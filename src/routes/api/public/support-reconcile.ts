import { createFileRoute } from "@tanstack/react-router";

// Scheduler-only support pilot reconciliation; the managed scheduler credential is verified inside the handler.
export const Route = createFileRoute("/api/public/support-reconcile")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/support/endpoints.server")).handleSupportReconcileRequest(request),
    },
  },
});
