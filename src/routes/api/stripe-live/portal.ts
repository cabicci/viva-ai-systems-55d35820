// Stripe LIVE customer portal. Lifecycle operation: works for existing Live
// subscriptions even when new checkout is switched OFF.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stripe-live/portal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleLivePortal } = await import("@/lib/billing/live/endpoints.server");
        return handleLivePortal(request);
      },
      POST: async ({ request }) => {
        const { handleLivePortal } = await import("@/lib/billing/live/endpoints.server");
        return handleLivePortal(request);
      },
    },
  },
});
