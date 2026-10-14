import { emailAccessInvitationContent, mailLocale } from "./masaarat-mail.ts";
import type { ResendResult, TransactionalEmail } from "./resend.ts";
type Db = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
export async function runEmailAccessMailJob(
  db: Db,
  send: (message: TransactionalEmail) => Promise<ResendResult>,
  id?: string,
  loadTitles?: (ids: string[], locale: string) => Promise<Record<string, string>>,
) {
  const rpc = async (action: string, data: Record<string, unknown>) => {
    const r = await db.rpc("email_access_mail", { p_action: action, p_data: data });
    if (r.error) throw new Error("email_access_mail_step_failed");
    return r.data;
  };
  const rows = await rpc("claim", id ? { id } : {});
  if (!Array.isArray(rows)) throw new Error("email_access_mail_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  const catalogues = new Map<string, Record<string, string>>();
  for (const row of rows as {
    id: string;
    claim_token: string;
    recipient: string;
    payload: Parameters<typeof emailAccessInvitationContent>[0];
  }[]) {
    if (id && row.id !== id) throw new Error("email_access_mail_target_mismatch");
    const claim = { id: row.id, claim_token: row.claim_token };
    if ((await rpc("authorize_attempt", claim)) !== true) {
      stats.deferred++;
      continue;
    }
    const locale = mailLocale(row.payload.locale);
    const cacheKey = locale + ":" + [...row.payload.catalogues].sort().join(",");
    if (
      row.payload.catalogues.some((key) => key.startsWith("academic:")) &&
      !catalogues.has(cacheKey)
    ) {
      const names: Record<string, string> = {};
      try {
        const ids = row.payload.catalogues
          .filter((key) => key.startsWith("academic:"))
          .map((key) => key.slice("academic:".length));
        if (loadTitles) Object.assign(names, await loadTitles(ids, locale));
      } catch {
        /* A metadata outage must not prevent the invitation; use a neutral label. */
      }
      catalogues.set(cacheKey, names);
    }
    let result: ResendResult;
    try {
      result = await send({
        to: row.recipient,
        ...emailAccessInvitationContent({
          ...row.payload,
          recipient_email: row.recipient,
          catalogue_titles: catalogues.get(cacheKey),
        }),
        idempotencyKey: "email-access/" + row.id,
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
      throw new Error("email_access_mail_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
