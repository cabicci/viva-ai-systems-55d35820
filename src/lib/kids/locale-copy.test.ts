import { describe, expect, it } from "vitest";
import { getKidsCopy } from "./copy";
import { getKidsJourneyCopy } from "./journey-copy";
import { getKidsPrivacyCopy } from "./privacy-copy";

describe("Kids locale copy", () => {
  it("uses distinct Egyptian, standard Arabic, Gulf and English interface text", () => {
    const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
    expect(new Set(locales.map((locale) => getKidsCopy(locale).reviewNotice)).size).toBe(4);
    expect(new Set(locales.map((locale) => getKidsJourneyCopy(locale).signInNotice)).size).toBe(4);
    expect(getKidsJourneyCopy("ar-EG").watch).toBe("اتفرج على الدرس");
    expect(getKidsJourneyCopy("ar-Gulf").objectives).toBe("وش بنتعلّم؟");
    expect(getKidsJourneyCopy("ar-MSA").objectives).toBe("ماذا سنتعلم؟");
  });

  it("keeps one child privacy policy across Arabic dialects and an English version", () => {
    expect(getKidsPrivacyCopy("ar-EG").sections).toEqual(getKidsPrivacyCopy("ar-MSA").sections);
    expect(getKidsPrivacyCopy("ar-Gulf").sections).toEqual(getKidsPrivacyCopy("ar-MSA").sections);
    expect(getKidsPrivacyCopy("en").title).toBe("Masaarat Kids Privacy Policy");
  });
});
