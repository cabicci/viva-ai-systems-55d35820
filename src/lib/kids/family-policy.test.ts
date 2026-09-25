import { describe, expect, it } from "vitest";
import { evaluateKidsRetention, quoteKidsFamily } from "./family-policy";

describe("Kids independent family pricing", () => {
  it.each([
    ["EG", "month", 19900, 17910],
    ["EG", "year", 199000, 179100],
    ["INTL", "month", 799, 719],
    ["INTL", "year", 7990, 7191],
  ] as const)("quotes %s %s without requiring an adult plan", (market, interval, base, bundle) => {
    for (const adult of [null, "free"] as const) {
      expect(quoteKidsFamily(market, interval, adult).totalMinor).toBe(base);
    }
    for (const adult of ["pro", "pro_plus"] as const) {
      const quote = quoteKidsFamily(market, interval, adult);
      expect(quote.totalMinor).toBe(bundle);
      expect(quote.discountMinor + quote.totalMinor).toBe(base);
      expect(quote.taxIncluded).toBe(false);
    }
  });
});

describe("Kids expiry retention policy", () => {
  const day = 86400000;
  const expiry = Date.parse("2026-01-01T00:00:00Z");
  const evaluate = (
    now: number,
    deliveredNotice: { expiry: number; deliveredAt: number } | null = null,
  ) => evaluateKidsRetention({ now, latestPaidExpiry: expiry, deliveredNotice });

  it("never schedules a never-paid free family under paid-expiry policy", () => {
    expect(
      evaluateKidsRetention({ now: expiry, latestPaidExpiry: null, deliveredNotice: null }).status,
    ).toBe("not-applicable");
  });
  it("retains profiles for the full 90 days and waits for prior notification", () => {
    expect(evaluate(expiry - 1).status).toBe("active");
    expect(evaluate(expiry + 90 * day - 1).status).toBe("retained");
    expect(evaluate(expiry + 90 * day).status).toBe("awaiting-notice");
    expect(evaluate(expiry + 90 * day, { expiry, deliveredAt: expiry + 80 * day }).status).toBe(
      "eligible-for-deletion",
    );
  });
  it("rejects notices from an old term, the future, before expiry or after the deadline", () => {
    for (const notice of [
      { expiry: expiry - day, deliveredAt: expiry + day },
      { expiry, deliveredAt: expiry - 1 },
      { expiry, deliveredAt: expiry + 100 * day },
      { expiry, deliveredAt: NaN },
    ])
      expect(evaluate(expiry + 90 * day, notice).status).toBe("awaiting-notice");
  });
  it("a renewed entitlement cancels the previous expiry candidate", () => {
    expect(
      evaluateKidsRetention({
        now: expiry + 90 * day,
        latestPaidExpiry: expiry + 120 * day,
        deliveredNotice: { expiry, deliveredAt: expiry + day },
      }).status,
    ).toBe("active");
  });
  it("fails closed on invalid dates", () => {
    expect(evaluate(NaN).status).toBe("invalid");
    expect(
      evaluateKidsRetention({ now: expiry, latestPaidExpiry: Infinity, deliveredNotice: null })
        .status,
    ).toBe("invalid");
  });
});
