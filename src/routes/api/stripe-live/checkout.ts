// Stripe LIVE checkout. Blocked unless STRIPE_LIVE_ENABLED=true AND the
// database kill switch are ON. Not wired to any page yet.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stripe-live/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleLiveCheckout } = await import("@/lib/billing/live/endpoints.server");
        return handleLiveCheckout(request);
      },
    },
  },
});
