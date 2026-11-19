// Pilot-only reconciliation for Meta events the webhook may not deliver. Reads only owned, selected
// media and the account's own Instagram inbox through the official Graph API, answers only allowlisted
// testers, and reuses the shared webhook engine (same claim key per event, same handoff/quota rules).
import { FACEBOOK_PAGE_ID, GRAPH_BASE, INSTAGRAM_ACCOUNT_ID } from "./config";
import { processMetaWork, type MetaSender, type MetaWork, type MetaWorkContext } from "./meta.server";
import { senderHash, type SupportStore } from "./store.server";

/** Owner-approved pilot scope. Testers are one-way hashes of the approved test accounts only. */
export const PILOT: PilotScope = {
  fbPosts: ["122127622173478914"],
  igMedia: ["18118806677170189"],
  testers: {
    messenger: ["8d7da3925e22a37504519f7ac76a3dd82633494126c23e6b2105ab0e6832c143"],
    instagram: ["492d32ba141ff2b32f83c310651b6a6f7de0019c1de13f9c8c6b1bc781dcff57"],
    instagramUsername: ["2c09b2152d2c23022e14bba39769e4e2ffe2d8a6f025cff42ade901047013ddb"],
  },
};
export type PilotScope = { fbPosts: readonly string[]; igMedia: readonly string[]; testers: { messenger: readonly string[]; instagram: readonly string[]; instagramUsername: readonly string[] } };

export type ReconcileSource = "fb_comments" | "ig_comments" | "ig_dm";
export const RECONCILE_SOURCES: ReconcileSource[] = ["fb_comments", "ig_comments", "ig_dm"];
const PAGE_SIZE = 25;
const MAX_PAGES = 2;
const OVERLAP_MS = 10 * 60_000;
const DM_WINDOW_MS = 24 * 3600_000;

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 && v.length <= 4000 ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export type GraphResult = { ok: true; data: Obj } | { ok: false; status: number; code: number | null };
export type GraphGet = (path: string, params: Record<string, string>) => Promise<GraphResult>;

export function graphGet(pageToken: string, appSecretProof: string, fetchImpl: typeof fetch = fetch): GraphGet {
  return async (path, params) => {
    const url = new URL(`${GRAPH_BASE}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("appsecret_proof", appSecretProof);
    try {
      const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(8000) });
      const body = obj(await res.json().catch(() => null));
      if (res.ok && body) return { ok: true, data: body };
      const code = obj(body?.error)?.code;
      return { ok: false, status: res.status, code: typeof code === "number" ? code : null };
    } catch {
      return { ok: false, status: 0, code: null };
    }
  };
}

export type RunState = {
  begin(source: ReconcileSource): Promise<{ mode: "dry_run" | "pilot"; startedAt: number; cursorAt: number } | null>;
  finish(source: ReconcileSource, cursorAt: number | null, pausedReason: string | null, counts: Counts): Promise<void>;
};
export type Counts = { seen: number; eligible: number; answered_already: number; outside_scope: number; queued: number; retry: number; status: string };

/** Access/review denials pause the source; throttling and transient failures just end this run. */
export function denialReason(r: Extract<GraphResult, { ok: false }>): string | null {
  if (r.code === 4 || r.code === 17 || r.code === 32 || r.code === 613 || r.status === 429) return null;
  if (r.status === 401 || r.status === 403 || r.code === 10 || r.code === 190 || r.code === 200 || r.code === 3 || (r.code !== null && r.code >= 200 && r.code < 300))
    return `graph_denied_${r.code ?? r.status}`;
  return null;
}

async function isTester(pilot: PilotScope, family: "messenger" | "instagram", id: string | null, username?: string | null) {
  if (id && pilot.testers[family].includes(await senderHash(family, id))) return true;
  if (family === "instagram" && username)
    return pilot.testers.instagramUsername.includes(await senderHash("instagram-username", username.toLowerCase()));
  return false;
}

type Candidate = { item: Extract<MetaWork, { kind: "reply" }>; at: number };
type Collected = { candidates: Candidate[]; maxAt: number | null; counts: Counts; denied: string | null; failed: boolean };

function hasOwnReply(c: Obj, field: "comments" | "replies", ownId: string) {
  return arr(obj(c[field])?.data).some((r) => str(obj(obj(r)?.from)?.id) === ownId);
}

async function collect(pilot: PilotScope, source: ReconcileSource, graph: GraphGet, floor: number, now: number): Promise<Collected> {
  const counts: Counts = { seen: 0, eligible: 0, answered_already: 0, outside_scope: 0, queued: 0, retry: 0, status: "ok" };
  const out: Collected = { candidates: [], maxAt: null, counts, denied: null, failed: false };
  const targets =
    source === "fb_comments" ? pilot.fbPosts.map((id) => ({ path: `${id}/comments`, owner: id })) :
    source === "ig_comments" ? pilot.igMedia.map((id) => ({ path: `${id}/comments`, owner: id })) :
    [{ path: `${FACEBOOK_PAGE_ID}/conversations`, owner: "" }];
  for (const target of targets) {
    let after: string | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params: Record<string, string> =
        source === "fb_comments" ? { fields: "id,message,created_time,from{id},comments.limit(10){from{id}}", order: "reverse_chronological", filter: "stream", limit: String(PAGE_SIZE) } :
        source === "ig_comments" ? { fields: "id,text,timestamp,from{id,username},replies.limit(10){from{id}}", limit: String(PAGE_SIZE) } :
        { platform: "instagram", fields: "updated_time,messages.limit(1){id,created_time,from{id,username},message}", limit: "10" };
      if (after) params.after = after;
      const r = await graph(target.path, params);
      if (!r.ok) {
        out.denied = denialReason(r);
        out.failed = true;
        counts.status = out.denied ?? `graph_unavailable_${r.code ?? r.status}`;
        return out;
      }
      let older = false;
      for (const raw of arr(r.data.data)) {
        const row = obj(raw);
        if (!row) continue;
        const node = source === "ig_dm" ? obj(arr(obj(row.messages)?.data)[0]) : row;
        if (!node) continue;
        const at = Date.parse(str(node.created_time) ?? str(node.timestamp) ?? "");
        if (!Number.isFinite(at)) continue;
        counts.seen++;
        if (at < floor) { older = true; continue; }
        out.maxAt = Math.max(out.maxAt ?? 0, at);
        const id = str(node.id);
        const from = obj(node.from);
        const fromId = str(from?.id);
        const text = str(node.message) ?? str(node.text);
        if (!id || !fromId || !text) continue;
        if (source === "fb_comments") {
          if (fromId === FACEBOOK_PAGE_ID || hasOwnReply(node, "comments", FACEBOOK_PAGE_ID)) { counts.answered_already++; continue; }
          if (!(await isTester(pilot, "messenger", fromId))) { counts.outside_scope++; continue; }
          out.candidates.push({ at, item: { kind: "reply", provider: "meta_page_comment", key: id, family: "messenger", senderId: fromId, text, target: id, postId: `${FACEBOOK_PAGE_ID}_${target.owner}` } });
        } else if (source === "ig_comments") {
          if (fromId === INSTAGRAM_ACCOUNT_ID || hasOwnReply(node, "replies", INSTAGRAM_ACCOUNT_ID)) { counts.answered_already++; continue; }
          if (!(await isTester(pilot, "instagram", fromId, str(from?.username)))) { counts.outside_scope++; continue; }
          out.candidates.push({ at, item: { kind: "reply", provider: "meta_instagram_comment", key: id, family: "instagram", senderId: fromId, text, target: id, postId: target.owner } });
        } else {
          // Latest message is ours (bot or staff) → already answered; outside 24h → messaging window closed.
          if (fromId === INSTAGRAM_ACCOUNT_ID) { counts.answered_already++; continue; }
          if (now - at > DM_WINDOW_MS) { counts.outside_scope++; continue; }
          if (!(await isTester(pilot, "instagram", fromId, str(from?.username)))) { counts.outside_scope++; continue; }
          out.candidates.push({ at, item: { kind: "reply", provider: "meta_instagram_dm", key: id, family: "instagram", senderId: fromId, text, target: fromId } });
        }
      }
      counts.eligible = out.candidates.length;
      after = str(obj(obj(r.data.paging)?.cursors)?.after);
      if (older || !after || !obj(r.data.paging)?.next) break;
    }
  }
  return out;
}

/** Fresh readback right before a send: still present, still unanswered by us, still inside the DM window. */
export function readback(graph: GraphGet, now: () => number) {
  return async (item: Extract<MetaWork, { kind: "reply" }>): Promise<boolean> => {
    if (item.provider === "meta_page_comment") {
      const r = await graph(item.target, { fields: "id,comments.limit(25){from{id}}" });
      return r.ok && str(r.data.id) === item.target && !hasOwnReply(r.data, "comments", FACEBOOK_PAGE_ID);
    }
    if (item.provider === "meta_instagram_comment") {
      const r = await graph(item.target, { fields: "id,replies.limit(25){from{id}}" });
      return r.ok && str(r.data.id) === item.target && !hasOwnReply(r.data, "replies", INSTAGRAM_ACCOUNT_ID);
    }
    if (item.provider === "meta_instagram_dm") {
      const r = await graph(`${FACEBOOK_PAGE_ID}/conversations`, { platform: "instagram", user_id: item.senderId, fields: "messages.limit(1){id,created_time,from{id}}" });
      if (!r.ok) return false;
      const latest = obj(arr(obj(obj(arr(r.data.data)[0])?.messages)?.data)[0]);
      const at = Date.parse(str(latest?.created_time) ?? "");
      return str(latest?.id) === item.key && str(obj(latest?.from)?.id) === item.senderId && Number.isFinite(at) && now() - at <= DM_WINDOW_MS;
    }
    return false;
  };
}

export type ReconcileDeps = {
  graph: GraphGet;
  state: RunState;
  appSecret: string;
  store: () => Promise<SupportStore>;
  send: MetaSender;
  answer: MetaWorkContext["answer"];
  now?: () => number;
  pilot?: PilotScope;
};

export async function reconcileOnce(deps: ReconcileDeps): Promise<Record<ReconcileSource, Counts | "skipped">> {
  const now = deps.now ?? Date.now;
  const result = {} as Record<ReconcileSource, Counts | "skipped">;
  let store: SupportStore | null = null;
  for (const source of RECONCILE_SOURCES) {
    const lease = await deps.state.begin(source);
    if (!lease) { result[source] = "skipped"; continue; }
    let collected: Collected | null = null;
    try {
      const floor = Math.max(lease.startedAt, lease.cursorAt - OVERLAP_MS);
      collected = await collect(deps.pilot ?? PILOT, source, deps.graph, floor, now());
      const c = collected.counts;
      // Oldest first, so a person's follow-ups are answered in order.
      const work = collected.candidates.sort((a, b) => a.at - b.at).map((x) => x.item);
      c.queued = work.length;
      let retry = false;
      if (lease.mode === "pilot" && work.length) {
        store ??= await deps.store();
        retry = await processMetaWork(work, { appSecret: deps.appSecret, store, send: deps.send, answer: deps.answer, requireBrand: true, beforeSend: readback(deps.graph, now) });
      } else if (lease.mode === "dry_run") c.status = "dry_run";
      if (retry) { c.retry = 1; c.status = "retry"; }
      // Advance only when the run fully succeeded; claims make the overlap window safe to re-read.
      await deps.state.finish(source, retry || collected.failed ? null : collected.maxAt, collected.denied, c);
      result[source] = c;
    } catch {
      const c = collected?.counts ?? { seen: 0, eligible: 0, answered_already: 0, outside_scope: 0, queued: 0, retry: 1, status: "error" };
      c.status = "error";
      await deps.state.finish(source, null, null, c).catch(() => undefined);
      result[source] = c;
    }
  }
  return result;
}

/** Service-only lease/cursor RPCs over the private support schema. */
export async function cloudRunState(): Promise<RunState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    async begin(source) {
      const r = await supabaseAdmin.rpc("support_reconcile_begin" as never, { p_source: source } as never);
      if (r.error) throw new Error("SUPPORT_RECONCILE_UNAVAILABLE");
      const v = obj(r.data);
      if (!v) return null;
      const mode = v.mode === "pilot" || v.mode === "dry_run" ? v.mode : null;
      if (!mode) return null;
      return { mode, startedAt: Date.parse(String(v.started_at)), cursorAt: Date.parse(String(v.cursor_at)) };
    },
    async finish(source, cursorAt, pausedReason, counts) {
      const r = await supabaseAdmin.rpc("support_reconcile_finish" as never, {
        p_source: source,
        p_cursor: cursorAt === null ? null : new Date(cursorAt).toISOString(),
        p_paused_reason: pausedReason,
        p_counts: counts,
      } as never);
      if (r.error) throw new Error("SUPPORT_RECONCILE_UNAVAILABLE");
    },
  };
}
