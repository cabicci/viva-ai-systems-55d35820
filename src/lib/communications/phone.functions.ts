import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accountPhoneStart, accountPhoneCheck } from "./phone-contracts";
import type { PhoneDatabase } from "./phone.server";
import { isSupportedLocale } from "@/lib/locale/resolve-locale";
import type { SupportedLocale } from "@/lib/locale/types";

async function databaseForActor(context: {
  userId: string;
  supabase: {
    auth: {
      getUser: () => PromiseLike<{
        data: {
          user: {
            id: string;
            email_confirmed_at?: string;
            user_metadata?: Record<string, unknown>;
          } | null;
        };
        error: unknown;
      }>;
    };
  };
}): Promise<{ db: PhoneDatabase; locale?: SupportedLocale }> {
  // getUser checks the current Auth account, not stale/user-editable JWT metadata.
  const current = await context.supabase.auth.getUser();
  if (current.error || !current.data.user || current.data.user.id !== context.userId)
    throw new Error("PHONE_ACCOUNT_UNAVAILABLE");
  if (!current.data.user.email_confirmed_at) throw new Error("EMAIL_CONFIRMATION_REQUIRED");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db: PhoneDatabase = async (action, data = {}) => {
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
  const savedLocale = current.data.user.user_metadata?.preferred_locale;
  return { db, locale: isSupportedLocale(savedLocale) ? savedLocale : undefined };
}
export const getAccountPhone = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAccountPhone } = await import("./phone.server");
    const { db } = await databaseForActor(context);
    return loadAccountPhone(db);
  });
export const sendAccountPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => accountPhoneStart.parse(input))
  .handler(async ({ context, data }) => {
    const { beginAccountPhone } = await import("./phone.server");
    const { db, locale } = await databaseForActor(context);
    // Signup's saved language wins over the current page or telephone country.
    // Legacy accounts without a valid preference use the explicit page choice.
    return beginAccountPhone({ ...data, locale: locale ?? data.locale }, db, process.env);
  });
export const verifyAccountPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => accountPhoneCheck.parse(input))
  .handler(async ({ context, data }) => {
    const { confirmAccountPhone } = await import("./phone.server");
    const { db } = await databaseForActor(context);
    return confirmAccountPhone(data, db, process.env);
  });
