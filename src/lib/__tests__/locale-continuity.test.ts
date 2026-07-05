import { describe, expect, it } from "vitest";
import {
  CONTINUITY_BY_LOCALE,
  getContinuityForLocale,
} from "@/lib/locale-curriculum/resolve-continuity";
import { LESSON_CONTINUITY } from "@/components/intro/lesson-continuity";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;
const KNOWN_CUSTOM_EG = "intro-m1-l1-what-is-ai";
const MISSING_CUSTOM = "creator-m5-l1-editing";

describe("locale continuity (Phase 12.6 Batch 2)", () => {
  it("returns no Arabic in en continuity body", () => {
    const body = getContinuityForLocale("en", KNOWN_CUSTOM_EG, {
      hasNext: true,
      nextTitle: "First Prompt",
      pathTitle: "Introduction",
    });
    expect(body).not.toMatch(ARABIC);
    expect(body).toContain("First Prompt");
  });

  it("uses ar-MSA ui template instead of Egyptian LESSON_CONTINUITY map", () => {
    const body = getContinuityForLocale("ar-MSA", KNOWN_CUSTOM_EG, {
      hasNext: true,
      nextTitle: "أول Prompt",
      pathTitle: "المقدمة",
    });
    expect(body).not.toBe(LESSON_CONTINUITY[KNOWN_CUSTOM_EG]);
    expect(body).toContain("«أول Prompt»");
    expect(body).toMatch(/بعد إتمام|انتقل/);
  });

  it("uses ar-Gulf ui template instead of Egyptian LESSON_CONTINUITY map", () => {
    const body = getContinuityForLocale("ar-Gulf", KNOWN_CUSTOM_EG, {
      hasNext: true,
      nextTitle: "أول Prompt",
      pathTitle: "المقدمة",
    });
    expect(body).not.toBe(LESSON_CONTINUITY[KNOWN_CUSTOM_EG]);
    expect(body).toContain("«أول Prompt»");
    expect(body).toMatch(/بعد ما تخلص|كمّل/);
  });

  it("keeps existing Egyptian custom continuity for ar-EG", () => {
    const body = getContinuityForLocale("ar-EG", KNOWN_CUSTOM_EG, {
      hasNext: true,
      nextTitle: "أول Prompt",
      pathTitle: "المقدمة",
    });
    expect(body).toBe(LESSON_CONTINUITY[KNOWN_CUSTOM_EG]);
    expect(body).toMatch(ARABIC);
  });

  it("uses locale-safe template when custom entry is missing and nextTitle is set", () => {
    expect(LESSON_CONTINUITY[MISSING_CUSTOM]).toBeUndefined();

    const enBody = getContinuityForLocale("en", MISSING_CUSTOM, {
      hasNext: true,
      nextTitle: "Editing — Cut, Caption, Pace",
      pathTitle: "Creator",
    });
    expect(enBody).not.toMatch(ARABIC);
    expect(enBody).toContain("Editing — Cut, Caption, Pace");

    const msaBody = getContinuityForLocale("ar-MSA", MISSING_CUSTOM, {
      hasNext: true,
      nextTitle: "المونتاج",
      pathTitle: "صانع المحتوى",
    });
    expect(msaBody).toContain("«المونتاج»");
    expect(msaBody).not.toContain("بعد ما تخلّص المهمة دي");
  });

  it("prefers sparse CONTINUITY_BY_LOCALE override when present", () => {
    CONTINUITY_BY_LOCALE.en = {
      [KNOWN_CUSTOM_EG]: "Custom English bridge for testing.",
    };
    try {
      const body = getContinuityForLocale("en", KNOWN_CUSTOM_EG, {
        hasNext: true,
        nextTitle: "Ignored",
        pathTitle: "Introduction",
      });
      expect(body).toBe("Custom English bridge for testing.");
    } finally {
      delete CONTINUITY_BY_LOCALE.en;
    }
  });

  it("passes locale leak scan after Batch 2 wiring", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
