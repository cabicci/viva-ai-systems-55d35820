// @vitest-environment node
// WhatsApp follow-ups across separate server instances: the production claim SQL plus the durable
// topic store (0067) in a disposable database; each "worker" has its own empty memory fallback.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "../answer.server";
import { SUPPORT_WHATSAPP_NUMBER } from "../config";
import { durableContextStore, memoryContextStore } from "../context";
import { twilioSignature } from "../crypto";
import { staticCatalogue } from "../sources";
import type { ClaimDecision, SupportStore } from "../store.server";
import { handleWhatsAppSupport } from "../whatsapp.server";

const db = new PGlite();
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  for (const f of ["0062_support_webhook_private_store", "0063_support_meta_reply_quota", "0067_support_topic_context"])
    await db.exec(readFileSync(`drizzle/migrations/${f}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => { await db.exec("TRUNCATE support_private.events, support_private.senders, support_private.topic_context"); });
afterAll(async () => { await db.close(); });

const one = async <T>(sql: string, args: unknown[]) => (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const store: SupportStore = {
  claim: async (p, k, s) => (await one<ClaimDecision>("SELECT public.support_claim_event($1,$2,$3) AS v", [p, k, s]))!,
  mark: async (p, k, st) => (await one<boolean>("SELECT public.support_mark_event($1,$2,$3) AS v", [p, k, st]))!,
  handoff: async (s, h) => { await db.query("SELECT public.support_set_handoff($1,$2)", [s, h]); },
};
const rpc = async (name: string, args: Record<string, unknown>) =>
  name === "support_get_topic"
    ? one("SELECT public.support_get_topic($1) AS v", [args.p_key])
    : db.query("SELECT public.support_set_topic($1,$2::jsonb)", [args.p_key, JSON.stringify(args.p_topic)]);

const TOKEN = "tok";
const URL_ = "https://masaarat.ai/api/public/support-whatsapp";
/** A fresh "server instance": its own empty memory, the shared durable store, no model key. */
function worker() {
  const context = durableContextStore(rpc, memoryContextStore());
  return {
    authToken: TOKEN,
    store: async () => store,
    answer: (q: string, thread: Parameters<typeof answerQuestion>[1]["thread"]) =>
      answerQuestion(q, { publicComment: false, thread }, { context, openaiKey: "", freeAccess: async () => ({ kind: "inactive" }), catalogue: async () => staticCatalogue() }),
  };
}
let seq = 0;
async function send(w: ReturnType<typeof worker>, from: string, body: string, sid = `SM${(++seq).toString(16).padStart(32, "0")}`) {
  const params = new URLSearchParams({ To: `whatsapp:${SUPPORT_WHATSAPP_NUMBER}`, From: `whatsapp:${from}`, MessageSid: sid, Body: body });
  const headers = { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": await twilioSignature(TOKEN, URL_, params) };
  const xml = await (await handleWhatsAppSupport(new Request(URL_, { method: "POST", headers, body: params.toString() }), w)).text();
  const m = xml.match(/<Message>([\s\S]*)<\/Message>/);
  return { sid, text: m ? m[1].replace(/&amp;/g, "&") : null };
}
const linkOf = (t: string | null) => t!.match(/https:\/\/masaarat\.ai[^\s<]*/g)!;

describe("WhatsApp follow-up across workers", () => {
  it("technical → «والسعر كام» asks only the market → «في مصر» gives the technical price", async () => {
    const a = await send(worker(), "+201000000001", "عندكم إيه في التعليم الفني؟");
    expect(a.text).toContain("النجارة وصناعة الأثاث");
    const b = await send(worker(), "+201000000001", "والسعر كام");
    expect(b.text).toMatch(/داخل مصر ولا براها/);
    expect(b.text).not.toMatch(/لأنهي برنامج/);
    expect(linkOf(b.text)).toEqual(["https://masaarat.ai/technical/pricing"]);
    const c = await send(worker(), "+201000000001", "في مصر");
    expect(c.text).toContain("اشتراك تقني: 309 جنيه في الشهر أو 3090 جنيه في السنة.");
    expect(linkOf(c.text)).toEqual(["https://masaarat.ai/technical/pricing"]);
    expect(c.text).toContain("— فريق مسارات");
    for (const t of [a.text, b.text, c.text]) expect(t).not.toMatch(/رسالة تلقائية|أهلاً بيك! اسألني/);
  });
  it("typo «بيبداء بايه» then «طب وبكام في مصر؟» on another worker gives the technical price", async () => {
    await send(worker(), "+201000000002", "التعليم الفني عندكم بيبداء بايه؟");
    const r = await send(worker(), "+201000000002", "طب وبكام في مصر؟");
    expect(r.text).toContain("اشتراك تقني: 309 جنيه");
  });
  it("an unrelated sender does not inherit the topic", async () => {
    await send(worker(), "+201000000003", "عندكم إيه في التعليم الفني؟");
    const r = await send(worker(), "+201000000004", "والسعر كام");
    expect(r.text).toMatch(/لأنهي برنامج/);
  });
  it("a repeated delivery is answered once", async () => {
    const first = await send(worker(), "+201000000005", "عندكم إيه في التعليم الفني؟", "SM" + "a".repeat(32));
    const again = await send(worker(), "+201000000005", "عندكم إيه في التعليم الفني؟", "SM" + "a".repeat(32));
    expect(first.text).not.toBeNull();
    expect(again.text).toBeNull();
  });
  it("a greeting gets a short greeting; a question never gets a welcome", async () => {
    const g = await send(worker(), "+201000000006", "السلام عليكم");
    expect(g.text).toMatch(/أهلاً بيك/);
    expect(g.text).toContain("— فريق مسارات");
    const q = await send(worker(), "+201000000006", "اهلا، التعليم الفني بكام في مصر؟");
    expect(q.text).toContain("اشتراك تقني");
    expect(q.text).not.toMatch(/أهلاً بيك! اسألني/);
  });
  it("the short greeting is WhatsApp-only: Meta DMs keep their existing behaviour", async () => {
    const deps = { context: memoryContextStore(), openaiKey: "", freeAccess: async () => ({ kind: "inactive" as const }), catalogue: async () => staticCatalogue() };
    for (const family of ["messenger", "instagram"]) {
      const a = await answerQuestion("السلام عليكم", { publicComment: false, thread: { family, thread: "t", visibility: "private" } }, deps);
      expect(a.text).not.toMatch(/أهلاً بيك! اسألني/);
    }
    const n = await answerQuestion("السلام عليكم", { publicComment: false }, deps);
    expect(n.text).not.toMatch(/أهلاً بيك! اسألني/);
    const w = await answerQuestion("السلام عليكم", { publicComment: false, thread: { family: "whatsapp", thread: "t", visibility: "private" } }, deps);
    expect(w.text).toMatch(/أهلاً بيك! اسألني/);
  });
  it("stores only allow-listed codes and refuses free text", async () => {
    await send(worker(), "+201000000007", "عندكم إيه في التعليم الفني؟");
    const rows = (await db.query<{ topic: Record<string, string> }>("SELECT topic FROM support_private.topic_context")).rows;
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0].topic).every((k) => ["subject", "area", "program", "plan", "market", "term", "lesson"].includes(k))).toBe(true);
    expect(JSON.stringify(rows[0].topic)).not.toMatch(/[\u0600-\u06FF]|\+20/);
    await expect(db.query("SELECT public.support_set_topic($1,$2::jsonb)", ["a".repeat(64), JSON.stringify({ note: "hello" })])).rejects.toThrow();
    await db.exec("UPDATE support_private.topic_context SET expires_at = now() - interval '1 second'");
    expect(await one("SELECT public.support_get_topic(context_key) AS v FROM support_private.topic_context", [])).toBeNull();
  });
});
