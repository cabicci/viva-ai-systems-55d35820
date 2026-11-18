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
