import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accountSubscriptionSchema, allowedPortalScope } from "./subscription-display";

export const getAccountSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ expectedAccountId: z.string().uuid() }).strict().parse(input),
  )
  .handler(async ({ data, context }) => {
    if (context.userId !== data.expectedAccountId) throw new Error("ACCOUNT_CHANGED");
    const result = await context.supabase.rpc(
      "commerce_command" as never,
      { p_action: "account_subscription_display", p_data: {} } as never,
    );
    if (result.error) throw new Error("SUBSCRIPTIONS_UNAVAILABLE");
    const parsed = accountSubscriptionSchema.safeParse(result.data);
    if (!parsed.success) throw new Error("SUBSCRIPTIONS_UNAVAILABLE");
    const snapshot = parsed.data;
    if (snapshot.actorUserId !== context.userId) throw new Error("ACCOUNT_CHANGED");
    // A database row is only a candidate. Confirm management against the existing
    // server-owned environment contract; never reopen Test or guess another scope.
    const modes = new Map<"core" | "kids", boolean>();
    for (const source of snapshot.sources) {
      const scope = allowedPortalScope(source);
      source.portalScope = null;
      if (!scope) continue;
      if (!modes.has(scope)) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const response = await supabaseAdmin.rpc(
            "get_stripe_portal_environment" as never,
            { p_user_id: context.userId, p_scope: scope } as never,
          );
          modes.set(scope, !response.error && response.data === "live");
        } catch {
          modes.set(scope, false);
        }
      }
      if (modes.get(scope)) source.portalScope = scope;
    }
    return snapshot;
  });
