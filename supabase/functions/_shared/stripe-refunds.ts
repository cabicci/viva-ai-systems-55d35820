type StripeObject = Record<string, any>;
type StripeGet = (path: string) => Promise<StripeObject>;
const id = (value: any): string | null => (typeof value === "string" ? value : (value?.id ?? null));

/** Keys Masaarat writes on its own Stripe customers/subscriptions. Anything without them is another product. */
export const MASAARAT_METADATA_KEYS = [
  "app", "environment", "product_scope", "internal_subscription_id", "plan_version_id",
  "market_price_id", "checkout_generation", "user_id", "plan_key",
] as const;
export function hasMasaaratMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  const m = metadata as Record<string, unknown>;
  return MASAARAT_METADATA_KEYS.some((k) => m[k] !== undefined && m[k] !== null && m[k] !== "");
}

/** Resolve money through Stripe's invoice-payment relation, never refund metadata. */
export async function resolveStripeRefund(
  refundId: string,
  get: StripeGet,
  environment: "test" | "live" = "test",
) {
  const live = environment === "live";
  const envError = live ? "REFUND_LIVE_REQUIRED" : "REFUND_TEST_REQUIRED";
  if (!/^re_[A-Za-z0-9_]+$/.test(refundId)) throw new Error("REFUND_ID_INVALID");
  const refund = await get(`/refunds/${encodeURIComponent(refundId)}`);
  if (refund.id !== refundId) throw new Error(envError);
  // Strict environment attestation. When the Refund carries livemode it must be
  // exactly the expected boolean (missing-but-present values such as null or
  // "true" are rejected). Stripe's Refund shape may omit livemode; then the
  // PaymentIntent below must attest it strictly before anything is returned.
  const refundAttests = Object.prototype.hasOwnProperty.call(refund, "livemode");
  if (refundAttests && refund.livemode !== live) throw new Error(envError);
  if (!["pending", "requires_action", "succeeded", "failed", "canceled"].includes(refund.status)) {
    throw new Error("REFUND_STATUS_INVALID");
  }
  if (!Number.isSafeInteger(refund.amount) || refund.amount <= 0)
    throw new Error("REFUND_AMOUNT_INVALID");
  let paymentIntent = id(refund.payment_intent);
  if (!paymentIntent && id(refund.charge)) {
    const charge = await get(`/charges/${encodeURIComponent(id(refund.charge)!)}`);
    if (charge.livemode !== live) throw new Error(envError);
    paymentIntent = id(charge.payment_intent);
  }
  if (!paymentIntent) throw new Error("REFUND_PAYMENT_INTENT_MISSING");
  const intent = await get(`/payment_intents/${encodeURIComponent(paymentIntent)}`);
  if (intent.livemode !== live || intent.id !== paymentIntent) throw new Error(envError);
  const query = new URLSearchParams({
    "payment[type]": "payment_intent",
    "payment[payment_intent]": paymentIntent,
    status: "paid",
    limit: "100",
  });
  const payments = await get(`/invoice_payments?${query}`);
  if (payments.has_more) throw new Error("REFUND_INVOICE_PAYMENTS_INCOMPLETE");
  if (!Array.isArray(payments.data)) throw new Error("REFUND_INVOICE_PAYMENTS_INVALID");
  if (payments.data.length === 0) {
    // Non-invoice payment (e.g. a one-time payment of another product on the
    // same account) is outside this bridge. In Live, a payment that belongs to
    // a Masaarat customer but lacks invoice evidence must fail loudly instead.
    if (live && (hasMasaaratMetadata(intent.metadata) || (await masaaratCustomer(id(intent.customer), get, live))))
      throw new Error("REFUND_INVOICE_EVIDENCE_MISSING");
    return null;
  }
  if (payments.data.length !== 1) throw new Error("REFUND_INVOICE_AMBIGUOUS");
  const payment = payments.data[0];
  if (
    payment.livemode !== live ||
    payment.status !== "paid" ||
    payment.payment?.type !== "payment_intent" ||
    id(payment.payment?.payment_intent) !== paymentIntent
  ) {
    throw new Error("REFUND_PAYMENT_MISMATCH");
  }
  const invoiceId = id(payment.invoice);
  if (!invoiceId) throw new Error("REFUND_INVOICE_MISSING");
  const invoice = await get(`/invoices/${encodeURIComponent(invoiceId)}`);
  const subscriptionId =
    id(invoice.parent?.subscription_details?.subscription) ?? id(invoice.subscription);
  if (!subscriptionId) {
    if (live && (hasMasaaratMetadata(invoice.metadata) || (await masaaratCustomer(id(invoice.customer), get, live))))
      throw new Error("REFUND_SUBSCRIPTION_EVIDENCE_MISSING");
    return null;
  }
  const subscription = await get(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  const meta = subscription.metadata ?? {};
  if (live) {
    // Unrelated product: acknowledge upstream. Masaarat with incomplete identity: fail.
    if (!hasMasaaratMetadata(meta)) return null;
    if (!meta.user_id) throw new Error("REFUND_SUBSCRIPTION_METADATA_INCOMPLETE");
  } else if ((!meta.internal_subscription_id && meta.product_scope !== "kids") || !meta.user_id) {
    return null;
  }
  const customerId = id(subscription.customer);
  if (
    [invoice, subscription, intent].some((o) => o.livemode !== live) ||
    invoice.id !== invoiceId ||
    subscription.id !== subscriptionId ||
    intent.id !== paymentIntent ||
    invoice.status !== "paid" ||
    intent.status !== "succeeded" ||
    id(invoice.customer) !== customerId ||
    id(intent.customer) !== customerId ||
    invoice.currency !== refund.currency ||
    intent.currency !== refund.currency ||
    payment.currency !== refund.currency ||
    payment.amount_paid !== invoice.amount_paid ||
    intent.amount_received !== invoice.amount_paid ||
    !Number.isSafeInteger(invoice.amount_paid) ||
    invoice.amount_paid < refund.amount
  ) {
    throw new Error("REFUND_INVOICE_PAYMENT_MISMATCH");
  }
  return {
    refund,
    invoice,
    subscription,
    rpc: {
      p_gateway_refund_id: refund.id,
      p_gateway_invoice_id: invoice.id,
      p_status: refund.status,
      p_amount_minor: refund.amount,
      p_currency_code: refund.currency,
      p_gateway_subscription_id: subscription.id,
      p_gateway_customer_id: customerId,
      p_checkout_generation: subscription.metadata.checkout_generation ?? null,
      p_is_latest_invoice: id(subscription.latest_invoice) === invoice.id,
    },
  };
}

async function masaaratCustomer(customerId: string | null, get: StripeGet, live: boolean): Promise<boolean> {
  if (!customerId) return false;
  const customer = await get(`/customers/${encodeURIComponent(customerId)}`);
  if (customer.livemode !== live) throw new Error(live ? "REFUND_LIVE_REQUIRED" : "REFUND_TEST_REQUIRED");
  return hasMasaaratMetadata(customer.metadata);
}
