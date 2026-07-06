import { describe, expect, it } from "vitest";
import { MISSION_CHROME_KEYS } from "@/lib/locale/mission-chrome-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { buildMissionTemplate } from "@/components/intro/MissionRubricSubmit";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;

describe("locale mission chrome (Phase 12.6 Batch 5C)", () => {
  it("serves mission chrome keys for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of MISSION_CHROME_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("uses English-only mission submit chrome for locale=en", () => {
    expect(getUiString("en", "mission.submit.cta")).not.toMatch(ARABIC);
    expect(getUiString("en", "mission.showSteps")).not.toMatch(ARABIC);
    expect(getUiString("en", "mission.template.writeHere")).not.toMatch(ARABIC);
  });

  it("builds mission templates with localized write-here placeholder", () => {
    const prompt = [
      "1) الهدف:",
      "2) الخطوات:",
    ].join("\n");
    const enTemplate = buildMissionTemplate(
      prompt,
      getUiString("en", "mission.template.writeHere"),
    );
    expect(enTemplate).toContain("[write here]");
    expect(enTemplate).not.toContain("[اكتب هنا]");

    const arTemplate = buildMissionTemplate(
      prompt,
      getUiString("ar-MSA", "mission.template.writeHere"),
    );
    expect(arTemplate).toContain("[اكتب هنا]");
  });

  it("passes locale leak scan after Batch 5C mission chrome wiring", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
