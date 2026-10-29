// Separate Stripe LIVE webhook endpoint. Live is OFF by default: this returns
// 503 before touching signatures, Stripe or billing data unless both the
// server flag STRIPE_LIVE_ENABLED and the database kill switch are on.
import { createFileRoute } from "@tanstack/react-router";
import { handleLiveWebhook } from "../../../../supabase/functions/_shared/stripe-environment";

export const Route = createFileRoute("/api/public/stripe-live-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleLiveWebhook(request, {
          getEnv: (name) => process.env[name],
          databaseLiveEnabled: async () => {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data, error } = await supabaseAdmin.rpc("get_stripe_live_enabled");
            if (error) return false;
            return data === true;
          },
        }),
    },
  },
});
