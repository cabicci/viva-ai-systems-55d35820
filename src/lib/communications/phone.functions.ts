import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accountPhoneStart, accountPhoneCheck } from "./phone-contracts";
import type { PhoneDatabase } from "./phone.server";

async function databaseForActor(context: {
  userId: string;
  supabase: {
    auth: {
      getUser: () => PromiseLike<{
        data: { user: { id: string; email_confirmed_at?: string } | null };
        error: unknown;
      }>;
    };
  };
}): Promise<PhoneDatabase> {
  // getUser checks the current Auth account, not stale/user-editable JWT metadata.
  const current = await context.supabase.auth.getUser();
  if (current.error || !current.data.user || current.data.user.id !== context.userId)
    throw new Error("PHONE_ACCOUNT_UNAVAILABLE");
  if (!current.data.user.email_confirmed_at) throw new Error("EMAIL_CONFIRMATION_REQUIRED");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return async (action, data = {}) => {
    const r = await supabaseAdmin.rpc(
      "account_phone_command" as never,
      {
        p_actor: context.userId,
        p_action: action,
        p_data: data,
      } as never,
    );
    if (r.error) {
      // Do not send database/provider details or any telephone number to callers.
      const safe = r.error.message.match(/(?:PHONE|EMAIL)_[A-Z_]+/)?.[0];
      throw new Error(safe ?? "PHONE_STORAGE_UNAVAILABLE");
    }
    return r.data;
  };
}
export const getAccountPhone = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAccountPhone } = await import("./phone.server");
    return loadAccountPhone(await databaseForActor(context));
  });
export const sendAccountPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => accountPhoneStart.parse(input))
  .handler(async ({ context, data }) => {
    const { beginAccountPhone } = await import("./phone.server");
    return beginAccountPhone(data, await databaseForActor(context), process.env);
  });
export const verifyAccountPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => accountPhoneCheck.parse(input))
  .handler(async ({ context, data }) => {
    const { confirmAccountPhone } = await import("./phone.server");
    return confirmAccountPhone(data, await databaseForActor(context), process.env);
  });
