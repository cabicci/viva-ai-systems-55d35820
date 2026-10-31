import type { OfferEvidence } from "./offer-discounts";

/** Fields read from the expanded, versioned Stripe offer response. Runtime
 * proof checks below remain authoritative; this type adds no new permission. */
type ProviderObject = {
  id?: string;
  object?: string;
  livemode?: boolean;
  mode?: string;
  customer?: string | ProviderObject | null;
  subscription?: string | ProviderObject | null;
  payment_intent?: string | ProviderObject | null;
  metadata?: Record<string, string>;
  currency?: string;
  amount_subtotal?: number;
  amount_total?: number;
  status?: string;
  payment_status?: string;
  line_items?: { has_more?: boolean; data?: ProviderObject[] };
  price?: string | ProviderObject;
  quantity?: number;
  discounts?: ProviderObject[];
  promotion_code?: ProviderObject;
  promotion?: { coupon?: ProviderObject };
  coupon?: ProviderObject;
  total_details?: { amount_discount?: number; amount_tax?: number };
  duration?: string;
  duration_in_months?: number | null;
  applies_to?: { products?: string[] };
  percent_off?: number | null;
  amount_off?: number | null;
};
const id = (value: unknown): string | null =>
  typeof value === "string"
    ? value
    : typeof (value as { id?: unknown } | null | undefined)?.id === "string"
      ? (value as { id: string }).id
      : null;

/** Signed invoice proof is still mandatory; Session proof prevents a bad mapped
 * discount from being offered to a customer in the first place. */
export function verifyOfferSession(
  e: OfferEvidence,
  session: ProviderObject,
  customer: string,
): void {
  const m = e.mapping,
    discounts = session.discounts;
  const promotion = discounts?.[0]?.promotion_code;
  const coupon = promotion?.promotion?.coupon ?? promotion?.coupon ?? discounts?.[0]?.coupon;
  const deduction =
    m.kind === "percent"
      ? Math.floor((Number(e.original_minor) * Number(m.value_minor)) / 100)
      : Number(m.value_minor);
  if (
    session.object !== "checkout.session" ||
    session.livemode !== true ||
    session.mode !== "subscription" ||
    (e.session_id && session.id !== e.session_id) ||
    id(session.customer) !== customer ||
    session.metadata?.offer_reservation_id !== e.id ||
    session.currency?.toUpperCase() !== m.currency ||
    session.line_items?.has_more ||
    session.line_items?.data?.length !== 1 ||
    id(session.line_items.data[0].price) !== m.price_id ||
    session.line_items.data[0].quantity !== 1 ||
    session.amount_subtotal !== Number(e.original_minor) ||
    session.amount_total !== Number(e.final_minor) ||
    Number(e.original_minor) - deduction !== Number(e.final_minor) ||
    session.total_details?.amount_discount !== deduction ||
    session.total_details?.amount_tax !== 0 ||
    discounts?.length !== 1 ||
    promotion?.object !== "promotion_code" ||
    promotion.id !== m.promotion_code_id ||
    promotion.livemode !== true ||
    coupon?.object !== "coupon" ||
    coupon.id !== m.coupon_id ||
    coupon.livemode !== true ||
    coupon.duration !== m.duration ||
    !["once", "forever"].includes(m.duration) ||
    coupon.duration_in_months != null ||
    coupon.applies_to?.products?.length !== 1 ||
    coupon.applies_to.products[0] !== m.product_id ||
    (m.kind === "percent"
      ? coupon.percent_off !== Number(m.value_minor) || coupon.amount_off != null
      : coupon.amount_off !== Number(m.value_minor) ||
        coupon.currency?.toUpperCase() !== m.currency ||
        coupon.percent_off != null)
  ) {
    throw new Error("LIVE_OFFER_SESSION_DISCOUNT_UNPROVEN");
  }
}

/** Only an expired, unpaid Session without a subscription or payment may free
 * capacity. Completed asynchronous Sessions must remain held. */
export function terminalOfferRelease(e: OfferEvidence, session: ProviderObject) {
  if (
    !e.session_id ||
    !e.customer_id ||
    e.subscription_id ||
    e.consumed_invoice_id ||
    session.id !== e.session_id ||
    session.object !== "checkout.session" ||
    session.livemode !== true ||
    session.mode !== "subscription" ||
    id(session.customer) !== e.customer_id ||
    session.metadata?.offer_reservation_id !== e.id ||
    session.status !== "expired" ||
    session.payment_status !== "unpaid" ||
    session.subscription != null ||
    session.payment_intent != null
  ) {
    throw new Error("LIVE_OFFER_TERMINAL_STATE_UNPROVEN");
  }
  return {
    session_id: e.session_id,
    customer_id: e.customer_id,
    status: "expired",
    payment_status: "unpaid",
    terminal_verified: true,
  };
}
