import { getRequest } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminRole } from "./admin-role.server";
import {
  contactAdministrationFilter,
  contactAdministrationSnapshot,
  contactWithdrawalInput,
  contactManualClosureInput,
} from "./contact-automation-admin";
import { dispatchContactAdministration } from "./mail-dispatch.server";

type Context = Parameters<typeof assertAdminRole>[0] & {
  supabase: {
    auth: { getUser(): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }> };
  };
};
async function command(
  context: Context,
  action: "status" | "withdraw" | "close_manual",
  id?: string,
  reference?: string,
) {
  await assertAdminRole(context);
  const current = await context.supabase.auth.getUser();
  if (current.error || current.data.user?.id !== context.userId)
    throw new Error("CONTACT_ACCOUNT_UNAVAILABLE");
  try {
    const result = await dispatchContactAdministration(
      {
        actor: context.userId,
        action,
        id: id ?? null,
        reference: reference ?? null,
      },
      getRequest().headers.get("authorization") ?? "",
    );
    return contactAdministrationSnapshot.parse(result);
  } catch {
    throw new Error("CONTACT_ADMIN_UNAVAILABLE");
  }
}
export const getContactAutomationAdministration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contactAdministrationFilter.parse(input))
  .handler(({ context, data }) => command(context, "status", data.requestId));
export const withdrawContactProcessing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contactWithdrawalInput.parse(input))
  .handler(({ context, data }) => command(context, "withdraw", data.requestId));

export const closeContactIntakeManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contactManualClosureInput.parse(input))
  .handler(({ context, data }) => command(context, "close_manual", data.requestId, data.reference));
