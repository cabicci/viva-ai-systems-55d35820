import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { emailAccessInput } from "./email-access";

export const emailAccessCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => emailAccessInput.parse(input))
  .handler(async ({ data, context }) => {
    // Pass the actor JWT; stored role/email authorization is enforced in SQL.
    const { data: result, error } = await context.supabase.rpc(
      "email_access_command" as never,
      { p_action: data.action, p_data: data.data } as never,
    );
    if (error) throw new Error(error.message);
    if (data.action === "create" && data.data.invitation) {
      const id = (result as unknown as { id: string }).id;
      const { dispatchImmediateMail } = await import("@/lib/mail-dispatch.server");
      // The grant transaction has committed. Failed delivery uses its stored
      // outbox; it never rolls back access or creates a second grant.
      try { await dispatchImmediateMail({ stream: "email_access", id }); } catch { /* scheduled retry */ }
    }
    return result;
  });

