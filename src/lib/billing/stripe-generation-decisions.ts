export type CheckoutSessionIntent = {
  id: string;
  url: string | null;
  metadata?: Record<string, string>;
};

export function selectCheckoutSessionIntent(input: {
  sessions: CheckoutSessionIntent[];
  subscriptionId: string;
  generation: string;
}) {
  const managed = input.sessions.filter((session) =>
    session.metadata?.environment === "test"
    && session.metadata?.internal_subscription_id === input.subscriptionId
  );
  const reusable = managed.find((session) =>
    Boolean(session.url)
    && session.metadata?.checkout_generation === input.generation
  ) ?? null;
  return {
    reusable,
    expireIds: managed.filter((session) => session.id !== reusable?.id).map((session) => session.id),
  };
}

type StripeObject = Record<string, any>;

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as StripeObject).id === "string") {
    return (value as StripeObject).id;
  }
  return null;
}

function lineSubscriptionId(line: StripeObject): string | null {
  return idOf(line.subscription)
    ?? idOf(line.parent?.subscription_details?.subscription)
    ?? idOf(line.parent?.subscription_item_details?.subscription);
}

function positivePaidPrice(lines: StripeObject[], subscriptionId: string): string | null {
  return lines
    .map((line) => ({
      amount: Number(line.amount ?? line.amount_total ?? 0),
      priceId: idOf(line.price),
      subscriptionId: lineSubscriptionId(line),
    }))
    .filter((line) => line.priceId && line.amount > 0
      && (!line.subscriptionId || line.subscriptionId === subscriptionId))
    .sort((left, right) => right.amount - left.amount)[0]?.priceId ?? null;
}

export function decidePaidPlanEvidence(input: {
  eventType: string;
  object: StripeObject;
  subscription: StripeObject;
  checkoutLineItems?: StripeObject[];
}) {
  const currentPriceId = idOf(input.subscription.items?.data?.[0]?.price);
  const subscriptionId = idOf(input.subscription);
  if (!subscriptionId || !["invoice.paid", "checkout.session.completed"].includes(input.eventType)) {
    return { transition: null, priceId: null, valid: false, error: null } as const;
  }
  const lines = input.eventType === "invoice.paid"
    ? input.object.lines?.data ?? []
    : input.checkoutLineItems ?? [];
  const paidPriceId = positivePaidPrice(lines, subscriptionId);
  const paid = input.eventType === "invoice.paid"
    ? input.object.status === "paid" && Number(input.object.amount_paid ?? 0) > 0
    : input.object.payment_status === "paid" && Number(input.object.amount_total ?? 0) > 0;
  if (!paid || input.subscription.status !== "active" || !paidPriceId) {
    return { transition: null, priceId: paidPriceId, valid: false, error: "PAID_PLAN_EVIDENCE_MISSING" } as const;
  }
  if (paidPriceId !== currentPriceId) {
    return { transition: null, priceId: paidPriceId, valid: false, error: "PAID_PLAN_EVIDENCE_MISMATCH" } as const;
  }
  return { transition: "payment_succeeded", priceId: paidPriceId, valid: true, error: null } as const;
}
