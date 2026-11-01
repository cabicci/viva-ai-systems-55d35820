/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-controlled mapping snapshots. Never accept Stripe IDs from a browser.
export type OfferEvidence = {
  id: string;
  user_id: string;
  customer_id: string | null;
  session_id: string | null;
  subscription_id: string | null;
  consumed_invoice_id: string | null;
  original_minor: number;
  final_minor: number;
  mapping: {
    id: string;
    package: string;
    market_code: string;
    currency: string;
    billing_interval: string;
    price_id: string;
    product_id: string;
    coupon_id: string;
    promotion_code_id: string;
    kind: "percent" | "fixed";
    value_minor: number;
    duration: "once" | "repeating" | "forever";
    duration_in_months: number | null;
  };
};
const id = (v: any): string | null =>
  typeof v === "string" ? v : typeof v?.id === "string" ? v.id : null;
const fail = (): never => {
  throw new Error("LIVE_OFFER_DISCOUNT_EVIDENCE_INVALID");
};

export function offerSessionParameters(params: URLSearchParams, evidence: OfferEvidence) {
  params.set("discounts[0][promotion_code]", evidence.mapping.promotion_code_id);
  params.set("allow_promotion_codes", "false");
  params.set("metadata[offer_reservation_id]", evidence.id);
  params.set("subscription_data[metadata][offer_reservation_id]", evidence.id);
  // Short reservation/Session validity; no amount, coupon or mode from browser.
  params.set("expires_at", String(Math.floor(Date.now() / 1000) + 1800));
}

export function verifyOfferInvoice(e: OfferEvidence, invoice: any, sub: any, session: any): number {
  const m = e.mapping,
    item = sub.items?.data?.[0],
    price = item?.price;
  if (
    !e.customer_id ||
    !e.session_id ||
    session.id !== e.session_id ||
    session.livemode !== true ||
    session.object !== "checkout.session" ||
    id(session.customer) !== e.customer_id ||
    id(session.subscription) !== sub.id ||
    sub.livemode !== true ||
    id(sub.customer) !== e.customer_id ||
    sub.metadata?.user_id !== e.user_id ||
    sub.metadata?.offer_reservation_id !== e.id ||
    session.metadata?.offer_reservation_id !== e.id ||
    (e.subscription_id && e.subscription_id !== sub.id) ||
    sub.items?.data?.length !== 1 ||
    id(price) !== m.price_id ||
    id(price.product) !== m.product_id ||
    price.unit_amount !== Number(e.original_minor) ||
    price.currency?.toUpperCase() !== m.currency ||
    price.recurring?.interval !== m.billing_interval ||
    item.quantity !== 1 ||
    invoice.currency?.toUpperCase() !== m.currency ||
    invoice.lines?.has_more ||
    invoice.lines?.data?.length !== 1 ||
    !["subscription_create", "subscription_cycle"].includes(invoice.billing_reason) ||
    invoice.starting_balance !== 0 ||
    invoice.ending_balance !== 0 ||
    invoice.amount_remaining !== 0 ||
    invoice.status !== "paid" ||
    invoice.livemode !== true ||
    id(invoice.customer) !== e.customer_id ||
    invoice.total_taxes?.some((t: any) => t.amount !== 0) ||
    invoice.total_tax_amounts?.some((t: any) => t.amount !== 0)
  )
    fail();
  const line = invoice.lines.data[0];
  const linePrice = id(line.pricing?.price_details?.price) ?? id(line.price);
  const linkedSub =
    id(invoice.subscription) ?? id(invoice.parent?.subscription_details?.subscription);
  const lineSub = id(line.subscription) ?? id(line.parent?.subscription_item_details?.subscription);
  if (
    linkedSub !== sub.id ||
    lineSub !== sub.id ||
    linePrice !== m.price_id ||
    line.amount !== Number(e.original_minor) ||
    line.quantity !== 1 ||
    !Number.isSafeInteger(line.period?.start) ||
    !Number.isSafeInteger(line.period?.end) ||
    line.period.start !== item.current_period_start ||
    line.period.end !== item.current_period_end ||
    line.period.end <= line.period.start ||
    line.proration === true ||
    line.parent?.subscription_item_details?.proration === true
  )
    fail();
  const initial = invoice.billing_reason === "subscription_create";
  if (initial && e.consumed_invoice_id && e.consumed_invoice_id !== invoice.id) fail();
  if (!initial && !e.consumed_invoice_id) fail();
  if (m.duration === "repeating") fail(); // Temporal policy not yet independently verified.
  const applies = initial || m.duration === "forever";
  const discounts = invoice.discounts ?? [];
  const amounts = invoice.total_discount_amounts ?? [];
  const deduction =
    m.kind === "percent"
      ? Math.floor((Number(e.original_minor) * Number(m.value_minor)) / 100)
      : Number(m.value_minor);
  const expected = applies ? Number(e.original_minor) - deduction : Number(e.original_minor);
  if (expected <= 0 || (applies && expected !== Number(e.final_minor))) fail();
  if (applies) {
    if (discounts.length !== 1 || amounts.length !== 1) fail();
    const d = discounts[0],
      coupon = d?.source?.coupon ?? d?.coupon;
    if (
      d?.object !== "discount" ||
      id(d.promotion_code) !== m.promotion_code_id ||
      id(coupon) !== m.coupon_id ||
      coupon?.object !== "coupon" ||
      coupon.livemode !== true ||
      coupon.duration !== m.duration ||
      coupon.duration_in_months != null ||
      id(amounts[0].discount) !== d.id ||
      amounts[0].amount !== deduction ||
      coupon.applies_to?.products?.length !== 1 ||
      coupon.applies_to.products[0] !== m.product_id ||
      (m.kind === "percent"
        ? coupon.percent_off !== Number(m.value_minor) || coupon.amount_off != null
        : coupon.amount_off !== Number(m.value_minor) ||
          coupon.currency?.toUpperCase() !== m.currency ||
          coupon.percent_off != null)
    )
      fail();
  } else if (discounts.length || amounts.length) fail();
  if (
    invoice.subtotal !== Number(e.original_minor) ||
    invoice.total !== expected ||
    invoice.amount_due !== expected ||
    invoice.amount_paid !== expected ||
    !Number.isSafeInteger(expected)
  )
    fail();
  return expected;
}
