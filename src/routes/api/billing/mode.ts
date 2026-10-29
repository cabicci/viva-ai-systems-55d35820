// Tells the site which Stripe flow to use. The decision is made here on the
// server from server settings; it returns no personal data.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/mode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleBillingMode } = await import("@/lib/billing/mode-endpoint.server");
        return handleBillingMode(request);
      },
    },
  },
});
