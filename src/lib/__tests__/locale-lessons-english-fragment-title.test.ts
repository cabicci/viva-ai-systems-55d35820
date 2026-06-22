import { describe, expect, it } from "vitest";
import { injectLocalizedFields } from "../../../scripts/locale-lessons/lib/inject-localized-fields.ts";
import { mockLocalizeTextMap } from "../../../scripts/locale-lessons/lib/mock-localize-text-map.ts";
import { extractLocalizableFields } from "../../../scripts/locale-lessons/lib/extract-localizable-fields.ts";
import { repairEnglishCatalogTitle } from "../../../scripts/locale-lessons/lib/repair-english-fragment-title.ts";
import { repairGulfCatalogTitle } from "../../../scripts/locale-lessons/lib/repair-gulf-fragment-title.ts";
import {
  detectEnglishTitleMismatchWarning,
  detectGulfTitleMismatchWarning,
} from "../../../scripts/locale-lessons/lib/quality-warnings.ts";
import {
  validateFragmentPipelineArtifact,
  validateStructuralParity,
} from "../../../scripts/locale-lessons/lib/validate-structural-parity.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";

function artifactWithEnglishTitle(
  source: Awaited<ReturnType<typeof loadMsaLessonPackage>>,
  title: string,
) {
  const textMap = extractLocalizableFields(source);
  const localizedTextMap = mockLocalizeTextMap(textMap, { targetLocale: "en" });
  const titleField = localizedTextMap.fields.find((field) => field.fieldPath === "title");
  if (titleField) titleField.localizedText = title;

  return injectLocalizedFields(
    source,
    localizedTextMap,
    "en",
    "2026-06-22T00:00:00.000Z",
  );
}

describe("English fragment title repair", () => {
  it('repairs generic English title "Lesson Start" to titleEn', async () => {
    const source = await loadMsaLessonPackage("analyst-m1-l1-from-automation-to-insight");
    const artifact = artifactWithEnglishTitle(source, "Lesson Start");
    const repaired = repairEnglishCatalogTitle(source, artifact);

    expect(repaired.title).toBe("From Automation to Insight");
    expect(detectEnglishTitleMismatchWarning(source, repaired)).toBeNull();
  });

  it("repairs analyst-m1-l1-from-automation-to-insight to From Automation to Insight", async () => {
    const source = await loadMsaLessonPackage("analyst-m1-l1-from-automation-to-insight");
    const artifact = artifactWithEnglishTitle(source, "Lesson Start");
    const repaired = repairEnglishCatalogTitle(source, artifact);

    expect(repaired.title).toBe(source.titleEn);
    expect(repaired.title).toBe("From Automation to Insight");
  });

  it("still fails validation when title does not equal titleEn without repair", async () => {
    const source = await loadMsaLessonPackage("analyst-m1-l1-from-automation-to-insight");
    const artifact = artifactWithEnglishTitle(source, "Wrong Catalog Title");

    expect(detectEnglishTitleMismatchWarning(source, artifact)).toMatch(/must match titleEn/);

    const validation = validateFragmentPipelineArtifact(source, artifact, "en");
    expect(validation.ok).toBe(false);
  });

  it("leaves ar-Gulf title repair behavior unchanged", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const textMap = extractLocalizableFields(source);
    const localizedTextMap = mockLocalizeTextMap(textMap, { targetLocale: "ar-Gulf" });
    const titleField = localizedTextMap.fields.find((field) => field.fieldPath === "title");
    if (titleField) titleField.localizedText = "بداية الدرس";

    const gulfArtifact = injectLocalizedFields(
      source,
      localizedTextMap,
      "ar-Gulf",
      "2026-06-22T00:00:00.000Z",
    );
    const repaired = repairGulfCatalogTitle(source, gulfArtifact);

    expect(repaired.title).toBe("من الفكرة للصفحة");
    expect(repairEnglishCatalogTitle(source, repaired)).toEqual(repaired);
    expect(detectGulfTitleMismatchWarning(source, repaired)).toBeNull();
  });

  it("preserves structure and quiz correctIndex after English title repair", async () => {
    const source = await loadMsaLessonPackage("analyst-m1-l1-from-automation-to-insight");
    const artifact = artifactWithEnglishTitle(source, "Lesson Start");
    const repaired = repairEnglishCatalogTitle(source, artifact);
    const parity = validateStructuralParity(source, repaired);

    expect(parity.ok).toBe(true);
    expect(repaired.title).toBe("From Automation to Insight");

    const sourceQuiz = source.sections.find((section) => section.role === "Quiz")?.quiz;
    const repairedQuiz = repaired.sections.find((section) => section.role === "Quiz")?.quiz;
    expect(sourceQuiz?.correctIndex).toBe(repairedQuiz?.correctIndex);
    expect(sourceQuiz?.options.length).toBe(repairedQuiz?.options.length);

    const validation = validateFragmentPipelineArtifact(source, repaired, "en");
    expect(validation.ok).toBe(true);
  });
});
