import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { authorizedServiceJob } from "../_shared/service-job-auth.ts";
import { sendTransactionalEmail } from "../_shared/resend.ts";
import { runContactMailJob } from "./handler.ts";
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (
    !(await authorizedWelcomeJob(
      request,
      Deno.env.get("CONTACT_MAIL_JOB_SECRET"),
    ))
  )
    return new Response(null, { status: 401 });
  if (Deno.env.get("CONTACT_MAIL_ENABLED") !== "true")
    return Response.json({ enabled: false });
  const apiKey = Deno.env.get("RESEND_API_KEY"),
    url = Deno.env.get("SUPABASE_URL"),
    key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !url || !key) return new Response(null, { status: 503 });
  try {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return Response.json(
      await runContactMailJob(db, (message, sender) =>
        sendTransactionalEmail({ apiKey, ...sender, enabled: true }, message),
      ),
    );
  } catch {
    return Response.json({ error: "contact_mail_job_failed" }, { status: 503 });
  }
});
