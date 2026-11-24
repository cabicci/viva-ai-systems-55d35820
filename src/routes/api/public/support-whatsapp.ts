import { createFileRoute } from "@tanstack/react-router";

// Twilio WhatsApp support webhook; signature-verified inside the handler, fail-closed without its token.
export const Route = createFileRoute("/api/public/support-whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/support/endpoints.server")).handleWhatsAppSupportRequest(request),
      POST: async ({ request }) =>
        (await import("@/lib/support/endpoints.server")).handleWhatsAppSupportRequest(request),
    },
  },
});
