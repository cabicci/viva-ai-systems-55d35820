/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CommercialPurchaseSelection } from "../commercial-purchase-contracts";
import {
  liveStripe,
  verifyLiveCustomer,
  type LiveDeps,
  type LiveResult,
  type LiveUser,
} from "./stripe-live";
import { financialDeliveryExpired } from "../../../../supabase/functions/_shared/account-financial-gate";
import { validateSignedRiskObject, validateSignedRiskRelationship } from "./payment-risk";
import { verifyOfferSession } from "./offer-operations";
import type { OfferEvidence } from "./offer-discounts";

export const COMMERCIAL_LIVE_CATALOGUE = {
  lifetime_course: {
    price: "price_1UXJ6GJUat05km9WKXP9ATsJ",
    product: "prod_masaarat_lifetime_curriculum_v1",
    amount: 7500,
  },
  question_topup: {
    price: "price_1UXJ6JJUat05km9WDjixVjfG",
    product: "prod_masaarat_question_topup_100_v1",
    amount: 5000,
  },
} as const;
type Kind = keyof typeof COMMERCIAL_LIVE_CATALOGUE;
export type CommercialPurchase = {
  id: string;
  user_id: string;
  kind: Kind;
  amount_minor: number;
  currency: string;
  price_id: string;
  product_id: string;
  customer_id: string | null;
  session_id: string | null;
  payment_id: string | null;
  created_at: string;
  state: string;
  parameters: { quote?: { offer?: OfferEvidence | null; original_minor?: number } };
};
type Selection = CommercialPurchaseSelection & {
  offer?: { code: string; key: string; phone?: string; renewal?: boolean };
};
const id = (v: any): string | null =>
  typeof v === "string" ? v : typeof v?.id === "string" ? v.id : null;
const marked = (o: any) =>
  ["curriculum_lifetime", "question_topup"].includes(o?.metadata?.product_scope);
function fail(code = "COMMERCIAL_PAYMENT_EVIDENCE_INVALID"): never {
  throw new Error(code);
}

function validatePurchase(p: CommercialPurchase) {
  const expected = COMMERCIAL_LIVE_CATALOGUE[p?.kind];
  if (
    !expected ||
    p.price_id !== expected.price ||
    p.product_id !== expected.product ||
    p.currency?.toUpperCase() !== "EGP" ||
    !Number.isSafeInteger(Number(p.amount_minor)) ||
    Number(p.amount_minor) <= 0 ||
    Number(p.amount_minor) > expected.amount
  )
    fail();
  return expected;
}

function verifyPrice(price: any, p: CommercialPurchase, requireActive: boolean) {
  const c = validatePurchase(p);
  if (
    price?.object !== "price" ||
    price.id !== c.price ||
    price.livemode !== true ||
    (requireActive && price.active !== true) ||
    price.type !== "one_time" ||
    price.recurring != null ||
    price.unit_amount !== c.amount ||
    price.currency !== "egp" ||
    price.tax_behavior !== "exclusive" ||
    id(price.product) !== c.product ||
    price.product?.object !== "product" ||
    price.product.livemode !== true ||
    (requireActive && price.product.active !== true) ||
    price.product.deleted ||
    price.metadata?.environment !== "live" ||
    price.product.metadata?.environment !== "live"
  )
    fail("LIVE_PRICE_MISMATCH");
}

/** Database row is immutable before money can be collected. Metadata is only a locator. */
export function verifyCommercialSession(p: CommercialPurchase, s: any, paid = false) {
  const c = validatePurchase(p);
  if (
    s?.object !== "checkout.session" ||
    s.livemode !== true ||
    s.mode !== "payment" ||
    (p.session_id && s.id !== p.session_id) ||
    id(s.customer) !== p.customer_id ||
    s.client_reference_id !== p.user_id ||
    s.metadata?.commercial_purchase_id !== p.id ||
    s.metadata?.user_id !== p.user_id ||
    s.metadata?.environment !== "live" ||
    s.metadata?.app !== "masaarat" ||
    s.metadata?.product_scope !==
      (p.kind === "lifetime_course" ? "curriculum_lifetime" : "question_topup") ||
    s.subscription != null ||
    s.currency !== "egp" ||
    s.line_items?.has_more !== false ||
    s.line_items?.data?.length !== 1 ||
    s.line_items.data[0].quantity !== 1 ||
    id(s.line_items.data[0].price) !== c.price ||
    s.amount_subtotal !== c.amount ||
    s.amount_total !== Number(p.amount_minor) ||
    s.total_details?.amount_tax !== 0 ||
    (s.total_details?.amount_shipping ?? 0) !== 0 ||
    (paid && (s.status !== "complete" || s.payment_status !== "paid"))
  )
    fail();
  verifyPrice(s.line_items.data[0].price, p, s.status === "open");
  const offer = p.parameters?.quote?.offer;
  if (offer) verifyOfferSession(offer, s, p.customer_id!, "payment");
  else if (
    s.total_details?.amount_discount !== 0 ||
    (s.discounts?.length ?? 0) !== 0 ||
    Number(p.amount_minor) !== c.amount
  )
    fail();
}

const expandSession = (session: string) =>
  `/checkout/sessions/${encodeURIComponent(session)}?expand[]=line_items.data.price.product&expand[]=discounts.promotion_code.promotion.coupon`;

export async function createCommercialCheckout(
  user: LiveUser,
  selection: Selection,
  origin: string,
  deps: LiveDeps,
): Promise<LiveResult> {
  if (selection.offer?.renewal) fail("COMMERCIAL_RENEWAL_INVALID");
  const p = await deps.rpc<CommercialPurchase>("prepare_commercial_purchase", {
    p_user_id: user.id,
    p_kind: selection.product === "curriculum_lifetime" ? "lifetime_course" : "question_topup",
    p_area: selection.product === "curriculum_lifetime" ? selection.area : null,
    p_course: selection.product === "curriculum_lifetime" ? selection.course : null,
    p_child_id: selection.product === "curriculum_lifetime" ? (selection.childId ?? null) : null,
    p_wallet_scope:
      selection.product === "question_topup"
        ? selection.walletScope
        : selection.area === "kids"
          ? "family"
          : "account",
    p_request_id: selection.requestId,
    p_offer: selection.offer ?? null,
  });
  validatePurchase(p);
  if (
    p.user_id !== user.id ||
    p.kind !== (selection.product === "curriculum_lifetime" ? "lifetime_course" : "question_topup")
  )
    fail();
  const stripe = liveStripe(deps);
  const price = await stripe<any>(`/prices/${p.price_id}?expand[]=product`);
  verifyPrice(price, p, true);
  let customer = p.customer_id;
  if (!customer) {
    const params = new URLSearchParams({
      email: user.email,
      "metadata[user_id]": user.id,
      "metadata[environment]": "live",
    });
    customer = (
      await stripe<{ id: string }>("/customers", {
        method: "POST",
        params,
        idempotencyKey: `customer-${user.id}-live-v1`,
      })
    ).id;
    customer = await deps.rpc<string>("register_kids_stripe_customer", {
      p_user_id: user.id,
      p_customer_id: customer,
    });
  }
  if (!customer) fail("LIVE_CUSTOMER_MISMATCH");
  await verifyLiveCustomer(stripe, customer, user.id);
  let session: any;
  if (p.session_id) session = await stripe(expandSession(p.session_id));
  else {
    const created = Date.parse(p.created_at);
    if (!Number.isFinite(created) || Date.now() - created > 23 * 60 * 60_000)
      fail("COMMERCIAL_REQUEST_EXPIRED");
    const params = new URLSearchParams({
      mode: "payment",
      customer,
      client_reference_id: user.id,
      integration_identifier: "masaarat-cqvhtnsp",
      allow_promotion_codes: "false",
      "line_items[0][price]": p.price_id,
      "line_items[0][quantity]": "1",
      "automatic_tax[enabled]": "false",
      billing_address_collection: "auto",
      success_url: `${origin}/account?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=canceled#question-topup`,
    });
    for (const [key, value] of Object.entries({
      app: "masaarat",
      environment: "live",
      user_id: user.id,
      commercial_purchase_id: p.id,
      product_scope: selection.product,
    })) {
      params.set(`metadata[${key}]`, value);
      params.set(`payment_intent_data[metadata][${key}]`, value);
    }
    const offer = p.parameters?.quote?.offer;
    if (offer) {
      params.set("discounts[0][promotion_code]", offer.mapping.promotion_code_id);
      params.set("metadata[offer_reservation_id]", offer.id);
    }
    const createdSession = await stripe<{ id: string }>("/checkout/sessions", {
      method: "POST",
      params,
      idempotencyKey: `commercial-${p.id}-live-v1`,
    });
    const binding = await deps.rpc<CommercialPurchase>("bind_commercial_purchase_session", {
      p_purchase_id: p.id,
      p_session_id: createdSession.id,
      p_customer_id: customer,
      p_price_id: p.price_id,
      p_product_id: p.product_id,
    });
    if (
      !binding ||
      binding.id !== p.id ||
      binding.user_id !== user.id ||
      binding.session_id !== createdSession.id ||
      binding.customer_id !== customer ||
      binding.price_id !== p.price_id ||
      binding.product_id !== p.product_id
    )
      fail("COMMERCIAL_SESSION_BIND_FAILED");
    Object.assign(p, binding);
    session = await stripe(expandSession(createdSession.id));
  }
  p.customer_id = customer;
  verifyCommercialSession(p, session);
  if (
    session.status === "expired" &&
    session.payment_status === "unpaid" &&
    session.payment_intent == null
  ) {
    const closed = await deps.rpc<{ closed: boolean }>("close_commercial_purchase_session", {
      p_purchase_id: p.id,
      p_session_id: session.id,
      p_customer_id: customer,
      p_status: "expired",
      p_payment_status: "unpaid",
      p_payment_id: null,
    });
    if (closed?.closed !== true) fail("COMMERCIAL_SESSION_CLOSE_FAILED");
    fail("COMMERCIAL_REQUEST_EXPIRED");
  }
  if (
    session.status !== "open" ||
    typeof session.url !== "string" ||
    new URL(session.url).origin !== "https://checkout.stripe.com"
  )
    fail("COMMERCIAL_SESSION_NOT_OPEN");
  return { status: 200, body: { url: session.url, sessionId: session.id } };
}

async function paymentGraph(p: CommercialPurchase, session: any, deps: LiveDeps) {
  verifyCommercialSession(p, session, true);
  const stripe = liveStripe(deps),
    paymentId = id(session.payment_intent);
  if (!paymentId) fail();
  const intent = await stripe<any>(`/payment_intents/${encodeURIComponent(paymentId)}`);
  if (
    intent?.object !== "payment_intent" ||
    intent.id !== paymentId ||
    intent.livemode !== true ||
    intent.status !== "succeeded" ||
    id(intent.customer) !== p.customer_id ||
    intent.currency !== "egp" ||
    intent.amount !== Number(p.amount_minor) ||
    intent.amount_received !== Number(p.amount_minor) ||
    intent.metadata?.commercial_purchase_id !== p.id ||
    intent.metadata?.user_id !== p.user_id ||
    intent.metadata?.environment !== "live"
  )
    fail();
  await verifyLiveCustomer(stripe, p.customer_id!, p.user_id);
  const chargeId = id(intent.latest_charge);
  if (!chargeId) fail();
  const charge = await stripe<any>(`/charges/${encodeURIComponent(chargeId)}`);
  if (
    charge?.object !== "charge" ||
    charge.id !== chargeId ||
    charge.livemode !== true ||
    charge.status !== "succeeded" ||
    charge.paid !== true ||
    id(charge.payment_intent) !== paymentId ||
    id(charge.customer) !== p.customer_id ||
    charge.amount !== Number(p.amount_minor) ||
    charge.currency !== "egp"
  )
    fail();
  return { paymentId, intent, charge };
}

/** Called only AFTER the raw event signature and live environment are verified. */
export async function handleCommercialPaymentEvent(
  event: { id: string; type: string; created: number; data: { object: any } },
  deps: LiveDeps,
): Promise<LiveResult | null> {
  const object = event.data.object;
  if (!event.type.startsWith("checkout.session.") || object.mode !== "payment") return null;
  const p = await deps.rpc<CommercialPurchase | null>("get_commercial_purchase_by_session", {
    p_session_id: object.id,
  });
  if (!p) {
    if (marked(object)) fail("COMMERCIAL_PURCHASE_NOT_BOUND");
    return null;
  }
  if (await financialDeliveryExpired(p.user_id, deps.rpc))
    return { status: 200, body: { received: true, financial_erased: true } };
  if (
    !["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)
  )
    return { status: 200, body: { received: true, ignored: true } };
  const session = await liveStripe(deps)<any>(expandSession(object.id));
  verifyCommercialSession(p, session, false);
  if (session.payment_status === "unpaid")
    return { status: 200, body: { received: true, pending: true } };
  const { paymentId, charge } = await paymentGraph(p, session, deps);
  if (charge.refunded || charge.disputed || Number(charge.amount_refunded) > 0) {
    const held = await deps.rpc<{ held: boolean }>("apply_commercial_purchase_risk_hold", {
      p_session_id: session.id,
      p_provider_event_id: event.id,
      p_payment_id: paymentId,
      p_reason: "payment_readback_risk",
    });
    if (held?.held !== true) fail("COMMERCIAL_RISK_HOLD_FAILED");
    return { status: 200, body: { received: true, held: true } };
  }
  const result = await deps.rpc<{ state: string }>("fulfill_commercial_purchase", {
    p_purchase_id: p.id,
    p_provider_event_id: event.id,
    p_payment_id: paymentId,
    p_session_id: session.id,
    p_customer_id: p.customer_id,
    p_price_id: p.price_id,
    p_product_id: p.product_id,
    p_amount_minor: p.amount_minor,
    p_currency: p.currency,
    p_paid_at: new Date(event.created * 1000).toISOString(),
  });
  if (result?.state !== "fulfilled") fail("COMMERCIAL_FULFILLMENT_FAILED");
  return { status: 200, body: { received: true, fulfilled: true } };
}

export async function handleCommercialRiskEvent(
  event: { id: string; type: string; created: number; data: { object: any } },
  deps: LiveDeps,
): Promise<LiveResult | null> {
  const object = event.data.object;
  const risks = ["charge.refunded", "charge.dispute.created", "radar.early_fraud_warning.created"];
  if (
    !risks.includes(event.type) &&
    !["refund.created", "refund.updated", "refund.failed"].includes(event.type)
  )
    return null;
  const stripe = liveStripe(deps);
  const refund = event.type.startsWith("refund.")
    ? await stripe<any>(`/refunds/${encodeURIComponent(object.id)}`)
    : null;
  if (refund && refund.status !== "succeeded") return null;
  if (refund && id(refund.payment_intent)) {
    const candidate = await stripe<any>(
      `/payment_intents/${encodeURIComponent(id(refund.payment_intent)!)}`,
    );
    if (!marked(candidate)) return null;
  }
  if (refund && (refund.object !== "refund" || refund.id !== object.id || refund.livemode !== true))
    fail();
  const chargeId = refund ? id(refund.charge) : validateSignedRiskObject(event.type, object);
  if (!chargeId) fail();
  const charge = await stripe<any>(`/charges/${encodeURIComponent(chargeId)}`);
  const paymentId = id(charge.payment_intent);
  if (!paymentId) return null;
  const intent = await stripe<any>(`/payment_intents/${encodeURIComponent(paymentId)}`);
  if (!marked(intent)) return null;
  if (!refund) validateSignedRiskRelationship(object, charge);
  if (refund && id(refund.payment_intent) !== paymentId) fail();
  const sessions = await stripe<any>(
    `/checkout/sessions?${new URLSearchParams({ payment_intent: paymentId, limit: "100" })}`,
  );
  if (sessions?.has_more || sessions?.data?.length !== 1) fail();
  const session = await stripe<any>(expandSession(sessions.data[0].id));
  const p = await deps.rpc<CommercialPurchase | null>("get_commercial_purchase_by_session", {
    p_session_id: session.id,
  });
  if (!p) fail("COMMERCIAL_PURCHASE_NOT_BOUND");
  if (await financialDeliveryExpired(p.user_id, deps.rpc))
    return { status: 200, body: { received: true, financial_erased: true } };
  const graph = await paymentGraph(p, session, deps);
  if (graph.paymentId !== paymentId || graph.charge.id !== chargeId) fail();
  if (
    refund &&
    (!Number.isSafeInteger(refund.amount) ||
      refund.amount <= 0 ||
      refund.amount > graph.charge.amount ||
      refund.currency !== graph.charge.currency)
  )
    fail();
  if (
    event.type === "charge.refunded" &&
    (!Number.isSafeInteger(charge.amount_refunded) ||
      charge.amount_refunded <= 0 ||
      charge.amount_refunded > charge.amount)
  )
    fail();
  const held = await deps.rpc<{ held: boolean }>("apply_commercial_purchase_risk_hold", {
    p_session_id: session.id,
    p_provider_event_id: event.id,
    p_payment_id: paymentId,
    p_reason: event.type,
  });
  if (held?.held !== true) fail("COMMERCIAL_RISK_HOLD_FAILED");
  return { status: 200, body: { received: true, held: true } };
}
