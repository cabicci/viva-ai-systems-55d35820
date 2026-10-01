export async function coordinateKidsCheckout(deps: {
  begin(): Promise<{ attempt_id: string; idempotency_key: string }>;
  create(key: string): Promise<{ id: string; url: string | null; status: string }>;
  record(attempt: string, session: string, expired?: boolean): Promise<boolean>;
  expire(session: string): Promise<{ status: string }>;
}) {
  const attempt = await deps.begin();
  // A failed/unknown provider response stays pending for idempotent recovery.
  const session = await deps.create(attempt.idempotency_key);
  const active = await deps.record(attempt.attempt_id, session.id);
  if (!active) {
    if (session.status === "open") {
      const expired = await deps.expire(session.id);
      if (expired.status !== "expired") throw new Error("LC09_CHECKOUT_NOT_EXPIRED");
    } else if (!["expired", "complete"].includes(session.status)) {
      throw new Error("LC09_CHECKOUT_STATE_UNKNOWN");
    }
    await deps.record(attempt.attempt_id, session.id, true);
    throw new Error("ACCOUNT_DELETION_PENDING");
  }
  if (session.status !== "open" || !session.url?.startsWith("https://checkout.stripe.com/"))
    throw new Error("CHECKOUT_URL_MISSING");
  return session;
}
