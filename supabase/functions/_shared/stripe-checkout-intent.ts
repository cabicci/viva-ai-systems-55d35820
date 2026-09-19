export type CheckoutIntent = {
  subscription_id: string;
  checkout_generation: string;
  checkout_session_id: string | null;
  selection_matches: boolean;
};

export type CheckoutSession = { id: string; url: string | null; status: string | null };

// Keep one durable intent until Stripe confirms its session cannot accept payment.
// A different selection cannot supersede an in-flight session creation. Retrying
// the original selection recovers it using the generation's Stripe idempotency key.
export async function coordinateCheckout(deps: {
  prepare(): Promise<CheckoutIntent>;
  retrieve(id: string): Promise<CheckoutSession>;
  expire(id: string): Promise<CheckoutSession>;
  create(intent: CheckoutIntent): Promise<CheckoutSession>;
  attach(intent: CheckoutIntent, sessionId: string): Promise<boolean>;
  close(intent: CheckoutIntent): Promise<boolean>;
  confirm(intent: CheckoutIntent): Promise<boolean>;
}): Promise<CheckoutSession> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const intent = await deps.prepare();
    if (intent.checkout_session_id) {
      let session = await deps.retrieve(intent.checkout_session_id);
      if (session.status === 'complete') throw new Error('SUBSCRIPTION_ALREADY_MANAGED');
      if (!intent.selection_matches && session.status === 'open') {
        // Failure (including a payment racing expiration) MUST abort replacement.
        session = await deps.expire(session.id);
      }
      if (session.status === 'expired') {
        if (!await deps.close(intent)) throw new Error('CHECKOUT_INTENT_SUPERSEDED');
        continue;
      }
      if (!intent.selection_matches || session.status !== 'open' || !session.url) {
        throw new Error('CHECKOUT_IN_PROGRESS');
      }
      if (!await deps.confirm(intent)) throw new Error('CHECKOUT_INTENT_SUPERSEDED');
      return session;
    }
    if (!intent.selection_matches) throw new Error('CHECKOUT_IN_PROGRESS');
    const session = await deps.create(intent);
    if (session.status === 'complete') throw new Error('SUBSCRIPTION_ALREADY_MANAGED');
    if (!await deps.attach(intent, session.id)) {
      if (session.status === 'open') await deps.expire(session.id);
      throw new Error('CHECKOUT_INTENT_SUPERSEDED');
    }
    if (session.status === 'expired') {
      if (!await deps.close({ ...intent, checkout_session_id: session.id })) {
        throw new Error('CHECKOUT_INTENT_SUPERSEDED');
      }
      continue;
    }
    if (session.status !== 'open' || !session.url) throw new Error('STRIPE_CHECKOUT_URL_MISSING');
    return session;
  }
  throw new Error('CHECKOUT_IN_PROGRESS');
}
