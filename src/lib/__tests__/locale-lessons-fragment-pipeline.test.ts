import path from "node:path";
import { describe, expect, it } from "vitest";
import { FRAGMENT_PROTOTYPE_LESSON_IDS } from "../../../scripts/locale-lessons/lib/localized-text-map.ts";
import { extractLocalizableFields } from "../../../scripts/locale-lessons/lib/extract-localizable-fields.ts";
import {
  getValueAtFieldPath,
  injectLocalizedFields,
} from "../../../scripts/locale-lessons/lib/inject-localized-fields.ts";
import { mockLocalizeTextMap } from "../../../scripts/locale-lessons/lib/mock-localize-text-map.ts";
import { runFragmentLocalizationPipeline } from "../../../scripts/locale-lessons/lib/fragment-localization-pipeline.ts";
import {
  validateFragmentPipelineArtifact,
  validateStructuralParity,
} from "../../../scripts/locale-lessons/lib/validate-structural-parity.ts";
import { isInternalProductionReferenceSection } from "../../../scripts/locale-lessons/lib/quality-warnings.ts";
import {
  loadMsaLessonPackage,
  readJsonFile,
} from "../../../scripts/locale-lessons/lib/source-package.ts";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

async function loadTargetReference(
  lessonId: string,
  locale: "en" | "ar-Gulf",
): Promise<LocalizedLessonPackage | undefined> {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  try {
    return await readJsonFile<LocalizedLessonPackage>(filePath);
  } catch {
    return undefined;
  }
}

describe("locale-lessons fragment localization pipeline", () => {
  it("extracts expected flat map keys for prototype lessons", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const map = extractLocalizableFields(source);

    expect(map.lessonId).toBe("intro-m1-l1-what-is-ai");
    expect(map.fields.some((field) => field.fieldPath === "title")).toBe(true);
    expect(map.fields.some((field) => field.fieldPath === "titleEn")).toBe(true);
    expect(
      map.fields.some((field) => field.fieldPath === "sections[0].heading"),
    ).toBe(true);
    expect(
      map.fields.some((field) => field.fieldPath.startsWith("sections[3].tables[0]")),
    ).toBe(true);
    expect(
      map.fields.some((field) => field.fieldPath.endsWith(".quiz.question")),
    ).toBe(true);
    expect(
      map.fields.some((field) => field.fieldType === "mission.rubric.criteria"),
    ).toBe(true);
  });

  it("excludes internal production/video sections from extraction", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const videoIndex = source.sections.findIndex((section) =>
      isInternalProductionReferenceSection(section),
    );
    expect(videoIndex).toBeGreaterThanOrEqual(0);

    const map = extractLocalizableFields(source);
    expect(
      map.fields.some((field) => field.fieldPath.startsWith(`sections[${videoIndex}]`)),
    ).toBe(false);
    expect(map.fields.every((field) => !field.sourceText.match(/Bunny/i))).toBe(true);
  });

  it("injection changes only extracted text fields and preserves structure", async () => {
    const source = await loadMsaLessonPackage("analyst-m2-l2-right-question-rule");
    const textMap = extractLocalizableFields(source);
    const localizedTextMap = mockLocalizeTextMap(textMap, { targetLocale: "en" });
    const artifact = injectLocalizedFields(
      source,
      localizedTextMap,
      "en",
      "2026-06-21T00:00:00.000Z",
    );

    const parity = validateStructuralParity(source, artifact);
    expect(parity.ok).toBe(true);

    const changedPaths = textMap.fields.filter((field) => {
      const before = getValueAtFieldPath(source, field.fieldPath);
      const after = getValueAtFieldPath(artifact, field.fieldPath);
      return before !== after;
    });
    expect(changedPaths.length).toBeGreaterThan(0);

    expect(artifact.lessonId).toBe(source.lessonId);
    expect(artifact.sections.length).toBe(source.sections.length);
    expect(artifact.sections.map((section) => section.role)).toEqual(
      source.sections.map((section) => section.role),
    );
  });

  it("preserves quiz correctIndex and option order", async () => {
    const source = await loadMsaLessonPackage("analyst-m1-l1-from-automation-to-insight");
    const result = runFragmentLocalizationPipeline(source, "en");

    const sourceQuiz = source.sections.find((section) => section.role === "Quiz")?.quiz;
    const artifactQuiz = result.artifact.sections.find(
      (section) => section.role === "Quiz",
    )?.quiz;

    expect(sourceQuiz?.correctIndex).toBe(artifactQuiz?.correctIndex);
    expect(sourceQuiz?.options.length).toBe(artifactQuiz?.options.length);
    expect(artifactQuiz?.options.map((_, index) => index)).toEqual(
      sourceQuiz?.options.map((_, index) => index),
    );
  });

  it("mock localized text injects successfully for all prototype lessons", async () => {
    for (const lessonId of FRAGMENT_PROTOTYPE_LESSON_IDS) {
      const source = await loadMsaLessonPackage(lessonId);
      const referencePackage = await loadTargetReference(lessonId, "en");
      const result = runFragmentLocalizationPipeline(source, "en", {
        referencePackage,
      });

      expect(result.textMap.fields.length).toBeGreaterThan(0);
      expect(result.localizedTextMap.fields.every((field) => field.localizedText)).toBe(
        true,
      );
      expect(result.artifact.locale).toBe("en");
      expect(result.artifact.lessonId).toBe(lessonId);
    }
  });

  it("final artifact passes structural parity and learner text quality gate for intro EN", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const referencePackage = await loadTargetReference(
      "intro-m1-l1-what-is-ai",
      "en",
    );
    expect(referencePackage).toBeDefined();

    const result = runFragmentLocalizationPipeline(source, "en", {
      referencePackage,
    });
    const validation = validateFragmentPipelineArtifact(
      source,
      result.artifact,
      "en",
    );

    expect(validation.errors).toEqual([]);
    expect(validation.ok).toBe(true);
  });

  it("final artifact passes quality gate for analyst lessons with mock fallback EN", async () => {
    for (const lessonId of [
      "analyst-m1-l1-from-automation-to-insight",
      "analyst-m2-l2-right-question-rule",
    ] as const) {
      const source = await loadMsaLessonPackage(lessonId);
      const result = runFragmentLocalizationPipeline(source, "en");
      const validation = validateFragmentPipelineArtifact(
        source,
        result.artifact,
        "en",
      );

      expect(validation.ok).toBe(true);
      expect(validation.errors).toEqual([]);
    }
  });
});
