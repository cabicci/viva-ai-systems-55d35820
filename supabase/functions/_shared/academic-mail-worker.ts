import { subscriptionContent } from "./masaarat-mail.ts";
import type { TransactionalEmail, ResendResult } from "./resend.ts";
type Db = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
export async function runAcademicMailJob(
  db: Db,
  send: (message: TransactionalEmail) => Promise<ResendResult>,
) {
  const rpc = async (action: string, data: Record<string, unknown> = {}) => {
    const result = await db.rpc("academic_mail_command", { p_action: action, p_data: data });
    if (result.error) throw new Error("academic_mail_step_failed");
    return result.data;
  };
  const claims = await rpc("claim");
  if (!Array.isArray(claims)) throw new Error("academic_mail_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  for (const row of claims) {
    const claim = { id: row.id, claim_token: row.claim_token };
    if ((await rpc("authorize", claim)) !== true) {
      stats.deferred++;
      continue;
    }
    let result: ResendResult;
    try {
      result = await send({
        to: row.recipient,
        ...subscriptionContent("academic", row.kind, row.name, row.locale),
        idempotencyKey: `academic-subscription/${row.id}`,
      });
    } catch {
      result = { ok: false, code: "unknown_outcome", retryable: true };
    }
    if (
      (await rpc("result", {
        ...claim,
        provider_id: result.ok ? result.emailId : null,
        blocked: !result.ok && !result.retryable,
      })) !== true
    )
      throw new Error("academic_mail_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
