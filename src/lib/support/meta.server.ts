import { FACEBOOK_PAGE_ID, GRAPH_BASE, INSTAGRAM_ACCOUNT_ID, META_APP_ID, type SupportProvider } from "./config";
import { detectLang, handoffReply, isRelevantPublicQuestion, wantsHuman } from "./compose";
import { echoToken, timingSafeEqualText, verifyEchoToken, verifyMeta } from "./crypto";
import type { SupportAnswer, ThreadRef } from "./answer.server";
import { senderHash, type SupportStore } from "./store.server";

export type MetaWork =
  | { kind: "reply"; provider: SupportProvider; key: string; family: string; senderId: string; text: string; target: string; postId?: string }
  | { kind: "echo"; family: string; customerId: string; mid: string | null; appId: string | null; metadata: string | null };

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
        // Everything the Page/IG account sends is echoed; ownership is decided when processing.
        if (sender === ownId && recipient !== ownId && message.is_self !== true) {
          const appId = typeof message.app_id === "number" || typeof message.app_id === "string" ? String(message.app_id) : null;
          out.push({ kind: "echo", family, customerId: recipient, mid: str(message.mid), appId, metadata: str(message.metadata) });
        }
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
        key: mid,
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
        // Page posts arrive as "<page>_<post>"; owned videos/reels can arrive as a bare numeric ID.
        // The verified signature plus entry.id === Page ID is the ownership boundary for both.
        if (!commentId || !text || !postId || !(postId.startsWith(`${FACEBOOK_PAGE_ID}_`) || /^\d{1,40}$/.test(postId))) continue;
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
  return out;
}

type SendResult = "sent" | "rejected" | "ambiguous";
export type SendOutcome = { result: SendResult; messageId?: string };
/** metadata is set only for Messenger DMs; Meta returns it on the echo of that message. */
export type MetaSender = (provider: SupportProvider, target: string, text: string, metadata?: string) => Promise<SendResult | SendOutcome>;
const outcomeOf = (v: SendResult | SendOutcome): SendOutcome => (typeof v === "string" ? { result: v } : v);

/** Hash of a provider message ID, scoped to the channel family; the raw ID is never stored. */
export const midHash = (family: string, mid: string) => senderHash(`mid:${family}`, mid);

/** Graph endpoints per channel, using the Page token from Facebook Login for Business. */
export function graphSender(pageToken: string, fetchImpl: typeof fetch = fetch): MetaSender {
  return async (provider, target, text, metadata) => {
    let url: string;
    let body: Obj;
    if (provider === "meta_messenger" || provider === "meta_instagram_dm") {
      url = `${GRAPH_BASE}/${FACEBOOK_PAGE_ID}/messages`;
      const message: Obj = { text: text.slice(0, 990) };
      if (provider === "meta_messenger" && metadata) message.metadata = metadata;
      body = { recipient: { id: target }, messaging_type: "RESPONSE", message };
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
      if (res.ok) {
        const data = obj(await res.json().catch(() => null));
        const messageId = str(data?.message_id) ?? undefined;
        return { result: "sent", messageId };
      }
      await res.body?.cancel().catch(() => undefined);
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
  answer: (question: string, publicComment: boolean, thread: ThreadRef, factsOnly: boolean) => Promise<SupportAnswer>;
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
  const appSecret = deps.appSecret;
  let retry = false;
  let store: SupportStore;
  try {
    store = await deps.store();
  } catch {
    return new Response("Service Unavailable", { status: 503 });
  }
  /** own/automated echoes are ignored; only an echo not proven to be ours or automated is a manual takeover. */
  async function classifyEcho(item: Extract<MetaWork, { kind: "echo" }>, conversation: string) {
    if (item.metadata && (await verifyEchoToken(appSecret, item.family, item.customerId, item.metadata)))
      return "own";
    if (item.appId === META_APP_ID) return "own";
    // Only Send API callers can attach metadata; native inbox replies by a person carry none.
    if (item.metadata) return "automated";
    if (item.mid && store.matchEcho) {
      const match = await store.matchEcho(conversation, await midHash(item.family, item.mid));
      if (match === "own") return "own";
      if (match === "pending") return "retry";
    }
    return "human";
  }
  async function processItem(item: MetaWork) {
    let beforeSendKey: string | undefined;
    try {
      if (item.kind === "echo") {
        const conversation = await senderHash(item.family, item.customerId);
        const verdict = await classifyEcho(item, conversation);
        if (verdict === "retry") retry = true;
        else if (verdict === "human") await store.handoff(conversation, 24);
        return;
      }
      const hash = await senderHash(item.family, item.senderId);
      // The ledger accepts 200 characters. Preserve distinct long message IDs.
      const key = item.key.length <= 200 ? item.key : "hash:" + await senderHash(item.provider, item.key);
      const decision = await store.claim(item.provider, key, hash);
      if (decision !== "process" && decision !== "public_facts") return;
      beforeSendKey = key;
      const factsOnly = decision === "public_facts";
      const publicComment = item.provider === "meta_page_comment" || item.provider === "meta_instagram_comment";
      let text: string | null = null;
      if (publicComment) {
        // Public threads: only genuine questions, scoped context per post+commenter (never DM context).
        if (isRelevantPublicQuestion(item.text))
          text = (await deps.answer(item.text, true, { family: item.family, thread: `${item.postId}:${hash}`, visibility: "public" }, factsOnly)).text;
      } else if (wantsHuman(item.text)) text = handoffReply(detectLang(item.text));
      else text = (await deps.answer(item.text, false, { family: item.family, thread: hash, visibility: "private" }, factsOnly)).text;
      if (!text) {
        await store.mark(item.provider, key, "ignored");
        return;
      }
      beforeSendKey = undefined;
      if (!(await store.mark(item.provider, key, "sending"))) return;
      const dm = item.provider === "meta_messenger" || item.provider === "meta_instagram_dm";
      const attempt = dm && store.beginOutbound ? await senderHash(`attempt:${item.provider}`, key) : null;
      if (attempt) {
        try {
          // Recorded before sending, so an echo that beats the Send API response is retried, not taken as manual.
          await store.beginOutbound!(attempt, hash);
        } catch {
          await store.mark(item.provider, key, "failed").catch(() => false);
          retry = true;
          return;
        }
      }
      const metadata = item.provider === "meta_messenger" ? await echoToken(appSecret, item.family, item.target) : undefined;
      const { result, messageId } = outcomeOf(await send(item.provider, item.target, text, metadata));
      if (attempt && store.finishOutbound) {
        const mh = messageId ? await midHash(item.family, messageId) : null;
        await store.finishOutbound(attempt, mh, result).catch(() => console.error("SUPPORT_OUTBOUND_LEDGER_FINISH_FAILED"));
      }
      if (result === "sent") await store.mark(item.provider, key, "replied");
      else if (result === "rejected") {
        await store.mark(item.provider, key, "failed");
        retry = true;
      } else await store.mark(item.provider, key, "ambiguous");
    } catch {
      if (beforeSendKey && item.kind === "reply") {
        await store.mark(item.provider, beforeSendKey, "failed").catch(() => false);
      }
      retry = true;
    }
  }
  // Keep messages and human handoffs for a sender in order, while other
  // conversations can progress independently. The concurrency bound is not a batch limit.
  const bySender = new Map<string, MetaWork[]>();
  for (const item of work) {
    const senderId = item.kind === "echo" ? item.customerId : item.senderId;
    const queue = bySender.get(senderId);
    if (queue) queue.push(item);
    else bySender.set(senderId, [item]);
  }
  const conversations = bySender.values();
  async function drain() {
    for (const conversation of conversations) {
      for (const item of conversation) await processItem(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, bySender.size) }, drain));
  return retry
    ? new Response("Retry", { status: 500, headers: noStore })
    : new Response("EVENT_RECEIVED", { headers: noStore });
}
