// @vitest-environment node
// SIMULATION ONLY: locally signed payloads (test secret), a disposable PGlite database running the
// production support migrations (0062/0063/0065/0067), a mock Graph transport and a stubbed network.
// Nothing reaches Meta, OpenAI or real people. Each "worker" is a separate server instance with its
// own empty in-memory fallback, so a follow-up can only resolve through the durable topic store.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "../answer.server";
import { FACEBOOK_PAGE_ID, INSTAGRAM_ACCOUNT_ID, type SupportProvider } from "../config";
import { durableContextStore, memoryContextStore } from "../context";
import { metaSignature } from "../crypto";
import { commentReadback, handleMetaSupport, type MetaDeps, type MetaSender } from "../meta.server";
import { staticCatalogue } from "../sources";
import type { ClaimDecision, EchoMatch, SupportStore } from "../store.server";

const db = new PGlite();
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  for (const f of ["0062_support_webhook_private_store", "0063_support_meta_reply_quota", "0065_support_outbound_echo_ledger", "0067_support_topic_context"])
    await db.exec(readFileSync(`drizzle/migrations/${f}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  await db.exec("TRUNCATE support_private.events, support_private.senders, support_private.outbound, support_private.topic_context");
  // The simulation must never touch the network.
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network disabled in simulation"); }));
});
afterAll(async () => { vi.unstubAllGlobals(); await db.close(); });

const one = async <T>(sql: string, args: unknown[]) => (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const store: SupportStore = {
  claim: async (p, k, s) => (await one<ClaimDecision>("SELECT public.support_claim_meta_event($1,$2,$3) AS v", [p, k, s]))!,
  mark: async (p, k, st) => (await one<boolean>("SELECT public.support_mark_event($1,$2,$3) AS v", [p, k, st]))!,
  handoff: async (s, h) => { await db.query("SELECT public.support_set_handoff($1,$2)", [s, h]); },
  beginOutbound: async (a, c) => { await db.query("SELECT public.support_begin_outbound($1,$2)", [a, c]); },
  finishOutbound: async (a, m, st) => { await db.query("SELECT public.support_finish_outbound($1,$2,$3)", [a, m, st]); },
  matchEcho: async (c, m) => (await one<EchoMatch>("SELECT public.support_match_echo($1,$2) AS v", [c, m]))!,
};
const rpc = async (name: string, args: Record<string, unknown>) =>
  name === "support_get_topic"
    ? one("SELECT public.support_get_topic($1) AS v", [args.p_key])
    : db.query("SELECT public.support_set_topic($1,$2::jsonb)", [args.p_key, JSON.stringify(args.p_topic)]);

const SECRET = "simulation-secret";
type Sent = { provider: SupportProvider; target: string; text: string };
let outSeq = 0;
/** A fresh server instance wired like production: real handler + real answerQuestion, mock transport. */
function worker(sent: Sent[], staffReplied = new Set<string>()) {
  const context = durableContextStore(rpc, memoryContextStore());
  const send = vi.fn<MetaSender>(async (provider, target, text) => {
    sent.push({ provider, target, text });
    return { result: "sent", messageId: `sim-out-${++outSeq}` };
  });
  const deps: MetaDeps = {
    appSecret: SECRET, pageToken: "simulation", store: async () => store, send,
    answer: (q, publicComment, thread, factsOnly) =>
      answerQuestion(q, { publicComment, thread, factsOnly }, { context, openaiKey: "", freeAccess: async () => ({ kind: "inactive" }), catalogue: async () => staticCatalogue() }),
    beforeSend: commentReadback(async (path) => ({
      ok: true,
      data: { id: path, comments: { data: staffReplied.has(path) ? [{ from: { id: FACEBOOK_PAGE_ID } }] : [] }, replies: { data: staffReplied.has(path) ? [{ from: { id: INSTAGRAM_ACCOUNT_ID } }] : [] } },
    })),
  };
  return deps;
}
async function deliver(deps: MetaDeps, payload: unknown) {
  const body = JSON.stringify(payload);
  const headers = { "x-hub-signature-256": await metaSignature(SECRET, new TextEncoder().encode(body)) };
  return handleMetaSupport(new Request("https://simulation.test/api/public/support-meta", { method: "POST", headers, body }), deps);
}
let seq = 0;
const id = () => String(9_000_000 + ++seq);
const messenger = (from: string, text: string, mid = `m_${id()}`) => ({ object: "page", entry: [{ id: FACEBOOK_PAGE_ID, messaging: [{ sender: { id: from }, recipient: { id: FACEBOOK_PAGE_ID }, message: { mid, text } }] }] });
const igDm = (from: string, text: string, mid = `ig_${id()}`) => ({ object: "instagram", entry: [{ id: INSTAGRAM_ACCOUNT_ID, messaging: [{ sender: { id: from }, recipient: { id: INSTAGRAM_ACCOUNT_ID }, message: { mid, text } }] }] });
const fbComment = (from: string, text: string, post = "photo1", cid = id()) => ({ object: "page", entry: [{ id: FACEBOOK_PAGE_ID, changes: [{ field: "feed", value: { item: "comment", verb: "add", from: { id: from }, comment_id: cid, post_id: `${FACEBOOK_PAGE_ID}_${post}`, message: text } }] }] });
const igComment = (from: string, text: string, media: string | null = "18118806677170189", cid = id()) => ({ object: "instagram", entry: [{ id: INSTAGRAM_ACCOUNT_ID, changes: [{ field: "comments", value: { id: cid, from: { id: from }, ...(media ? { media: { id: media } } : {}), text } }] }] });

const Q1 = "التعليم الفني عندكم بيبدأ بإيه؟";
const Q2 = "طب وبكام في مصر؟";
const links = (t: string) => t.match(/https:\/\/masaarat\.ai[^\s]*/g) ?? [];
function expectGrounded(text: string, link: string) {
  expect(links(text)).toEqual([link]);
  expect(text).toMatch(/— (فريق مسارات|Masaarat Team)\s*$/);
}

const PATHS = [
  ["Page Messenger DM", (from: string, t: string) => messenger(from, t), "meta_messenger"],
  ["Instagram DM", (from: string, t: string) => igDm(from, t), "meta_instagram_dm"],
  ["Facebook comment", (from: string, t: string) => fbComment(from, t), "meta_page_comment"],
  ["Instagram comment", (from: string, t: string) => igComment(from, t), "meta_instagram_comment"],
] as const;

describe("SIMULATION — durable follow-up context on the four native Meta webhook paths", () => {
  for (const [label, make, provider] of PATHS) {
    it(`${label}: the follow-up on a different worker resolves the first question`, async () => {
      const sent: Sent[] = [];
      expect((await deliver(worker(sent), make("u-1", Q1))).status).toBe(200);
      expect((await deliver(worker(sent), make("u-1", Q2))).status).toBe(200);
      expect(sent.map((s) => s.provider)).toEqual([provider, provider]);
      expect(sent[0].text).toContain("النجارة وصناعة الأثاث");
      expectGrounded(sent[0].text, "https://masaarat.ai/technical");
      expect(sent[1].text).toContain("309");
      expectGrounded(sent[1].text, "https://masaarat.ai/technical/pricing");
      expect(fetch).not.toHaveBeenCalled();
    });
  }

  it("a repeated delivery of the same event is answered once; a new comment ID on the same post is answered separately", async () => {
    const sent: Sent[] = [];
    const first = igComment("u-2", Q1, "18118806677170189", "c-100");
    await deliver(worker(sent), first);
    await deliver(worker(sent), first);
    await deliver(worker(sent), igComment("u-2", Q2, "18118806677170189", "c-101"));
    await deliver(worker(sent), igComment("u-2", Q2, "18118806677170189", "c-101"));
    expect(sent.map((s) => s.target)).toEqual(["c-100", "c-101"]);
    expect(sent[1].text).toContain("309");
    const dmSent: Sent[] = [];
    const dm = messenger("u-2", Q1, "m_dup");
    await deliver(worker(dmSent), dm);
    await deliver(worker(dmSent), dm);
    expect(dmSent).toHaveLength(1);
  });

  it("never shares context across sender, post, channel or public/private", async () => {
    const sent: Sent[] = [];
    await deliver(worker(sent), fbComment("u-3", Q1, "photo1"));
    await deliver(worker(sent), messenger("u-3", Q1));
    // Other sender, same post / same sender, other post / same sender, other channel or visibility.
    await deliver(worker(sent), fbComment("u-4", Q2, "photo1"));
    await deliver(worker(sent), fbComment("u-3", Q2, "photo2"));
    await deliver(worker(sent), igComment("u-3", Q2));
    await deliver(worker(sent), igDm("u-3", Q2));
    const followUps = sent.slice(2);
    expect(followUps).toHaveLength(4);
    for (const s of followUps) {
      expect(s.text).not.toContain("309");
      expect(links(s.text)).not.toContain("https://masaarat.ai/technical/pricing");
    }
  });

  it("an Instagram comment without a media ID never mixes threads", async () => {
    const sent: Sent[] = [];
    await deliver(worker(sent), igComment("u-5", Q1, null));
    await deliver(worker(sent), igComment("u-5", Q2, null));
    await deliver(worker(sent), igComment("u-5", Q2, "18118806677170189"));
    expect(sent).toHaveLength(3);
    for (const s of sent.slice(1)) expect(s.text).not.toContain("309");
  });

  it("keeps own, staff-answered and echo safeguards", async () => {
    const sent: Sent[] = [];
    await deliver(worker(sent), fbComment(FACEBOOK_PAGE_ID, Q1));
    await deliver(worker(sent), igComment(INSTAGRAM_ACCOUNT_ID, Q1));
    await deliver(worker(sent, new Set(["c-staff"])), igComment("u-6", Q1, "18118806677170189", "c-staff"));
    expect(sent).toHaveLength(0);
    expect(await one("SELECT status AS v FROM support_private.events WHERE event_key=$1", ["c-staff"])).toBe("ignored");
    // A manual (non-app) Messenger echo hands the DM to staff; the next DM is not answered.
    const echo = { object: "page", entry: [{ id: FACEBOOK_PAGE_ID, messaging: [{ sender: { id: FACEBOOK_PAGE_ID }, recipient: { id: "u-7" }, message: { is_echo: true, mid: "m_staff", text: "staff" } }] }] };
    await deliver(worker(sent), echo);
    await deliver(worker(sent), messenger("u-7", Q1));
    expect(sent).toHaveLength(0);
  });

  it("stores only allow-listed topic codes, never text or identifiers", async () => {
    await deliver(worker([]), igDm("u-8", Q1));
    const rows = (await db.query<{ context_key: string; topic: Record<string, string> }>("SELECT context_key, topic FROM support_private.topic_context")).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].context_key).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rows[0].topic)).not.toMatch(/[\u0600-\u06FF]|u-8/);
  });
});
