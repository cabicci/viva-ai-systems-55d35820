import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { sendTransactionalEmail } from "../_shared/resend.ts";
import { authorizedRetentionJob, runKidsRetention } from "./handler.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!(await authorizedRetentionJob(request, Deno.env.get("KIDS_RETENTION_JOB_SECRET"))))
    return new Response(null, { status: 401 });
  const enabled = Deno.env.get("KIDS_RETENTION_ENABLED") === "true";
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!enabled) return Response.json({ enabled: false });
  if (!apiKey || !from || !url || !key) return new Response(null, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const stats = await runKidsRetention(db, (message) =>
      sendTransactionalEmail(
        { apiKey, from, replyTo: Deno.env.get("RESEND_REPLY_TO_EMAIL"), enabled: true },
        message,
      ),
    );
    return Response.json(stats);
  } catch {
    // Do not log recipient addresses, child IDs, credentials or provider responses.
    return Response.json({ error: "retention_job_failed" }, { status: 503 });
  }
});
