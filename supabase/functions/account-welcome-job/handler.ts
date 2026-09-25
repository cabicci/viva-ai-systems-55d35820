import { legacyWelcomeContent, welcomeContent } from "../_shared/masaarat-mail.ts";
import { subscriptionContent } from "../_shared/masaarat-mail.ts";
export { legacyWelcomeContent, welcomeContent } from "../_shared/masaarat-mail.ts";
type Db = {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
type Send = (message: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey: string;
}) => Promise<{ ok: true; emailId: string } | { ok: false; retryable?: boolean }>;
export async function authorizedWelcomeJob(request: Request, secret: string | undefined) {
  if (!secret || secret.length < 32) return false;
  const value = request.headers.get("authorization");
  if (!value || value.length > 1024) return false;
  const hash = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([hash(`Bearer ${secret}`), hash(value)]);
  return a.reduce((difference, byte, i) => difference | (byte ^ b[i]), 0) === 0;
}
export async function runWelcomeJob(db: Db, send: Send) {
  const claims = await db.rpc("claim_account_welcome_emails_v2");
  if (claims.error || !Array.isArray(claims.data)) throw new Error("welcome_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  for (const claim of claims.data as {
    user_id: string;
    recipient: string;
    claim_token: string;
    template_version?: number;
    display_name?: string | null;
    preferred_locale?: string | null;
  }[]) {
    let result: Awaited<ReturnType<Send>>;
    try {
      result = await send({
        to: claim.recipient,
        ...(claim.template_version === 2
          ? welcomeContent(claim.display_name, claim.preferred_locale)
          : legacyWelcomeContent),
        idempotencyKey: `account-welcome-v${claim.template_version === 2 ? 2 : 1}/${claim.user_id}`,
      });
    } catch {
      result = { ok: false, retryable: true };
    }
    const saved = await db.rpc("complete_account_welcome_email", {
      p_user: claim.user_id,
      p_claim: claim.claim_token,
      p_email_id: result.ok ? result.emailId : null,
      p_block: !result.ok && result.retryable === false,
    });
    if (saved.error || saved.data !== true) throw new Error("welcome_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}

/** The billing DB creates receipts only after applying a verified paid transition. */
export async function runSubscriptionMailJob(db: Db, send: Send) {
  const claims = await db.rpc("claim_subscription_mail");
  if (claims.error || !Array.isArray(claims.data))
    throw new Error("subscription_mail_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  for (const claim of claims.data as {
    event_id: string;
    recipient: string;
    claim_token: string;
    display_name: string | null;
    preferred_locale: string | null;
    plan_key: "pro" | "pro_plus";
    kind: "activated" | "renewed";
  }[]) {
    let result: Awaited<ReturnType<Send>>;
    try {
      result = await send({
        to: claim.recipient,
        ...subscriptionContent(
          claim.plan_key,
          claim.kind,
          claim.display_name,
          claim.preferred_locale,
        ),
        idempotencyKey: `subscription-mail-v1/${claim.event_id}`,
      });
    } catch {
      result = { ok: false, retryable: true };
    }
    const saved = await db.rpc("complete_subscription_mail", {
      p_event: claim.event_id,
      p_claim: claim.claim_token,
      p_email_id: result.ok ? result.emailId : null,
      p_block: !result.ok && result.retryable === false,
    });
    if (saved.error || saved.data !== true) throw new Error("subscription_mail_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
