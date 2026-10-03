import { contactMailContent } from "../../supabase/functions/_shared/contact-mail";
import { runContactMailJob } from "../../supabase/functions/_shared/contact-mail-worker";
import { sendTransactionalEmail } from "../../supabase/functions/_shared/resend";
import { resolveSignupProfile } from "./email-templates/signup-profile";
import type { ContactFormInput } from "./contact-form";
import { contactMailEnabled } from "../../supabase/functions/_shared/contact-mail-enabled";
/** Called only after CAPTCHA, rate limit and HubSpot acceptance. */
export async function queueContactAcknowledgement(input: ContactFormInput, id: string) {
  if (
    !contactMailEnabled(process.env.CONTACT_MAIL_ENABLED, process.env.CONTACT_MAIL_DIRECT_ENABLED)
  )
    return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const profile = await resolveSignupProfile(input.email, async (email) => {
    const result = await supabaseAdmin.rpc(
      "auth_signup_email_profile" as never,
      { p_email: email } as never,
    );
    if (result.error) throw result.error;
    return (result.data ?? []) as Array<{
      full_name: unknown;
      preferred_locale: unknown;
    }>;
  });
  // Saved account preference takes priority; visitors explicitly chose the form language.
  const locale = profile.locale ?? input.locale;
  const stream = input.requestType ?? "support";
  const content = contactMailContent(stream, locale, profile.name ?? input.firstName);
  const queued = await supabaseAdmin.rpc(
    "queue_contact_acknowledgement" as never,
    {
      p_id: id,
      p_recipient: input.email,
      p_locale: locale,
      p_stream: stream,
      p_subject: content.subject,
      p_text: content.text,
      p_html: content.html,
    } as never,
  );
  if (queued.error) throw new Error("contact_mail_queue_failed");
  // Persist first. An unavailable provider/configuration must not lose the retry.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("contact_mail_transport_unconfigured");
  return runContactMailJob(
    { rpc: (name, args) => supabaseAdmin.rpc(name as never, args as never) },
    (message, sender) => sendTransactionalEmail({ apiKey, ...sender, enabled: true }, message),
    id,
  );
}
