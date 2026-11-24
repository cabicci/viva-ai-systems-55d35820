// Synthetic dry run: real OpenAI answers + live public offer state, run through both
// signed webhook handlers with throwaway secrets, an in-memory store and a capturing
// sender. Nothing is sent to Twilio, Meta or any customer.
import { answerQuestion, readFreeAccessState } from "../src/lib/support/answer.server";
import { countOfficialLinks } from "../src/lib/support/compose";
import { metaSignature, twilioSignature } from "../src/lib/support/crypto";
import { handleMetaSupport } from "../src/lib/support/meta.server";
import type { SupportStore } from "../src/lib/support/store.server";
import { handleWhatsAppSupport } from "../src/lib/support/whatsapp.server";

const seen = new Set<string>();
const store: SupportStore = {
  async claim(p, k) { if (seen.has(p + k)) return "duplicate"; seen.add(p + k); return "process"; },
  async mark() { return true; },
  async handoff() {},
};
const sources: string[] = [];
const answer = async (q: string, publicComment = false) => {
  const a = await answerQuestion(q, { publicComment });
  sources.push(a.source);
  return a;
};
const offer = await readFreeAccessState();
console.log("live free-access state:", offer.kind);

const token = crypto.randomUUID();
const url = "https://masaarat.ai/api/public/support-whatsapp";
const params = new URLSearchParams({
  To: "whatsapp:+19376967661", From: "whatsapp:+10000000000",
  MessageSid: "SM" + "0".repeat(32), Body: "لو اشتركت في باقة مدفوعة، مدة الاشتراك بتبقى قد إيه؟",
});
const wa = await handleWhatsAppSupport(
  new Request(url, { method: "POST", body: params.toString(), headers: {
    "content-type": "application/x-www-form-urlencoded",
    "x-twilio-signature": await twilioSignature(token, url, params) } }),
  { authToken: token, store: async () => store, answer: (q) => answer(q) },
);
const twiml = await wa.text();
const waText = twiml.match(/<Message>([\s\S]*)<\/Message>/)?.[1] ?? "";
console.log("\n[Q1 WhatsApp, paid duration] status", wa.status, "source", sources[0], "official links", countOfficialLinks(waText));
console.log(waText);

const secret = crypto.randomUUID();
const body = JSON.stringify({ object: "page", entry: [{ id: "1298751943326788", messaging: [
  { sender: { id: "synthetic-user" }, recipient: { id: "1298751943326788" },
    message: { mid: "m_synthetic_1", text: "Hi, what kinds of courses can I study on Masaarat? Is there a website I should check?" } }] }] });
const captured: { provider: string; text: string }[] = [];
const meta = await handleMetaSupport(
  new Request("https://masaarat.ai/api/public/support-meta", { method: "POST", body,
    headers: { "x-hub-signature-256": await metaSignature(secret, new TextEncoder().encode(body)) } }),
  { appSecret: secret, pageToken: "unused-synthetic", store: async () => store, answer,
    send: async (provider, _t, text) => { captured.push({ provider, text }); return "sent"; } },
);
console.log("\n[Q2 Messenger, general] status", meta.status, "source", sources[1], "official links", countOfficialLinks(captured[0]?.text ?? ""));
console.log(captured[0]?.text);
