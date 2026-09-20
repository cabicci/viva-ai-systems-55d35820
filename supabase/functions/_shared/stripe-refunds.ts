type StripeObject = Record<string, any>;
type StripeGet = (path: string) => Promise<StripeObject>;
const id = (value: any): string | null => typeof value === "string" ? value : value?.id ?? null;

/** Resolve money through Stripe's invoice-payment relation, never refund metadata. */
export async function resolveStripeRefund(refundId: string, get: StripeGet) {
  if (!/^re_[A-Za-z0-9_]+$/.test(refundId)) throw new Error("REFUND_ID_INVALID");
  const refund = await get(`/refunds/${encodeURIComponent(refundId)}`);
  if (refund.id !== refundId || refund.livemode !== false) throw new Error("REFUND_TEST_REQUIRED");
  if (!["pending", "requires_action", "succeeded", "failed", "canceled"].includes(refund.status)) {
    throw new Error("REFUND_STATUS_INVALID");
  }
  if (!Number.isSafeInteger(refund.amount) || refund.amount <= 0) throw new Error("REFUND_AMOUNT_INVALID");
  let paymentIntent = id(refund.payment_intent);
  if (!paymentIntent && id(refund.charge)) {
    const charge = await get(`/charges/${encodeURIComponent(id(refund.charge)!)}`);
    if (charge.livemode !== false) throw new Error("REFUND_TEST_REQUIRED");
    paymentIntent = id(charge.payment_intent);
  }
  if (!paymentIntent) throw new Error("REFUND_PAYMENT_INTENT_MISSING");
  const query = new URLSearchParams({
    "payment[type]": "payment_intent", "payment[payment_intent]": paymentIntent,
    status: "paid", limit: "100",
  });
  const payments = await get(`/invoice_payments?${query}`);
  if (payments.has_more) throw new Error("REFUND_INVOICE_PAYMENTS_INCOMPLETE");
  if (!Array.isArray(payments.data)) throw new Error("REFUND_INVOICE_PAYMENTS_INVALID");
  if (payments.data.length === 0) return null; // Non-invoice payment is outside this bridge.
  if (payments.data.length !== 1) throw new Error("REFUND_INVOICE_AMBIGUOUS");
  const payment = payments.data[0];
  if (payment.livemode !== false || payment.status !== "paid"
    || payment.payment?.type !== "payment_intent" || id(payment.payment?.payment_intent) !== paymentIntent) {
    throw new Error("REFUND_PAYMENT_MISMATCH");
  }
  const invoiceId = id(payment.invoice);
  if (!invoiceId) throw new Error("REFUND_INVOICE_MISSING");
  const invoice = await get(`/invoices/${encodeURIComponent(invoiceId)}`);
  const subscriptionId = id(invoice.parent?.subscription_details?.subscription) ?? id(invoice.subscription);
  if (!subscriptionId) return null;
  const subscription = await get(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (!subscription.metadata?.internal_subscription_id || !subscription.metadata?.user_id) return null;
  const intent = await get(`/payment_intents/${encodeURIComponent(paymentIntent)}`);
  const customerId = id(subscription.customer);
  if ([invoice, subscription, intent].some((o) => o.livemode !== false)
    || invoice.id !== invoiceId || subscription.id !== subscriptionId || intent.id !== paymentIntent
    || invoice.status !== "paid" || intent.status !== "succeeded"
    || id(invoice.customer) !== customerId || id(intent.customer) !== customerId
    || invoice.currency !== refund.currency || intent.currency !== refund.currency
    || payment.currency !== refund.currency
    || payment.amount_paid !== invoice.amount_paid || intent.amount_received !== invoice.amount_paid
    || !Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid < refund.amount) {
    throw new Error("REFUND_INVOICE_PAYMENT_MISMATCH");
  }
  return {
    refund, invoice, subscription,
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
