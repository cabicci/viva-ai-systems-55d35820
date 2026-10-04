import {
  paymentConfirmationContent,
  receiptReviewContent,
  type PaymentConfirmation,
} from "./masaarat-mail.ts";
import type { ResendResult, TransactionalEmail } from "./resend.ts";
type Db = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
export async function runCommercePaymentMailJob(
  db: Db,
  send: (message: TransactionalEmail) => Promise<ResendResult>,
  orderId?: string,
  receiptId?: string,
) {
  const rpc = async (action: string, data: Record<string, unknown>) => {
    const result = await db.rpc("commerce_payment_mail", { p_action: action, p_data: data });
    if (result.error) throw new Error("commerce_payment_mail_step_failed");
    return result.data;
  };
  const rows = await rpc(
    "claim",
    receiptId ? { receipt_id: receiptId } : orderId ? { order_id: orderId } : {},
  );
  if (!Array.isArray(rows)) throw new Error("commerce_payment_mail_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  for (const row of rows as {
    id: string;
    order_id: string | null;
    receipt_id?: string | null;
    claim_token: string;
    recipient: string;
    payload: PaymentConfirmation;
  }[]) {
    if ((orderId && row.order_id !== orderId) || (receiptId && row.receipt_id !== receiptId))
      throw new Error("commerce_payment_mail_target_mismatch");
    const claim = { id: row.id, claim_token: row.claim_token };
    if ((await rpc("authorize_attempt", claim)) !== true) {
      stats.deferred++;
      continue;
    }
    let result: ResendResult;
    try {
      result = await send({
        to: row.recipient,
        ...(row.receipt_id
          ? receiptReviewContent(row.payload)
          : paymentConfirmationContent(row.payload)),
        idempotencyKey: `commerce-payment/${row.id}`,
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
    ) {
      throw new Error("commerce_payment_mail_record_failed");
    }
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
