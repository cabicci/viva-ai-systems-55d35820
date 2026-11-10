import { expect, it } from "vitest";
import { verifyOfferInvoice, type OfferEvidence } from "@/lib/billing/live/offer-discounts";
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
const stamp = (date: string) => Date.parse(date + "T00:00:00Z") / 1000;
it.each([
  ["2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30", "2024-05-31"],
  ["2025-01-31", "2025-02-28", "2025-03-31", "2025-04-30", "2025-05-31"],
])(
  "proves three specified months from the initial paid period starting %s, with the end exclusive",
  (...dates) => {
    const f = fixture();
    f.evidence.mapping.duration = "repeating";
    f.evidence.mapping.duration_in_months = 3;
    const first = { ...structuredClone(f.invoice), object: "invoice" };
    Object.assign(first.discounts[0], { start: stamp(dates[0]), end: stamp(dates[3]) });
    Object.assign(first.discounts[0].source.coupon, {
      duration: "repeating",
      duration_in_months: 3,
    });
    first.lines.data[0].period = { start: stamp(dates[0]), end: stamp(dates[1]) };
    const observed: number[] = [];
    for (let period = 0; period < 4; period++) {
      const invoice = structuredClone(first);
      invoice.id = period ? `in_fixture_renewal_${period}` : first.id;
      invoice.billing_reason = period ? "subscription_cycle" : "subscription_create";
      invoice.lines.data[0].period = { start: stamp(dates[period]), end: stamp(dates[period + 1]) };
      Object.assign(f.sub.items.data[0], {
        current_period_start: invoice.lines.data[0].period.start,
        current_period_end: invoice.lines.data[0].period.end,
      });
      if (period) f.evidence.consumed_invoice_id = first.id;
      if (period === 3) {
        invoice.discounts = [];
        invoice.total_discount_amounts = [];
        invoice.total = invoice.amount_paid = invoice.amount_due = 19900;
      }
      observed.push(
        verifyOfferInvoice(f.evidence, invoice, f.sub, f.session, period ? first : undefined),
      );
      if (period && period < 3)
        expect(() => verifyOfferInvoice(f.evidence, invoice, f.sub, f.session)).toThrow();
    }
    expect(observed).toEqual([17910, 17910, 17910, 19900]);
  },
);
it.each(["once", "forever"] as const)("preserves %s on initial payment and renewal", (duration) => {
  const f = fixture();
  f.evidence.mapping.duration = duration;
  f.invoice.discounts[0].source.coupon.duration = duration;
  expect(verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toBe(17910);
  f.evidence.consumed_invoice_id = f.invoice.id;
  f.invoice = { ...f.invoice, id: "in_renewal", billing_reason: "subscription_cycle" };
  if (duration === "once") {
    f.invoice.discounts = [];
    f.invoice.total_discount_amounts = [];
    f.invoice.total = f.invoice.amount_due = f.invoice.amount_paid = 19900;
  }
  expect(verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toBe(
    duration === "once" ? 19900 : 17910,
  );
});
it("still rejects stacked discounts and currency mismatches", () => {
  const f = fixture();
  f.invoice.discounts.push(structuredClone(f.invoice.discounts[0]));
  expect(() => verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toThrow();
  f.invoice.discounts.pop();
  f.invoice.currency = "usd";
  expect(() => verifyOfferInvoice(f.evidence, f.invoice, f.sub, f.session)).toThrow();
});
