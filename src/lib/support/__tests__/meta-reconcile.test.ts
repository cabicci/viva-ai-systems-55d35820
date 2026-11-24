// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FACEBOOK_PAGE_ID, INSTAGRAM_ACCOUNT_ID } from "../config";
import { metaSignature } from "../crypto";
import { handleMetaSupport, isBranded } from "../meta.server";
import { reconcileOnce, type GraphGet, type PilotScope, type ReconcileDeps, type RunState } from "../reconcile.server";
import { senderHash, type ClaimDecision, type SupportStore } from "../store.server";
import { isRelevantPublicQuestion } from "../compose";

const db = new PGlite();
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  for (const m of ["0062_support_webhook_private_store", "0063_support_meta_reply_quota", "0066_support_reconcile_pilot"])
    await db.exec(readFileSync(`drizzle/migrations/${m}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  await db.exec(`TRUNCATE support_private.events, support_private.senders;
    UPDATE support_private.reconcile SET mode='pilot', started_at=now() - interval '1 hour', cursor_at=now() - interval '1 hour', lease_until=NULL, paused_reason=NULL;`);
});
afterAll(async () => { await db.close(); });

const store: SupportStore = {
  async claim(p, k, s) { return (await db.query<{ d: ClaimDecision }>("SELECT public.support_claim_meta_event($1,$2,$3) d", [p, k, s])).rows[0].d; },
  async mark(p, k, st) { return (await db.query<{ m: boolean }>("SELECT public.support_mark_event($1,$2,$3) m", [p, k, st])).rows[0].m; },
  async handoff(s, h) { await db.query("SELECT public.support_set_handoff($1,$2)", [s, h]); },
};
const state: RunState = {
  async begin(source) {
    const v = (await db.query<{ v: { mode: "pilot" | "dry_run"; started_at: string; cursor_at: string } | null }>("SELECT public.support_reconcile_begin($1) v", [source])).rows[0].v;
    return v ? { mode: v.mode, startedAt: Date.parse(v.started_at), cursorAt: Date.parse(v.cursor_at) } : null;
  },
  async finish(source, cursor, reason, counts) {
    await db.query("SELECT public.support_reconcile_finish($1,$2,$3,$4)", [source, cursor === null ? null : new Date(cursor).toISOString(), reason, JSON.stringify(counts)]);
  },
};

const BRANDED = "أهلاً\n\nhttps://masaarat.ai/pricing\n— فريق مسارات";
let pilot: PilotScope;
beforeAll(async () => {
  pilot = { fbPosts: ["post1"], igMedia: ["media1"], testers: {
    messenger: [await senderHash("messenger", "fbtester")],
    instagram: [await senderHash("instagram", "igtester")],
    instagramUsername: [] } };
});
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

type Rows = { fb: unknown[]; ig: unknown[]; dm: unknown[] };
function fakeGraph(rows: Rows, opts: { deny?: string; ownReplied?: Set<string> } = {}): GraphGet {
  return async (path, params) => {
    if (opts.deny && path.startsWith(opts.deny)) return { ok: false, status: 403, code: 10 };
    if (path === "post1/comments") return { ok: true, data: { data: rows.fb } };
    if (path === "media1/comments") return { ok: true, data: { data: rows.ig } };
    if (path === `${FACEBOOK_PAGE_ID}/conversations`) {
      if (params.user_id) {
        const latest = rows.dm.map((c) => (c as { messages: { data: { from: { id: string } }[] } }).messages.data[0]).find((m) => m.from.id === params.user_id);
        return { ok: true, data: { data: latest ? [{ messages: { data: [latest] } }] : [] } };
      }
      return { ok: true, data: { data: rows.dm } };
    }
    // Readback of a single comment.
    const own = opts.ownReplied?.has(path);
    return { ok: true, data: { id: path, comments: { data: own ? [{ from: { id: FACEBOOK_PAGE_ID } }] : [] }, replies: { data: own ? [{ from: { id: INSTAGRAM_ACCOUNT_ID } }] : [] } } };
  };
}
const deps = (graph: GraphGet, over: Partial<ReconcileDeps> = {}): ReconcileDeps => ({
  graph, state, appSecret: "local-test", store: async () => store, pilot,
  send: vi.fn(async () => "sent" as const),
  answer: vi.fn(async () => ({ text: BRANDED, source: "openai" as const })),
  ...over,
});
const fbComment = (id: string, from: string, text = "بكام الاشتراك؟", ago = 60_000, replies: unknown[] = []) =>
  ({ id, message: text, created_time: iso(ago), from: { id: from }, comments: { data: replies } });

describe("pilot reconciliation", () => {
  it("answers a tester's new comment once even when the webhook delivers the same comment too", async () => {
    const d = deps(fakeGraph({ fb: [fbComment("c1", "fbtester")], ig: [], dm: [] }));
    await reconcileOnce(d);
    const body = JSON.stringify({ object: "page", entry: [{ id: FACEBOOK_PAGE_ID, changes: [{ field: "feed", value: { item: "comment", verb: "add", comment_id: "c1", post_id: `${FACEBOOK_PAGE_ID}_post1`, message: "بكام الاشتراك؟", from: { id: "fbtester" } } }] }] });
    const send = d.send;
    await handleMetaSupport(new Request("https://x.test", { method: "POST", body, headers: { "x-hub-signature-256": await metaSignature("local-test", new TextEncoder().encode(body)) } }),
      { appSecret: "local-test", pageToken: "t", store: async () => store, answer: d.answer, send });
    await reconcileOnce(d);
    expect(vi.mocked(send).mock.calls).toHaveLength(1);
  });

  it("answers a new follow-up in the same public thread", async () => {
    const rows: Rows = { fb: [fbComment("c1", "fbtester")], ig: [], dm: [] };
    const d = deps(fakeGraph(rows));
    await reconcileOnce(d);
    rows.fb.unshift(fbComment("c2", "fbtester", "ممكن تفاصيل", 10_000));
    await reconcileOnce(d);
    expect(vi.mocked(d.send).mock.calls.map((c) => c[1])).toEqual(["c1", "c2"]);
    const threads = vi.mocked(d.answer).mock.calls.map((c) => c[2].thread);
    expect(threads[0]).toBe(threads[1]);
  });

  it("ignores non-testers, comments already answered by the Page, and pre-pilot comments", async () => {
    const d = deps(fakeGraph({ fb: [
      fbComment("a", "stranger"),
      fbComment("b", "fbtester", "بكام؟", 60_000, [{ from: { id: FACEBOOK_PAGE_ID } }]),
      fbComment("c", "fbtester", "بكام؟", 3 * 3600_000),
    ], ig: [], dm: [] }));
    const r = await reconcileOnce(d);
    expect(d.send).not.toHaveBeenCalled();
    expect(r.fb_comments).toMatchObject({ outside_scope: 1, answered_already: 1, queued: 0 });
  });

  it("skips when a manual staff reply appears between listing and send (readback)", async () => {
    const d = deps(fakeGraph({ fb: [], ig: [{ id: "i1", text: "how much?", timestamp: iso(60_000), from: { id: "igtester" }, replies: { data: [] } }], dm: [] }, { ownReplied: new Set(["i1"]) }));
    await reconcileOnce(d);
    expect(d.send).not.toHaveBeenCalled();
    expect((await db.query<{ status: string }>("SELECT status FROM support_private.events WHERE event_key='i1'")).rows[0].status).toBe("ignored");
  });

  it("answers an Instagram DM only inside the 24h window and only when the latest message is the tester's", async () => {
    const conv = (id: string, from: string, ago: number) => ({ messages: { data: [{ id, created_time: iso(ago), from: { id: from }, message: "بكام؟" }] } });
    await db.exec("UPDATE support_private.reconcile SET started_at = now() - interval '3 days', cursor_at = now() - interval '3 days'");
    const d = deps(fakeGraph({ fb: [], ig: [], dm: [conv("m-old", "igtester", 30 * 3600_000), conv("m-ours", INSTAGRAM_ACCOUNT_ID, 1000)] }));
    await reconcileOnce(d);
    expect(d.send).not.toHaveBeenCalled();
    const d2 = deps(fakeGraph({ fb: [], ig: [], dm: [conv("m-new", "igtester", 5000)] }));
    await reconcileOnce(d2);
    expect(vi.mocked(d2.send).mock.calls[0].slice(0, 2)).toEqual(["meta_instagram_dm", "igtester"]);
  });

  it("allows only one concurrent run per source", async () => {
    const d = deps(fakeGraph({ fb: [fbComment("c1", "fbtester")], ig: [], dm: [] }));
    const [a, b] = await Promise.all([reconcileOnce(d), reconcileOnce(d)]);
    expect(vi.mocked(d.send).mock.calls).toHaveLength(1);
    expect([a.fb_comments, b.fb_comments]).toContain("skipped");
  });

  it("pauses a source when Graph denies access and does not retry it", async () => {
    const d = deps(fakeGraph({ fb: [], ig: [], dm: [] }, { deny: `${FACEBOOK_PAGE_ID}/conversations` }));
    const r = await reconcileOnce(d);
    expect(r.ig_dm).toMatchObject({ status: "graph_denied_10" });
    expect((await reconcileOnce(d)).ig_dm).toBe("skipped");
  });

  it("does not send an unbranded reply", async () => {
    const d = deps(fakeGraph({ fb: [fbComment("c1", "fbtester")], ig: [], dm: [] }), { answer: vi.fn(async () => ({ text: "no link", source: "openai" as const })) });
    await reconcileOnce(d);
    expect(d.send).not.toHaveBeenCalled();
    expect(isBranded(BRANDED)).toBe(true);
  });

  it("treats تفاصيل as a genuine question", () => {
    expect(isRelevantPublicQuestion("عايز تفاصيل")).toBe(true);
    expect(isRelevantPublicQuestion("تفاصيل")).toBe(true);
  });
});
