// Separate Stripe LIVE webhook with its own signing secret. Processes signed
// livemode=true events even when new checkout is OFF; answers 2xx only after
// the database recorded the event, otherwise non-2xx so Stripe retries.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-live-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { liveRuntime } = await import("@/lib/billing/live/runtime.server");
        const { handleLiveWebhookEvent } = await import("@/lib/billing/live/stripe-live");
        const result = await handleLiveWebhookEvent(
          await request.text(),
          request.headers.get("stripe-signature"),
          liveRuntime(),
        );
        return Response.json(result.body, { status: result.status });
      },
    },
  },
});
