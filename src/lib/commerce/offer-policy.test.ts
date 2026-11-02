import { describe, expect, it } from "vitest";
import { simpleOfferSchema } from "./offer-input";

const input = {
  key: "offer-policy-fixture",
  audience: "individual",
  emails: ["buyer@example.test"],
  package: "pro",
  market: "EG",
  billing_interval: "month",
  percent: 20,
  delivery: "coupon",
  code: "FIXTURE",
  locale: "en",
  limit_mode: "time",
  valid_until: null,
  max_redemptions: null,
  expected_price_minor: 16900,
};
describe("commercial coupon configuration", () => {
  it("keeps legacy offers subscription-only and first-payment-only", () => {
    expect(simpleOfferSchema.parse(input)).toMatchObject({
      product_scope: "subscription",
      discount_duration: "once",
    });
  });
  it("requires a positive whole number of months only for a repeating discount", () => {
    for (const months of [undefined, null, 0, -1, 1.5]) {
      expect(
        simpleOfferSchema.safeParse({
          ...input,
          discount_duration: "repeating",
          discount_duration_months: months,
        }).success,
      ).toBe(false);
    }
    expect(
      simpleOfferSchema.safeParse({
        ...input,
        discount_duration: "repeating",
        discount_duration_months: 3,
      }).success,
    ).toBe(true);
    expect(
      simpleOfferSchema.safeParse({
        ...input,
        discount_duration: "forever",
        discount_duration_months: 3,
      }).success,
    ).toBe(false);
  });
  it("requires an explicit, one-time top-up coupon scope without silently widening subscriptions", () => {
    const topup = {
      ...input,
      package: "question_topup",
      billing_interval: "one_time",
      expected_price_minor: 5000,
      product_scope: "question_topup",
    };
    expect(simpleOfferSchema.safeParse(topup).success).toBe(true);
    for (const invalid of [
      { product_scope: "subscription" },
      { package: "pro" },
      { billing_interval: "month" },
      { market: "INTL" },
      { percent: 100 },
      { discount_duration: "forever" },
      { delivery: "invitation" },
    ])
      expect(simpleOfferSchema.safeParse({ ...topup, ...invalid }).success).toBe(false);
  });
});
