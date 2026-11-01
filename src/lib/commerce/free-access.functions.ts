import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { freeAccessInput } from "./free-access";

export const freeAccessCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => freeAccessInput.parse(input))
  .handler(async ({ data, context }) => {
    // SQL checks the stored administrator role; no browser-supplied identity or service key.
    const result = await context.supabase.rpc(
      "free_access_window_command" as never,
      {
        p_action: data.action,
        p_data: data.data,
      } as never,
    );
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });
