import { describe, expect, it } from "vitest";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { getContinuityForLocale } from "@/lib/locale-curriculum/resolve-continuity";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;

describe("locale learner chrome parity (Phase 12.6 Batch 6)", () => {
  it("serves localized account route meta for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { meta } = buildLocalizedLearnerMeta(locale, "account");
      const title = meta.find((tag) => "title" in tag)?.title ?? "";
      const descriptionTag = meta.find(
        (tag): tag is { name: string; content: string } =>
          "name" in tag && tag.name === "description",
      );
      const description = descriptionTag?.content ?? "";
      expect(title.length).toBeGreaterThan(0);
      expect(description.length).toBeGreaterThan(0);
      if (locale === "en") {
        expect(title).not.toMatch(ARABIC);
        expect(description).not.toMatch(ARABIC);
      }
    }
  });

  it("uses mission copy chrome keys for non-Egyptian locales", () => {
    expect(getUiString("en", "mission.copy.cta")).not.toMatch(ARABIC);
    expect(getUiString("ar-MSA", "mission.copy.cta")).toMatch(ARABIC);
    expect(getUiString("ar-Gulf", "mission.copy.done")).toMatch(ARABIC);
  });

  it("keeps continuity locale-safe for en and ar-MSA", () => {
    const options = {
      hasNext: true,
      nextTitle: "Next lesson title",
      pathTitle: "Builder",
    };
    expect(getContinuityForLocale("en", "intro-m1-l1-what-is-ai", options)).not.toMatch(
      ARABIC,
    );
    expect(
      getContinuityForLocale("ar-MSA", "intro-m1-l1-what-is-ai", options),
    ).not.toContain("فتحت أول AI ليك");
  });

  it("passes locale leak scan after Batch 6 parity cleanup", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
