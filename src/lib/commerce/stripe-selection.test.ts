import { describe, expect, it } from "vitest";
import { stripeSelection } from "./stripe-selection";

describe("offer-page Stripe selection continuity", () => {
  for (const pack of ["pro", "pro_plus", "kids", "academic", "technical"] as const)
    for (const market of ["EG", "INTL"] as const)
      for (const interval of ["month", "year"] as const)
        it(`retains ${pack}/${market}/${interval} on both Stripe environments`, () => {
          const selected = stripeSelection(pack, market, interval, "en");
          expect(selected.live).toEqual({ product: pack === "pro" || pack === "pro_plus" ? "core" : pack,
            marketCode: market, billingInterval: interval, locale: "en",
            ...(pack === "pro" || pack === "pro_plus" ? { planKey: pack } : {}),
            ...(pack === "academic" ? { academicAssistant: false } : {}) });
          expect(selected.functionName).toBe(pack === "pro" || pack === "pro_plus" ? "billing-stripe-checkout" : `${pack}-stripe-checkout`);
          expect(selected.body).toEqual({ marketCode: market, billingInterval: interval, locale: "en",
            ...(pack === "pro" || pack === "pro_plus" ? { planKey: pack } : {}),
            ...(pack === "academic" ? { academicAssistant: false } : {}) });
        });
});