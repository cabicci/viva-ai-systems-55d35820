import { FACEBOOK_PAGE_ID, GRAPH_BASE, INSTAGRAM_ACCOUNT_ID, META_APP_ID, type SupportProvider } from "./config";
import { detectLang, handoffReply, isRelevantPublicQuestion, wantsHuman } from "./compose";
import { timingSafeEqualText, verifyMeta } from "./crypto";
import type { SupportAnswer, ThreadRef } from "./answer.server";
import { senderHash, type SupportStore } from "./store.server";

export type MetaWork =
  | { kind: "reply"; provider: SupportProvider; key: string; family: string; senderId: string; text: string; target: string; postId?: string }
  | { kind: "human_echo"; family: string; customerId: string };

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 && v.length <= 4000 ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Extracts only first-party customer messages and new comments for the two fixed accounts. */
export function extractMetaWork(payload: unknown): MetaWork[] {
  const root = obj(payload);
  const object = root?.object;
  if (object !== "page" && object !== "instagram") return [];
  const ownId = object === "page" ? FACEBOOK_PAGE_ID : INSTAGRAM_ACCOUNT_ID;
  const family = object === "page" ? "messenger" : "instagram";
  const out: MetaWork[] = [];
  for (const e of arr(root?.entry)) {
    const entry = obj(e);
    if (!entry || entry.id !== ownId) continue;
    for (const m of arr(entry.messaging)) {
      const ev = obj(m);
      const message = obj(ev?.message);
      const sender = str(obj(ev?.sender)?.id);
      const recipient = str(obj(ev?.recipient)?.id);
      if (!ev || !message || !sender || !recipient) continue;
      if (message.is_echo === true) {
        // A person replying from the Page/IG inbox (not this app) takes the conversation over.
        if (sender === ownId && recipient !== ownId && String(message.app_id ?? "") !== META_APP_ID)
          out.push({ kind: "human_echo", family, customerId: recipient });
        continue;
      }
      if (message.is_deleted === true || message.is_unsupported === true) continue;
      if (sender === ownId || recipient !== ownId) continue;
      const mid = str(message.mid);
      const text = str(message.text);
      if (!mid || !text) continue;
      out.push({
        kind: "reply",
        provider: object === "page" ? "meta_messenger" : "meta_instagram_dm",
        key: mid.slice(0, 200),
        family,
        senderId: sender,
        text,
        target: sender,
      });
    }
    for (const c of arr(entry.changes)) {
      const change = obj(c);
      const value = obj(change?.value);
      if (!change || !value) continue;
      const fromId = str(obj(value.from)?.id);
      if (!fromId || fromId === ownId) continue;
      if (object === "page") {
        if (change.field !== "feed" || value.item !== "comment" || value.verb !== "add") continue;
        const commentId = str(value.comment_id);
        const postId = str(value.post_id);
        const text = str(value.message);
        if (!commentId || !text || !postId?.startsWith(`${FACEBOOK_PAGE_ID}_`)) continue;
        out.push({ kind: "reply", provider: "meta_page_comment", key: commentId, family, senderId: fromId, text, target: commentId, postId });
      } else {
        if (change.field !== "comments") continue;
        const commentId = str(value.id);
        const text = str(value.text);
        if (!commentId || !text) continue;
        const mediaId = str(obj(value.media)?.id) ?? "unknown-media";
        out.push({ kind: "reply", provider: "meta_instagram_comment", key: commentId, family, senderId: fromId, text, target: commentId, postId: mediaId });
      }
    }
  }
  return out.slice(0, 5);
}

type SendResult = "sent" | "rejected" | "ambiguous";
export type MetaSender = (provider: SupportProvider, target: string, text: string) => Promise<SendResult>;

/** Graph endpoints per channel, using the Page token from Facebook Login for Business. */
export function graphSender(pageToken: string, fetchImpl: typeof fetch = fetch): MetaSender {
  return async (provider, target, text) => {
    let url: string;
    let body: Obj;
    if (provider === "meta_messenger" || provider === "meta_instagram_dm") {
      url = `${GRAPH_BASE}/${FACEBOOK_PAGE_ID}/messages`;
      body = { recipient: { id: target }, messaging_type: "RESPONSE", message: { text: text.slice(0, 990) } };
    } else if (provider === "meta_page_comment") {
      url = `${GRAPH_BASE}/${encodeURIComponent(target)}/comments`;
      body = { message: text };
    } else if (provider === "meta_instagram_comment") {
      url = `${GRAPH_BASE}/${encodeURIComponent(target)}/replies`;
      body = { message: text.slice(0, 990) };
    } else return "rejected";
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${pageToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      await res.body?.cancel().catch(() => undefined);
      if (res.ok) return "sent";
      console.error(`SUPPORT_GRAPH_STATUS_${res.status}`);
      return res.status >= 400 && res.status < 500 && res.status !== 408 ? "rejected" : "ambiguous";
    } catch {
      return "ambiguous";
    }
  };
}

export type MetaDeps = {
  appSecret?: string;
  verifyToken?: string;
  pageToken?: string;
  store: () => Promise<SupportStore>;
  answer: (question: string, publicComment: boolean, thread: ThreadRef) => Promise<SupportAnswer>;
  send?: MetaSender;
};

const noStore = { "Cache-Control": "no-store" };

export async function handleMetaSupport(request: Request, deps: MetaDeps): Promise<Response> {
  if (request.method === "GET") {
    const q = new URL(request.url).searchParams;
    const challenge = q.get("hub.challenge") ?? "";
    if (
      deps.verifyToken &&
      q.get("hub.mode") === "subscribe" &&
      timingSafeEqualText(q.get("hub.verify_token") ?? "", deps.verifyToken) &&
      /^[A-Za-z0-9_-]{1,128}$/.test(challenge)
    )
      return new Response(challenge, { headers: { ...noStore, "Content-Type": "text/plain" } });
    return new Response("Forbidden", { status: 403, headers: noStore });
  }
  if (request.method !== "POST")
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
  if (!deps.appSecret || !deps.pageToken)
    return Response.json({ error: "SUPPORT_CHANNEL_NOT_CONFIGURED" }, { status: 503, headers: noStore });
  const raw = new Uint8Array(await request.arrayBuffer());
  if (raw.byteLength > 1_000_000) return new Response("Payload Too Large", { status: 413 });
  if (!(await verifyMeta(deps.appSecret, raw, request.headers.get("x-hub-signature-256"))))
    return new Response("Forbidden", { status: 403, headers: noStore });
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  const work = extractMetaWork(payload);
  if (!work.length) return new Response("EVENT_RECEIVED", { headers: noStore });
  const send = deps.send ?? graphSender(deps.pageToken);
  let retry = false;
  let store: SupportStore;
  try {
    store = await deps.store();
  } catch {
    return new Response("Service Unavailable", { status: 503 });
  }
  for (const item of work) {
    try {
      if (item.kind === "human_echo") {
        await store.handoff(await senderHash(item.family, item.customerId), 24);
        continue;
      }
      const hash = await senderHash(item.family, item.senderId);
      if ((await store.claim(item.provider, item.key, hash)) !== "process") continue;
      const publicComment = item.provider === "meta_page_comment" || item.provider === "meta_instagram_comment";
      let text: string | null = null;
      if (publicComment) {
        // Public threads: only genuine questions, scoped context per post+commenter (never DM context).
        if (isRelevantPublicQuestion(item.text))
          text = (await deps.answer(item.text, true, { family: item.family, thread: `${item.postId}:${hash}`, visibility: "public" })).text;
      } else if (wantsHuman(item.text)) text = handoffReply(detectLang(item.text));
      else text = (await deps.answer(item.text, false, { family: item.family, thread: hash, visibility: "private" })).text;
      if (!text) {
        await store.mark(item.provider, item.key, "ignored");
        continue;
      }
      if (publicComment) {
        // At most one public reply per commenter per post, ever: a durable lock row.
        const once = `once:${item.postId}:${hash}`.slice(0, 200);
        if ((await store.claim(item.provider, once, hash)) !== "process") {
          await store.mark(item.provider, item.key, "ignored");
          continue;
        }
        await store.mark(item.provider, once, "ignored");
      }
      if (!(await store.mark(item.provider, item.key, "sending"))) continue;
      const result = await send(item.provider, item.target, text);
      if (result === "sent") await store.mark(item.provider, item.key, "replied");
      else if (result === "rejected") {
        await store.mark(item.provider, item.key, "failed");
        retry = true;
      } else await store.mark(item.provider, item.key, "ambiguous");
    } catch {
      retry = true;
    }
  }
  return retry
    ? new Response("Retry", { status: 500, headers: noStore })
    : new Response("EVENT_RECEIVED", { headers: noStore });
}
