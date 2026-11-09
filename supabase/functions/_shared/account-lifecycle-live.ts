/* eslint-disable @typescript-eslint/no-explicit-any */
// Live-only orchestration. No dependency on checkout creation switches or Test adapters.
import { verifyOfferSession } from "./stripe-offer-operations.ts";
type ObjectValue = Record<string, any>;
type Customer = { id: string; gateway: string; mode: string | null };
export type LiveClaim = {
  stage: string; user_id?: string; lease_token?: string; lease_until?: string; server_time?: string;
  customers?: Customer[]; storage_objects?: { bucket: string; name: string }[];
  checkout_attempts?: ObjectValue[]; core_checkouts?: ObjectValue[];
  commercial_checkouts?: ObjectValue[]; offer_reservations?: ObjectValue[];
  holds?: { reason: string; id: string }[];
};
export type LiveLifecycleDependencies = {
  rpc<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
  stripe(path: string, options?: { method?: "GET" | "POST" | "DELETE"; params?: URLSearchParams; idempotency?: string }): Promise<ObjectValue>;
  removeStorage(objects: { bucket: string; name: string }[], financial: boolean, beforeEach?: () => Promise<void>): Promise<void>;
  identityExists(user: string): Promise<boolean>;
  deleteIdentity(user: string): Promise<void>;
  now?: () => number;
};
function fail(code: string): never { throw new Error(code); }
const id = (value: any): string | null => typeof value === "string" ? value : typeof value?.id === "string" ? value.id : null;
const validId = (value: unknown, prefix: string): value is string => typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9_]+$`).test(value);
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const scopes = ["kids", "technical", "academic"];
function object(value: ObjectValue, kind: string, expected?: string) {
  if (!value || value.object !== kind || value.livemode !== true || !id(value) || (expected && value.id !== expected)) fail("LC09_LIVE_OBJECT_MISMATCH");
}
function owned(value: ObjectValue, kind: string, customer: string, user: string, metadata = false) {
  object(value, kind);
  if (id(value.customer) !== customer || (metadata && (value.metadata?.environment !== "live" || value.metadata?.user_id !== user))) fail("LC09_LIVE_OWNERSHIP_MISMATCH");
}
export function validateLiveClaim(claim: LiveClaim, user: string, phase: "deletion" | "financial") {
  const allowed = phase === "deletion" ? ["blocked", "provider_reconciled", "learner_erased"] : ["financial_due"];
  if (!claim || !allowed.includes(claim.stage) || claim.user_id !== user || !uuid(claim.lease_token)
    || !Number.isFinite(Date.parse(claim.lease_until ?? "")) || !Number.isFinite(Date.parse(claim.server_time ?? ""))
    || Date.parse(claim.lease_until!) <= Date.parse(claim.server_time!) || !Array.isArray(claim.customers)
    || !Array.isArray(claim.storage_objects) || !Array.isArray(claim.holds)) fail("LC09_LIVE_CLAIM_INVALID");
  if (claim.customers.some(c => !validId(c.id, "cus") || c.gateway !== "stripe_us_live" || c.mode !== "live")
    || new Set(claim.customers.map(c => c.id)).size !== claim.customers.length) fail("LC09_LIVE_MODE_REVIEW_REQUIRED");
  if (phase === "deletion" && [claim.checkout_attempts, claim.core_checkouts, claim.commercial_checkouts, claim.offer_reservations].some(x => !Array.isArray(x))) fail("LC09_LIVE_CLAIM_INVALID");
}

function context(user: string, claim: LiveClaim, phase: "deletion" | "financial", deps: LiveLifecycleDependencies) {
  const lease = claim.lease_token!;
  const renew = async (erasure = false) => {
    const r = await deps.rpc<LiveClaim & { phase: string }>("lc09_renew_live_lifecycle_lease", { p_user_id: user, p_lease_token: lease, p_phase: phase });
    if (!r || r.user_id !== user || r.lease_token !== lease || r.phase !== phase
      || !Number.isFinite(Date.parse(r.server_time ?? "")) || !Number.isFinite(Date.parse(r.lease_until ?? ""))
      || Date.parse(r.lease_until!) <= Date.parse(r.server_time!)) fail("LC09_LEASE_LOST");
    if (erasure && (!Array.isArray(r.holds) || r.holds.length)) fail("LC09_LIVE_HOLD");
  };
  const request = async (path: string, options?: Parameters<LiveLifecycleDependencies["stripe"]>[1]) => {
    const erasure = path.startsWith("/customers/") && options?.method === "DELETE";
    await renew(erasure);
    const result = await deps.stripe(path, options);
    await renew(erasure);
    return result;
  };
  const rpc = async <T = unknown>(name: string, args: Record<string, unknown>) => { await renew(); return deps.rpc<T>(name, args); };
  const list = async (path: string, query: Record<string, string>) => {
    const all: ObjectValue[] = []; let cursor: string | undefined;
    for (let page = 0; page < 100; page++) {
      const q = new URLSearchParams({ ...query, limit: "100", ...(cursor ? { starting_after: cursor } : {}) });
      const response = await request(`${path}?${q}`);
      if (response.object !== "list" || !Array.isArray(response.data) || typeof response.has_more !== "boolean") fail("LC09_LIVE_LIST_INVALID");
      for (const item of response.data) { if (!item || !id(item) || item.livemode !== true || all.some(v => v.id === item.id)) fail("LC09_LIVE_LIST_INVALID"); all.push(item); }
      if (!response.has_more) return all;
      const next = id(response.data.at(-1));
      if (!next || next === cursor) fail("LC09_LIVE_LIST_INVALID");
      cursor = next;
    }
    return fail("LC09_LIVE_LIST_INCOMPLETE");
  };
  return { renew, request, rpc, list, user, claim, phase, now: deps.now ?? Date.now };
}
type Context = ReturnType<typeof context>;
async function customer(c: Context, customerId: string) {
  const value = await c.request(`/customers/${encodeURIComponent(customerId)}`);
  object(value, "customer", customerId);
  if (value.deleted || value.metadata?.user_id !== c.user || value.metadata?.environment !== "live") fail("LC09_LIVE_CUSTOMER_MISMATCH");
  return value;
}
async function expire(c: Context, session: ObjectValue, customerId: string) {
  owned(session, "checkout.session", customerId, c.user, true);
  if (!validId(session.id, "cs") || session.client_reference_id !== c.user) fail("LC09_LIVE_SESSION_MISMATCH");
  if (session.status === "open") {
    const response = await c.request(`/checkout/sessions/${session.id}/expire`, { method: "POST", params: new URLSearchParams(), idempotency: `lc09-expire-${session.id}` });
    owned(response, "checkout.session", customerId, c.user, true);
    if (response.id !== session.id || response.status !== "expired") fail("LC09_LIVE_SESSION_UNRESOLVED");
    session = await c.request(`/checkout/sessions/${session.id}`);
    owned(session, "checkout.session", customerId, c.user, true);
    if (session.id !== response.id) fail("LC09_LIVE_SESSION_MISMATCH");
  }
  if (!["expired", "complete"].includes(session.status)) fail("LC09_LIVE_SESSION_UNRESOLVED");
  if (session.status === "expired" && (session.payment_status !== "unpaid" || session.subscription != null || session.payment_intent != null)) fail("LC09_LIVE_SESSION_UNRESOLVED");
  if (session.status === "complete" && session.payment_status !== "paid") fail("LC09_LIVE_PAYMENT_PENDING");
  return session;
}
async function terminalSubscription(c: Context, subscriptionId: string, customerId: string, generation?: string) {
  if (!validId(subscriptionId, "sub")) fail("LC09_LIVE_SUBSCRIPTION_MISMATCH");
  const sub = await c.request(`/subscriptions/${subscriptionId}`);
  owned(sub, "subscription", customerId, c.user, true);
  if (sub.id !== subscriptionId || (generation && sub.metadata?.checkout_generation !== generation)
    || !["canceled", "incomplete_expired"].includes(sub.status)) fail("LC09_LIVE_SUBSCRIPTION_PENDING");
  if (sub.latest_invoice) {
    const invoiceId = id(sub.latest_invoice);
    if (!validId(invoiceId, "in")) fail("LC09_LIVE_INVOICE_MISMATCH");
    const invoice = await c.request(`/invoices/${invoiceId}`);
    owned(invoice, "invoice", customerId, c.user);
    if (invoice.id !== invoiceId || (id(invoice.parent?.subscription_details?.subscription) ?? id(invoice.subscription)) !== subscriptionId
      || !["paid", "void"].includes(invoice.status)) fail("LC09_LIVE_INVOICE_PENDING");
  }
  return sub;
}

async function reconcileCustomer(c: Context, customerId: string) {
  await customer(c, customerId);
  const sessions = await c.list("/checkout/sessions", { customer: customerId });
  // Verify every selected object before mutating any object in that collection.
  sessions.forEach(s => owned(s, "checkout.session", customerId, c.user, true));
  const terminalSessions: ObjectValue[] = [];
  for (const session of sessions) terminalSessions.push(await expire(c, session, customerId));
  const schedules = await c.list("/subscription_schedules", { customer: customerId });
  schedules.forEach(s => owned(s, "subscription_schedule", customerId, c.user, true));
  for (let schedule of schedules) {
    if (["active", "not_started"].includes(schedule.status)) {
      const changed = await c.request(`/subscription_schedules/${encodeURIComponent(schedule.id)}/cancel`, { method: "POST", params: new URLSearchParams({ invoice_now: "false", prorate: "false" }), idempotency: `lc09-cancel-${schedule.id}` });
      owned(changed, "subscription_schedule", customerId, c.user, true);
      if (changed.id !== schedule.id || changed.status !== "canceled") fail("LC09_LIVE_SCHEDULE_PENDING");
      const checked = await c.request(`/subscription_schedules/${encodeURIComponent(schedule.id)}`);
      owned(checked, "subscription_schedule", customerId, c.user, true);
      if (checked.id !== schedule.id) fail("LC09_LIVE_OWNERSHIP_MISMATCH"); schedule = checked;
    }
    if (!["canceled", "completed", "released"].includes(schedule.status)) fail("LC09_LIVE_SCHEDULE_PENDING");
  }
  const subscriptions = await c.list("/subscriptions", { customer: customerId, status: "all" });
  subscriptions.forEach(s => owned(s, "subscription", customerId, c.user, true));
  for (const sub of subscriptions) {
    if (!["canceled", "incomplete_expired"].includes(sub.status)) {
      if (!["active", "trialing", "past_due", "unpaid", "paused", "incomplete"].includes(sub.status)) fail("LC09_LIVE_SUBSCRIPTION_PENDING");
      const changed = await c.request(`/subscriptions/${encodeURIComponent(sub.id)}`, { method: "DELETE", params: new URLSearchParams({ invoice_now: "false", prorate: "false" }) });
      owned(changed, "subscription", customerId, c.user, true);
      if (changed.id !== sub.id || changed.status !== "canceled") fail("LC09_LIVE_SUBSCRIPTION_PENDING");
    }
    await terminalSubscription(c, sub.id, customerId);
  }
  const terminalSubscriptions = await c.list("/subscriptions", { customer: customerId, status: "all" });
  for (const sub of terminalSubscriptions) {
    owned(sub, "subscription", customerId, c.user, true);
    if (!["canceled", "incomplete_expired"].includes(sub.status)) fail("LC09_LIVE_SUBSCRIPTION_PENDING");
  }
  const invoices = await c.list("/invoices", { customer: customerId });
  for (const invoice of invoices) {
    owned(invoice, "invoice", customerId, c.user);
    if (!["paid", "void"].includes(invoice.status)) fail("LC09_LIVE_INVOICE_PENDING");
  }
  const intents = await c.list("/payment_intents", { customer: customerId });
  for (const intent of intents) {
    owned(intent, "payment_intent", customerId, c.user);
    if (!["succeeded", "canceled"].includes(intent.status)) fail("LC09_LIVE_PAYMENT_PENDING");
  }
  for (const session of terminalSessions.filter(v => v.status === "complete")) {
    if (session.mode === "subscription") {
      if (!validId(id(session.subscription), "sub") || !terminalSubscriptions.some(s => s.id === id(session.subscription))) fail("LC09_LIVE_SUBSCRIPTION_PENDING");
    } else if (session.mode === "payment") {
      if (session.subscription != null || !validId(id(session.payment_intent), "pi")
        || !intents.some(p => p.id === id(session.payment_intent) && p.status === "succeeded")) fail("LC09_LIVE_PAYMENT_PENDING");
    } else fail("LC09_LIVE_SESSION_UNRESOLVED");
    if (session.payment_intent != null && !intents.some(p => p.id === id(session.payment_intent) && p.status === "succeeded")) fail("LC09_LIVE_PAYMENT_PENDING");
  }
  for (const charge of await c.list("/charges", { customer: customerId })) {
    owned(charge, "charge", customerId, c.user);
    if (charge.disputed !== false || !["succeeded", "failed"].includes(charge.status)) fail("LC09_LIVE_CHARGE_PENDING");
    if (charge.payment_intent != null && !intents.some(i => i.id === id(charge.payment_intent))) fail("LC09_LIVE_PAYMENT_MISMATCH");
    for (const refund of await c.list("/refunds", { charge: charge.id })) {
      object(refund, "refund");
      if (id(refund.charge) !== charge.id || !["succeeded", "failed", "canceled"].includes(refund.status)) fail("LC09_LIVE_REFUND_PENDING");
    }
  }
}

async function recoverAttempt(c: Context, attempt: ObjectValue, observeOnly = false) {
  if (!uuid(attempt.id) || typeof attempt.key !== "string" || typeof attempt.parameters !== "string" || !scopes.includes(attempt.scope)) fail("LC09_LIVE_ATTEMPT_UNKNOWN");
  const parameters = new URLSearchParams(attempt.parameters), customerId = parameters.get("customer");
  if (!customerId || !c.claim.customers!.some(v => v.id === customerId) || parameters.get("metadata[user_id]") !== c.user
    || parameters.get("metadata[environment]") !== "live" || parameters.get("metadata[product_scope]") !== attempt.scope
    || parameters.get("mode") !== "subscription" || parameters.get("client_reference_id") !== c.user) fail("LC09_LIVE_ATTEMPT_UNKNOWN");
  const legacy = attempt.environment !== "live";
  let session: ObjectValue;
  if (attempt.session_id) {
    if (!validId(attempt.session_id, "cs")) fail("LC09_LIVE_SESSION_MISMATCH");
    session = await c.request(`/checkout/sessions/${attempt.session_id}?expand[]=line_items.data.price`);
  } else {
    const created = Date.parse(attempt.create_started_at ?? ""), expiry = Date.parse(attempt.session_expires_at ?? "");
    if (legacy || attempt.resolved_at || !Number.isFinite(created) || !Number.isFinite(expiry)
      || c.now() < created || c.now() >= created + 23 * 3600000 || c.now() >= expiry
      || parameters.get("metadata[checkout_generation]") !== attempt.id
      || parameters.get("subscription_data[metadata][checkout_generation]") !== attempt.id
      || Number(parameters.get("expires_at")) !== Math.floor(expiry / 1000)) fail("LC09_LIVE_UNKNOWN_REPLAY_HELD");
    // Exact original request only, inside the sealed retention window. Never regenerate.
    session = await c.request("/checkout/sessions", { method: "POST", params: parameters, idempotency: attempt.key });
    if (!validId(session.id, "cs")) fail("LC09_LIVE_SESSION_MISMATCH");
    owned(session, "checkout.session", customerId, c.user, true);
    if (session.mode !== "subscription" || session.client_reference_id !== c.user
      || session.metadata?.checkout_generation !== attempt.id || session.metadata?.product_scope !== attempt.scope) fail("LC09_LIVE_SESSION_MISMATCH");
    await c.rpc("attach_scoped_checkout_intent", { p_user_id: c.user, p_scope: attempt.scope, p_generation: attempt.id, p_key: attempt.key, p_session: session.id });
    attempt.session_id = session.id;
    session = await c.request(`/checkout/sessions/${session.id}?expand[]=line_items.data.price`);
  }
  owned(session, "checkout.session", customerId, c.user, true);
  if ((attempt.session_id && session.id !== attempt.session_id) || session.mode !== "subscription"
    || session.metadata?.product_scope !== attempt.scope || (!legacy && session.metadata?.checkout_generation !== attempt.id)
    || session.line_items?.has_more !== false || session.line_items?.data?.length !== 1
    || id(session.line_items.data[0].price) !== parameters.get("line_items[0][price]")
    || session.line_items.data[0].quantity !== 1) fail("LC09_LIVE_SESSION_MISMATCH");
  if (observeOnly) return;
  session = await expire(c, session, customerId);
  let subscription: string | null = null;
  if (session.status === "complete") {
    subscription = id(session.subscription);
    if (!subscription) fail("LC09_LIVE_SUBSCRIPTION_PENDING");
    await terminalSubscription(c, subscription, customerId, legacy ? undefined : attempt.id);
  }
  const closed = await c.rpc("close_scoped_checkout_intent", { p_user_id: c.user, p_scope: attempt.scope,
    p_generation: attempt.id, p_key: attempt.key, p_session: session.id,
    p_disposition: session.status === "expired" ? "expired" : "completed_terminal", p_subscription: subscription });
  if (closed !== true) fail("LC09_LIVE_ATTEMPT_NOT_CLOSED");
}


async function recordProof(c: Context, kind: string, intent: string, session: ObjectValue, disposition: string, subscription: string | null = null, payment: string | null = null) {
  const accepted = await c.rpc("lc09_record_live_checkout_proof", { p_user_id: c.user, p_lease_token: c.claim.lease_token,
    p_kind: kind, p_intent_id: intent, p_session_id: session.id, p_customer_id: id(session.customer),
    p_disposition: disposition, p_subscription_id: subscription, p_payment_id: payment });
  if (accepted !== true) fail("LC09_LIVE_PROOF_NOT_ACCEPTED");
}
// No replay without immutable original parameters. Locate a lost response by its
// exact generation/purchase identity, fully paginate, reject ambiguous matches.
async function locateSession(c: Context, row: ObjectValue, kind: "core" | "commercial") {
  const match = (s: ObjectValue) => kind === "core"
    ? s.metadata?.checkout_generation === row.generation && s.metadata?.internal_subscription_id === row.id
    : s.metadata?.commercial_purchase_id === row.id;
  let session: ObjectValue;
  if (row.session_id) {
    if (!validId(row.session_id, "cs")) fail("LC09_LIVE_SESSION_MISMATCH");
    session = await c.request(`/checkout/sessions/${row.session_id}?expand[]=line_items.data.price.product&expand[]=discounts.promotion_code.promotion.coupon`);
    if (session.id !== row.session_id) fail("LC09_LIVE_SESSION_MISMATCH");
  } else {
    const found: ObjectValue[] = [];
    for (const owner of c.claim.customers!) {
      for (const candidate of await c.list("/checkout/sessions", { customer: owner.id })) {
        owned(candidate, "checkout.session", owner.id, c.user, true);
        if (match(candidate)) found.push(candidate);
      }
    }
    if (found.length !== 1 || !validId(found[0].id, "cs")) fail("LC09_LIVE_UNKNOWN_SESSION_HELD");
    session = await c.request(`/checkout/sessions/${found[0].id}?expand[]=line_items.data.price.product&expand[]=discounts.promotion_code.promotion.coupon`);
    if (session.id !== found[0].id) fail("LC09_LIVE_SESSION_MISMATCH");
  }
  const customerId = id(session.customer);
  if (!customerId || !c.claim.customers!.some(v => v.id === customerId) || !match(session)
    || session.client_reference_id !== c.user || session.metadata?.app !== "masaarat") fail("LC09_LIVE_SESSION_MISMATCH");
  owned(session, "checkout.session", customerId, c.user, true);
  if (kind === "core" && session.mode !== "subscription") fail("LC09_LIVE_SESSION_MISMATCH");
  return session;
}
function commercialSession(c: Context, row: ObjectValue, session: ObjectValue) {
  const price = session.line_items?.data?.[0]?.price;
  const scope = row.kind === "lifetime_course" ? "curriculum_lifetime" : "question_topup";
  if (!['lifetime_course','question_topup'].includes(row.kind) || row.user_id !== c.user
    || row.payment_rail !== "stripe" || (row.customer_id && row.customer_id !== id(session.customer))
    || session.mode !== "payment" || session.subscription != null || session.metadata?.product_scope !== scope
    || session.currency !== "egp" || row.currency !== "EGP" || !Number.isSafeInteger(row.amount_minor) || row.amount_minor <= 0
    || session.amount_total !== row.amount_minor || session.total_details?.amount_tax !== 0 || (session.total_details?.amount_shipping ?? 0) !== 0
    || session.line_items?.has_more !== false || session.line_items?.data?.length !== 1 || session.line_items.data[0].quantity !== 1
    || !validId(row.price_id, "price") || !validId(row.product_id, "prod") || price?.id !== row.price_id
    || price.object !== "price" || price.livemode !== true || price.type !== "one_time" || price.recurring != null
    || price.currency !== "egp" || price.tax_behavior !== "exclusive" || price.metadata?.environment !== "live"
    || id(price.product) !== row.product_id || price.product?.object !== "product" || price.product.livemode !== true
    || price.product.deleted || price.product.metadata?.environment !== "live"
    || !Number.isSafeInteger(price.unit_amount) || price.unit_amount < row.amount_minor || session.amount_subtotal !== price.unit_amount) fail("LC09_LIVE_COMMERCIAL_MISMATCH");
  if (row.parameters?.quote?.offer) verifyOfferSession(row.parameters.quote.offer, session, id(session.customer)!, "payment");
  else if (session.total_details?.amount_discount !== 0 || (session.discounts?.length ?? 0) !== 0 || session.amount_subtotal !== row.amount_minor) fail("LC09_LIVE_COMMERCIAL_MISMATCH");
}
async function recoverCore(c: Context, row: ObjectValue, observeOnly = false) {
  if (row.state !== "checkout_pending") return;
  if (!uuid(row.generation) || !uuid(row.id)) fail("LC09_LIVE_CORE_UNKNOWN");
  let session = await locateSession(c, row, "core");
  await recordProof(c, "core", row.generation, session, "observed"); row.session_id = session.id;
  if (observeOnly) return;
  session = await expire(c, session, id(session.customer)!);
  if (session.status === "expired") await recordProof(c, "core", row.generation, session, "expired");
  else {
    const sub = id(session.subscription);
    if (!sub) fail("LC09_LIVE_SUBSCRIPTION_PENDING");
    await terminalSubscription(c, sub, id(session.customer)!, row.generation);
    await recordProof(c, "core", row.generation, session, "completed_terminal", sub);
  }
}
async function recoverCommercial(c: Context, row: ObjectValue, observeOnly = false) {
  // Signed-settlement records already fulfilled/held by deletion are not replayed.
  if (row.state !== "pending") return;
  if (!uuid(row.id)) fail("LC09_LIVE_COMMERCIAL_MISMATCH");
  let session = await locateSession(c, row, "commercial");
  commercialSession(c, row, session);
  await recordProof(c, "commercial", row.id, session, "observed");
  row.session_id = session.id; row.customer_id = id(session.customer);
  if (observeOnly) return;
  session = await expire(c, session, row.customer_id);
  if (session.status === "expired") await recordProof(c, "commercial", row.id, session, "expired");
  else {
    const paymentId = id(session.payment_intent);
    if (!validId(paymentId, "pi") || (row.payment_id && row.payment_id !== paymentId)) fail("LC09_LIVE_PAYMENT_MISMATCH");
    const payment = await c.request(`/payment_intents/${paymentId}`);
    owned(payment, "payment_intent", row.customer_id, c.user, true);
    if (payment.id !== paymentId || payment.metadata?.commercial_purchase_id !== row.id || payment.metadata?.app !== "masaarat"
      || payment.metadata?.product_scope !== session.metadata.product_scope || payment.status !== "succeeded"
      || payment.amount !== row.amount_minor || payment.amount_received !== row.amount_minor || payment.currency !== "egp"
      || !validId(id(payment.latest_charge), "ch")) fail("LC09_LIVE_PAYMENT_PENDING");
    const charge = await c.request(`/charges/${id(payment.latest_charge)}`);
    owned(charge, "charge", row.customer_id, c.user);
    if (charge.id !== id(payment.latest_charge) || id(charge.payment_intent) !== paymentId || charge.status !== "succeeded"
      || charge.paid !== true || charge.disputed !== false || charge.amount !== row.amount_minor || charge.currency !== "egp") fail("LC09_LIVE_PAYMENT_PENDING");
    await recordProof(c, "commercial", row.id, session, "observed", null, paymentId);
    // Do not synthesize signed settlement or fulfillment. Fresh native holds
    // decide whether the authoritative webhook has subsequently settled this row.
  }
}

export async function finalizeLiveAccount(user: string, deps: LiveLifecycleDependencies) {
  if (!uuid(user)) fail("LC09_INVALID_USER");
  const claim = await deps.rpc<LiveClaim>("lc09_claim_live_deletion", { p_user_id: user });
  if (claim?.stage === "complete") return { stage: "complete" };
  const c = context(user, claim, "deletion", deps);
  try {
    validateLiveClaim(claim, user, "deletion");
    if (claim.holds!.some(h => h.reason === "customer_mode")) fail("LC09_LIVE_HOLD");
    for (const value of claim.customers!) await customer(c, value.id);
    // Capture lost-response identity before pending-money/risk checks can defer.
    for (const attempt of claim.checkout_attempts!) await recoverAttempt(c, attempt, true);
    for (const row of claim.core_checkouts!) await recoverCore(c, row, true);
    for (const row of claim.commercial_checkouts!) await recoverCommercial(c, row, true);
    if (claim.holds!.some(h => !["checkout_unresolved", "core_checkout_pending", "commercial_pending"].includes(h.reason))) fail("LC09_LIVE_HOLD");
    for (const value of claim.customers!) await reconcileCustomer(c, value.id);
    for (const attempt of claim.checkout_attempts!) await recoverAttempt(c, attempt);
    for (const row of claim.core_checkouts!) await recoverCore(c, row);
    for (const row of claim.commercial_checkouts!) await recoverCommercial(c, row);
    for (const offer of claim.offer_reservations!) {
      if (!validId(offer.session_id, "cs") || !claim.customers!.some(v => v.id === offer.customer_id)) fail("LC09_LIVE_OFFER_UNKNOWN");
      const s = await c.request(`/checkout/sessions/${offer.session_id}`);
      if (s.metadata?.offer_reservation_id !== offer.id) fail("LC09_LIVE_OFFER_UNKNOWN");
      await expire(c, s, offer.customer_id);
    }
    // Recheck all native financial holds at each authoritative checkpoint.
    if (claim.stage === "blocked") await c.rpc("lc09_advance_deletion", { p_user_id: user, p_lease_token: claim.lease_token, p_next_stage: "provider_reconciled" });
    await c.renew(true); await deps.removeStorage(claim.storage_objects!, false, () => c.renew(true));
    if (claim.stage !== "learner_erased") await c.rpc("lc09_advance_deletion", { p_user_id: user, p_lease_token: claim.lease_token, p_next_stage: "learner_erased" });
    await c.renew();
    if (await deps.identityExists(user)) { await c.renew(true); await deps.deleteIdentity(user); }
    await c.renew(); if (await deps.identityExists(user)) fail("LC09_AUTH_REMOVAL_UNVERIFIED");
    await c.rpc("lc09_advance_deletion", { p_user_id: user, p_lease_token: claim.lease_token, p_next_stage: "complete" });
    return { stage: "complete" };
  } finally {
    if (uuid(claim?.lease_token)) await deps.rpc("lc09_advance_deletion", { p_user_id: user, p_lease_token: claim.lease_token, p_next_stage: "release" }).catch(() => undefined);
  }
}

export async function purgeLiveFinancialAccount(user: string, deps: LiveLifecycleDependencies) {
  if (!uuid(user)) fail("LC09_INVALID_USER");
  const claim = await deps.rpc<LiveClaim>("lc09_claim_live_financial_purge", { p_user_id: user });
  if (claim?.stage === "financial_purged") return { stage: "financial_purged" };
  const c = context(user, claim, "financial", deps);
  try {
    validateLiveClaim(claim, user, "financial");
    if (claim.holds!.length) fail("LC09_LIVE_HOLD");
    for (const value of claim.customers!) {
      const first = await c.request(`/customers/${value.id}`);
      if (first?.id === value.id && first.deleted === true) continue;
      await reconcileCustomer(c, value.id);
      await customer(c, value.id);
      await c.renew(true);
      const removed = await c.request(`/customers/${value.id}`, { method: "DELETE" });
      if (removed?.id !== value.id || removed.deleted !== true) fail("LC09_CUSTOMER_REMOVAL_UNVERIFIED");
      const verified = await c.request(`/customers/${value.id}`);
      if (verified?.id !== value.id || verified.deleted !== true) fail("LC09_CUSTOMER_REMOVAL_UNVERIFIED");
    }
    await c.renew(true); await deps.removeStorage(claim.storage_objects!, true, () => c.renew(true));
    await c.rpc("lc09_complete_financial_purge", { p_user_id: user, p_lease_token: claim.lease_token, p_release: false });
    return { stage: "financial_purged" };
  } finally {
    if (uuid(claim?.lease_token)) await deps.rpc("lc09_complete_financial_purge", { p_user_id: user, p_lease_token: claim.lease_token, p_release: true }).catch(() => undefined);
  }
}
