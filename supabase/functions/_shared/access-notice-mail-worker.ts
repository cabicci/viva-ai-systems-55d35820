import { accessNoticeContent, type AccessNotice } from "./masaarat-mail.ts";
import type { ResendResult, TransactionalEmail } from "./resend.ts";

type Db = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
type Claim = {
  id: string;
  lease: string;
  recipient: string;
  locale: string;
  payload: AccessNotice;
};

export async function runAccessNoticeMailJob(
  db: Db,
  send: (message: TransactionalEmail) => Promise<ResendResult>,
) {
  async function rpc(action: string, data: Record<string, unknown>) {
    const result = await db.rpc("access_notice_mail", { p_action: action, p_data: data });
    if (result.error) throw new Error("access_notice_mail_step_failed");
    return result.data;
  }

  const rows = await rpc("claim", {});
  if (!Array.isArray(rows)) throw new Error("access_notice_mail_invalid_claim");
  const stats = { accepted: 0, deferred: 0 };
  for (const row of rows as Claim[]) {
    const claim = { id: row.id, lease: row.lease };
    if ((await rpc("authorize", claim)) !== true) {
      stats.deferred++;
      continue;
    }
    let result: ResendResult;
    try {
      result = await send({
        to: row.recipient,
        ...accessNoticeContent(row.payload, row.locale),
        idempotencyKey: "access-notice/" + row.id,
      });
    } catch {
      result = { ok: false, code: "unknown_outcome", retryable: true };
    }
    if (
      (await rpc("result", {
        ...claim,
        provider_id: result.ok ? result.emailId : null,
        retryable: !result.ok && result.retryable,
      })) !== true
    )
      throw new Error("access_notice_mail_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
