import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { liveOfferAdminSchema } from "./admin-offer-contracts";
import { terminalOfferRelease } from "./offer-operations";
import type { OfferEvidence } from "./offer-discounts";

export const liveOfferAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => liveOfferAdminSchema.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || role.data !== true) throw new Error("ADMIN_REQUIRED");
    const { liveRuntime } = await import("./runtime.server");
    const runtime = liveRuntime();
    if (data.action === "reconcile") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const row = await supabaseAdmin.from("stripe_live_offer_reservations").select("user_id").eq("id", data.id).single();
      if (row.error || !row.data) throw new Error("LIVE_OFFER_EVIDENCE_MISSING");
      const evidence = await runtime.rpc<OfferEvidence>("get_stripe_live_offer_evidence", { p_reservation_id: data.id, p_user_id: row.data.user_id });
      if (!evidence.session_id) throw new Error("LIVE_OFFER_NOT_BOUND");
      const session = await runtime.stripe<Record<string, unknown>>(`/checkout/sessions/${encodeURIComponent(evidence.session_id)}`);
      const terminal = terminalOfferRelease(evidence, session);
      return runtime.rpc("stripe_live_offer_admin", { p_actor: context.userId, p_action: "release", p_data: { id: data.id, key: data.key, ...terminal } });
    }
    const { action, ...parameters } = data;
    return runtime.rpc("stripe_live_offer_admin", { p_actor: context.userId, p_action: action, p_data: parameters });
  });