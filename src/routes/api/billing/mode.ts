// Tells the site which Stripe flow to use. The decision is made here on the
// server from server settings; it returns no personal data.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/mode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const intent = new URL(request.url).searchParams.get("intent");
        if (intent !== "checkout" && intent !== "portal")
          return Response.json({ error: "INVALID_INTENT" }, { status: 400 });
        const { decideBillingMode } = await import("@/lib/billing/billing-mode");
        const getEnv = (name: string) => process.env[name];
        const mode = await decideBillingMode(intent, getEnv, async () => {
          const { liveRuntime } = await import("@/lib/billing/live/runtime.server");
          return liveRuntime().databaseLiveEnabled();
        });
        return Response.json({ mode }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
