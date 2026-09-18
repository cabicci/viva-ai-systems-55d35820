type StripeObject = Record<string, any>;

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  return value && typeof value === "object" && typeof (value as StripeObject).id === "string"
    ? (value as StripeObject).id : null;
}

export function decidePaidPlanEvidence(input: {
  eventType: string;
  object: StripeObject;
  subscription: StripeObject;
  checkoutLineItems?: StripeObject[];
}) {
  const reject = (error: string | null, priceId: string | null = null) =>
    ({ transition: null, priceId, valid: false, error } as const);
  const isInvoice = input.eventType === "invoice.paid";
  if (!isInvoice && input.eventType !== "checkout.session.completed") return reject(null);
  const sub = input.subscription;
  const obj = input.object;
  const subId = idOf(sub);
  const invoiceId = isInvoice ? idOf(obj) : idOf(obj.invoice);
  // A payment for an earlier invoice cannot authorize today's unpaid item change.
  if (!subId || !invoiceId || invoiceId !== idOf(sub.latest_invoice)) {
    return reject("PAID_INVOICE_MISMATCH");
  }
  const paid = isInvoice ? obj.status === "paid" && Number(obj.amount_remaining ?? 0) === 0
    : obj.payment_status === "paid";
  if (!paid || sub.status !== "active" || sub.pending_update) return reject("PAID_PLAN_EVIDENCE_MISSING");
  const lines: StripeObject[] = isInvoice ? obj.lines?.data ?? [] : input.checkoutLineItems ?? [];
  if (isInvoice && obj.lines?.has_more) return reject("PAID_PLAN_LINES_INCOMPLETE");
  const linkedSub = idOf(obj.subscription) ?? idOf(obj.parent?.subscription_details?.subscription);
  if (linkedSub !== subId) return reject("PAID_SUBSCRIPTION_MISMATCH");
  const candidates = new Set<string>();
  for (const line of lines) {
    const priceId = idOf(line.pricing?.price_details?.price) ?? idOf(line.price);
    const lineSub = idOf(line.subscription) ?? idOf(line.parent?.subscription_item_details?.subscription);
    // Manual invoice items and negative unused-time credits aren't paid-plan evidence.
    if (isInvoice && lineSub !== subId) continue;
    if (Number(line.amount ?? line.amount_total ?? 0) <= 0 || !priceId) continue;
    candidates.add(priceId);
  }
  if (candidates.size !== 1) return reject("PAID_PLAN_EVIDENCE_AMBIGUOUS");
  const priceId = [...candidates][0];
  const items: StripeObject[] = sub.items?.data ?? [];
  if (items.length !== 1 || priceId !== idOf(items[0].price)) return reject("PAID_PLAN_EVIDENCE_MISMATCH", priceId);
  return { transition: "payment_succeeded", priceId, valid: true, error: null } as const;
}
