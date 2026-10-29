/* eslint-disable @typescript-eslint/no-explicit-any */
// Stripe LIVE flows for every Masaarat package. Server-only (imported by server
// routes through runtime.server.ts). Test edge functions are untouched.
//
// Rules:
// - New checkout requires BOTH kill switches ON (env flag + database).
// - Webhook / portal / refunds are lifecycle and work even when checkout is OFF.
// - Every database call carries the Live environment header, so RPCs use
//   gateway_code=stripe_us_live and stripe_environment='live' rows only.
// - Any Stripe object that reports livemode!==true is rejected.
// - The webhook only answers 2xx after the database recorded the event.
import { coordinateCheckout, type CheckoutIntent } from "../../../../supabase/functions/_shared/stripe-checkout-intent";
import { coordinateKidsCheckout } from "../../../../supabase/functions/_shared/checkout-coordinator";
import { decidePaidPlanEvidence } from "../../../../supabase/functions/_shared/stripe-generation-decisions";
import { resolveStripeRefund } from "../../../../supabase/functions/_shared/stripe-refunds";
import { financialDeliveryExpired } from "../../../../supabase/functions/_shared/account-financial-gate";
import {
  assertLiveCheckoutAllowed,
  verifyStripeSignature,
  STRIPE_SECRET_NAMES,
  type LiveGateDeps,
} from "../../../../supabase/functions/_shared/stripe-environment";
import { LIVE_SITE_HOSTS } from "./origin";
import { resolveLiveRiskPayment, validateSignedRiskObject, validateSignedRiskRelationship } from "./payment-risk";
import { offerSessionParameters, verifyOfferInvoice, type OfferEvidence } from "./offer-discounts";

const TRUSTED_APP_ORIGINS = new Set<string>(LIVE_SITE_HOSTS.map((h) => `https://${h}`));

export const LIVE = "live" as const;
export const LIVE_SUFFIX = "live-v1";
// Explicit marker on every new Masaarat Live session/subscription, so account-wide
// webhook events of unrelated products (e.g. Render) can be told apart.
export const APP_MARKER = { key: "app", value: "masaarat" } as const;
const MASAARAT_KEYS = [APP_MARKER.key, "environment", "product_scope", "internal_subscription_id", "plan_version_id",
  "market_price_id", "checkout_generation", "user_id", "plan_key"];

// Unrelated = carries none of the keys Masaarat ever writes.
export function isMasaaratSubscription(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  return MASAARAT_KEYS.some((k) => metadata[k] !== undefined && metadata[k] !== null && metadata[k] !== "");
}

type StripeMethod = "GET" | "POST" | "DELETE";
export type LiveDeps = LiveGateDeps & {
  rpc<T>(name: string, body: Record<string, unknown>): Promise<T>;
  stripe<T>(path: string, options?: { method?: StripeMethod; params?: URLSearchParams; idempotencyKey?: string }): Promise<T>;
};
export type LiveUser = { id: string; email: string };
export type LiveResult = { status: number; body: Record<string, unknown> };

const MANAGED = ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"];
const LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as any).id === "string") return (value as any).id;
  return null;
}

// Every returned Stripe object must be a Live object.
export function liveStripe(deps: LiveDeps): LiveDeps["stripe"] {
  return async <T>(path: string, options?: Parameters<LiveDeps["stripe"]>[1]) => {
    const value = await deps.stripe<any>(path, options);
    const items = value?.object === "list" && Array.isArray(value.data) ? value.data : [value];
    for (const item of items) {
      if (item && typeof item === "object" && "livemode" in item && item.livemode !== true) {
        throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
      }
    }
    return value as T;
  };
}

// Live never creates catalog objects during checkout. The registered price is
// read back from Stripe and must match the database context exactly.
type ExpectedPrice = { priceId: string; productId: string; currency: string; amountMinor: number; interval: "month" | "year" };
export async function verifyLivePrice(stripe: LiveDeps["stripe"], e: ExpectedPrice): Promise<string> {
  const price = await stripe<any>(`/prices/${encodeURIComponent(e.priceId)}?${new URLSearchParams({ "expand[]": "product" })}`);
  const product = price?.product && typeof price.product === "object" ? price.product : null;
  const ok = price?.object === "price" && price.id === e.priceId && price.livemode === true && price.active === true
    && price.type === "recurring" && String(price.currency).toLowerCase() === e.currency.toLowerCase()
    && price.unit_amount === e.amountMinor && price.recurring?.interval === e.interval
    && (price.recurring?.interval_count ?? 1) === 1 && price.recurring?.usage_type !== "metered"
    && price.tax_behavior === "exclusive" && price.metadata?.environment === LIVE
    && product?.id === e.productId && product.livemode === true && product.active === true && !product.deleted
    && product.metadata?.environment === LIVE;
  if (!ok) throw new Error("LIVE_PRICE_MISMATCH");
  return price.id;
}

export async function verifyLiveCustomer(stripe: LiveDeps["stripe"], customerId: string, userId: string): Promise<void> {
  const customer = await stripe<any>(`/customers/${encodeURIComponent(customerId)}`);
  if (customer?.object !== "customer" || customer.id !== customerId || customer.livemode !== true || customer.deleted
    || customer.metadata?.user_id !== userId || customer.metadata?.environment !== LIVE)
    throw new Error("LIVE_CUSTOMER_MISMATCH");
}

// ---------------------------------------------------------------- checkout
export type LiveCheckoutBody = (
  | { product: "core"; planKey: "pro" | "pro_plus"; billingInterval: "month" | "year"; marketCode: "EG" | "INTL" }
  | { product: "kids" | "technical"; billingInterval: "month" | "year"; marketCode: "EG" | "INTL"; locale?: string }
  | { product: "academic"; academicAssistant: boolean; billingInterval: "month" | "year"; marketCode: "EG" | "INTL"; locale?: string }) & { offer?: { code: string; phone?: string; key: string; renewal?: boolean } };

async function reserveOffer(user: LiveUser, body: LiveCheckoutBody, deps: LiveDeps): Promise<OfferEvidence | null> {
  if (!body.offer) return null;
  if (deps.getEnv("STRIPE_BILLING_MODE")?.trim().toLowerCase() !== "live") throw new Error("LIVE_OFFER_MODE_REQUIRED");
  if (body.product === "academic" && body.academicAssistant) throw new Error("LIVE_OFFER_ASSISTANT_NOT_MAPPED");
  return deps.rpc<OfferEvidence>("reserve_stripe_live_offer", { p_user_id: user.id, p_code: body.offer.code,
    p_package: body.product === "core" ? body.planKey : body.product, p_market: body.marketCode, p_interval: body.billingInterval,
    p_phone: body.offer.phone ?? null, p_key: body.offer.key, p_renewal: body.offer.renewal ?? false });
}

async function bindOffer(offer: OfferEvidence | null, user: LiveUser, customer: string, session: { id: string }, deps: LiveDeps) {
  if (offer) {
    // Bind before verification: an ambiguous Stripe result must keep capacity
    // reserved for readback reconciliation, never silently release it.
    if (await deps.rpc("bind_stripe_live_offer", { p_reservation_id: offer.id, p_user_id: user.id,
      p_customer_id: customer, p_session_id: session.id }) !== true) throw new Error("LIVE_OFFER_BINDING_FAILED");
    const actual = await liveStripe(deps)<any>(`/checkout/sessions/${encodeURIComponent(session.id)}?expand[]=line_items&expand[]=discounts.promotion_code.promotion.coupon`);
    if (actual.id !== session.id || actual.object !== "checkout.session" || actual.livemode !== true
      || idOf(actual.customer) !== customer || actual.metadata?.offer_reservation_id !== offer.id
      || actual.line_items?.has_more || actual.line_items?.data?.length !== 1
      || idOf(actual.line_items.data[0].price) !== offer.mapping.price_id || actual.line_items.data[0].quantity !== 1
      || actual.currency?.toUpperCase() !== offer.mapping.currency) throw new Error("LIVE_OFFER_SESSION_MISMATCH");
    const { verifyOfferSession } = await import("./offer-operations");
    verifyOfferSession(offer, actual, customer);
  }
}

export async function createLiveCheckout(
  user: LiveUser,
  body: LiveCheckoutBody,
  appOrigin: string,
  deps: LiveDeps,
): Promise<LiveResult> {
  if (!TRUSTED_APP_ORIGINS.has(appOrigin)) return { status: 403, body: { error: "UNTRUSTED_ORIGIN" } };
  try {
    await assertLiveCheckoutAllowed(LIVE, deps);
  } catch {
    return { status: 503, body: { error: "STRIPE_LIVE_CHECKOUT_DISABLED" } };
  }
  try {
    return body.product === "core"
      ? await coreCheckout(user, body, appOrigin, deps)
      : await scopedCheckout(user, body, appOrigin, deps);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("stripe-live-checkout", message);
    if (["CHECKOUT_INTENT_SUPERSEDED", "CHECKOUT_IN_PROGRESS", "SUBSCRIPTION_ALREADY_MANAGED"].includes(message))
      return { status: 409, body: { error: message } };
    if (["LIVE_PRICE_NOT_REGISTERED", "LIVE_PRICE_MISMATCH", "LIVE_CUSTOMER_MISMATCH"].includes(message))
      return { status: 503, body: { error: message } };
    if (message === "PARENT_CONSENT_REQUIRED") return { status: 403, body: { error: message } };
    return { status: 503, body: { error: "LIVE_CHECKOUT_UNAVAILABLE" } };
  }
}

type CoreContext = {
  plan_version_id: string; market_price_id: string; plan_key: "pro" | "pro_plus"; plan_name: string;
  billing_interval: "month" | "year"; market_code: "EG" | "INTL"; currency_code: string; amount_minor: number;
  gateway_price_id: string | null; gateway_product_id: string | null; gateway_customer_id: string | null;
  access_state: string | null;
};

async function coreCheckout(
  user: LiveUser,
  body: Extract<LiveCheckoutBody, { product: "core" }>,
  appOrigin: string,
  deps: LiveDeps,
): Promise<LiveResult> {
  const stripe = liveStripe(deps);
  const offer = await reserveOffer(user, body, deps);
  const context = await deps.rpc<CoreContext>("get_stripe_checkout_context", {
    p_user_id: user.id, p_plan_key: body.planKey, p_billing_interval: body.billingInterval, p_market_code: body.marketCode,
  });
  if (["paid_active", "past_due", "canceled_at_period_end"].includes(context.access_state ?? ""))
    return { status: 409, body: { error: "SUBSCRIPTION_ALREADY_MANAGED" } };

  if (!context.gateway_price_id || !context.gateway_product_id) throw new Error("LIVE_PRICE_NOT_REGISTERED");
  if (offer && (offer.mapping.price_id !== context.gateway_price_id || offer.mapping.product_id !== context.gateway_product_id
    || Number(offer.original_minor) !== context.amount_minor)) throw new Error("LIVE_OFFER_PRICE_MISMATCH");
  const priceId = await verifyLivePrice(stripe, {
    priceId: context.gateway_price_id, productId: context.gateway_product_id, currency: context.currency_code,
    amountMinor: context.amount_minor, interval: context.billing_interval,
  });

  let customerId = context.gateway_customer_id;
  if (customerId) await verifyLiveCustomer(stripe, customerId, user.id);
  else {
    const params = new URLSearchParams({ email: user.email });
    params.set("metadata[user_id]", user.id);
    params.set("metadata[environment]", LIVE);
    customerId = (await stripe<{ id: string }>("/customers", {
      method: "POST", params, idempotencyKey: `customer-${user.id}-${LIVE_SUFFIX}`,
    })).id;
  }

  const existing = await stripe<{ data: any[]; has_more: boolean }>(
    `/subscriptions?${new URLSearchParams({ customer: customerId, status: "all", limit: "100" })}`,
  );
  if (existing.has_more) throw new Error("SUBSCRIPTION_LIST_INCOMPLETE");
  if (existing.data.some((s) => s.metadata?.environment === LIVE && s.metadata?.product_scope === undefined && MANAGED.includes(s.status)))
    return { status: 409, body: { error: "SUBSCRIPTION_ALREADY_MANAGED" } };

  const window = Math.floor(Date.now() / 300_000);
  const nonce = `${user.id}:${body.planKey}:${body.billingInterval}:${body.marketCode}:${offer?.id ?? window}`;
  const finalPrice = priceId;
  const finalCustomer = customerId;
  const session = await coordinateCheckout({
    prepare: () => deps.rpc<CheckoutIntent>("prepare_stripe_checkout", {
      p_user_id: user.id, p_plan_version_id: context.plan_version_id, p_market_price_id: context.market_price_id,
      p_market_code: context.market_code, p_currency_code: context.currency_code, p_billing_interval: context.billing_interval,
      p_gateway_customer_id: finalCustomer, p_idempotency_key: `stripe-live-checkout:${user.id}:${nonce}`,
    }),
    retrieve: (id) => stripe(`/checkout/sessions/${encodeURIComponent(id)}`),
    expire: (id) => stripe(`/checkout/sessions/${encodeURIComponent(id)}/expire`, {
      method: "POST", params: new URLSearchParams(), idempotencyKey: `expire-checkout-${id}`,
    }),
    attach: (intent, sessionId) => deps.rpc<boolean>("record_stripe_checkout_session", {
      p_user_id: user.id, p_checkout_generation: intent.checkout_generation, p_session_id: sessionId,
    }),
    close: (intent) => deps.rpc<boolean>("close_stripe_checkout_intent", {
      p_user_id: user.id, p_checkout_generation: intent.checkout_generation, p_session_id: intent.checkout_session_id,
    }),
    confirm: (intent) => deps.rpc<boolean>("confirm_stripe_checkout_generation", {
      p_user_id: user.id, p_checkout_generation: intent.checkout_generation,
    }),
    create: (prepared) => {
      const metadata: Record<string, string> = {
        user_id: user.id, internal_subscription_id: prepared.subscription_id,
        checkout_generation: prepared.checkout_generation, plan_version_id: context.plan_version_id,
        market_price_id: context.market_price_id, plan_key: context.plan_key, market_code: context.market_code,
        billing_interval: context.billing_interval, environment: LIVE, [APP_MARKER.key]: APP_MARKER.value,
      };
      const params = new URLSearchParams({
        mode: "subscription", customer: finalCustomer, client_reference_id: user.id, integration_identifier: "masaarat-live-v1",
        success_url: `${appOrigin}/account?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appOrigin}/pricing?payment=canceled`,
        allow_promotion_codes: "false", billing_address_collection: "auto", "automatic_tax[enabled]": "false",
      });
      params.set("line_items[0][price]", finalPrice);
      params.set("line_items[0][quantity]", "1");
      if (offer) offerSessionParameters(params, offer);
      for (const [key, value] of Object.entries(metadata)) {
        params.set(`metadata[${key}]`, value);
        params.set(`subscription_data[metadata][${key}]`, value);
      }
      return stripe("/checkout/sessions", {
        method: "POST", params, idempotencyKey: `checkout-session-${prepared.checkout_generation}-${LIVE_SUFFIX}`,
      });
    },
  });
  await bindOffer(offer, user, finalCustomer, session, deps);
  return { status: 200, body: { url: session.url, sessionId: session.id } };
}

type ScopedContext = {
  amount_minor: number; currency_code: "egp" | "usd"; market_code: "EG" | "INTL"; billing_interval: "month" | "year";
  discounted: boolean; gateway_customer_id: string | null; gateway_product_id: string | null;
  gateway_price_id: string | null; email: string; includes_assistant?: boolean;
};

async function scopedCheckout(
  user: LiveUser,
  body: Exclude<LiveCheckoutBody, { product: "core" }>,
  appOrigin: string,
  deps: LiveDeps,
): Promise<LiveResult> {
  const stripe = liveStripe(deps);
  const offer = await reserveOffer(user, body, deps);
  const scope = body.product;
  const assistant = scope === "academic" && body.academicAssistant === true;
  const contextRpc = scope === "kids" ? "get_kids_stripe_checkout_context"
    : scope === "technical" ? "get_technical_stripe_checkout_context"
      : assistant ? "get_academic_assistant_stripe_checkout_context" : "get_academic_stripe_checkout_context";
  const context = await deps.rpc<ScopedContext>(contextRpc, {
    p_user_id: user.id, p_market_code: body.marketCode, p_billing_interval: body.billingInterval,
  });
  if (context.email !== user.email) throw new Error("PARENT_EMAIL_MISMATCH");
  if (offer) {
    // Guardian/market checks above still run; replace family price with standard mapped base.
    context.gateway_price_id = offer.mapping.price_id;
    context.gateway_product_id = offer.mapping.product_id;
    context.amount_minor = Number(offer.original_minor);
    context.discounted = false;
  }

  if (!context.gateway_price_id || !context.gateway_product_id) throw new Error("LIVE_PRICE_NOT_REGISTERED");
  const priceId = await verifyLivePrice(stripe, {
    priceId: context.gateway_price_id, productId: context.gateway_product_id, currency: context.currency_code,
    amountMinor: context.amount_minor, interval: context.billing_interval,
  });

  let customerId = context.gateway_customer_id;
  if (customerId) await verifyLiveCustomer(stripe, customerId, user.id);
  else {
    const params = new URLSearchParams({ email: user.email });
    params.set("metadata[user_id]", user.id);
    params.set("metadata[environment]", LIVE);
    const created = await stripe<{ id: string }>("/customers", {
      method: "POST", params, idempotencyKey: `customer-${user.id}-${LIVE_SUFFIX}`,
    });
    customerId = await deps.rpc<string>("register_kids_stripe_customer", { p_user_id: user.id, p_customer_id: created.id });
  }

  const existing = await stripe<{ data: any[]; has_more: boolean }>(
    `/subscriptions?${new URLSearchParams({ customer: customerId, status: "all", limit: "100" })}`,
  );
  if (existing.has_more) throw new Error("SUBSCRIPTION_LIST_INCOMPLETE");
  if (existing.data.some((s) => s.metadata?.product_scope === scope && MANAGED.includes(s.status)))
    return { status: 409, body: { error: `${scope.toUpperCase()}_SUBSCRIPTION_ALREADY_MANAGED` } };

  const locale = "locale" in body && body.locale && LOCALES.includes(body.locale) ? body.locale : "ar-EG";
  const paths = {
    kids: { success: "/kids/family?payment=success", cancel: "/pricing?payment=canceled#kids" },
    technical: { success: `/technical/curriculum?payment=success&locale=${locale}`, cancel: "/technical/pricing?payment=canceled" },
    academic: { success: `/academic?payment=success&locale=${locale}`, cancel: "/academic/pricing?payment=canceled" },
  }[scope];
  const params = new URLSearchParams({
    mode: "subscription", customer: customerId, client_reference_id: user.id, allow_promotion_codes: "false", integration_identifier: "masaarat-live-v1",
    billing_address_collection: "auto", "automatic_tax[enabled]": "false", success_url: `${appOrigin}${paths.success}`, cancel_url: `${appOrigin}${paths.cancel}`,
  });
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  if (offer) offerSessionParameters(params, offer);
  const metadata: Record<string, string> = {
    product_scope: scope, user_id: user.id, market_code: context.market_code,
    billing_interval: context.billing_interval, environment: LIVE, [APP_MARKER.key]: APP_MARKER.value,
    ...(scope === "academic" ? { academic_assistant: context.includes_assistant ? "true" : "false", course_id: "AC-BUS" } : {}),
  };
  for (const [key, value] of Object.entries(metadata)) {
    params.set(`metadata[${key}]`, value);
    params.set(`subscription_data[metadata][${key}]`, value);
  }
  const window = Math.floor(Date.now() / 300_000);
  const variantKey = scope === "kids" ? String(context.discounted) : `${context.amount_minor}-${context.includes_assistant ? "assistant" : "standard"}`;
  const session = await coordinateKidsCheckout({
    begin: () => deps.rpc("lc09_begin_kids_checkout", {
      p_user_id: user.id,
      p_key: `${scope}-live-checkout-${user.id}-${context.market_code}-${context.billing_interval}-${variantKey}-${offer?.id ?? window}`,
      p_parameters: params.toString(),
    }),
    create: (key) => stripe("/checkout/sessions", { method: "POST", params, idempotencyKey: key }),
    record: (attempt, session, expired = false) => deps.rpc("lc09_record_kids_checkout", {
      p_user_id: user.id, p_attempt: attempt, p_session: session, p_expired: expired,
    }),
    expire: (session) => stripe(`/checkout/sessions/${encodeURIComponent(session)}/expire`, {
      method: "POST", params: new URLSearchParams(),
    }),
  });
  await bindOffer(offer, user, customerId, session, deps);
  return { status: 200, body: { url: session.url, sessionId: session.id } };
}

// ------------------------------------------------------------------ portal
export type PortalScope = "core" | "kids" | "academic" | "technical";

export async function createLivePortal(user: LiveUser, scope: PortalScope, appOrigin: string, deps: LiveDeps): Promise<LiveResult> {
  if (!TRUSTED_APP_ORIGINS.has(appOrigin)) return { status: 403, body: { error: "UNTRUSTED_ORIGIN" } };
  try {
    const stripe = liveStripe(deps);
    const rpcName = { core: "get_stripe_portal_context", kids: "get_kids_stripe_portal_context",
      academic: "get_academic_stripe_portal_context", technical: "get_technical_stripe_portal_context" }[scope];
    const context = await deps.rpc<{ gateway_customer_id?: string; gateway_subscription_id?: string }>(rpcName, { p_user_id: user.id });
    if (!context?.gateway_customer_id || !context.gateway_subscription_id) throw new Error("STRIPE_PORTAL_CONTEXT_INCOMPLETE");
    const configurationId = deps.getEnv("STRIPE_LIVE_PORTAL_CONFIGURATION_ID");
    if (!configurationId || !configurationId.startsWith("bpc_")) throw new Error("STRIPE_LIVE_PORTAL_CONFIGURATION_MISSING");
    const configuration = await stripe<any>(`/billing_portal/configurations/${encodeURIComponent(configurationId)}`);
    const cancel = configuration?.features?.subscription_cancel;
    if (configuration?.id !== configurationId || configuration.livemode !== true || configuration.active !== true
      || cancel?.enabled !== true || cancel.mode !== "at_period_end")
      throw new Error("STRIPE_LIVE_PORTAL_CONFIGURATION_INVALID");
    await verifyLiveCustomer(stripe, context.gateway_customer_id, user.id);
    const back = scope === "academic" ? "/academic/pricing" : scope === "technical" ? "/technical/pricing" : "/account";
    const session = await stripe<{ url?: string }>("/billing_portal/sessions", {
      method: "POST", params: new URLSearchParams({
        customer: context.gateway_customer_id, configuration: configurationId, return_url: `${appOrigin}${back}`,
      }),
    });
    if (!session.url) throw new Error("STRIPE_PORTAL_URL_MISSING");
    return { status: 200, body: { url: session.url } };
  } catch (error) {
    console.error("stripe-live-portal", error instanceof Error ? error.message : "UNKNOWN");
    return { status: 503, body: { error: "LIVE_PORTAL_UNAVAILABLE" } };
  }
}

// ----------------------------------------------------------------- webhook
type StripeEvent = { id: string; type: string; created: number; livemode: boolean; data: { object: Record<string, any> } };

function subscriptionIdFrom(object: Record<string, any>): string | null {
  return idOf(object.subscription) ?? idOf(object.parent?.subscription_details?.subscription)
    ?? idOf(object.lines?.data?.[0]?.parent?.subscription_item_details?.subscription)
    ?? (object.object === "subscription" ? idOf(object) : null);
}

function transitionFor(event: StripeEvent, subscription: Record<string, any>): string | null {
  if (event.type === "invoice.payment_failed") return ["past_due", "unpaid"].includes(subscription.status) ? "payment_failed" : null;
  if (event.type === "customer.subscription.deleted") return "canceled";
  if (event.type === "customer.subscription.updated") {
    if (subscription.cancel_at_period_end) return "cancel_at_period_end";
    if (["past_due", "unpaid"].includes(subscription.status)) return "payment_failed";
  }
  return null;
}

const CHECKOUT_EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"]);
const RISK_EVENTS = new Set(["charge.dispute.created", "charge.refunded", "radar.early_fraud_warning.created"]);
const SUPPORTED = new Set([...CHECKOUT_EVENTS, "invoice.paid", "invoice.payment_failed",
  "customer.subscription.updated", "customer.subscription.deleted"]);
const SCOPED = ["kids", "technical", "academic"];

export async function handleLiveWebhookEvent(rawBody: string, signature: string | null, deps: LiveDeps): Promise<LiveResult> {
  const secret = deps.getEnv(STRIPE_SECRET_NAMES.live.webhook);
  if (!secret) return { status: 503, body: { error: "STRIPE_LIVE_NOT_CONFIGURED" } };
  if (!signature || !(await verifyStripeSignature(rawBody, signature, secret)))
    return { status: 400, body: { error: "INVALID_SIGNATURE" } };
  let event: StripeEvent;
  try { event = JSON.parse(rawBody); } catch { return { status: 400, body: { error: "INVALID_PAYLOAD" } }; }
  if (event.livemode !== true) return { status: 400, body: { error: "TEST_EVENT_REJECTED" } };

  const stripe = liveStripe(deps);
  const get = (path: string, method: StripeMethod = "GET") => stripe<Record<string, any>>(path, { method });
  try {
    const occurredAt = new Date(event.created * 1000).toISOString();
    if (!event.id || !event.data?.object || !Number.isSafeInteger(event.created)) throw new Error("STRIPE_EVENT_INVALID");
    if (RISK_EVENTS.has(event.type)) {
      const object = event.data.object;
      const chargeId = validateSignedRiskObject(event.type, object);
      const resolved = await resolveLiveRiskPayment(chargeId, get);
      if (!resolved) return { status: 200, body: { received: true, ignored: true, unrelated: true } };
      validateSignedRiskRelationship(object, resolved.charge);
      if (event.type === "charge.refunded" && (!Number.isSafeInteger(resolved.charge.amount_refunded)
        || resolved.charge.amount_refunded <= 0 || resolved.charge.amount_refunded > resolved.charge.amount))
        throw new Error("RISK_REFUND_EVIDENCE_INVALID");
      // A durable, atomic hold is required: do not fake a refund or acknowledge
      // the event when persistence/revocation is not available.
      const result = await deps.rpc<{ processed: boolean; held: boolean }>("apply_stripe_live_risk_hold", {
        p_event_id: event.id, p_user_id: resolved.subscription.metadata.user_id,
        p_subscription_id: resolved.subscription.id, p_customer_id: idOf(resolved.subscription.customer),
        p_scope: resolved.subscription.metadata.product_scope ?? "core",
        p_price_id: idOf(resolved.subscription.items?.data?.[0]?.price),
        p_invoice_id: resolved.invoice.id, p_charge_id: resolved.charge.id,
        p_reason: event.type, p_occurred_at: occurredAt,
      });
      if (result?.processed !== true || result.held !== true) throw new Error("RISK_HOLD_NOT_CONFIRMED");
      return { status: 200, body: { received: true, held: true } };
    }
    if (["refund.created", "refund.updated", "refund.failed"].includes(event.type)) {
      const resolved = await resolveStripeRefund(String(event.data.object.id), (p) => get(p), LIVE);
      if (!resolved) return { status: 200, body: { received: true, ignored: true } };
      if (!isMasaaratSubscription(resolved.subscription?.metadata))
        return { status: 200, body: { received: true, ignored: true, unrelated: true } };
      if (await financialDeliveryExpired(resolved.subscription.metadata?.user_id, deps.rpc))
        return { status: 200, body: { received: true, ignored: true, financial_erased: true } };
      if (resolved.subscription.metadata?.environment !== LIVE) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
      if (resolved.refund.status === "succeeded") {
        const chargeId = idOf(resolved.refund.charge);
        if (!chargeId) throw new Error("RISK_REFUND_CHARGE_MISSING");
        const risk = await resolveLiveRiskPayment(chargeId, get);
        if (!risk || risk.subscription.id !== resolved.subscription.id || risk.invoice.id !== resolved.invoice.id)
          throw new Error("RISK_REFUND_RELATIONSHIP_MISMATCH");
        const hold = await deps.rpc<{ processed: boolean; held: boolean }>("apply_stripe_live_risk_hold", {
          // Separate ledger identity from the financial refund receipt: both
          // writes must remain independently idempotent across retry delivery.
          p_event_id: `${event.id}_risk`, p_user_id: risk.subscription.metadata.user_id,
          p_subscription_id: risk.subscription.id, p_customer_id: idOf(risk.subscription.customer),
          p_scope: risk.subscription.metadata.product_scope ?? "core", p_price_id: idOf(risk.subscription.items?.data?.[0]?.price),
          p_invoice_id: risk.invoice.id, p_charge_id: risk.charge.id, p_reason: "refund.succeeded", p_occurred_at: occurredAt,
        });
        if (hold?.processed !== true || hold.held !== true) throw new Error("RISK_HOLD_NOT_CONFIRMED");
      }
      const scope = resolved.subscription.metadata?.product_scope ?? "";
      if (SCOPED.includes(scope)) {
        const revoked = await deps.rpc<boolean>(`apply_${scope}_stripe_refund`, {
          p_event_id: event.id, p_parent_id: resolved.subscription.metadata.user_id,
          p_subscription_id: resolved.subscription.id, p_customer_id: idOf(resolved.subscription.customer),
          p_invoice_id: resolved.invoice.id, p_refund_id: resolved.refund.id, p_refund_amount: resolved.refund.amount,
          p_invoice_amount: resolved.invoice.amount_paid, p_refund_status: resolved.refund.status, p_occurred_at: occurredAt,
        });
        if (revoked && resolved.subscription.status !== "canceled")
          await get(`/subscriptions/${encodeURIComponent(resolved.subscription.id)}`, "DELETE");
        return { status: 200, body: { received: true, revoked } };
      }
      const result = await deps.rpc<{ cancel_subscription: boolean }>("apply_stripe_refund_event", {
        ...resolved.rpc, p_gateway_event_id: event.id, p_event_type: event.type, p_effective_at: occurredAt,
      });
      if (result?.cancel_subscription && resolved.subscription.status !== "canceled")
        await get(`/subscriptions/${encodeURIComponent(resolved.subscription.id)}?invoice_now=false&prorate=false`, "DELETE");
      return { status: 200, body: { received: true, result } };
    }

    if (!SUPPORTED.has(event.type)) return { status: 200, body: { received: true, ignored: true } };
    const object = event.data.object;
    const gatewaySubscriptionId = subscriptionIdFrom(object);
    if (!gatewaySubscriptionId) {
      if (isMasaaratSubscription(object.metadata)) throw new Error("STRIPE_SUBSCRIPTION_EVIDENCE_MISSING");
      return { status: 200, body: { received: true, ignored: true, unrelated: true } };
    }
    const subscription = event.type.startsWith("customer.subscription.")
      ? object : await get(`/subscriptions/${encodeURIComponent(gatewaySubscriptionId)}`);
    if (subscription.livemode !== true) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
    const metadata = subscription.metadata ?? {};
    // Another product on the same Stripe account: acknowledge, write nothing.
    if (!isMasaaratSubscription(metadata)) return { status: 200, body: { received: true, ignored: true, unrelated: true } };
    if (metadata.environment !== LIVE) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
    if (await financialDeliveryExpired(metadata.user_id, deps.rpc))
      return { status: 200, body: { received: true, ignored: true, financial_erased: true } };

    // Checkout is notification only. Fulfillment for initial and delayed
    // payments is exclusively the signed, validated invoice.paid lifecycle.
    const evidence = await paidEvidence(event, subscription, get, deps);
    if (event.type === "invoice.paid" && evidence.error) throw new Error(evidence.error);
    const held = await deps.rpc<boolean>("get_stripe_live_risk_hold", {
      p_subscription_id: gatewaySubscriptionId, p_user_id: metadata.user_id,
    });
    if (held !== false && held !== true) throw new Error("PAYMENT_RISK_HOLD_UNVERIFIED");
    if (held === true) {
      // Do not let subscription.updated overwrite a scoped hold either.
      throw new Error("PAYMENT_RISK_HOLD_OR_UNVERIFIED");
    }
    if (evidence.offer && await deps.rpc("consume_stripe_live_offer", {
      p_reservation_id: evidence.offer.id, p_user_id: metadata.user_id, p_subscription_id: gatewaySubscriptionId,
      p_invoice_id: object.id, p_customer_id: idOf(subscription.customer),
    }) !== true) throw new Error("LIVE_OFFER_CONSUMPTION_FAILED");
    if (SCOPED.includes(metadata.product_scope)) {
      if (!metadata.user_id || idOf(subscription.customer) === null || !Array.isArray(subscription.items?.data)
        || subscription.items.data.length !== 1) throw new Error("SCOPED_SUBSCRIPTION_EVIDENCE_MISSING");
      if (evidence.error && (event.type === "invoice.paid" || (event.type === "checkout.session.completed" && object.payment_status === "paid")))
        throw new Error(evidence.error);
      const priceId = idOf(subscription.items.data[0].price);
      if (!priceId || (evidence.transition && evidence.priceId !== priceId)) throw new Error("SCOPED_PRICE_MISMATCH");
      const start = subscription.items.data[0].current_period_start;
      const end = subscription.items.data[0].current_period_end;
      const paidInvoice = event.type === "invoice.paid" ? object.id : idOf(object.invoice);
      const result = await deps.rpc<boolean>(`apply_${metadata.product_scope}_stripe_event`, {
        p_event_id: event.id, p_parent_id: metadata.user_id, p_subscription_id: gatewaySubscriptionId,
        p_customer_id: idOf(subscription.customer), p_price_id: priceId, p_status: subscription.status, p_occurred_at: occurredAt,
        p_paid: evidence.transition === "payment_succeeded", p_paid_invoice_id: evidence.transition ? paidInvoice : null,
        p_period_start: evidence.transition && start ? new Date(start * 1000).toISOString() : null,
        p_period_end: evidence.transition && end ? new Date(end * 1000).toISOString() : null,
      });
      return { status: 200, body: { received: true, result } };
    }

    const authoritativePriceId = evidence.priceId ?? idOf(subscription.items?.data?.[0]?.price);
    const plan = authoritativePriceId
      ? await deps.rpc<{ plan_version_id: string; market_price_id: string; plan_key: string; market_code: string; billing_interval: string } | null>(
        "resolve_stripe_subscription_plan", { p_gateway_price_id: authoritativePriceId })
      : null;
    if (evidence.transition && !plan) throw new Error("PAID_PRICE_MAPPING_MISSING");
    const planVersionId = plan?.plan_version_id ?? metadata.plan_version_id;
    const marketPriceId = plan?.market_price_id ?? metadata.market_price_id;
    const customerId = idOf(subscription.customer);
    if (!metadata.internal_subscription_id || !metadata.user_id || !planVersionId || !marketPriceId || !customerId)
      throw new Error("STRIPE_METADATA_INCOMPLETE");
    const periodStart = subscription.current_period_start ?? subscription.items?.data?.[0]?.current_period_start ?? null;
    const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end ?? null;
    const transition = event.type === "invoice.paid" ? evidence.transition : transitionFor(event, subscription);
    const isPaidInvoice = event.type === "invoice.paid";
    const result = await deps.rpc("apply_stripe_webhook_event", {
      p_gateway_event_id: event.id, p_event_type: event.type, p_effective_at: occurredAt, p_transition: transition,
      p_subscription_id: metadata.internal_subscription_id, p_user_id: metadata.user_id, p_plan_version_id: planVersionId,
      p_market_price_id: marketPriceId, p_gateway_customer_id: customerId, p_gateway_subscription_id: gatewaySubscriptionId,
      p_gateway_status: subscription.status,
      p_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      p_gateway_transaction_id: isPaidInvoice ? object.id : null,
      p_amount_minor: isPaidInvoice ? evidence.amountPaid ?? Number(object.amount_paid ?? 0) : null,
      p_currency_code: isPaidInvoice ? evidence.currency ?? object.currency : null,
      p_payload_minimized: {
        stripe_event_type: event.type, stripe_status: subscription.status,
        checkout_generation: metadata.checkout_generation ?? null,
        plan_key: plan?.plan_key ?? metadata.plan_key, market_code: plan?.market_code ?? metadata.market_code,
        billing_interval: plan?.billing_interval ?? metadata.billing_interval,
        billing_reason: object.billing_reason ?? null, payment_evidence_error: evidence.error, livemode: true,
      },
    });
    return { status: 200, body: { received: true, result } };
  } catch (error) {
    // Non-2xx: Stripe retries; nothing is acknowledged before it is recorded.
    console.error("stripe-live-webhook", error instanceof Error ? error.message : "UNKNOWN");
    return { status: 500, body: { error: "WEBHOOK_PROCESSING_FAILED" } };
  }
}

async function paidEvidence(
  event: StripeEvent,
  subscription: Record<string, any>,
  get: (path: string) => Promise<Record<string, any>>,
  deps: LiveDeps,
): Promise<{ transition: "payment_succeeded" | null; priceId: string | null; error: string | null; offer?: OfferEvidence; amountPaid?: number; currency?: string }> {
  if (event.type !== "invoice.paid") return { transition: null, priceId: null, error: null };
  const object = event.data.object;
  // Read the invoice back; a signature authenticates delivery but does not
  // replace object relationship validation or current payment status.
  const reservation = subscription.metadata?.offer_reservation_id;
  const invoice = await get(`/invoices/${encodeURIComponent(String(object.id))}${reservation ? "?expand[]=discounts.source.coupon" : ""}`);
  if (invoice.id !== object.id || invoice.livemode !== true || idOf(invoice.customer) !== idOf(subscription.customer)
    || !Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid <= 0
    || invoice.currency !== subscription.items?.data?.[0]?.price?.currency)
    return { transition: null, priceId: null, error: "PAID_INVOICE_CUSTOMER_MISMATCH" };
  const decision = decidePaidPlanEvidence({ eventType: event.type, object: invoice, subscription });
  if (decision.error) return decision;
  if (!reservation) {
    if ((invoice.discounts?.length ?? 0) || (invoice.total_discount_amounts?.length ?? 0)) throw new Error("UNMAPPED_LIVE_DISCOUNT");
    return { ...decision, amountPaid: invoice.amount_paid, currency: invoice.currency };
  }
  const offer = await deps.rpc<OfferEvidence>("get_stripe_live_offer_evidence", { p_reservation_id: reservation, p_user_id: subscription.metadata.user_id });
  if (!offer?.session_id) throw new Error("LIVE_OFFER_EVIDENCE_MISSING");
  const session = await get(`/checkout/sessions/${encodeURIComponent(offer.session_id)}`);
  const amountPaid = verifyOfferInvoice(offer, invoice, subscription, session);
  return { ...decision, offer, amountPaid, currency: invoice.currency };
}
