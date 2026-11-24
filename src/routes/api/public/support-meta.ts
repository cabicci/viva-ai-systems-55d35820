import { createFileRoute } from "@tanstack/react-router";

// Meta (Facebook Page + linked Instagram) support webhook; verified inside the handler.
export const Route = createFileRoute("/api/public/support-meta")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/support/endpoints.server")).handleMetaSupportRequest(request),
      POST: async ({ request }) =>
        (await import("@/lib/support/endpoints.server")).handleMetaSupportRequest(request),
    },
  },
});
