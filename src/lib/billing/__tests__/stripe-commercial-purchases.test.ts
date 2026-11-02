/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHmac } from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { createLiveCheckout, handleLiveWebhookEvent, type LiveDeps } from "../live/stripe-live";
import { COMMERCIAL_LIVE_CATALOGUE, type CommercialPurchase } from "../live/commercial-purchases";
import { liveCheckoutSchema } from "../live/schemas";

const uid = "11111111-1111-4111-8111-111111111111";
const rid = "22222222-2222-4222-8222-222222222222";
const secret = "whsec_fixture_only";
function harness(kind: keyof typeof COMMERCIAL_LIVE_CATALOGUE = "lifetime_course") {
  const catalogue = COMMERCIAL_LIVE_CATALOGUE[kind];
  const purchase: CommercialPurchase = {
    id: rid,
    user_id: uid,
    kind,
    amount_minor: catalogue.amount,
    currency: "EGP",
    price_id: catalogue.price,
    product_id: catalogue.product,
    customer_id: "cus_fixture",
    session_id: "cs_fixture",
    payment_id: null,
    created_at: new Date().toISOString(),
    state: "pending",
    parameters: {},
  };
  const metadata = {
    app: "masaarat",
    environment: "live",
    user_id: uid,
    commercial_purchase_id: rid,
    product_scope: kind === "lifetime_course" ? "curriculum_lifetime" : kind,
  };
  const price = {
    id: catalogue.price,
    object: "price",
    active: true,
    livemode: true,
    type: "one_time",
    recurring: null,
    unit_amount: catalogue.amount,
    currency: "egp",
    tax_behavior: "exclusive",
    metadata: { environment: "live" },
    product: {
      id: catalogue.product,
      object: "product",
      active: true,
      livemode: true,
      metadata: { environment: "live" },
    },
  };
  const session: any = {
    id: "cs_fixture",
    object: "checkout.session",
    livemode: true,
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    client_reference_id: uid,
    metadata,
    customer: "cus_fixture",
    subscription: null,
    payment_intent: "pi_fixture",
    currency: "egp",
    line_items: { has_more: false, data: [{ price, quantity: 1 }] },
    amount_subtotal: catalogue.amount,
    amount_total: catalogue.amount,
    total_details: { amount_tax: 0, amount_discount: 0, amount_shipping: 0 },
    discounts: [],
  };
  const intent: any = {
    id: "pi_fixture",
    object: "payment_intent",
    livemode: true,
    status: "succeeded",
    customer: "cus_fixture",
    currency: "egp",
    amount: catalogue.amount,
    amount_received: catalogue.amount,
    latest_charge: "ch_fixture",
    metadata,
  };
  const charge: any = {
    id: "ch_fixture",
    object: "charge",
    livemode: true,
    status: "succeeded",
    paid: true,
    customer: "cus_fixture",
    payment_intent: "pi_fixture",
    amount: catalogue.amount,
    currency: "egp",
    refunded: false,
    amount_refunded: 0,
    disputed: false,
  };
  const fulfilled = new Set<string>();
  const rpc = vi.fn(async (name: string, args: any) => {
    if (name === "prepare_commercial_purchase" || name === "get_commercial_purchase_by_session")
      return purchase;
    if (name === "bind_commercial_purchase_session") {
      purchase.session_id = args.p_session_id;
      purchase.customer_id = args.p_customer_id;
      return { ...purchase };
    }
    if (name === "lc09_financial_expired") return false;
    if (name === "fulfill_commercial_purchase") {
      fulfilled.add(args.p_payment_id);
      return { state: "fulfilled" };
    }
    if (name === "apply_commercial_purchase_risk_hold") return { held: true };
    if (name === "close_commercial_purchase_session") return { closed: true };
    if (name === "register_kids_stripe_customer") return "cus_fixture";
    throw new Error(name);
  });
  const stripe = vi.fn(async (path: string, opts: any = {}) => {
    if (path === "/customers" && opts.method === "POST")
      return { id: "cus_fixture", object: "customer", livemode: true };
    if (path.startsWith("/prices/")) return price;
    if (path.startsWith("/customers/"))
      return {
        id: "cus_fixture",
        object: "customer",
        livemode: true,
        metadata: { user_id: uid, environment: "live" },
      };
    if (path.startsWith("/checkout/sessions?"))
      return { object: "list", has_more: false, data: [session] };
    if (path.startsWith("/checkout/sessions/")) return session;
    if (path === "/checkout/sessions" && opts.method === "POST") return session;
    if (path.startsWith("/payment_intents/")) return intent;
    if (path.startsWith("/charges/")) return charge;
    throw new Error(path);
  });
  const deps: LiveDeps = {
    getEnv: (n) =>
      ({
        STRIPE_LIVE_WEBHOOK_SECRET: secret,
        STRIPE_LIVE_ENABLED: "true",
        STRIPE_BILLING_MODE: "live",
      })[n],
    databaseLiveEnabled: async () => true,
    rpc: rpc as any,
    stripe: stripe as any,
  };
  async function send(type = "checkout.session.completed", object = session) {
    const t = Math.floor(Date.now() / 1000),
      body = JSON.stringify({
        id: "evt_fixture",
        type,
        created: t,
        livemode: true,
        data: { object },
      });
    return handleLiveWebhookEvent(
      body,
      `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`,
      deps,
    );
  }
  return { purchase, session, intent, charge, price, rpc, stripe, deps, send, fulfilled };
}

describe("Scoped commercial purchases", () => {
  it("registers a new customer in the shared account registry before binding checkout", async () => {
    const h = harness("question_topup");
    h.purchase.customer_id = null;
    h.purchase.session_id = null;
    h.session.status = "open";
    h.session.payment_status = "unpaid";
    h.session.url = "https://checkout.stripe.com/c/pay/cs_fixture";
    expect(
      (
        await createLiveCheckout(
          { id: uid, email: "fixture@example.invalid" },
          { product: "question_topup", walletScope: "account", requestId: rid, marketCode: "EG" },
          "https://masaarat.ai",
          h.deps,
        )
      ).status,
    ).toBe(200);
    expect(h.rpc).toHaveBeenCalledWith("register_kids_stripe_customer", {
      p_user_id: uid,
      p_customer_id: "cus_fixture",
    });
  });
  it("fulfills a top-up discounted by its explicitly scoped verified coupon", async () => {
    const h = harness("question_topup");
    h.purchase.amount_minor = 4500;
    h.purchase.parameters = {
      quote: {
        offer: {
          id: "reservation",
          user_id: uid,
          customer_id: "cus_fixture",
          session_id: "cs_fixture",
          subscription_id: null,
          consumed_invoice_id: null,
          original_minor: 5000,
          final_minor: 4500,
          mapping: {
            id: "mapping",
            package: "question_topup",
            market_code: "EG",
            currency: "EGP",
            billing_interval: "one_time",
            price_id: h.price.id,
            product_id: h.price.product.id,
            coupon_id: "coupon",
            promotion_code_id: "promo_fixture",
            kind: "percent",
            value_minor: 10,
            duration: "once",
            duration_in_months: null,
          },
        },
      },
    };
    h.session.metadata.offer_reservation_id = "reservation";
    h.session.amount_total = 4500;
    h.session.total_details.amount_discount = 500;
    h.session.discounts = [
      {
        promotion_code: {
          id: "promo_fixture",
          object: "promotion_code",
          livemode: true,
          promotion: {
            coupon: {
              id: "coupon",
              object: "coupon",
              livemode: true,
              duration: "once",
              duration_in_months: null,
              percent_off: 10,
              applies_to: { products: [h.price.product.id] },
            },
          },
        },
      },
    ];
    h.intent.amount = h.intent.amount_received = h.charge.amount = 4500;
    expect((await h.send()).body.fulfilled).toBe(true);
    expect(h.rpc).toHaveBeenCalledWith(
      "fulfill_commercial_purchase",
      expect.objectContaining({ p_amount_minor: 4500 }),
    );
    h.session.discounts[0].promotion_code.promotion.coupon.applies_to.products = [
      "prod_subscription",
    ];
    expect((await h.send()).status).toBe(500);
  });
  it("releases only a provider-verified expired unpaid attempt with no payment", async () => {
    const h = harness();
    h.session.status = "expired";
    h.session.payment_status = "unpaid";
    h.session.payment_intent = null;
    const result = await createLiveCheckout(
      { id: uid, email: "fixture@example.invalid" },
      {
        product: "curriculum_lifetime",
        area: "ai",
        course: "ai",
        requestId: rid,
        marketCode: "EG",
      },
      "https://masaarat.ai",
      h.deps,
    );
    expect(result).toEqual({ status: 409, body: { error: "COMMERCIAL_REQUEST_EXPIRED" } });
    expect(h.rpc).toHaveBeenCalledWith(
      "close_commercial_purchase_session",
      expect.objectContaining({ p_payment_id: null, p_status: "expired" }),
    );
    expect(h.fulfilled.size).toBe(0);
  });
  it("creates and returns a new session using the actual SQL binding row contract", async () => {
    const h = harness();
    h.purchase.session_id = null;
    h.session.status = "open";
    h.session.payment_status = "unpaid";
    h.session.url = "https://checkout.stripe.com/c/pay/cs_fixture";
    const result = await createLiveCheckout(
      { id: uid, email: "fixture@example.invalid" },
      {
        product: "curriculum_lifetime",
        area: "ai",
        course: "ai",
        requestId: rid,
        marketCode: "EG",
      },
      "https://masaarat.ai",
      h.deps,
    );
    expect(result.status).toBe(200);
    expect(result.body.url).toBe(h.session.url);
    expect(h.rpc).toHaveBeenCalledWith(
      "bind_commercial_purchase_session",
      expect.objectContaining({ p_session_id: "cs_fixture" }),
    );
  });
  it.each(["lifetime_course", "question_topup"] as const)(
    "fulfills %s from signed paid graph only",
    async (kind) => {
      const h = harness(kind);
      expect((await h.send()).status).toBe(200);
      expect(h.rpc).toHaveBeenCalledWith(
        "fulfill_commercial_purchase",
        expect.objectContaining({
          p_purchase_id: rid,
          p_price_id: h.purchase.price_id,
          p_amount_minor: h.purchase.amount_minor,
          p_payment_id: "pi_fixture",
        }),
      );
      await h.send();
      expect(h.fulfilled.size).toBe(1);
    },
  );
  it("leaves asynchronous unpaid checkout pending until success", async () => {
    const h = harness();
    h.session.payment_status = "unpaid";
    expect((await h.send()).body.pending).toBe(true);
    expect(h.fulfilled.size).toBe(0);
    h.session.payment_status = "paid";
    expect((await h.send("checkout.session.async_payment_succeeded")).body.fulfilled).toBe(true);
  });
  it.each([
    "owner",
    "price",
    "quantity",
    "amount",
    "customer",
    "payment",
    "test",
    "discount",
    "linepage",
  ])("rejects altered %s before granting", async (field) => {
    const h = harness();
    if (field === "owner") h.session.metadata.user_id = "other";
    if (field === "price") h.session.line_items.data[0].price.id = "price_other";
    if (field === "quantity") h.session.line_items.data[0].quantity = 2;
    if (field === "amount") h.intent.amount_received = 1;
    if (field === "customer") h.intent.customer = "cus_other";
    if (field === "payment") h.charge.payment_intent = "pi_other";
    if (field === "test") h.price.livemode = false;
    if (field === "discount") h.session.discounts = [{}];
    if (field === "linepage") h.session.line_items.has_more = true;
    expect((await h.send()).status).toBe(500);
    expect(h.fulfilled.size).toBe(0);
  });
  it("does not fetch or grant for an invalid signature", async () => {
    const h = harness();
    expect((await handleLiveWebhookEvent("{}", "invalid", h.deps)).status).toBe(400);
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.stripe).not.toHaveBeenCalled();
  });
  it("holds a refunded purchase instead of restoring it", async () => {
    const h = harness();
    h.charge.amount_refunded = 100;
    expect((await h.send()).body.held).toBe(true);
    expect(h.fulfilled.size).toBe(0);
    expect((await h.send("charge.refunded", h.charge)).body.held).toBe(true);
  });
  it("retains checkout gating for both one-time products", async () => {
    const h = harness();
    h.deps.databaseLiveEnabled = async () => false;
    const result = await createLiveCheckout(
      { id: uid, email: "fixture@example.invalid" },
      { product: "question_topup", walletScope: "account", requestId: rid, marketCode: "EG" },
      "https://masaarat.ai",
      h.deps,
    );
    expect(result.status).toBe(503);
    expect(h.rpc).not.toHaveBeenCalled();
  });
  it("reuses a bound open session with no second session creation", async () => {
    const h = harness();
    h.session.status = "open";
    h.session.payment_status = "unpaid";
    h.session.url = "https://checkout.stripe.com/c/pay/cs_fixture";
    const body = {
      product: "curriculum_lifetime",
      area: "ai",
      course: "ai",
      requestId: rid,
      marketCode: "EG",
    } as const;
    expect(
      (
        await createLiveCheckout(
          { id: uid, email: "fixture@example.invalid" },
          body,
          "https://masaarat.ai",
          h.deps,
        )
      ).status,
    ).toBe(200);
    expect(h.stripe.mock.calls.some(([, opts]) => opts?.method === "POST")).toBe(false);
    expect(h.rpc).toHaveBeenCalledWith(
      "prepare_commercial_purchase",
      expect.objectContaining({ p_area: "ai", p_course: "ai", p_request_id: rid }),
    );
  });
  it("requires the Kids child binding and refuses caller-controlled price", () => {
    const b = {
      product: "curriculum_lifetime",
      area: "kids",
      course: "kids",
      requestId: rid,
      marketCode: "EG",
    };
    expect(liveCheckoutSchema.safeParse(b).success).toBe(false);
    expect(liveCheckoutSchema.safeParse({ ...b, childId: uid }).success).toBe(true);
    expect(liveCheckoutSchema.safeParse({ ...b, childId: uid, amount: 1 }).success).toBe(false);
  });
});
