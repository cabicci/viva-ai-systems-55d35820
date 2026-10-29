// Stripe LIVE checkout. Blocked unless STRIPE_LIVE_ENABLED=true AND the
// database kill switch are ON. Not wired to any page yet.
import { createFileRoute } from "@tanstack/react-router";
import { liveCheckoutSchema } from "@/lib/billing/live/schemas";

export const Route = createFileRoute("/api/stripe-live/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { liveRuntime, authenticateBearer, appOriginFor } = await import("@/lib/billing/live/runtime.server");
        const { createLiveCheckout } = await import("@/lib/billing/live/stripe-live");
        const user = await authenticateBearer(request);
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        const parsed = liveCheckoutSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "INVALID_CHECKOUT_SELECTION" }, { status: 400 });
        const result = await createLiveCheckout(user, parsed.data, appOriginFor(request), liveRuntime());
        return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
