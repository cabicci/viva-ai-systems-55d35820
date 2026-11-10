import { contactMailContent } from "../../supabase/functions/_shared/contact-mail";
import { dispatchImmediateMail } from "./mail-dispatch.server";
import { resolveSignupProfile } from "./email-templates/signup-profile";
import type { ContactFormInput } from "./contact-form";
import { contactMailEnabled } from "../../supabase/functions/_shared/contact-mail-enabled";
import { decideContactAutomation } from "./contact-automation-policy";
import { contactOwnerReviewContent } from "./contact-automation-mail";
import { contactAttemptFingerprint } from "./contact-automation-attempt";

async function frozenParameters(input: ContactFormInput, id: string) {
  if (input.consentToProcess !== true || !id) throw new Error("contact_automation_intake_invalid");
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
  const owner = contactOwnerReviewContent(input, id, locale);
  return {
    supabaseAdmin,
    parameters: {
      p_id: id,
      p_recipient: input.email,
      p_locale: locale,
      p_stream: stream,
      p_subject: content.subject,
      p_text: content.text,
      p_html: content.html,
      p_processing_consent: input.consentToProcess,
      p_owner_subject: owner.subject,
      p_owner_text: owner.text,
      p_owner_html: owner.html,
    },
  };
}

/** Legacy accepted-intake adapter; keeps the installed immediate ACK behavior. */
export async function queueContactAcknowledgement(input: ContactFormInput, id: string) {
  if (!contactMailEnabled(process.env.CONTACT_MAIL_DIRECT_ENABLED)) return;
  const plan = decideContactAutomation({
    verifiedSubmission: true,
    processingConsent: input.consentToProcess === true,
    submissionId: id,
    receivedAt: new Date(),
    kind: "unknown",
  });
  if (plan.status !== "ready") throw new Error("contact_automation_intake_invalid");
  const { supabaseAdmin, parameters } = await frozenParameters(input, id);
  const queued = await supabaseAdmin.rpc("queue_contact_automation" as never, parameters as never);
  if (queued.error || queued.data !== true) throw new Error("contact_mail_queue_failed");
  return dispatchImmediateMail({ stream: "contact", id });
}

export type ContactIntakeReservation =
  | { state: "dispatch"; claim: string }
  | { state: "accepted" }
  | { state: "reconciliation_required" }
  | { state: "closed_manual" }
  | { state: "withdrawn" };

/** Persist the frozen intake before contacting HubSpot; no mail is eligible yet. */
export async function reserveContactSubmission(
  input: ContactFormInput,
): Promise<ContactIntakeReservation> {
  if (!input.attemptId) throw new Error("contact_attempt_required");
  const { supabaseAdmin, parameters } = await frozenParameters(input, input.attemptId);
  const result = (await supabaseAdmin.rpc(
    "reserve_contact_intake" as never,
    {
      ...parameters,
      p_payload_hash: await contactAttemptFingerprint(input),
      p_recovery_hash: input.recoveryToken ? await contactRecoveryHash(input.recoveryToken) : null,
    } as never,
  )) as unknown as { data: unknown; error: unknown };
  if (result.error || !result.data || typeof result.data !== "object")
    throw new Error("contact_intake_unavailable");
  const value = result.data as { state?: unknown; claim?: unknown };
  if (value.state === "dispatch" && typeof value.claim === "string")
    return { state: "dispatch" as const, claim: value.claim };
  if (value.state === "accepted") return { state: "accepted" };
  if (value.state === "reconciliation_required") return { state: "reconciliation_required" };
  if (value.state === "withdrawn") return { state: "withdrawn" };
  if (value.state === "closed_manual") return { state: "closed_manual" };
  throw new Error("contact_intake_unavailable");
}

export async function beginContactSubmission(id: string, claim: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = (await supabaseAdmin.rpc(
    "begin_contact_intake" as never,
    { p_id: id, p_claim: claim } as never,
  )) as unknown as { data: unknown; error: unknown };
  if (result.error || typeof result.data !== "boolean")
    throw new Error("contact_intake_begin_unavailable");
  return result.data;
}

export async function completeContactSubmission(id: string, claim: string, accepted: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc(
    "complete_contact_intake" as never,
    {
      p_id: id,
      p_claim: claim,
      p_accepted: accepted,
    } as never,
  );
  if (result.error || result.data !== true)
    throw new Error("contact_intake_completion_unavailable");
}

export async function dispatchAcceptedContact(id: string) {
  if (contactMailEnabled(process.env.CONTACT_MAIL_DIRECT_ENABLED))
    return dispatchImmediateMail({ stream: "contact", id });
}

export type ContactRecoveryState =
  | "pending"
  | "accepted"
  | "closed_manual"
  | "withdrawn"
  | "unknown";
async function contactRecoveryHash(token: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function readContactRecovery(
  id: string,
  token: string,
): Promise<ContactRecoveryState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc(
    "read_contact_intake_state" as never,
    { p_id: id, p_recovery_hash: await contactRecoveryHash(token) } as never,
  );
  if (result.error) throw new Error("contact_recovery_unavailable");
  const state: unknown = result.data;
  if (
    state === "pending" ||
    state === "accepted" ||
    state === "closed_manual" ||
    state === "withdrawn" ||
    state === "unknown"
  )
    return state;
  throw new Error("contact_recovery_invalid");
}
