type Db = {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
type Message = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};
type Send = (
  message: Message,
  sender: { from: string; replyTo: string },
) => Promise<{ ok: true; emailId: string } | { ok: false; retryable: boolean }>;
/** Claims contain frozen locale, sender and content; retries never rebuild a message. */
export async function runContactMailJob(db: Db, send: Send, outboxId?: string) {
  // A form request claims only its own immutable message. Scheduled retries use the batch.
  const claims = outboxId
    ? await db.rpc("claim_contact_acknowledgement", { p_id: outboxId })
    : await db.rpc("claim_contact_acknowledgements");
  if (claims.error || !Array.isArray(claims.data)) throw new Error("contact_mail_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  for (const row of claims.data as Array<{
    id: string;
    claim_token: string;
    recipient: string;
    subject: string;
    text_body: string;
    html_body: string;
    sender: string;
  }>) {
    if (!["info@mail.masaarat.ai", "sales@mail.masaarat.ai"].includes(row.sender))
      throw new Error("contact_mail_sender_invalid");
    let result: Awaited<ReturnType<Send>>;
    try {
      result = await send(
        {
          to: row.recipient,
          subject: row.subject,
          text: row.text_body,
          html: row.html_body,
          idempotencyKey: `contact-ack-v1/${row.id}`,
        },
        {
          from: row.sender,
          replyTo:
            row.sender === "sales@mail.masaarat.ai" ? "sales@masaarat.ai" : "info@masaarat.ai",
        },
      );
    } catch {
      result = { ok: false, retryable: true };
    }
    const saved = await db.rpc("complete_contact_acknowledgement", {
      p_id: row.id,
      p_claim: row.claim_token,
      p_email_id: result.ok ? result.emailId : null,
      p_block: !result.ok && !result.retryable,
    });
    if (saved.error || saved.data !== true) throw new Error("contact_mail_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
