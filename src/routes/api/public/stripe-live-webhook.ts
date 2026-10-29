// Separate Stripe LIVE webhook with its own signing secret. Processes signed
// livemode=true events even when new checkout is OFF; answers 2xx only after
// the database recorded the event, otherwise non-2xx so Stripe retries.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-live-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleLiveWebhook } = await import("@/lib/billing/live/endpoints.server");
        return handleLiveWebhook(request);
      },
    },
  },
});
