import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { sendTransactionalEmail } from "../_shared/resend.ts";
import { handleCommerceInvitations } from "./handler.ts";
Deno.serve(async (request) => {
  // Reuse the project's already configured mail transport and Supabase secrets.
  const url = Deno.env.get("SUPABASE_URL"),
    key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    apiKey = Deno.env.get("RESEND_API_KEY"),
    from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!url || !key || !apiKey || !from) return new Response(null, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return handleCommerceInvitations(request, db, (message) =>
    sendTransactionalEmail(
      { apiKey, from, replyTo: Deno.env.get("RESEND_REPLY_TO_EMAIL"), enabled: true },
      message,
    ),
  );
});
