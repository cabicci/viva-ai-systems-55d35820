// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "../answer.server";
import { FACEBOOK_PAGE_ID, INSTAGRAM_ACCOUNT_ID } from "../config";
import { metaSignature } from "../crypto";
import { handleMetaSupport, type MetaDeps } from "../meta.server";
import type { ClaimDecision, SupportStore } from "../store.server";
// Every real reply carries the official link and signature; the webhook refuses unbranded text.
const SIGN = "\n\nhttps://masaarat.ai\n— فريق مسارات";

// Replay the production claim/mark SQL in a disposable local database.
const db = new PGlite();
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  for (const migration of ["0062_support_webhook_private_store", "0063_support_meta_reply_quota"]) {
    await db.exec(readFileSync(`drizzle/migrations/${migration}.sql`, "utf8"));
  }
}, 30_000);
beforeEach(async () => { await db.exec("TRUNCATE support_private.events, support_private.senders"); });
afterAll(async () => { await db.close(); });

const store: SupportStore = {
  async claim(provider, key, sender) {
    const result = await db.query<{ decision: ClaimDecision }>(
      "SELECT public.support_claim_meta_event($1, $2, $3) AS decision", [provider, key, sender]);
    return result.rows[0].decision;
  },
  async mark(provider, key, status) {
    const result = await db.query<{ marked: boolean }>(
      "SELECT public.support_mark_event($1, $2, $3) AS marked", [provider, key, status]);
    return result.rows[0].marked;
  },
  async handoff(sender, hours) { await db.query("SELECT public.support_set_handoff($1, $2)", [sender, hours]); },
};
const deps = (): MetaDeps => ({
  appSecret: "local-test", pageToken: "unused", store: async () => store,
  answer: vi.fn(async (q: string) => ({ text: q + SIGN, source: "fallback" as const })),
  send: vi.fn(async () => "sent" as const),
});
async function deliver(payload: unknown, options: MetaDeps) {
  const body = JSON.stringify(payload);
  const headers = { "x-hub-signature-256": await metaSignature("local-test", new TextEncoder().encode(body)) };
  return handleMetaSupport(new Request("https://example.test/support-meta", { method: "POST", headers, body }), options);
}

describe.each([["page", FACEBOOK_PAGE_ID], ["instagram", INSTAGRAM_ACCOUNT_ID]])("%s batched delivery", (object, account) => {
  it("answers eight messages from one person in order across entries, including above the AI quota", async () => {
    const options = deps();
    const messages = Array.from({ length: 8 }, (_, i) => ({
      sender: { id: "person" }, recipient: { id: account },
      message: { mid: "m".repeat(205) + i, text: `question ${i}?` },
    }));
    const batch = { object, entry: [
      { id: account, messaging: messages.slice(0, 4) },
      { id: account, messaging: messages.slice(4) },
    ] };
    expect((await deliver(batch, options)).status).toBe(200);
    expect((await deliver(batch, options)).status).toBe(200);
    expect(vi.mocked(options.send!).mock.calls.map(([, , text]) => text)).toEqual(messages.map(m => m.message.text + SIGN));
    expect(vi.mocked(options.answer).mock.calls.map(([, , , factsOnly]) => factsOnly))
      .toEqual([false, false, false, false, false, false, true, true]);
  });

  it("answers two distinct comments from one author on one post once each across concurrent redeliveries", async () => {
    const options = deps();
    const changes = ["c1", "c2", "c1"].map(id => {
      const text = id === "c1" ? "الاشتراك بكام؟" : "إزاي أسجّل؟";
      return object === "page"
      ? { field: "feed", value: { item: "comment", verb: "add", post_id: account + "_42", comment_id: id,
          from: { id: "person" }, message: text } }
      : { field: "comments", value: { media: { id: "42" }, id, from: { id: "person" }, text } };
    });
    const batch = { object, entry: [{ id: account, changes }] };
    const responses = await Promise.all([deliver(batch, options), deliver(batch, options)]);
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    expect(vi.mocked(options.send!).mock.calls.map(([, target]) => target).sort()).toEqual(["c1", "c2"]);
    expect(options.answer).toHaveBeenCalledTimes(2);
  });
});

it("finishes the other conversations and retries only the unsent message after an answer error", async () => {
  const options = deps();
  const messages = Array.from({ length: 12 }, (_, i) => ({
    sender: { id: "person" + i }, recipient: { id: FACEBOOK_PAGE_ID },
    message: { mid: "mid" + i, text: "message " + i },
  }));
  const batch = { object: "page", entry: [{ id: FACEBOOK_PAGE_ID, messaging: messages }] };
  let failOnce = true;
  options.answer = async (text) => {
    if (text === "message 2" && failOnce) {
      failOnce = false;
      throw new Error("temporary failure generating answer");
    }
    return { text: text + SIGN, source: "deterministic" };
  };
  expect((await deliver(batch, options)).status).toBe(500);
  expect(options.send).toHaveBeenCalledTimes(11);
  expect((await deliver(batch, options)).status).toBe(200);
  const recipients = vi.mocked(options.send!).mock.calls.map(([, target]) => target);
  expect(recipients.sort()).toEqual(messages.map(m => m.sender.id).sort());
});

it("answers from public prices above quota without calling an AI provider", async () => {
  const fetchImpl = vi.fn<typeof fetch>();
  const result = await answerQuestion("What is the monthly price of Pro in Egypt?", { publicComment: false, factsOnly: true }, {
    openaiKey: "test-only", catalogue: async () => [], freeAccess: async () => ({kind: "inactive"}), fetchImpl,
  });
  expect(result.text).toContain("169");
  expect(result.text).toContain("https://masaarat.ai/pricing");
  expect(fetchImpl).not.toHaveBeenCalled();
});
