import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { handleContactMailReceipt } from "./handler.ts";
Deno.serve((request) =>
  handleContactMailReceipt(
    request,
    Deno.env.get("RESEND_WEBHOOK_SECRET"),
    () => {
      const url = Deno.env.get("SUPABASE_URL"),
        key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !key) throw new Error("contact_receipt_configuration");
      return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    },
  ),
);
