import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const owner = z.object({ expectedAccountId: z.string().uuid() }).strict();
export type CommercialInvitation = {
  id: string;
  scope_mode: string;
  catalogues: string[];
  catalogue_details?: { id: string; title: string; titles?: Record<string, string> }[];
  duration_days: number | null;
  accepted_at: string | null;
  ends_at: string | null;
};
export const getCommercialInvitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => owner.parse(v))
  .handler(async ({ context, data }): Promise<CommercialInvitation[]> => {
    if (data.expectedAccountId !== context.userId) throw new Error("ACCOUNT_CHANGED");
    const result = await context.supabase.rpc("get_my_commercial_invitations" as never);
    if (result.error || !Array.isArray(result.data)) throw new Error("INVITATIONS_UNAVAILABLE");
    return result.data as unknown as CommercialInvitation[];
  });
export const acceptCommercialInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => owner.extend({ invitationId: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    if (data.expectedAccountId !== context.userId) throw new Error("ACCOUNT_CHANGED");
    const result = await context.supabase.rpc(
      "accept_commercial_invitation" as never,
      { p_grant_id: data.invitationId } as never,
    );
    if (result.error) throw new Error("INVITATION_ACCEPT_FAILED");
    return result.data;
  });
