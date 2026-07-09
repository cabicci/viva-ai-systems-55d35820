import { describe, expect, it } from "vitest";
import { injectLocalizedFields } from "../../../scripts/locale-lessons/lib/inject-localized-fields.ts";
import { mockLocalizeTextMap } from "../../../scripts/locale-lessons/lib/mock-localize-text-map.ts";
import { extractLocalizableFields } from "../../../scripts/locale-lessons/lib/extract-localizable-fields.ts";
import { runFragmentLocalizationPipeline } from "../../../scripts/locale-lessons/lib/fragment-localization-pipeline.ts";
import {
  isGenericBadGulfTitle,
  repairGulfCatalogTitle,
} from "../../../scripts/locale-lessons/lib/repair-gulf-fragment-title.ts";
import {
  detectGulfTitleMismatchWarning,
  detectEnglishTitleMismatchWarning,
} from "../../../scripts/locale-lessons/lib/quality-warnings.ts";
import { validateFragmentPipelineArtifact } from "../../../scripts/locale-lessons/lib/validate-structural-parity.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";
import type { AdaptedLessonPackage } from "@/lib/locale-lessons/types";

function artifactWithGulfTitle(
  source: Awaited<ReturnType<typeof loadMsaLessonPackage>>,
  title: string,
): AdaptedLessonPackage {
  const textMap = extractLocalizableFields(source);
  const localizedTextMap = mockLocalizeTextMap(textMap, { targetLocale: "ar-Gulf" });
  const titleField = localizedTextMap.fields.find((field) => field.fieldPath === "title");
  if (titleField) titleField.localizedText = title;

  return injectLocalizedFields(
    source,
    localizedTextMap,
    "ar-Gulf",
    "2026-06-22T00:00:00.000Z",
  );
}

describe("Gulf fragment title repair", () => {
  it("detects generic ar-Gulf title بداية الدرس as bad", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    expect(isGenericBadGulfTitle("بداية الدرس", source)).toBe(true);
  });

  it("flags unrepaired generic Gulf title in validator", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const artifact = artifactWithGulfTitle(source, "بداية الدرس");
    const warning = detectGulfTitleMismatchWarning(source, artifact);
    expect(warning).toMatch(/orientation subtitle|generic orientation title/);
  });

  it("repairs builder-m6-l1-idea-to-page to a topic-specific Gulf title", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const artifact = artifactWithGulfTitle(source, "بداية الدرس");
    const repaired = repairGulfCatalogTitle(source, artifact);

    expect(repaired.title).toBe("من الفكرة للصفحة");
    expect(detectGulfTitleMismatchWarning(source, repaired)).toBeNull();
  });

  it("repairs analyst-m2-l1-feeling-to-question to a topic-specific Gulf title", async () => {
    const source = await loadMsaLessonPackage("analyst-m2-l1-feeling-to-question");
    const artifact = artifactWithGulfTitle(source, "بداية الدرس");
    const repaired = repairGulfCatalogTitle(source, artifact);

    expect(repaired.title).toBe("من الإحساس للسؤال");
    expect(detectGulfTitleMismatchWarning(source, repaired)).toBeNull();
  });

  it("repairs full-mode generic Gulf titles from titleEn fallback map", async () => {
    const source = await loadMsaLessonPackage("creator-m5-l2-thumbnails-captions");
    const artifact = artifactWithGulfTitle(source, "بداية الدرس");
    const repaired = repairGulfCatalogTitle(source, artifact);

    expect(repaired.title).toBe("الثمبنيلز والكابشنز");
    expect(detectGulfTitleMismatchWarning(source, repaired)).toBeNull();
    expect(validateFragmentPipelineArtifact(source, repaired, "ar-Gulf").ok).toBe(true);
  });

  it("still fails validation when generic title has no fallback map entry", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const artifact = artifactWithGulfTitle(source, "بداية الدرس");
    const unrepaired = {
      ...artifact,
      titleEn: "Unknown Catalog Topic XYZ",
    };

    const warning = detectGulfTitleMismatchWarning(source, unrepaired);
    expect(warning).toMatch(/orientation subtitle|generic orientation title/);

    const validation = validateFragmentPipelineArtifact(source, unrepaired, "ar-Gulf");
    expect(validation.ok).toBe(false);
    expect(
      validation.errors.some(
        (error) =>
          error.includes("generic orientation title") ||
          error.includes("orientation subtitle"),
      ),
    ).toBe(true);
  });

  it("leaves English title behavior unchanged", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const result = runFragmentLocalizationPipeline(source, "en");

    expect(result.artifact.locale).toBe("en");
    expect(result.artifact.title).toBeTruthy();
    expect(detectEnglishTitleMismatchWarning(source, result.artifact)).toBeNull();
    expect(repairGulfCatalogTitle(source, result.artifact)).toEqual(result.artifact);
  });

  it("passes fragment validation after Gulf title repair in pipeline", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const result = runFragmentLocalizationPipeline(source, "ar-Gulf");

    expect(result.artifact.title).toBe("من الفكرة إلى الصفحة");
    expect(result.validation.ok).toBe(true);
    expect(detectGulfTitleMismatchWarning(source, result.artifact)).toBeNull();
  });
});
