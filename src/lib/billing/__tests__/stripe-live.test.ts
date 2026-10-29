/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  createLiveCheckout,
  createLivePortal,
  handleLiveWebhookEvent,
  type LiveDeps,
} from "@/lib/billing/live/stripe-live";

const SECRET = "whsec_live_fixture";
const USER = { id: "11111111-1111-4111-8111-111111111111", email: "parent@example.com" };
const NOW = Math.floor(Date.now() / 1000);

type Call = { name: string; body: any };
type StripeCall = { path: string; method: string; params?: URLSearchParams };

function harness(opts: {
  env?: Record<string, string>;
  db?: boolean;
  rpc?: Record<string, (body: any) => any>;
  stripe?: Record<string, any | ((call: StripeCall) => any)>;
}) {
  const rpcCalls: Call[] = [];
  const stripeCalls: StripeCall[] = [];
  let dbChecks = 0;
  const deps: LiveDeps = {
    getEnv: (n) => ({ STRIPE_LIVE_WEBHOOK_SECRET: SECRET, ...opts.env })[n],
    databaseLiveEnabled: async () => {
      dbChecks += 1;
      return opts.db ?? false;
    },
    rpc: async (name: string, body: any) => {
      rpcCalls.push({ name, body });
      if (name === "lc09_financial_expired") return false as any;
      const handler = opts.rpc?.[name];
      if (!handler) throw new Error(`UNEXPECTED_RPC_${name}`);
      return handler(body);
    },
    stripe: async (path: string, options: any = {}) => {
      const call = { path, method: options.method ?? "GET", params: options.params };
      stripeCalls.push(call);
      const key = Object.keys(opts.stripe ?? {}).find((k) => `${call.method} ${path}`.startsWith(k));
      if (!key) throw new Error(`UNEXPECTED_STRIPE_${call.method}_${path}`);
      const value = opts.stripe![key];
      return typeof value === "function" ? value(call) : value;
    },
  };
  return { deps, rpcCalls, stripeCalls, dbChecks: () => dbChecks };
}

function signedEvent(event: Record<string, unknown>, secret = SECRET) {
  const body = JSON.stringify(event);
  const sig = createHmac("sha256", secret).update(`${NOW}.${body}`).digest("hex");
  return { body, signature: `t=${NOW},v1=${sig}` };
}

const liveKidsSub = (overrides: Record<string, any> = {}) => ({
  id: "sub_live1",
  object: "subscription",
  livemode: true,
  status: "active",
  customer: "cus_live1",
  latest_invoice: "in_live2",
  metadata: { product_scope: "kids", user_id: USER.id, environment: "live" },
  items: { data: [{ price: { id: "price_kids_live" }, current_period_start: NOW, current_period_end: NOW + 2_592_000 }] },
  ...overrides,
});

const paidInvoice = (id: string) => ({
  id,
  object: "invoice",
  livemode: true,
  status: "paid",
  amount_remaining: 0,
  amount_paid: 19900,
  currency: "egp",
  subscription: "sub_live1",
  lines: { has_more: false, data: [{ amount: 19900, price: { id: "price_kids_live" }, subscription: "sub_live1" }] },
});

describe("Live checkout gate (default OFF)", () => {
  it("refuses every product with 503 and touches neither the database nor Stripe", async () => {
    for (const body of [
      { product: "core", planKey: "pro", billingInterval: "month", marketCode: "EG" },
      { product: "kids", billingInterval: "year", marketCode: "INTL" },
      { product: "academic", academicAssistant: true, billingInterval: "month", marketCode: "EG" },
      { product: "technical", billingInterval: "month", marketCode: "EG" },
    ] as const) {
      const h = harness({ env: {}, db: true });
      const res = await createLiveCheckout(USER, body, "https://masaarat.ai", h.deps);
      expect(res).toEqual({ status: 503, body: { error: "STRIPE_LIVE_CHECKOUT_DISABLED" } });
      expect(h.rpcCalls).toHaveLength(0);
      expect(h.stripeCalls).toHaveLength(0);
      expect(h.dbChecks()).toBe(0);
    }
  });

  it("stays closed when only the env flag is on", async () => {
    const h = harness({ env: { STRIPE_LIVE_ENABLED: "true" }, db: false });
    const res = await createLiveCheckout(USER, { product: "kids", billingInterval: "month", marketCode: "EG" }, "https://masaarat.ai", h.deps);
    expect(res.status).toBe(503);
    expect(h.stripeCalls).toHaveLength(0);
  });
});

describe("Live checkout when both switches are ON", () => {
  it("creates a separate live price with live metadata and lookup key for Kids", async () => {
    const h = harness({
      env: { STRIPE_LIVE_ENABLED: "true" },
      db: true,
      rpc: {
        get_kids_stripe_checkout_context: () => ({
          amount_minor: 17910, currency_code: "egp", market_code: "EG", billing_interval: "month", discounted: true,
          gateway_customer_id: "cus_live1", gateway_product_id: null, gateway_price_id: null, email: USER.email,
        }),
        register_kids_stripe_price: (b) => b.p_price_id,
        lc09_begin_kids_checkout: () => ({ attempt_id: "a1", idempotency_key: "k1" }),
        lc09_record_kids_checkout: () => true,
      },
      stripe: {
        "GET /subscriptions": { object: "list", data: [], has_more: false },
        "POST /products": { id: "prod_live", object: "product", livemode: true },
        "POST /prices": { id: "price_live_bundle", object: "price", livemode: true },
        "POST /checkout/sessions": { id: "cs_live", object: "checkout.session", livemode: true, status: "open", url: "https://checkout.stripe.com/c/x" },
      },
    });
    const res = await createLiveCheckout(USER, { product: "kids", billingInterval: "month", marketCode: "EG" }, "https://masaarat.ai", h.deps);
    expect(res.status).toBe(200);
    const price = h.stripeCalls.find((c) => c.path === "/prices")!;
    expect(price.params!.get("lookup_key")).toBe("masaarat_kids_eg_month_bundle_live_v1");
    expect(price.params!.get("unit_amount")).toBe("17910");
    expect(price.params!.get("metadata[environment]")).toBe("live");
    const session = h.stripeCalls.find((c) => c.path === "/checkout/sessions")!;
    expect(session.params!.get("subscription_data[metadata][environment]")).toBe("live");
    expect(session.params!.get("line_items[0][price]")).toBe("price_live_bundle");
    expect(h.rpcCalls.find((c) => c.name === "lc09_begin_kids_checkout")!.body.p_key).toContain("kids-live-checkout-");
  });

  it("rejects a Test object returned during a Live checkout", async () => {
    const h = harness({
      env: { STRIPE_LIVE_ENABLED: "true" },
      db: true,
      rpc: {
        get_stripe_checkout_context: () => ({
          plan_version_id: "pv", market_price_id: "mp", plan_key: "pro", plan_name: "Pro", billing_interval: "month",
          market_code: "EG", currency_code: "egp", amount_minor: 16900, gateway_price_id: "price_live_pro",
          gateway_product_id: "prod_live_pro", gateway_customer_id: null, access_state: null,
        }),
      },
      stripe: { "POST /customers": { id: "cus_test", object: "customer", livemode: false } },
    });
    const res = await createLiveCheckout(USER, { product: "core", planKey: "pro", billingInterval: "month", marketCode: "EG" }, "https://masaarat.ai", h.deps);
    expect(res.status).toBe(503);
    expect(h.stripeCalls.some((c) => c.path === "/checkout/sessions")).toBe(false);
  });
});

describe("Live webhook", () => {
  it("rejects bad signatures, test-secret signatures and test-mode events", async () => {
    const h = harness({});
    const live = signedEvent({ id: "evt_1", type: "invoice.paid", created: NOW, livemode: true, data: { object: {} } });
    expect((await handleLiveWebhookEvent(live.body, "t=1,v1=bad", h.deps)).status).toBe(400);
    const wrong = signedEvent({ id: "evt_1", type: "invoice.paid", created: NOW, livemode: true, data: { object: {} } }, "whsec_test_fixture");
    expect((await handleLiveWebhookEvent(wrong.body, wrong.signature, h.deps)).status).toBe(400);
    const testMode = signedEvent({ id: "evt_2", type: "invoice.paid", created: NOW, livemode: false, data: { object: {} } });
    const res = await handleLiveWebhookEvent(testMode.body, testMode.signature, h.deps);
    expect(res).toEqual({ status: 400, body: { error: "TEST_EVENT_REJECTED" } });
    expect(h.rpcCalls).toHaveLength(0);
  });

  it("returns 503 when the live webhook secret is not configured", async () => {
    const h = harness({ env: { STRIPE_LIVE_WEBHOOK_SECRET: "" } });
    const e = signedEvent({ id: "evt_1", type: "invoice.paid", created: NOW, livemode: true, data: { object: {} } });
    expect((await handleLiveWebhookEvent(e.body, e.signature, h.deps)).status).toBe(503);
  });

  it("processes a renewal while new checkout is OFF and is idempotent on redelivery", async () => {
    const applied = new Set<string>();
    const h = harness({
      env: {},
      db: false,
      rpc: {
        apply_kids_stripe_event: (b) => {
          if (applied.has(b.p_event_id)) return false;
          applied.add(b.p_event_id);
          return true;
        },
      },
      stripe: { "GET /subscriptions/sub_live1": liveKidsSub() },
    });
    const e = signedEvent({ id: "evt_renew", type: "invoice.paid", created: NOW, livemode: true, data: { object: paidInvoice("in_live2") } });
    const first = await handleLiveWebhookEvent(e.body, e.signature, h.deps);
    const second = await handleLiveWebhookEvent(e.body, e.signature, h.deps);
    expect(first).toEqual({ status: 200, body: { received: true, result: true } });
    expect(second).toEqual({ status: 200, body: { received: true, result: false } });
    expect(applied.size).toBe(1);
    const call = h.rpcCalls.find((c) => c.name === "apply_kids_stripe_event")!;
    expect(call.body).toMatchObject({ p_paid: true, p_paid_invoice_id: "in_live2", p_price_id: "price_kids_live" });
    expect(h.dbChecks()).toBe(0);
  });

  it("records a failed payment for a core plan", async () => {
    const h = harness({
      rpc: {
        resolve_stripe_subscription_plan: () => ({ plan_version_id: "pv", market_price_id: "mp", plan_key: "pro", market_code: "EG", billing_interval: "month" }),
        apply_stripe_webhook_event: () => ({ applied: true }),
      },
      stripe: {
        "GET /subscriptions/sub_core": {
          id: "sub_core", object: "subscription", livemode: true, status: "past_due", customer: "cus_core",
          metadata: { environment: "live", user_id: USER.id, internal_subscription_id: "isub" },
          items: { data: [{ price: { id: "price_live_pro" } }] },
        },
      },
    });
    const e = signedEvent({ id: "evt_fail", type: "invoice.payment_failed", created: NOW, livemode: true,
      data: { object: { id: "in_fail", object: "invoice", subscription: "sub_core" } } });
    const res = await handleLiveWebhookEvent(e.body, e.signature, h.deps);
    expect(res.status).toBe(200);
    expect(h.rpcCalls.find((c) => c.name === "apply_stripe_webhook_event")!.body).toMatchObject({
      p_transition: "payment_failed", p_gateway_status: "past_due", p_payload_minimized: { livemode: true },
    });
  });

  it("processes a cancellation of an existing subscription while checkout is OFF", async () => {
    const h = harness({ rpc: { apply_kids_stripe_event: () => true } });
    const e = signedEvent({ id: "evt_cancel", type: "customer.subscription.deleted", created: NOW, livemode: true,
      data: { object: liveKidsSub({ status: "canceled" }) } });
    const res = await handleLiveWebhookEvent(e.body, e.signature, h.deps);
    expect(res.status).toBe(200);
    expect(h.rpcCalls.find((c) => c.name === "apply_kids_stripe_event")!.body).toMatchObject({ p_status: "canceled", p_paid: false });
  });

  it("processes a full refund while checkout is OFF and cancels the subscription", async () => {
    const h = harness({
      rpc: { apply_kids_stripe_refund: () => true },
      stripe: {
        "GET /refunds/re_live": { id: "re_live", object: "refund", status: "succeeded", amount: 19900, currency: "egp", payment_intent: "pi_live" },
        "GET /invoice_payments": { object: "list", has_more: false, data: [{ livemode: true, status: "paid", currency: "egp", amount_paid: 19900, invoice: "in_live2", payment: { type: "payment_intent", payment_intent: "pi_live" } }] },
        "GET /invoices/in_live2": { ...paidInvoice("in_live2"), customer: "cus_live1" },
        "GET /subscriptions/sub_live1": liveKidsSub(),
        "GET /payment_intents/pi_live": { id: "pi_live", object: "payment_intent", livemode: true, status: "succeeded", customer: "cus_live1", currency: "egp", amount_received: 19900 },
        "DELETE /subscriptions/sub_live1": { id: "sub_live1", object: "subscription", livemode: true, status: "canceled" },
      },
    });
    const e = signedEvent({ id: "evt_refund", type: "refund.created", created: NOW, livemode: true, data: { object: { id: "re_live" } } });
    const res = await handleLiveWebhookEvent(e.body, e.signature, h.deps);
    expect(res).toEqual({ status: 200, body: { received: true, revoked: true } });
    expect(h.stripeCalls.some((c) => c.method === "DELETE" && c.path === "/subscriptions/sub_live1")).toBe(true);
  });

  it("rejects a Test refund object arriving on the Live endpoint", async () => {
    const h = harness({ stripe: { "GET /refunds/re_x": { id: "re_x", object: "refund", livemode: false, status: "succeeded", amount: 1 } } });
    const e = signedEvent({ id: "evt_r2", type: "refund.created", created: NOW, livemode: true, data: { object: { id: "re_x" } } });
    expect((await handleLiveWebhookEvent(e.body, e.signature, h.deps)).status).toBe(500);
  });

  it("rejects a live event whose subscription metadata says test", async () => {
    const h = harness({});
    const e = signedEvent({ id: "evt_mix", type: "customer.subscription.updated", created: NOW, livemode: true,
      data: { object: liveKidsSub({ metadata: { product_scope: "kids", user_id: USER.id, environment: "test" } }) } });
    const res = await handleLiveWebhookEvent(e.body, e.signature, h.deps);
    expect(res.status).toBe(500);
    expect(h.rpcCalls.some((c) => c.name.startsWith("apply_"))).toBe(false);
  });

  it("never answers 2xx when recording the event fails", async () => {
    const h = harness({ rpc: { apply_kids_stripe_event: () => { throw new Error("db down"); } } });
    const e = signedEvent({ id: "evt_db", type: "customer.subscription.updated", created: NOW, livemode: true, data: { object: liveKidsSub() } });
    expect((await handleLiveWebhookEvent(e.body, e.signature, h.deps)).status).toBe(500);
  });
});

describe("Live portal", () => {
  it("opens for an existing subscription while checkout is OFF", async () => {
    const h = harness({
      rpc: { get_academic_stripe_portal_context: () => ({ gateway_customer_id: "cus_live1", gateway_subscription_id: "sub_a" }) },
      stripe: { "POST /billing_portal/sessions": { object: "billing_portal.session", livemode: true, url: "https://billing.stripe.com/p/x" } },
    });
    const res = await createLivePortal(USER, "academic", "https://masaarat.ai", h.deps);
    expect(res).toEqual({ status: 200, body: { url: "https://billing.stripe.com/p/x" } });
    expect(h.stripeCalls[0].params!.get("return_url")).toBe("https://masaarat.ai/academic/pricing");
  });

  it("refuses a test-mode portal session", async () => {
    const h = harness({
      rpc: { get_stripe_portal_context: () => ({ gateway_customer_id: "cus_x", gateway_subscription_id: "sub_x" }) },
      stripe: { "POST /billing_portal/sessions": { object: "billing_portal.session", livemode: false, url: "https://billing.stripe.com/p/t" } },
    });
    expect((await createLivePortal(USER, "core", "https://masaarat.ai", h.deps)).status).toBe(503);
  });
});
