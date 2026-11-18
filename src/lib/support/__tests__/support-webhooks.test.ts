import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { countOfficialLinks, offerFacts, redactQuestion, sanitizeAnswer } from "../compose";
import { metaSignature, twilioSignature } from "../crypto";
import { extractMetaWork, handleMetaSupport } from "../meta.server";
import type { ClaimDecision, MarkStatus, SupportStore } from "../store.server";
import { handleWhatsAppSupport } from "../whatsapp.server";

function memoryStore() {
  const events = new Map<string, string>();
  const handoffs = new Set<string>();
  const store: SupportStore = {
    async claim(p, k, h): Promise<ClaimDecision> {
      if (handoffs.has(h)) return "handoff";
      const key = `${p}:${k}`;
      const s = events.get(key);
      if (s && s !== "failed") return "duplicate";
      events.set(key, "processing");
      return "process";
    },
    async mark(p, k, status: MarkStatus) {
      events.set(`${p}:${k}`, status);
      return true;
    },
    async handoff(h) {
      handoffs.add(h);
    },
  };
  return { store, events, handoffs };
}
const answer = async () => ({ text: "أهلاً\n\nhttps://masaarat.ai/pricing\n— فريق مسارات", source: "openai" as const });

describe("support reply policy", () => {
  it("keeps exactly one official link and the signature, dropping external links", () => {
    const out = sanitizeAnswer("زور https://evil.example و www.other.com و masaarat.ai/x", "https://masaarat.ai/pricing", "ar")!;
    expect(countOfficialLinks(out)).toBe(1);
    expect(out).toContain("https://masaarat.ai/pricing");
    expect(out).not.toMatch(/evil|other\.com/);
    expect(out.endsWith("— فريق مسارات")).toBe(true);
  });
  it("rejects credential requests and certificate claims", () => {
    expect(sanitizeAnswer("ابعتلي الباسورد بتاعك", "https://masaarat.ai", "ar")).toBeNull();
    expect(sanitizeAnswer("You get an accredited certificate", "https://masaarat.ai", "en")).toBeNull();
  });
  it("redacts contact details before the model sees them", () => {
    const r = redactQuestion("رقمي 01012345678 وايميلي a@b.com و @ahmed https://x.co");
    expect(r).not.toMatch(/01012345678|a@b\.com|@ahmed|x\.co/);
  });
  it("mentions limited-time free access only when active and never denies a deadline", () => {
    const active = offerFacts({ kind: "active", endsAt: "2026-12-01T00:00:00Z" });
    expect(active).toMatch(/free for a limited time/);
    expect(active).toMatch(/Paid plans are still available/);
    expect(offerFacts({ kind: "inactive" })).toMatch(/Do not mention any free period/);
  });
});

describe("signatures", () => {
  it("matches Twilio's HMAC-SHA1 scheme", async () => {
    const p = new URLSearchParams("To=a&Body=x&From=b");
    const expected = createHmac("sha1", "tok").update("https://h/p" + "Bodyx" + "Fromb" + "Toa").digest("base64");
    expect(await twilioSignature("tok", "https://h/p", p)).toBe(expected);
  });
  it("matches Meta's sha256 app signature over raw bytes", async () => {
    const raw = new TextEncoder().encode('{"a":"\\u0645"}');
    const expected = "sha256=" + createHmac("sha256", "sec").update(raw).digest("hex");
    expect(await metaSignature("sec", raw)).toBe(expected);
  });
});

const WA_URL = "https://masaarat.ai/api/public/support-whatsapp";
async function waRequest(fields: Record<string, string>, token = "tok", sign = true) {
  const params = new URLSearchParams(fields);
  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  if (sign) headers["x-twilio-signature"] = await twilioSignature(token, WA_URL, params);
  return new Request(WA_URL, { method: "POST", headers, body: params.toString() });
}
const waFields = {
  To: "whatsapp:+19376967661",
  From: "whatsapp:+201000000000",
  MessageSid: "SM" + "a".repeat(32),
  Body: "مدة الاشتراك كام؟",
};

describe("WhatsApp webhook", () => {
  it("fails closed without the auth token", async () => {
    const { store } = memoryStore();
    const r = await handleWhatsAppSupport(await waRequest(waFields), { store: async () => store, answer });
    expect(r.status).toBe(503);
  });
  it("rejects unsigned requests", async () => {
    const { store } = memoryStore();
    const r = await handleWhatsAppSupport(await waRequest(waFields, "tok", false), { authToken: "tok", store: async () => store, answer });
    expect(r.status).toBe(403);
  });
  it("ignores other destinations", async () => {
    const { store } = memoryStore();
    const r = await handleWhatsAppSupport(await waRequest({ ...waFields, To: "whatsapp:+10000000000" }), { authToken: "tok", store: async () => store, answer });
    expect(await r.text()).not.toContain("<Message>");
  });
  it("answers once and stays silent on a duplicate delivery", async () => {
    const { store } = memoryStore();
    const deps = { authToken: "tok", store: async () => store, answer };
    const first = await (await handleWhatsAppSupport(await waRequest(waFields), deps)).text();
    const second = await (await handleWhatsAppSupport(await waRequest(waFields), deps)).text();
    expect(first).toContain("<Message>");
    expect(second).not.toContain("<Message>");
  });
  it("answers a request for a person truthfully: contact page, no promise, no silent mute", async () => {
    const m = memoryStore();
    const r = await handleWhatsAppSupport(await waRequest({ ...waFields, Body: "عايز اكلم موظف" }), { authToken: "tok", store: async () => m.store, answer });
    const text = await r.text();
    expect(text).toContain("https://masaarat.ai/contact");
    expect(text).toContain("المساعد الآلي");
    expect(text).not.toMatch(/هنحوّل|هيرد عليك|هنرد/);
    expect(m.handoffs.size).toBe(0);
  });
  it("passes a private, sender-scoped thread to the answerer", async () => {
    const m = memoryStore();
    const seen: unknown[] = [];
    await handleWhatsAppSupport(await waRequest(waFields), { authToken: "tok", store: async () => m.store, answer: async (_q, thread) => (seen.push(thread), answer()) });
    expect(seen[0]).toMatchObject({ family: "whatsapp", visibility: "private" });
  });
});

const page = (messaging: unknown[] = [], changes: unknown[] = [], id = "1298751943326788") => ({ object: "page", entry: [{ id, messaging, changes }] });
describe("Meta webhook", () => {
  it("keeps only customer messages and new comments for the fixed accounts", () => {
    const work = extractMetaWork(
      page(
        [
          { sender: { id: "u1" }, recipient: { id: "1298751943326788" }, message: { mid: "m1", text: "hi" } },
          { sender: { id: "1298751943326788" }, recipient: { id: "u1" }, message: { mid: "m2", text: "x", is_echo: true, app_id: 4372803903032156 } },
          { sender: { id: "u1" }, recipient: { id: "1298751943326788" }, message: { mid: "m3", is_deleted: true } },
          { sender: { id: "u1" }, recipient: { id: "1298751943326788" }, read: { watermark: 1 } },
        ],
        [
          { field: "feed", value: { item: "comment", verb: "add", comment_id: "c1", post_id: "1298751943326788_9", message: "price?", from: { id: "u2" } } },
          { field: "feed", value: { item: "comment", verb: "edited", comment_id: "c2", post_id: "1298751943326788_9", message: "x", from: { id: "u2" } } },
          { field: "feed", value: { item: "comment", verb: "add", comment_id: "c3", post_id: "1298751943326788_9", message: "self", from: { id: "1298751943326788" } } },
        ],
      ),
    );
    expect(work.map((w) => (w.kind === "reply" ? w.key : "echo"))).toEqual(["m1", "c1"]);
    expect(extractMetaWork(page([{ sender: { id: "u" }, recipient: { id: "999" }, message: { mid: "m", text: "t" } }], [], "999"))).toEqual([]);
    const ig = extractMetaWork({ object: "instagram", entry: [{ id: "17841430598943682", changes: [{ field: "comments", value: { id: "ic1", text: "كام السعر", from: { id: "ig9" } } }] }] });
    expect(ig[0]).toMatchObject({ provider: "meta_instagram_comment", target: "ic1" });
  });
  it("answers GET verification only with the configured token", async () => {
    const ok = await handleMetaSupport(new Request("https://masaarat.ai/api/public/support-meta?hub.mode=subscribe&hub.verify_token=v&hub.challenge=123"), { verifyToken: "v", store: async () => memoryStore().store, answer });
    expect(await ok.text()).toBe("123");
    const bad = await handleMetaSupport(new Request("https://masaarat.ai/api/public/support-meta?hub.mode=subscribe&hub.verify_token=x&hub.challenge=123"), { verifyToken: "v", store: async () => memoryStore().store, answer });
    expect(bad.status).toBe(403);
  });
  it("rejects bad signatures and sends each event once, never retrying an ambiguous send", async () => {
    const m = memoryStore();
    const body = JSON.stringify(page([{ sender: { id: "u1" }, recipient: { id: "1298751943326788" }, message: { mid: "m1", text: "hi" } }]));
    const req = async (sig?: string) =>
      new Request("https://masaarat.ai/api/public/support-meta", {
        method: "POST",
        headers: { "x-hub-signature-256": sig ?? (await metaSignature("sec", new TextEncoder().encode(body))) },
        body,
      });
    const send = vi.fn(async () => "ambiguous" as const);
    const deps = { appSecret: "sec", pageToken: "pt", store: async () => m.store, answer, send };
    expect((await handleMetaSupport(await req("sha256=00"), deps)).status).toBe(403);
    expect((await handleMetaSupport(await req(), deps)).status).toBe(200);
    expect((await handleMetaSupport(await req(), deps)).status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(m.events.get("meta_messenger:m1")).toBe("ambiguous");
  });
});

describe("public comments", () => {
  const comment = (id: string, text: string, from = "u7", post = "1298751943326788_42") => ({
    field: "feed",
    value: { item: "comment", verb: "add", comment_id: id, post_id: post, message: text, from: { id: from } },
  });
  async function deliver(changes: unknown[], deps: Parameters<typeof handleMetaSupport>[1]) {
    const body = JSON.stringify(page([], changes));
    return handleMetaSupport(
      new Request("https://masaarat.ai/api/public/support-meta", {
        method: "POST",
        headers: { "x-hub-signature-256": await metaSignature("sec", new TextEncoder().encode(body)) },
        body,
      }),
      deps,
    );
  }
  it("ignores non-questions without calling the model", async () => {
    const m = memoryStore();
    const ans = vi.fn(answer);
    const send = vi.fn(async () => "sent" as const);
    await deliver([comment("c1", "😍😍 جميل"), comment("c2", "@friend")], { appSecret: "sec", pageToken: "pt", store: async () => m.store, answer: ans, send });
    expect(ans).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("answers each new comment once and keeps follow-ups in the same public thread", async () => {
    const m = memoryStore();
    const threads: unknown[] = [];
    const send = vi.fn(async () => "sent" as const);
    const deps = { appSecret: "sec", pageToken: "pt", store: async () => m.store, send, answer: async (_q: string, _p: boolean, t: unknown) => (threads.push(t), answer()) };
    await deliver([comment("c1", "الاشتراك بكام؟")], deps);
    await deliver([comment("c2", "طب والسنوي بكام؟")], deps);
    await deliver([comment("c2", "طب والسنوي بكام؟")], deps);
    await deliver([comment("c3", "بكام؟", "u8")], deps);
    expect(send).toHaveBeenCalledTimes(3);
    expect(threads).toHaveLength(3);
    expect(threads[1]).toEqual(threads[0]);
    expect(threads[2]).not.toEqual(threads[0]);
    expect(threads[0]).toMatchObject({ visibility: "public", family: "messenger" });
    expect((threads[0] as { thread: string }).thread.startsWith("1298751943326788_42:")).toBe(true);
  });
});

describe("live free-access mention", () => {
  it("adds the limited-time free line when active and the model omitted it", () => {
    const out = sanitizeAnswer("الاشتراك شهري أو سنوي.", "https://masaarat.ai/pricing", "ar", { kind: "active", endsAt: "2026-12-01T00:00:00Z" })!;
    expect(out).toMatch(/مجاناً لفترة محدودة/);
    expect(countOfficialLinks(out)).toBe(1);
  });
  it("adds nothing when no promotion is active", () => {
    const out = sanitizeAnswer("Monthly or yearly.", "https://masaarat.ai/pricing", "en", { kind: "inactive" })!;
    expect(out).not.toMatch(/free/i);
  });
});
