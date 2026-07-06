import { describe, expect, it } from "vitest";
import { INTRO_LESSON_CHROME_KEYS } from "@/lib/locale/intro-lesson-chrome-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { getValueHook, getValueHookForLocale } from "@/components/intro/value-hooks";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;

describe("locale intro lesson chrome (Phase 12.6 Batch 5B)", () => {
  it("serves intro lesson chrome keys for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of INTRO_LESSON_CHROME_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("uses English-only quiz chrome for locale=en", () => {
    expect(getUiString("en", "intro.quiz.header")).not.toMatch(ARABIC);
    expect(getUiString("en", "learn.notes.title")).not.toMatch(ARABIC);
    expect(getUiString("en", "learn.difficulty.hard")).not.toMatch(ARABIC);
  });

  it("suppresses ar-EG value-hook body for non-Egyptian locales", () => {
    const sampleId = "intro-m1-l1-what-is-ai";
    expect(getValueHook(sampleId)).toBeTruthy();
    expect(getValueHookForLocale(sampleId, "ar-EG")).toBeTruthy();
    expect(getValueHookForLocale(sampleId, "ar-MSA")).toBeUndefined();
    expect(getValueHookForLocale(sampleId, "ar-Gulf")).toBeUndefined();
    expect(getValueHookForLocale(sampleId, "en")).toBeUndefined();
  });

  it("passes locale leak scan after Batch 5B chrome wiring", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
