import { SUPPORT_WHATSAPP_NUMBER } from "./config";
import { detectLang, handoffReply, wantsHuman } from "./compose";
import { verifyTwilio } from "./crypto";
import type { SupportAnswer, ThreadRef } from "./answer.server";
import { senderHash, type SupportStore } from "./store.server";

const xmlHeaders = { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" };
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response/>';

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
export function messageTwiml(text: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(text)}</Message></Response>`;
}

export type WhatsAppDeps = {
  authToken?: string;
  store: () => Promise<SupportStore>;
  answer: (question: string, thread: ThreadRef) => Promise<SupportAnswer>;
};

/** Twilio WhatsApp inbound webhook: signed, destination-bound, replies only with TwiML. */
export async function handleWhatsAppSupport(request: Request, deps: WhatsAppDeps): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  if (!deps.authToken)
    return Response.json({ error: "SUPPORT_CHANNEL_NOT_CONFIGURED" }, { status: 503 });
  if (!(request.headers.get("content-type") ?? "").startsWith("application/x-www-form-urlencoded"))
    return new Response("Unsupported Media Type", { status: 415 });
  const raw = await request.text();
  if (raw.length > 64_000) return new Response("Payload Too Large", { status: 413 });
  const params = new URLSearchParams(raw);
  if (!(await verifyTwilio(deps.authToken, request.url, params, request.headers.get("x-twilio-signature"))))
    return new Response("Forbidden", { status: 403 });

  const to = params.get("To") ?? "";
  const from = params.get("From") ?? "";
  const sid = params.get("MessageSid") ?? params.get("SmsMessageSid") ?? "";
  const body = (params.get("Body") ?? "").trim();
  if (to !== `whatsapp:${SUPPORT_WHATSAPP_NUMBER}` || !/^whatsapp:\+\d{6,15}$/.test(from) || from === to)
    return new Response(EMPTY_TWIML, { headers: xmlHeaders });
  if (!/^[A-Z]{2}[a-f0-9]{32}$/.test(sid) || !body)
    return new Response(EMPTY_TWIML, { headers: xmlHeaders });

  const hash = await senderHash("whatsapp", from);
  let store: SupportStore;
  try {
    store = await deps.store();
    const decision = await store.claim("twilio_whatsapp", sid, hash);
    if (decision !== "process") return new Response(EMPTY_TWIML, { headers: xmlHeaders });
  } catch {
    return new Response("Service Unavailable", { status: 503 });
  }
  try {
    let text: string | null;
    // No live agent is connected, so asking for one gets a truthful pointer, not a mute.
    if (wantsHuman(body)) text = handoffReply(detectLang(body));
    else text = (await deps.answer(body, { family: "whatsapp", thread: hash, visibility: "private" })).text;
    if (!text) {
      await store.mark("twilio_whatsapp", sid, "ignored");
      return new Response(EMPTY_TWIML, { headers: xmlHeaders });
    }
    if (!(await store.mark("twilio_whatsapp", sid, "sending")))
      return new Response(EMPTY_TWIML, { headers: xmlHeaders });
    await store.mark("twilio_whatsapp", sid, "replied");
    return new Response(messageTwiml(text), { headers: xmlHeaders });
  } catch {
    await store.mark("twilio_whatsapp", sid, "failed").catch(() => false);
    return new Response("Service Unavailable", { status: 503 });
  }
}
