// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FACEBOOK_PAGE_ID, INSTAGRAM_ACCOUNT_ID } from "../config";
import { echoToken, metaSignature } from "../crypto";
import { extractMetaWork, handleMetaSupport, type MetaDeps, type MetaSender } from "../meta.server";
import { senderHash, type ClaimDecision, type EchoMatch, type SupportStore } from "../store.server";

// Production claim/mark SQL plus the proposed (unapplied) outbound ledger, in a disposable database.
const db = new PGlite();
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  for (const file of [
    "drizzle/migrations/0062_support_webhook_private_store.sql",
    "drizzle/migrations/0063_support_meta_reply_quota.sql",
    "drizzle/proposed/support_outbound_echo_ledger.sql",
  ]) await db.exec(readFileSync(file, "utf8"));
}, 30_000);
beforeEach(async () => { await db.exec("TRUNCATE support_private.events, support_private.senders, support_private.outbound"); });
afterAll(async () => { await db.close(); });

const one = async <T>(sql: string, args: unknown[]) => (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const baseStore: SupportStore = {
  claim: async (p, k, s) => (await one<ClaimDecision>("SELECT public.support_claim_meta_event($1,$2,$3) AS v", [p, k, s]))!,
  mark: async (p, k, st) => (await one<boolean>("SELECT public.support_mark_event($1,$2,$3) AS v", [p, k, st]))!,
  handoff: async (s, h) => { await db.query("SELECT public.support_set_handoff($1,$2)", [s, h]); },
};
const ledgerStore: SupportStore = {
  ...baseStore,
  beginOutbound: async (a, c) => { await db.query("SELECT public.support_begin_outbound($1,$2)", [a, c]); },
  finishOutbound: async (a, m, st) => { await db.query("SELECT public.support_finish_outbound($1,$2,$3)", [a, m, st]); },
  matchEcho: async (c, m) => (await one<EchoMatch>("SELECT public.support_match_echo($1,$2) AS v", [c, m]))!,
};

const SECRET = "local-test";
let outSeq = 0;
function harness(store: SupportStore = ledgerStore, onSend?: (target: string, metadata?: string) => Promise<void>) {
  const sent: { target: string; metadata?: string; messageId: string }[] = [];
  const send = vi.fn<MetaSender>(async (_p, target, _text, metadata) => {
    const messageId = `out-${++outSeq}`;
    await onSend?.(target, metadata);
    sent.push({ target, metadata, messageId });
    return { result: "sent", messageId };
  });
  const deps: MetaDeps = {
    appSecret: SECRET, pageToken: "unused", store: async () => store, send,
    answer: vi.fn(async (q: string) => ({ text: "reply to " + q + "\n\nhttps://masaarat.ai\n— Masaarat Team", source: "fallback" as const })),
  };
  return { deps, send, sent };
}
async function deliver(payload: unknown, deps: MetaDeps) {
  const body = JSON.stringify(payload);
  const headers = { "x-hub-signature-256": await metaSignature(SECRET, new TextEncoder().encode(body)) };
  return handleMetaSupport(new Request("https://example.test/support-meta", { method: "POST", headers, body }), deps);
}
const batch = (object: "page" | "instagram", messaging: unknown[]) => {
  const id = object === "page" ? FACEBOOK_PAGE_ID : INSTAGRAM_ACCOUNT_ID;
  return { object, entry: [{ id, messaging }] };
};
const inbound = (object: "page" | "instagram", from: string, mid: string) => ({
  sender: { id: from }, recipient: { id: object === "page" ? FACEBOOK_PAGE_ID : INSTAGRAM_ACCOUNT_ID },
  message: { mid, text: "how much is Pro? " + mid },
});
const echo = (object: "page" | "instagram", to: string, mid: string, extra: Record<string, unknown> = {}) => ({
  sender: { id: object === "page" ? FACEBOOK_PAGE_ID : INSTAGRAM_ACCOUNT_ID }, recipient: { id: to },
  message: { mid, is_echo: true, text: "any text, never inspected", ...extra },
});
async function handedOff(family: string, customer: string) {
  const h = await senderHash(family, customer);
  return (await one<boolean>(
    "SELECT coalesce((SELECT handoff_until > now() FROM support_private.senders WHERE sender_hash = $1), false) AS v", [h]))!;
}

describe("own outbound echoes never cause a manual takeover", () => {
  it("Messenger: own echo with signed metadata and no app_id, then a distinct follow-up is answered", async () => {
    const { deps, send, sent } = harness();
    expect((await deliver(batch("page", [inbound("page", "cust", "m1")]), deps)).status).toBe(200);
    expect(sent[0].metadata).toMatch(/^msr1\.[a-f0-9]{32}\.[a-f0-9]{64}$/);
    // Echo arrives without app_id and with a different mid than the Send API returned.
    const own = echo("page", "cust", "mid-from-echo", { metadata: sent[0].metadata });
    expect((await deliver(batch("page", [own]), deps)).status).toBe(200);
    expect((await deliver(batch("page", [own]), deps)).status).toBe(200); // Meta redelivery
    expect(await handedOff("messenger", "cust")).toBe(false);
    expect((await deliver(batch("page", [inbound("page", "cust", "m2")]), deps)).status).toBe(200);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("Instagram: own echo with no app_id or metadata is matched by the returned message ID", async () => {
    const { deps, send, sent } = harness();
    await deliver(batch("instagram", [inbound("instagram", "igc", "i1")]), deps);
    expect(sent[0].metadata).toBeUndefined(); // metadata is only sent on Messenger
    const own = echo("instagram", "igc", sent[0].messageId);
    expect((await deliver(batch("instagram", [own]), deps)).status).toBe(200);
    expect(await handedOff("instagram", "igc")).toBe(false);
    await deliver(batch("instagram", [inbound("instagram", "igc", "i2")]), deps);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("Instagram: an echo that beats the Send API response is retried, then recognised", async () => {
    let quick: Response | undefined;
    let quickDeps: MetaDeps;
    const h = harness(ledgerStore, async (target) => {
      // While the send is in flight the echo (with the not-yet-recorded ID) arrives.
      quick = await deliver(batch("instagram", [echo("instagram", target, `out-${outSeq}`)]), quickDeps);
    });
    quickDeps = h.deps;
    expect((await deliver(batch("instagram", [inbound("instagram", "fast", "q1")]), h.deps)).status).toBe(200);
    expect(quick!.status).toBe(500);
    expect(await handedOff("instagram", "fast")).toBe(false);
    const retried = await deliver(batch("instagram", [echo("instagram", "fast", h.sent[0].messageId)]), h.deps);
    expect(retried.status).toBe(200);
    expect(await handedOff("instagram", "fast")).toBe(false);
  });
});

describe("genuine manual replies still take over", () => {
  it.each([
    ["no app_id", {}],
    ["a foreign app_id (native inbox)", { app_id: 263902037430900 }],
  ])("Messenger echo with %s and no metadata, unrelated to our sends", async (_label, extra) => {
    const { deps, send } = harness();
    await deliver(batch("page", [inbound("page", "human", "h1")]), deps);
    await deliver(batch("page", [echo("page", "human", "staff-mid", extra)]), deps);
    expect(await handedOff("messenger", "human")).toBe(true);
    await deliver(batch("page", [inbound("page", "human", "h2")]), deps);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("Instagram manual reply after our own reply in the same conversation", async () => {
    const { deps, sent } = harness();
    await deliver(batch("instagram", [inbound("instagram", "mix", "x1")]), deps);
    await deliver(batch("instagram", [echo("instagram", "mix", sent[0].messageId), echo("instagram", "mix", "staff-ig")]), deps);
    expect(await handedOff("instagram", "mix")).toBe(true);
  });

  it("without the ledger installed, unproven echoes keep the previous takeover behaviour", async () => {
    const { deps, sent } = harness(baseStore);
    await deliver(batch("page", [inbound("page", "a", "n1")]), deps);
    await deliver(batch("page", [echo("page", "a", "e1", { metadata: sent[0].metadata })]), deps);
    expect(await handedOff("messenger", "a")).toBe(false);
    await deliver(batch("instagram", [echo("instagram", "b", "e2")]), deps);
    expect(await handedOff("instagram", "b")).toBe(true);
  });
});

describe("automated third-party echoes are ignored", () => {
  it("foreign metadata and a token bound to another conversation are not ours and not manual", async () => {
    const { deps } = harness();
    const otherBinding = await echoToken(SECRET, "messenger", "someone-else");
    await deliver(batch("page", [
      echo("page", "t1", "bot-1", { app_id: 111, metadata: "crm-flow-42" }),
      echo("page", "t2", "bot-2", { metadata: otherBinding }),
    ]), deps);
    expect(await handedOff("messenger", "t1")).toBe(false);
    expect(await handedOff("messenger", "t2")).toBe(false);
  });
});

it("mixed burst: replies, own echoes, a manual takeover and a third-party echo in one delivery", async () => {
  const { deps, send, sent } = harness();
  await deliver(batch("page", [inbound("page", "A", "a0")]), deps);
  const ownA = echo("page", "A", "echo-a0", { metadata: sent[0].metadata });
  const burst = batch("page", [
    ownA,
    inbound("page", "B", "b1"),
    echo("page", "C", "staff-c"),
    inbound("page", "C", "c1"),
    echo("page", "D", "crm-d", { app_id: 222, metadata: "crm" }),
    inbound("page", "D", "d1"),
    inbound("page", "A", "a1"),
  ]);
  expect((await deliver(burst, deps)).status).toBe(200);
  expect((await deliver(burst, deps)).status).toBe(200); // redelivery: idempotent
  expect(sent.slice(1).map((s) => s.target).sort()).toEqual(["A", "B", "D"]);
  expect(send).toHaveBeenCalledTimes(4);
  expect(await handedOff("messenger", "A")).toBe(false);
  expect(await handedOff("messenger", "C")).toBe(true);
  expect(await handedOff("messenger", "D")).toBe(false);
});

describe("Page comment ownership", () => {
  const change = (post_id: string, comment_id = "cm") => ({
    field: "feed", value: { item: "comment", verb: "add", post_id, comment_id, message: "price?", from: { id: "u" } },
  });
  const keys = (changes: unknown[], id = FACEBOOK_PAGE_ID) =>
    extractMetaWork({ object: "page", entry: [{ id, changes }] }).map((w) => (w.kind === "reply" ? w.key : "echo"));
  it("accepts prefixed posts and bare numeric owned video/reel IDs, rejects other pages", () => {
    expect(keys([change(`${FACEBOOK_PAGE_ID}_9`, "c1"), change("1122836357382450", "c2")])).toEqual(["c1", "c2"]);
    expect(keys([change("999_9"), change("reel-abc"), change("")])).toEqual([]);
    expect(keys([change("1122836357382450")], "999")).toEqual([]);
  });
});

it("Graph sender attaches metadata only to Messenger DMs and returns the provider message ID", async () => {
  const bodies: Record<string, unknown>[] = [];
  const fetchImpl = vi.fn<typeof fetch>(async (_u, init) => {
    bodies.push(JSON.parse(String(init!.body)));
    return Response.json({ recipient_id: "r", message_id: "mid.out" });
  });
  const { graphSender } = await import("../meta.server");
  const sender = graphSender("page-token", fetchImpl);
  expect(await sender("meta_messenger", "r", "hi", "msr1.x")).toEqual({ result: "sent", messageId: "mid.out" });
  expect(await sender("meta_instagram_dm", "r", "hi", "msr1.x")).toEqual({ result: "sent", messageId: "mid.out" });
  expect((bodies[0].message as Record<string, unknown>).metadata).toBe("msr1.x");
  expect((bodies[1].message as Record<string, unknown>).metadata).toBeUndefined();
});
