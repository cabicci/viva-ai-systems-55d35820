// Stripe LIVE checkout. Blocked unless STRIPE_LIVE_ENABLED=true AND the
// database kill switch are ON. Not wired to any page yet.
import { createFileRoute } from "@tanstack/react-router";
import { liveCheckoutSchema } from "@/lib/billing/live/schemas";

export const Route = createFileRoute("/api/stripe-live/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { liveRuntime, authenticateBearer, trustedLiveOriginFor } = await import("@/lib/billing/live/runtime.server");
        // Refuse preview / unknown origins before any database or Stripe call.
        const origin = trustedLiveOriginFor(request);
        if (!origin) return Response.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
        const { createLiveCheckout } = await import("@/lib/billing/live/stripe-live");
        const user = await authenticateBearer(request);
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        const parsed = liveCheckoutSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "INVALID_CHECKOUT_SELECTION" }, { status: 400 });
        const result = await createLiveCheckout(user, parsed.data, origin, liveRuntime());
        return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
