import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { sendTransactionalEmail } from "../_shared/resend.ts";
import { authorizedWelcomeJob, runWelcomeJob } from "./handler.ts";
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!(await authorizedWelcomeJob(request, Deno.env.get("ACCOUNT_WELCOME_JOB_SECRET"))))
    return new Response(null, { status: 401 });
  if (Deno.env.get("ACCOUNT_WELCOME_ENABLED") !== "true") return Response.json({ enabled: false });
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !from || !url || !key) return new Response(null, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return Response.json(
      await runWelcomeJob(db, (message) =>
        sendTransactionalEmail(
          { apiKey, from, replyTo: Deno.env.get("RESEND_REPLY_TO_EMAIL"), enabled: true },
          message,
        ),
      ),
    );
  } catch {
    return Response.json({ error: "welcome_job_failed" }, { status: 503 });
  }
});
