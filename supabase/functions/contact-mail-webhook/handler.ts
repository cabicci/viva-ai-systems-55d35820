import { verifyResendWebhook } from "../_shared/resend.ts";
type Db = {
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: unknown }>;
};
const receiptTypes = new Set([
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.failed",
  "email.complained",
  "email.suppressed",
]);
/** Authentication precedes database access; a receipt must bind to its saved provider ID and recipient. */
export async function handleContactMailReceipt(
  request: Request,
  secret: string | undefined,
  database: () => Db,
) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!secret) return new Response(null, { status: 503 });
  if (Number(request.headers.get("content-length")) > 100000)
    return new Response(null, { status: 413 });
  const body = await request.text();
  const event = await verifyResendWebhook(body, request.headers, secret);
  if (!event) return new Response(null, { status: 401 });
  if (!receiptTypes.has(event.type)) return new Response(null, { status: 204 });
  if (event.recipients.length !== 1) return new Response(null, { status: 204 });
  try {
    const result = await database().rpc("record_contact_mail_receipt", {
      p_event: event.eventId,
      p_email_id: event.emailId,
      p_recipient: event.recipients[0],
      p_type: event.type,
      p_at: event.occurredAt,
    });
    if (result.error || result.data === "pending")
      return new Response(null, { status: 503 });
    if (result.data !== "recorded" && result.data !== "ignored")
      return new Response(null, { status: 503 });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
