import { legacyWelcomeContent, welcomeContent } from "./masaarat-mail.ts";
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
export async function runWelcomeJob(db: Db, send: Send, userId?: string) {
  const claims = userId
    ? await db.rpc("claim_account_welcome_email", { p_user: userId })
    : await db.rpc("claim_account_welcome_emails_v2");
  if (claims.error || !Array.isArray(claims.data)) throw new Error("welcome_claim_failed");
  // Validate the entire targeted result before sending any message.
  if (
    userId &&
    (claims.data.length > 1 || claims.data.some((row) => !row || row.user_id !== userId))
  )
    throw new Error("welcome_claim_target_mismatch");
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
