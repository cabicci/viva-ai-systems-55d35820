import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminRole } from "@/lib/admin-role.server";
import { phoneAdminInput, phoneAdminSnapshot, type PhoneAdminInput } from "./phone-admin";

type AdminPhoneContext = Parameters<typeof assertAdminRole>[0] & {
  supabase: {
    auth: { getUser(): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }> };
  };
};

async function command(
  context: AdminPhoneContext,
  action: "status" | "configure",
  data: PhoneAdminInput | Record<string, never> = {},
) {
  await assertAdminRole(context);
  const current = await context.supabase.auth.getUser();
  if (current.error || current.data.user?.id !== context.userId) {
    throw new Error("PHONE_ACCOUNT_UNAVAILABLE");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc(
    "admin_account_phone_command" as never,
    {
      p_actor: context.userId,
      p_action: action,
      p_data: data,
    } as never,
  );
  if (result.error) {
    if (result.error.message.includes("PHONE_CONTROL_CONFLICT")) {
      throw new Error("PHONE_CONTROL_CONFLICT");
    }
    throw new Error("PHONE_ADMIN_UNAVAILABLE");
  }
  return phoneAdminSnapshot.parse(result.data);
}

export const getPhoneAdministration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => command(context, "status"));

export const configurePhoneAdministration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => phoneAdminInput.parse(input))
  .handler(({ context, data }) => command(context, "configure", data));
