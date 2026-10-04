import { describe, expect, it } from "vitest";
import { getLineCopy, learningLineForPath, lineMeta } from "./learning-lines";
import { parseAuthIntentSearch, kidsSignupRedirect, SAFE_LINE_RETURNS } from "./kids/auth-intent";
import { SUPPORTED_LOCALES } from "./locale/types";
describe("line identities and safe unified auth returns", () => {
  it.each(SUPPORTED_LOCALES)(
    "has complete contextual copy and distinct canonical metadata in %s",
    (locale) => {
      const c = getLineCopy(locale);
      Object.values(c).forEach((value) => expect(value.length).toBeGreaterThan(2));
      if (locale === "en") expect(JSON.stringify(c)).not.toMatch(/[\u0600-\u06ff]/);
      for (const kind of [
        "platform",
        "ai",
        "kids",
        "technical",
        "about",
        "kidsPricing",
        "technicalPricing",
      ] as const) {
        const h = lineMeta(locale, kind);
        expect(h.links).toHaveLength(1);
        expect(h.meta.find((x) => "title" in x)).toBeTruthy();
      }
      expect(lineMeta(locale, "technicalPricing").links[0].href).toBe(
        "https://masaarat.ai/technical/pricing",
      );
    },
  );
  it("does not misclassify account/payments/admin as an educational subscription", () => {
    ["/account", "/payments", "/admin/commerce", "/"].forEach((path) =>
      expect(learningLineForPath(path)).toBeNull(),
    );
    expect(learningLineForPath("/kids/level-1/2")).toBe("kids");
    expect(learningLineForPath("/learn/builder/lesson-1")).toBe("ai");
  });
  it("only accepts fixed internal line destinations and preserves the guardian intent", () => {
    for (const returnTo of SAFE_LINE_RETURNS) {
      const parsed = parseAuthIntentSearch({ returnTo, locale: "en" });
      expect(kidsSignupRedirect("https://masaarat.ai", parsed)).toBe(
        `https://masaarat.ai${returnTo}?locale=en`,
      );
    }
    for (const returnTo of [
      "https://evil.test",
      "//evil.test",
      "/admin",
      "/kids/family",
      "/payments?order=bad",
      "/technical/../admin",
    ])
      expect(parseAuthIntentSearch({ returnTo }).returnTo).toBeUndefined();
    expect(
      kidsSignupRedirect("https://masaarat.ai", {
        intent: "kids",
        returnTo: "/technical",
        locale: "en",
      }),
    ).toBe("https://masaarat.ai/kids/family?locale=en");
    expect(kidsSignupRedirect("https://masaarat.ai", {})).toBe("https://masaarat.ai/dashboard");
  });
});
