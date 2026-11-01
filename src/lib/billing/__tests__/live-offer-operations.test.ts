import { describe, expect, it } from "vitest";
import { terminalOfferRelease, verifyOfferSession } from "../live/offer-operations";
import { liveOfferAdminSchema } from "../live/admin-offer-contracts";
import { portalModeForExistingSubscription } from "../portal-continuity";
import type { OfferEvidence } from "../live/offer-discounts";

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
const session = () => ({
  id: "cs_fixture",
  object: "checkout.session",
  mode: "subscription",
  livemode: true,
  customer: "cus_fixture",
  metadata: { offer_reservation_id: "reservation" },
  currency: "egp",
  status: "expired",
  payment_status: "unpaid",
  subscription: null,
  payment_intent: null,
  line_items: { has_more: false, data: [{ price: "price_standard", quantity: 1 }] },
  amount_subtotal: 19900,
  amount_total: 17910,
  total_details: { amount_discount: 1990, amount_tax: 0 },
  discounts: [
    {
      promotion_code: {
        id: "promo_fixture",
        object: "promotion_code",
        livemode: true,
        promotion: {
          coupon: {
            id: "coupon_fixture",
            object: "coupon",
            livemode: true,
            duration: "once",
            applies_to: { products: ["prod_fixture"] },
            percent_off: 10,
          },
        },
      },
    },
  ],
});
describe("Operational Live offer proof", () => {
  it("proves standard Kids price and exact 10% mapped discount", () => {
    expect(() => verifyOfferSession(evidence, session(), "cus_fixture")).not.toThrow();
  });
  it("rejects unexpanded promotion evidence", () => {
    const s = session();
    s.discounts = [];
    expect(() => verifyOfferSession(evidence, s, "cus_fixture")).toThrow("UNPROVEN");
  });
  it("rejects family-price stacking", () => {
    const s = session();
    s.line_items.data[0].price = "price_family";
    expect(() => verifyOfferSession(evidence, s, "cus_fixture")).toThrow();
  });
  it("rejects client-driven provision totals", () => {
    expect(
      liveOfferAdminSchema.safeParse({
        action: "enable",
        id: crypto.randomUUID(),
        key: crypto.randomUUID(),
        reviewed: true,
        review_reference: "review",
        amount: 1,
      }).success,
    ).toBe(false);
  });
  it("releases only expired unpaid Session with no payment graph", () => {
    expect(terminalOfferRelease(evidence, session())).toEqual({
      session_id: "cs_fixture",
      customer_id: "cus_fixture",
      status: "expired",
      payment_status: "unpaid",
      terminal_verified: true,
    });
  });
  it.each(["open", "complete"])("keeps %s attempts held", (status) => {
    const s = session();
    s.status = status;
    expect(() => terminalOfferRelease(evidence, s)).toThrow();
  });
  it("keeps asynchronous paid-capable attempts held", () => {
    expect(() =>
      terminalOfferRelease(evidence, { ...session(), payment_intent: "pi_pending" }),
    ).toThrow();
  });
  it("cannot release consumed offer", () => {
    expect(() =>
      terminalOfferRelease({ ...evidence, consumed_invoice_id: "in_paid" }, session()),
    ).toThrow();
  });
  it("rejects Test session on Live reconciliation", () => {
    expect(() => terminalOfferRelease(evidence, { ...session(), livemode: false })).toThrow();
  });
  it("rejects customer mismatch", () => {
    expect(() => terminalOfferRelease(evidence, { ...session(), customer: "cus_other" })).toThrow();
  });
});
describe("Non-destructive portal continuity", () => {
  it("keeps Live lifecycle on Live even if checkout mode is Test", () => {
    expect(portalModeForExistingSubscription("live", false)).toBe("live");
  });
  it("does not send Test subscription to Live portal", () => {
    expect(portalModeForExistingSubscription("test", true)).toBe("unavailable");
  });
  it("preserves existing Test portal before switch", () => {
    expect(portalModeForExistingSubscription("test", false)).toBe("test");
  });
  it("fails closed with no or ambiguous subscription", () => {
    expect(portalModeForExistingSubscription("unavailable", false)).toBe("unavailable");
  });
});
