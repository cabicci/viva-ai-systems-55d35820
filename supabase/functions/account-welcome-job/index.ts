import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { sendTransactionalEmail } from "../_shared/resend.ts";
import { runContactMailJob } from "../_shared/contact-mail-worker.ts";
import { contactMailEnabled } from "../_shared/contact-mail-enabled.ts";
import { runMailStreams } from "./streams.ts";
import { authorizedWelcomeJob, runWelcomeJob, runSubscriptionMailJob } from "./handler.ts";
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!(await authorizedWelcomeJob(request, Deno.env.get("ACCOUNT_WELCOME_JOB_SECRET"))))
    return new Response(null, { status: 401 });
  const welcomeEnabled = Deno.env.get("ACCOUNT_WELCOME_ENABLED") === "true";
  const subscriptionEnabled = Deno.env.get("SUBSCRIPTION_MAIL_ENABLED") === "true";
  const contactEnabled = contactMailEnabled(
    Deno.env.get("CONTACT_MAIL_ENABLED"),
    Deno.env.get("CONTACT_MAIL_DIRECT_ENABLED"),
  );
  if (!welcomeEnabled && !subscriptionEnabled && !contactEnabled)
    return Response.json({ enabled: false });
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !url || !key) return new Response(null, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const send = (message: Parameters<typeof sendTransactionalEmail>[1]) => {
      if (!from) throw new Error("mail_sender_unconfigured");
      return sendTransactionalEmail(
        { apiKey, from, replyTo: Deno.env.get("RESEND_REPLY_TO_EMAIL"), enabled: true },
        message,
      );
    };
    const result = await runMailStreams({
      welcome: welcomeEnabled
        ? () => {
            if (!from) throw new Error("mail_sender_unconfigured");
            return runWelcomeJob(db, send);
          }
        : null,
      subscription: subscriptionEnabled
        ? () => {
            if (!from) throw new Error("mail_sender_unconfigured");
            return runSubscriptionMailJob(db, send);
          }
        : null,
      contact: contactEnabled
        ? () =>
            runContactMailJob(db, (message, sender) =>
              sendTransactionalEmail({ apiKey, ...sender, enabled: true }, message),
            )
        : null,
    });
    return Response.json(result.body, { status: result.status });
  } catch {
    return Response.json({ error: "welcome_job_failed" }, { status: 503 });
  }
});
