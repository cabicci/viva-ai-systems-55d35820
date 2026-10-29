import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { handleLiveWebhookEvent, type LiveDeps } from "../live/stripe-live";
import { resolveLiveRiskPayment } from "../live/payment-risk";

const now = Math.floor(Date.now() / 1000);
const secret = "whsec_synthetic_webhook_signing_fixture";
const user = "11111111-1111-4111-8111-111111111111";
const customer = { id: "cus_m", livemode: true, metadata: { environment: "live", user_id: user } };
const subscription = { id: "sub_m", object: "subscription", livemode: true, customer: "cus_m", status: "active", latest_invoice: "in_m",
  metadata: { app: "masaarat", environment: "live", product_scope: "kids", user_id: user },
  items: { data: [{ price: { id: "price_m", currency: "egp" }, current_period_start: now, current_period_end: now + 2592000 }] } };
const invoice = { id: "in_m", object: "invoice", livemode: true, customer: "cus_m", subscription: "sub_m", status: "paid",
  amount_paid: 100, amount_remaining: 0, currency: "egp", lines: { data: [{ price: { id: "price_m" }, subscription: "sub_m", amount: 100 }] } };
const charge = { id: "ch_m", livemode: true, paid: true, status: "succeeded", payment_intent: "pi_m", customer: "cus_m", amount: 100, currency: "egp", amount_refunded: 10 };
const intent = { id: "pi_m", livemode: true, status: "succeeded", latest_charge: "ch_m", customer: "cus_m", amount_received: 100, currency: "egp" };

function setup(unrelated = false) {
  const objects: Record<string, unknown> = {
    "/charges/ch_m": charge, "/payment_intents/pi_m": intent,
    "/customers/cus_m": unrelated ? { ...customer, metadata: {} } : customer,
    "/invoices/in_m": invoice, "/subscriptions/sub_m": subscription,
    "/disputes/dp_m": { id: "dp_m", livemode: true, charge: "ch_m" },
    "/radar/early_fraud_warnings/dp_m": { id: "dp_m", livemode: true, charge: "ch_m" },
  };
  let applied = false;
  const rpc = vi.fn(async (name: string) => {
    if (name === "lc09_financial_expired") return false;
    if (name === "get_stripe_live_risk_hold") return applied;
    if (name === "apply_stripe_live_risk_hold") { applied = true; return { processed: true, held: true }; }
    if (name === "apply_kids_stripe_event") return true;
    throw new Error("unexpected RPC");
  });
  const stripe = vi.fn(async (path: string) => {
    if (path.startsWith("/invoice_payments?")) return { object: "list", has_more: false, data: unrelated ? [] : [
      { livemode: true, status: "paid", invoice: "in_m", currency: "egp", amount_paid: 100, payment: { type: "payment_intent", payment_intent: "pi_m" } },
    ] };
    if (!(path in objects)) throw new Error("unexpected Stripe read");
    return objects[path];
  });
  const deps = { getEnv: () => secret, databaseLiveEnabled: async () => false, rpc, stripe } as unknown as LiveDeps;
  const send = (type: string, object: unknown = { id: "dp_m", charge: "ch_m" }, signatureValid = true) => {
    const body = JSON.stringify({ id: "evt_m", type, created: now, livemode: true, data: { object } });
    const digest = createHmac("sha256", secret).update(`${now}.${body}`).digest("hex");
    return handleLiveWebhookEvent(body, `t=${now},v1=${signatureValid ? digest : "invalid"}`, deps);
  };
  return { objects, deps, rpc, stripe, send, held: () => applied };
}

describe("Live payment risk evidence and acknowledgement", () => {
  for (const type of ["charge.dispute.created", "charge.refunded", "radar.early_fraud_warning.created"]) {
    it(`${type}: ignores unrelated Render one-time payments without writes`, async () => {
      const h = setup(true);
      expect(await h.send(type, type === "charge.refunded" ? { id: "ch_m" } : { id: "dp_m", charge: "ch_m" })).toEqual({ status: 200, body: { received: true, ignored: true, unrelated: true } });
      expect(h.rpc).not.toHaveBeenCalled();
    });
    it(`${type}: requires confirmed persistent access hold`, async () => {
      const h = setup();
      expect((await h.send(type, type === "charge.refunded" ? { id: "ch_m" } : { id: "dp_m", charge: "ch_m" })).status).toBe(200);
      expect(h.held()).toBe(true);
      expect(h.rpc).toHaveBeenCalledWith("apply_stripe_live_risk_hold", expect.objectContaining({ p_reason: type, p_subscription_id: "sub_m", p_invoice_id: "in_m", p_charge_id: "ch_m" }));
    });
  }
  it("checks signature before any provider or database operation", async () => {
    const h = setup();
    expect((await h.send("charge.dispute.created", { charge: "ch_m" }, false)).status).toBe(400);
    expect(h.stripe).not.toHaveBeenCalled(); expect(h.rpc).not.toHaveBeenCalled();
  });
  it("fails non-2xx if the required durable-hold RPC is absent", async () => {
    const h = setup(); h.rpc.mockRejectedValue(new Error("RPC not installed"));
    expect((await h.send("charge.dispute.created")).status).toBe(500);
  });
  it("fails non-2xx if persistence does not confirm a hold", async () => {
    const h = setup(); h.rpc.mockResolvedValue({ processed: false, held: false } as never);
    expect((await h.send("charge.dispute.created")).status).toBe(500);
  });
  for (const [label, path, replacement] of [
    ["wrong environment", "/subscriptions/sub_m", { ...subscription, metadata: { ...subscription.metadata, environment: "test" } }],
    ["missing environment", "/subscriptions/sub_m", { ...subscription, metadata: { app: "masaarat", user_id: user } }],
    ["wrong customer", "/invoices/in_m", { ...invoice, customer: "cus_other" }],
    ["wrong payment amount", "/payment_intents/pi_m", { ...intent, amount_received: 90 }],
    ["wrong charge relationship", "/payment_intents/pi_m", { ...intent, latest_charge: "ch_other" }],
    ["Test charge", "/charges/ch_m", { ...charge, livemode: false }],
    ["another user", "/customers/cus_m", { ...customer, metadata: { environment: "live", user_id: "other" } }],
  ] as const) {
    it(`rejects ${label} without access changes`, async () => {
      const h = setup(); h.objects[path] = replacement;
      expect((await h.send("charge.dispute.created")).status).toBe(500);
      expect(h.rpc).not.toHaveBeenCalled();
    });
  }
  it("rejects missing invoice evidence for a Masaarat payment", async () => {
    const h = setup(true); h.objects["/customers/cus_m"] = customer;
    await expect(resolveLiveRiskPayment("ch_m", h.deps.stripe)).rejects.toThrow("RISK_MASAARAT_INVOICE_MISSING");
  });
  it("rejects a dispute readback pointing to another charge", async () => {
    const h = setup(); h.objects["/disputes/dp_m"] = { id: "dp_m", livemode: true, charge: "ch_other" };
    expect((await h.send("charge.dispute.created")).status).toBe(500); expect(h.rpc).not.toHaveBeenCalled();
  });
  for (const scope of ["core", "kids", "academic", "technical"]) {
    it(`records ${scope} risk identity and safely redelivers the event`, async () => {
      const h = setup(); h.objects["/subscriptions/sub_m"] = { ...subscription, metadata: { ...subscription.metadata, product_scope: scope } };
      expect((await h.send("charge.dispute.created")).status).toBe(200);
      expect((await h.send("charge.dispute.created")).status).toBe(200);
      expect(h.rpc).toHaveBeenCalledWith("apply_stripe_live_risk_hold", expect.objectContaining({ p_scope: scope, p_event_id: "evt_m" }));
    });
  }
});

describe("Signed fulfillment is invoice-owned", () => {
  for (const type of ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"]) {
    it(`${type} never grants access even with a paid Checkout session`, async () => {
      const h = setup();
      expect((await h.send(type, { id: "cs_m", subscription: "sub_m", payment_status: "paid" })).status).toBe(200);
      expect(h.rpc).toHaveBeenCalledWith("apply_kids_stripe_event", expect.objectContaining({ p_paid: false }));
    });
  }
  it("invoice.paid grants only against a matching paid invoice read back from Stripe", async () => {
    const h = setup(); expect((await h.send("invoice.paid", invoice)).status).toBe(200);
    expect(h.rpc).toHaveBeenCalledWith("apply_kids_stripe_event", expect.objectContaining({ p_paid: true, p_paid_invoice_id: "in_m" }));
  });
  it("invoice.paid rejects a mismatching invoice customer", async () => {
    const h = setup(); h.objects["/invoices/in_m"] = { ...invoice, customer: "cus_other" };
    expect((await h.send("invoice.paid", invoice)).status).toBe(500);
    expect(h.rpc.mock.calls.some(([name]) => name.startsWith("apply_"))).toBe(false);
  });
  it("a later renewal cannot restore a held subscription", async () => {
    const h = setup(); expect((await h.send("charge.dispute.created")).status).toBe(200);
    h.rpc.mockClear();
    expect((await h.send("invoice.paid", invoice)).status).toBe(500);
    expect(h.rpc.mock.calls.some(([name]) => name.startsWith("apply_"))).toBe(false);
  });
});