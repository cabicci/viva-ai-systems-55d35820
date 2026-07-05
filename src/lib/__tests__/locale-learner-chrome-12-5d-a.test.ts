import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEARNER_CHROME_12_5D_A_KEYS } from "@/lib/locale/curriculum-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";

const ARABIC_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf"] as const satisfies readonly SupportedLocale[];

const ARABIC_LETTER = /[\u0600-\u06FF]/;

const CURRICULUM_SOURCE = readFileSync(
  resolve(process.cwd(), "src/routes/curriculum.tsx"),
  "utf8",
);

const PAYWALL_SOURCE = readFileSync(
  resolve(process.cwd(), "src/components/learn/PaywallCard.tsx"),
  "utf8",
);

const AUDITED_CURRICULUM_AR = [
  "ابدأ من هنا قبل ما تدخل المسارات.",
  "قريبًا",
  "تقدّم المسار",
  "محتوى هذا المسار قيد البناء",
  "تقني — للمتقدمين",
  "لازم تعدّي",
  "ابدأ Builder",
] as const;

const AUDITED_PAYWALL_AR = [
  "الدرس ده ضمن اشتراك Pro",
  "فعّل Pro",
  "رجوع للوحة",
  "اكمل المقدمة الأول",
  "ابدأ المقدمة",
] as const;

const LATIN_EYEBROW_KEYS = new Set([
  "curriculum.path.introductionEyebrow",
  "curriculum.path.pathEyebrow",
  "curriculum.module.eyebrow",
]);

describe("locale learner chrome (Phase 12.5D-A)", () => {
  it("serves all new keys for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of LEARNER_CHROME_12_5D_A_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("uses English-only copy for locale=en new keys", () => {
    for (const key of LEARNER_CHROME_12_5D_A_KEYS) {
      const value = getUiString("en", key);
      expect(value, key).not.toMatch(ARABIC_LETTER);
    }
  });

  it("uses non-empty Arabic copy for ar-EG, ar-MSA, and ar-Gulf new keys", () => {
    for (const locale of ARABIC_LOCALES) {
      for (const key of LEARNER_CHROME_12_5D_A_KEYS) {
        if (LATIN_EYEBROW_KEYS.has(key)) continue;
        const value = getUiString(locale, key);
        expect(value, `${locale} ${key}`).toMatch(ARABIC_LETTER);
      }
    }
  });

  it("removes audited hardcoded Arabic from curriculum route chrome", () => {
    for (const snippet of AUDITED_CURRICULUM_AR) {
      expect(CURRICULUM_SOURCE, snippet).not.toContain(snippet);
    }
    expect(CURRICULUM_SOURCE).toContain("useUiString");
  });

  it("removes audited hardcoded Arabic from PaywallCard", () => {
    for (const snippet of AUDITED_PAYWALL_AR) {
      expect(PAYWALL_SOURCE, snippet).not.toContain(snippet);
    }
    expect(PAYWALL_SOURCE).toContain("useUiString");
  });

  it("formats dashboard percent via ui key", () => {
    expect(readFileSync(resolve(process.cwd(), "src/routes/dashboard.tsx"), "utf8")).toContain(
      "dashboard.progress.percentValue",
    );
    expect(getUiString("en", "dashboard.progress.percentValue").replace("{value}", "42")).toBe(
      "42%",
    );
    expect(getUiString("ar-EG", "dashboard.progress.percentValue").replace("{value}", "42")).toBe(
      "42٪",
    );
  });
});
