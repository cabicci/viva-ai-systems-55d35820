// @vitest-environment node
// A private (DM) human takeover must not suppress new public comments by the same person,
// while staff/own replies on that exact comment, duplicates and ambiguous sends are still skipped.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FACEBOOK_PAGE_ID, INSTAGRAM_ACCOUNT_ID } from "../config";
import { metaSignature } from "../crypto";
import { commentReadback, handleMetaSupport, type MetaDeps, type MetaSender } from "../meta.server";
import { senderHash, type ClaimDecision, type SupportStore } from "../store.server";

const db = new PGlite();
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  for (const file of ["drizzle/migrations/0062_support_webhook_private_store.sql", "drizzle/migrations/0063_support_meta_reply_quota.sql"])
    await db.exec(readFileSync(file, "utf8"));
}, 30_000);
beforeEach(async () => { await db.exec("TRUNCATE support_private.events, support_private.senders"); });
afterAll(async () => { await db.close(); });

const one = async <T>(sql: string, args: unknown[]) => (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const store: SupportStore = {
  claim: async (p, k, s) => (await one<ClaimDecision>("SELECT public.support_claim_meta_event($1,$2,$3) AS v", [p, k, s]))!,
  mark: async (p, k, st) => (await one<boolean>("SELECT public.support_mark_event($1,$2,$3) AS v", [p, k, st]))!,
  handoff: async (s, h) => { await db.query("SELECT public.support_set_handoff($1,$2)", [s, h]); },
};
const status = (p: string, k: string) => one<string>("SELECT status AS v FROM support_private.events WHERE provider=$1 AND event_key=$2", [p, k]);

const SECRET = "local-test";
const BRANDED = "إجابة\n\nhttps://masaarat.ai/technical\n— فريق مسارات";
function harness(opts: { result?: "sent" | "ambiguous"; staffReplied?: Set<string>; readbackDown?: boolean } = {}) {
  const send = vi.fn<MetaSender>(async () => ({ result: opts.result ?? "sent" }));
  const deps: MetaDeps = {
    appSecret: SECRET, pageToken: "unused", store: async () => store, send,
    answer: vi.fn(async () => ({ text: BRANDED, source: "deterministic" as const })),
    beforeSend: commentReadback(async (path) =>
      opts.readbackDown ? { ok: false } : { ok: true, data: { id: path, comments: { data: opts.staffReplied?.has(path) ? [{ from: { id: FACEBOOK_PAGE_ID } }] : [] }, replies: { data: opts.staffReplied?.has(path) ? [{ from: { id: INSTAGRAM_ACCOUNT_ID } }] : [] } } }),
  };
  return { deps, send };
}
async function deliver(payload: unknown, deps: MetaDeps) {
  const body = JSON.stringify(payload);
  const headers = { "x-hub-signature-256": await metaSignature(SECRET, new TextEncoder().encode(body)) };
  return handleMetaSupport(new Request("https://example.test/support-meta", { method: "POST", headers, body }), deps);
}
const fbComment = (from: string, id: string) => ({
  object: "page",
  entry: [{ id: FACEBOOK_PAGE_ID, changes: [{ field: "feed", value: { item: "comment", verb: "add", from: { id: from }, comment_id: id, post_id: `${FACEBOOK_PAGE_ID}_photo1`, message: "المسار الفني بيبدأ بأي مجال؟" } }] }],
});
const igComment = (from: string, id: string) => ({
  object: "instagram",
  entry: [{ id: INSTAGRAM_ACCOUNT_ID, changes: [{ field: "comments", value: { id, from: { id: from }, media: { id: "reel1" }, text: "التعليم الفني بكام؟" } }] }],
});
const dm = (from: string, mid: string) => ({
  object: "page",
  entry: [{ id: FACEBOOK_PAGE_ID, messaging: [{ sender: { id: from }, recipient: { id: FACEBOOK_PAGE_ID }, message: { mid, text: "بكام Pro؟" } }] }],
});

describe("private takeover vs public comments", () => {
  it("an active Messenger hold still stops DMs but not two new Facebook comments from the same person", async () => {
    await store.handoff(await senderHash("messenger", "tester"), 24);
    const { deps, send } = harness();
    await deliver(dm("tester", "d1"), deps);
    expect(await status("meta_messenger", "d1")).toBe("handoff");
    await deliver(fbComment("tester", "c1"), deps);
    await deliver(fbComment("tester", "c2"), deps);
    expect(await status("meta_page_comment", "c1")).toBe("replied");
    expect(await status("meta_page_comment", "c2")).toBe("replied");
    expect(send).toHaveBeenCalledTimes(2);
    // The hold itself is untouched.
    expect(await one<boolean>("SELECT handoff_until > now() AS v FROM support_private.senders WHERE sender_hash=$1", [await senderHash("messenger", "tester")])).toBe(true);
  });
  it("an active Instagram DM hold does not stop a new Instagram comment", async () => {
    await store.handoff(await senderHash("instagram", "igt"), 24);
    const { deps, send } = harness();
    await deliver(igComment("igt", "ic1"), deps);
    expect(await status("meta_instagram_comment", "ic1")).toBe("replied");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("a staff/own reply already on that comment is respected (no send)", async () => {
    const { deps, send } = harness({ staffReplied: new Set(["c9", "ic9"]) });
    await deliver(fbComment("p", "c9"), deps);
    await deliver(igComment("q", "ic9"), deps);
    expect(send).not.toHaveBeenCalled();
    expect(await status("meta_page_comment", "c9")).toBe("ignored");
  });
  it("redelivery of the same comment is answered once", async () => {
    const { deps, send } = harness();
    await deliver(fbComment("p", "c3"), deps);
    await deliver(fbComment("p", "c3"), deps);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("an ambiguous send is never sent again", async () => {
    const { deps, send } = harness({ result: "ambiguous" });
    await deliver(fbComment("p", "c4"), deps);
    await deliver(fbComment("p", "c4"), deps);
    expect(send).toHaveBeenCalledTimes(1);
    expect(await status("meta_page_comment", "c4")).toBe("ambiguous");
  });
  it("readback unavailable → nothing sent, event left retryable", async () => {
    const { deps, send } = harness({ readbackDown: true });
    const r = await deliver(fbComment("p", "c5"), deps);
    expect(r.status).toBe(500);
    expect(send).not.toHaveBeenCalled();
    expect(await status("meta_page_comment", "c5")).toBe("failed");
  });
  it("an old comment recorded under the earlier sender scope is never re-answered", async () => {
    await store.claim("meta_page_comment", "old1", await senderHash("messenger", "p"));
    await store.mark("meta_page_comment", "old1", "handoff");
    const { deps, send } = harness();
    await deliver(fbComment("p", "old1"), deps);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("webhook brand guard", () => {
  it("an answer without the official link and signature is never posted", async () => {
    const { deps, send } = harness();
    deps.answer = vi.fn(async () => ({ text: "no link here", source: "openai" as const }));
    await deliver(fbComment("p", "c6"), deps);
    expect(send).not.toHaveBeenCalled();
    expect(await status("meta_page_comment", "c6")).toBe("ignored");
  });
});
