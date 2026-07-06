import { describe, expect, it } from "vitest";
import { LEARN_UI_KEYS } from "@/lib/locale/learn-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;
const COMPLETION_KEYS = LEARN_UI_KEYS.filter((key) => key.startsWith("learn.completion."));
const SAFETY_PREVIEW_KEYS = [
  "safety.quiz.previewLabel",
  "safety.screenshot.title",
  "safety.screenshot.placeholder",
] as const;

describe("locale learn chrome (Phase 12.6 Batch 5A)", () => {
  it("serves completion chrome keys for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of COMPLETION_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("uses English-only completion default for locale=en", () => {
    expect(getUiString("en", "learn.completion.default")).not.toMatch(ARABIC);
    expect(getUiString("en", "learn.completion.milestone.streak3")).not.toMatch(ARABIC);
  });

  it("serves safety preview keys for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of SAFETY_PREVIEW_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("uses Arabic preview quiz label for ar-MSA and ar-Gulf", () => {
    const enLabel = getUiString("en", "safety.quiz.previewLabel");
    expect(getUiString("ar-MSA", "safety.quiz.previewLabel")).not.toBe(enLabel);
    expect(getUiString("ar-MSA", "safety.quiz.previewLabel")).toMatch(ARABIC);
    expect(getUiString("ar-Gulf", "safety.quiz.previewLabel")).toMatch(ARABIC);
    expect(enLabel).not.toMatch(ARABIC);
  });

  it("passes locale leak scan after Batch 5A chrome wiring", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
