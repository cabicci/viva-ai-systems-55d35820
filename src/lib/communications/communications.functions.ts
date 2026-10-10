import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CommunicationsReadiness } from "./contracts";

export const getCommunicationsReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommunicationsReadiness> => {
    const { readAuthorizedCommunicationsReadiness } = await import("./twilio.server");
    return readAuthorizedCommunicationsReadiness(context.userId, async (name, parameters) => {
      const response = await context.supabase.rpc(name as never, parameters as never);
      return { data: response.data, error: response.error };
    });
  });
