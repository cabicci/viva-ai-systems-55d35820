// Stripe LIVE customer portal. Lifecycle operation: works for existing Live
// subscriptions even when new checkout is switched OFF.
import { createFileRoute } from "@tanstack/react-router";
import { livePortalSchema } from "@/lib/billing/live/schemas";

export const Route = createFileRoute("/api/stripe-live/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { liveRuntime, authenticateBearer, appOriginFor } = await import("@/lib/billing/live/runtime.server");
        const { createLivePortal } = await import("@/lib/billing/live/stripe-live");
        const user = await authenticateBearer(request);
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        const parsed = livePortalSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "INVALID_PORTAL_SCOPE" }, { status: 400 });
        const result = await createLivePortal(user, parsed.data.scope, appOriginFor(request), liveRuntime());
        return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
