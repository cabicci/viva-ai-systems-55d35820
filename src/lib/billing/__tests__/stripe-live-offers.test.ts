import { describe, expect, it } from "vitest";
import {
  offerSessionParameters,
  verifyOfferInvoice,
  type OfferEvidence,
} from "../live/offer-discounts";
import { liveCheckoutSchema } from "../live/schemas";
import { resolveCheckoutUrl } from "../checkout-client";

function fixture() {
  const evidence: OfferEvidence = {
    id: "reservation",
    user_id: "user",
    customer_id: "cus_fixture",
    session_id: "cs_fixture",
    subscription_id: null,
    consumed_invoice_id: null,
    original_minor: 19900,
    final_minor: 17910,
    mapping: {
      id: "mapping",
      package: "kids",
      market_code: "EG",
      currency: "EGP",
      billing_interval: "month",
      price_id: "price_standard",
      product_id: "prod_fixture",
      coupon_id: "coupon_fixture",
      promotion_code_id: "promo_fixture",
      kind: "percent",
      value_minor: 10,
      duration: "once",
      duration_in_months: null,
    },
  };
  const price = {
    id: "price_standard",
    product: "prod_fixture",
    unit_amount: 19900,
    currency: "egp",
    recurring: { interval: "month" },
  };
  const sub = {
    id: "sub_fixture",
    livemode: true,
    customer: "cus_fixture",
    metadata: { user_id: "user", offer_reservation_id: "reservation" },
    items: { data: [{ price, quantity: 1, current_period_start: 1000, current_period_end: 2000 }] },
  };
  const session = {
    id: "cs_fixture",
    object: "checkout.session",
    livemode: true,
    customer: "cus_fixture",
    subscription: "sub_fixture",
    metadata: { offer_reservation_id: "reservation" },
  };
  const invoice = {
    id: "in_fixture",
    livemode: true,
    status: "paid",
    customer: "cus_fixture",
    subscription: "sub_fixture",
    currency: "egp",
    billing_reason: "subscription_create",
    starting_balance: 0,
    ending_balance: 0,
    amount_remaining: 0,
    subtotal: 19900,
    total: 17910,
    amount_due: 17910,
    amount_paid: 17910,
    lines: {
      has_more: false,
      data: [
        {
          price: "price_standard",
          subscription: "sub_fixture",
          amount: 19900,
          quantity: 1,
          period: { start: 1000, end: 2000 },
        },
      ],
    },
    discounts: [
      {
        id: "di_fixture",
        object: "discount",
        promotion_code: "promo_fixture",
        source: {
          coupon: {
            id: "coupon_fixture",
            object: "coupon",
            livemode: true,
            duration: "once",
            duration_in_months: null,
            percent_off: 10,
            applies_to: { products: ["prod_fixture"] },
          },
        },
      },
    ],
    total_discount_amounts: [{ amount: 1990, discount: "di_fixture" }],
  };
  return { evidence, sub, session, invoice };
}
describe("Mapped Live coded offers", () => {
  it("proves 10% from the standard Kids 19900 price without stacking", () => {
    const f = fixture();
    expect(verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toBe(17910);
    const p = new URLSearchParams();
    offerSessionParameters(p, f.evidence);
    expect(p.get("discounts[0][promotion_code]")).toBe("promo_fixture");
    expect(p.has("discounts[0][coupon]")).toBe(false);
  });
  it("proves a currency-specific fixed discount", () => {
    const f = fixture();
    f.evidence.mapping.kind = "fixed";
    f.evidence.mapping.value_minor = 1990;
    const c = f.invoice.discounts[0].source.coupon as Record<string, unknown>;
    delete c.percent_off;
    c.amount_off = 1990;
    c.currency = "egp";
    expect(verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toBe(17910);
  });
  it("once expires after first paid invoice; renewals pay full base", () => {
    const f = fixture();
    f.evidence.consumed_invoice_id = "in_first";
    f.invoice.billing_reason = "subscription_cycle";
    f.invoice.discounts = [];
    f.invoice.total_discount_amounts = [];
    f.invoice.total = f.invoice.amount_due = f.invoice.amount_paid = 19900;
    expect(verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toBe(19900);
  });
  it("forever applies the verified discount on renewal", () => {
    const f = fixture();
    f.evidence.consumed_invoice_id = "in_first";
    f.invoice.billing_reason = "subscription_cycle";
    f.evidence.mapping.duration = "forever";
    f.invoice.discounts[0].source.coupon.duration = "forever";
    expect(verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toBe(17910);
  });
  it.each([
    "currency",
    "interval",
    "amount",
    "coupon",
    "promotion",
    "stack",
    "family",
    "period",
    "replay",
    "unexpanded",
    "repeating",
    "balance",
  ])("rejects %s mismatch", (rule) => {
    const f = fixture();
    switch (rule) {
      case "currency":
        f.invoice.currency = "usd";
        break;
      case "interval":
        f.sub.items.data[0].price.recurring.interval = "year";
        break;
      case "amount":
        f.invoice.amount_paid = 1;
        break;
      case "coupon":
        f.invoice.discounts[0].source.coupon.id = "wrong";
        break;
      case "promotion":
        f.invoice.discounts[0].promotion_code = "wrong";
        break;
      case "stack":
        f.invoice.discounts.push(f.invoice.discounts[0]);
        break;
      case "family":
        f.sub.items.data[0].price.id = "price_family";
        break;
      case "period":
        f.invoice.lines.data[0].period.end = 3000;
        break;
      case "replay":
        f.evidence.consumed_invoice_id = "in_other";
        break;
      case "unexpanded":
        (f.invoice.discounts[0].source as unknown as Record<string, unknown>).coupon =
          "coupon_fixture";
        break;
      case "repeating":
        f.evidence.mapping.duration = "repeating";
        break;
      case "balance":
        f.invoice.starting_balance = -100;
        break;
    }
    expect(() => verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toThrow();
  });
  it("cannot request amounts, Stripe IDs or mode from browser", () => {
    const selection = { product: "kids", billingInterval: "month", marketCode: "EG" };
    for (const field of ["amount", "coupon_id", "promotion_code_id", "mode"])
      expect(liveCheckoutSchema.safeParse({ ...selection, [field]: "bad" }).success).toBe(false);
  });
  it("coded checkout never invokes Test callback when server selects Test", async () => {
    let called = false;
    await expect(
      resolveCheckoutUrl(
        {
          product: "kids",
          billingInterval: "month",
          marketCode: "EG",
          offer: { code: "SYNTHETIC", key: "key" },
        },
        async () => {
          called = true;
          return "test";
        },
        { fetch: async () => Response.json({ mode: "test" }), accessToken: async () => null },
      ),
    ).rejects.toThrow("LIVE_OFFER_NOT_AVAILABLE");
    expect(called).toBe(false);
  });
});
