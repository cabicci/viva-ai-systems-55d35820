import { runWelcomeJob } from "../../supabase/functions/_shared/account-welcome-worker";
import { sendTransactionalEmail } from "../../supabase/functions/_shared/resend";

/** Only the verified request actor; confirmation already persisted the outbox. */
export async function attemptAccountWelcome(userId: string) {
  if (process.env.ACCOUNT_WELCOME_ENABLED !== "true") return;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  // Leave the durable row untouched for the existing worker if unavailable.
  if (!apiKey || !from) throw new Error("welcome_transport_unconfigured");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return runWelcomeJob(
    { rpc: (name, args) => supabaseAdmin.rpc(name as never, args as never) },
    (message) =>
      sendTransactionalEmail(
        { apiKey, from, replyTo: process.env.RESEND_REPLY_TO_EMAIL, enabled: true },
        message,
      ),
    userId,
  );
}
