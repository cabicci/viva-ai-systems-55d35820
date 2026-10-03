import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { sendTransactionalEmail } from "../_shared/resend.ts";
import { runContactMailJob } from "../_shared/contact-mail-worker.ts";
import { contactMailEnabled } from "../_shared/contact-mail-enabled.ts";
import { createAccountLifecycleWorker } from "../_shared/account-lifecycle-worker.ts";
import { runMailStreams } from "./streams.ts";
import { authorizedWelcomeJob, runWelcomeJob, runSubscriptionMailJob } from "./handler.ts";
import { readImmediateMailTarget } from "../_shared/immediate-mail-request.ts";
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!(await authorizedWelcomeJob(request, Deno.env.get("ACCOUNT_WELCOME_JOB_SECRET"))))
    return new Response(null, { status: 401 });
  let immediate;
  try {
    immediate = await readImmediateMailTarget(request);
  } catch {
    return new Response(null, { status: 400 });
  }
  const welcomeEnabled = Deno.env.get("ACCOUNT_WELCOME_ENABLED") === "true";
  const subscriptionEnabled = Deno.env.get("SUBSCRIPTION_MAIL_ENABLED") === "true";
  const contactEnabled = contactMailEnabled(Deno.env.get("CONTACT_MAIL_DIRECT_ENABLED"));
  const deletionEnabled = Deno.env.get("ACCOUNT_DELETION_ENABLED") === "true";
  const financialEnabled = Deno.env.get("ACCOUNT_FINANCIAL_PURGE_ENABLED") === "true";
  if (
    !welcomeEnabled &&
    !subscriptionEnabled &&
    !contactEnabled &&
    !deletionEnabled &&
    !financialEnabled
  )
    return Response.json({ enabled: false });
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return new Response(null, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const send = (message: Parameters<typeof sendTransactionalEmail>[1]) => {
      if (!apiKey || !from) throw new Error("mail_sender_unconfigured");
      return sendTransactionalEmail(
        { apiKey, from, replyTo: Deno.env.get("RESEND_REPLY_TO_EMAIL"), enabled: true },
        message,
      );
    };
    // An immediate request can only attempt its stored message. It never runs
    // batch subscription, contact, deletion or financial operations.
    if (immediate) {
      const active = immediate.stream === "welcome" ? welcomeEnabled : contactEnabled;
      if (!active) return Response.json({ enabled: false });
      if (!apiKey || (immediate.stream === "welcome" && !from))
        throw new Error("mail_sender_unconfigured");
      const stats =
        immediate.stream === "welcome"
          ? await runWelcomeJob(db, send, immediate.id)
          : await runContactMailJob(
              db,
              (message, sender) =>
                sendTransactionalEmail({ apiKey, ...sender, enabled: true }, message),
              immediate.id,
            );
      return Response.json({ [immediate.stream]: stats });
    }
    const result = await runMailStreams({
      welcome: welcomeEnabled
        ? () => {
            if (!apiKey || !from) throw new Error("mail_sender_unconfigured");
            return runWelcomeJob(db, send);
          }
        : null,
      subscription: subscriptionEnabled
        ? () => {
            if (!apiKey || !from) throw new Error("mail_sender_unconfigured");
            return runSubscriptionMailJob(db, send);
          }
        : null,
      contact: contactEnabled
        ? () => {
            if (!apiKey) throw new Error("mail_sender_unconfigured");
            return runContactMailJob(db, (message, sender) =>
              sendTransactionalEmail({ apiKey, ...sender, enabled: true }, message),
            );
          }
        : null,
      lifecycle:
        deletionEnabled || financialEnabled
          ? () => {
              const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
              if (!stripeKey || !/^(sk|rk)_test_/.test(stripeKey))
                throw new Error("LC09_TEST_ONLY");
              return createAccountLifecycleWorker(db, stripeKey).runBatch({
                deletionEnabled,
                financialEnabled,
              });
            }
          : null,
    });
    return Response.json(result.body, { status: result.status });
  } catch {
    return Response.json({ error: "welcome_job_failed" }, { status: 503 });
  }
});
