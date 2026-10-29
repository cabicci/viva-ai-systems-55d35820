/* eslint-disable @typescript-eslint/no-explicit-any */
import { hasMasaaratMetadata } from "../../../../supabase/functions/_shared/stripe-refunds";

type Get = (path: string) => Promise<Record<string, any>>;
const id = (v: any): string | null => typeof v === "string" ? v : typeof v?.id === "string" ? v.id : null;
export const RISK_HOLD = "masaarat_payment_risk_hold";

// These snapshots are authoritative only after verification of the raw Stripe
// webhook signature. Disputes/Radar reads are deliberately not required.
export function validateSignedRiskObject(type: string, object: Record<string, any>): string {
  const expected = type === "charge.dispute.created" ? "dispute"
    : type === "radar.early_fraud_warning.created" ? "radar.early_fraud_warning" : "charge";
  if (object.object !== expected || object.livemode !== true || !id(object))
    throw new Error("RISK_SIGNED_OBJECT_INVALID");
  if (expected === "dispute" && (!Number.isSafeInteger(object.amount) || object.amount <= 0
    || typeof object.currency !== "string" || !/^[a-z]{3}$/.test(object.currency)))
    throw new Error("RISK_SIGNED_DISPUTE_INVALID");
  if (expected === "radar.early_fraud_warning" && (typeof object.fraud_type !== "string" || !object.fraud_type
    || typeof object.actionable !== "boolean")) throw new Error("RISK_SIGNED_WARNING_INVALID");
  const chargeId = expected === "charge" ? id(object) : id(object.charge);
  if (!chargeId || !/^ch_[A-Za-z0-9_]+$/.test(chargeId)) throw new Error("RISK_CHARGE_ID_INVALID");
  return chargeId;
}

export function validateSignedRiskRelationship(object: Record<string, any>, charge: Record<string, any>): void {
  if (object.payment_intent != null && id(object.payment_intent) !== id(charge.payment_intent))
    throw new Error("RISK_SIGNED_PAYMENT_INTENT_MISMATCH");
}

// Resolve the provider's payment graph before using any metadata to select a user.
export async function resolveLiveRiskPayment(chargeId: string, get: Get) {
  if (!/^ch_[A-Za-z0-9_]+$/.test(chargeId)) throw new Error("RISK_CHARGE_ID_INVALID");
  const charge = await get(`/charges/${encodeURIComponent(chargeId)}`);
  if (charge.id !== chargeId || charge.livemode !== true || !charge.paid || charge.status !== "succeeded")
    throw new Error("RISK_CHARGE_INVALID");
  const pi = id(charge.payment_intent);
  if (!pi) throw new Error("RISK_PAYMENT_INTENT_MISSING");
  const intent = await get(`/payment_intents/${encodeURIComponent(pi)}`);
  if (intent.id !== pi || intent.livemode !== true || intent.status !== "succeeded"
    || id(intent.latest_charge) !== chargeId || id(intent.customer) !== id(charge.customer)
    || intent.currency !== charge.currency || intent.amount_received !== charge.amount)
    throw new Error("RISK_PAYMENT_INTENT_MISMATCH");
  const customerId = id(intent.customer);
  const customer = customerId ? await get(`/customers/${encodeURIComponent(customerId)}`) : null;
  if (customer && (customer.id !== customerId || customer.livemode !== true || customer.deleted))
    throw new Error("RISK_CUSTOMER_INVALID");
  const marked = hasMasaaratMetadata(charge.metadata) || hasMasaaratMetadata(intent.metadata)
    || hasMasaaratMetadata(customer?.metadata);
  const payments = await get(`/invoice_payments?${new URLSearchParams({
    "payment[type]": "payment_intent", "payment[payment_intent]": pi, status: "paid", limit: "100",
  })}`);
  if (payments.has_more || !Array.isArray(payments.data)) throw new Error("RISK_PAYMENT_EVIDENCE_INCOMPLETE");
  if (payments.data.length === 0) {
    if (marked) throw new Error("RISK_MASAARAT_INVOICE_MISSING");
    return null;
  }
  if (payments.data.length !== 1) throw new Error("RISK_INVOICE_AMBIGUOUS");
  const payment = payments.data[0];
  const invoiceId = id(payment.invoice);
  if (!invoiceId || payment.livemode !== true || payment.status !== "paid"
    || payment.payment?.type !== "payment_intent" || id(payment.payment.payment_intent) !== pi
    || payment.currency !== charge.currency || payment.amount_paid !== intent.amount_received)
    throw new Error("RISK_INVOICE_PAYMENT_MISMATCH");
  const invoice = await get(`/invoices/${encodeURIComponent(invoiceId)}`);
  if (invoice.id !== invoiceId || invoice.livemode !== true || invoice.status !== "paid"
    || id(invoice.customer) !== customerId || invoice.currency !== charge.currency
    || invoice.amount_paid !== payment.amount_paid) throw new Error("RISK_INVOICE_MISMATCH");
  const subId = id(invoice.parent?.subscription_details?.subscription) ?? id(invoice.subscription);
  if (!subId) {
    if (marked || hasMasaaratMetadata(invoice.metadata)) throw new Error("RISK_MASAARAT_SUBSCRIPTION_MISSING");
    return null;
  }
  const subscription = await get(`/subscriptions/${encodeURIComponent(subId)}`);
  if (subscription.id !== subId || subscription.livemode !== true || id(subscription.customer) !== customerId)
    throw new Error("RISK_SUBSCRIPTION_MISMATCH");
  if (!hasMasaaratMetadata(subscription.metadata)) {
    if (marked) throw new Error("RISK_MASAARAT_METADATA_MISSING");
    return null;
  }
  if (subscription.metadata.environment !== "live" || !subscription.metadata.user_id
    || customer?.metadata?.environment !== "live" || customer.metadata.user_id !== subscription.metadata.user_id)
    throw new Error("RISK_MASAARAT_OWNER_MISMATCH");
  return { charge, invoice, subscription };
}