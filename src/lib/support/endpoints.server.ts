// Server-only wiring shared by the file routes and the exact-path Worker dispatch.
import { answerQuestion } from "./answer.server";
import { handleMetaSupport } from "./meta.server";
import { cloudSupportStore } from "./store.server";
import { handleWhatsAppSupport } from "./whatsapp.server";

export function handleWhatsAppSupportRequest(request: Request): Promise<Response> {
  return handleWhatsAppSupport(request, {
    authToken: process.env.TWILIO_AUTH_TOKEN,
    store: cloudSupportStore,
    answer: (q, thread) => answerQuestion(q, { publicComment: false, thread }),
  });
}

export function handleMetaSupportRequest(request: Request): Promise<Response> {
  return handleMetaSupport(request, {
    appSecret: process.env.META_APP_SECRET,
    verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
    pageToken: process.env.META_PAGE_ACCESS_TOKEN,
    store: cloudSupportStore,
    answer: (q, publicComment, thread, factsOnly) => answerQuestion(q, { publicComment, thread, factsOnly }),
  });
}

/** Scheduler-only pilot reconciliation; authenticated with the managed scheduler credential. */
export async function handleSupportReconcileRequest(request: Request): Promise<Response> {
  const noStore = { "Cache-Control": "no-store" };
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
  const denied = await authenticateCronRequest(request);
  if (denied) return denied;
  const appSecret = process.env.META_APP_SECRET;
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!appSecret || !pageToken) return Response.json({ error: "SUPPORT_CHANNEL_NOT_CONFIGURED" }, { status: 503, headers: noStore });
  const { graphGet, reconcileOnce, cloudRunState } = await import("./reconcile.server");
  const { graphSender } = await import("./meta.server");
  const { createHmac } = await import("node:crypto");
  const proof = createHmac("sha256", appSecret).update(pageToken).digest("hex");
  try {
    const sources = await reconcileOnce({
      graph: graphGet(pageToken, proof),
      state: await cloudRunState(),
      appSecret,
      store: cloudSupportStore,
      send: graphSender(pageToken),
      answer: (q, publicComment, thread, factsOnly) => answerQuestion(q, { publicComment, thread, factsOnly }),
    });
    return Response.json({ sources }, { headers: noStore });
  } catch {
    console.error("SUPPORT_RECONCILE_FAILED");
    return Response.json({ error: "SUPPORT_RECONCILE_UNAVAILABLE" }, { status: 503, headers: noStore });
  }
}
