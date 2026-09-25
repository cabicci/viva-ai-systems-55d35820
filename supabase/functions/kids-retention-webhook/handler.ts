import type { RetentionDb } from "../kids-retention-job/handler.ts";

export async function readWebhookBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

export type DeliveryEvent = {
  eventId: string;
  type: string;
  emailId: string;
  occurredAt: string;
  recipients: string[];
};
export async function recordRetentionEvent(db: RetentionDb, event: DeliveryEvent) {
  const relevant = [
    "email.delivered",
    "email.bounced",
    "email.complained",
    "email.failed",
    "email.suppressed",
  ];
  if (!relevant.includes(event.type)) return true;
  // Each retention notice has exactly one adult recipient, never a child address.
  if (event.recipients.length !== 1) return false;
  const result = await db.rpc("kids_record_retention_delivery", {
    p_event_id: event.eventId,
    p_email_id: event.emailId,
    p_recipient: event.recipients[0],
    p_kind: event.type,
    p_occurred_at: event.occurredAt,
  });
  return !result.error && result.data === true;
}
