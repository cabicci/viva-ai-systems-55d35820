import { describe, expect, it } from "vitest";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";
import { runFragmentLocalizationPipeline } from "../../../scripts/locale-lessons/lib/fragment-localization-pipeline.ts";
import {
  finalizeLearnerFacingLocalePackageForWrite,
  finalizePhase13PilotLessonForWrite,
} from "../../../scripts/locale-lessons/lib/phase13-pilot-lesson-output.ts";
import { lockPackageTitleToLocaleIndex } from "../../../scripts/locale-lessons/lib/lesson-title-index.ts";
import type {
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";

const PILOT_LESSON_ID = "intro-m1-l1-what-is-ai";

/**
 * Canonical internal production-reference section used by sanitization tests.
 * Runtime ar-MSA packages no longer ship this block (Phase 13B promotion);
 * inject it in-test so finalize behavior stays covered without weakening
 * production-leak assertions.
 */
const INTERNAL_PRODUCTION_VIDEO_SECTION = {
  role: "Video block (production reference only)",
  heading: "Video block (production reference only)",
  contentMarkdown: "> في الإنتاج: فيديو Bunny. **لا يُعاد توليده.**",
  bullets: [] as string[],
  tables: [] as [],
};

function withInternalProductionVideoSection(
  source: LocalizedLessonPackage,
): LocalizedLessonPackage {
  const sections = [...source.sections];
  const closeIdx = sections.findIndex((section) =>
    /confidence close/i.test(section.role),
  );
  const insertAt = closeIdx >= 0 ? closeIdx : sections.length;
  sections.splice(insertAt, 0, { ...INTERNAL_PRODUCTION_VIDEO_SECTION });
  return { ...source, sections };
}

describe("learner-facing locale package finalization", () => {
  it("locks EN package title to lesson-titles.json index", async () => {
    const source = await loadMsaLessonPackage("builder-m6-l1-idea-to-page");
    const pipeline = runFragmentLocalizationPipeline(source, "en");
    const drifted: AdaptedLessonPackage = {
      ...pipeline.artifact,
      title: "From Idea to Page",
    };

    const { sanitized, errors } = finalizeLearnerFacingLocalePackageForWrite(drifted);

    expect(errors).toEqual([]);
    expect(sanitized.title).toBe("Idea to Page");
  });

  it("locks ar-Gulf package title to lesson-titles.json index", async () => {
    const source = await loadMsaLessonPackage(PILOT_LESSON_ID);
    const pipeline = runFragmentLocalizationPipeline(source, "ar-Gulf");
    const drifted: AdaptedLessonPackage = {
      ...pipeline.artifact,
      title: "وش هو الذكاء الاصطناعي",
    };

    const { sanitized, errors } = finalizeLearnerFacingLocalePackageForWrite(drifted);

    expect(errors).toEqual([]);
    expect(sanitized.title).toBe("ما هو الذكاء الاصطناعي");
  });

  it("fails with a clear error when the title index entry is missing", () => {
    const { errors } = lockPackageTitleToLocaleIndex(
      { lessonId: "nonexistent-lesson-id-for-title-lock", title: "Drift Title" },
      "en",
    );

    expect(errors).toEqual([
      "en nonexistent-lesson-id-for-title-lock: missing title in lesson-titles.json",
    ]);
  });

  it("does not mutate canonical ar-MSA source when finalizing a clone", async () => {
    const source = withInternalProductionVideoSection(
      await loadMsaLessonPackage(PILOT_LESSON_ID),
    );
    const snapshot = structuredClone(source);

    finalizeLearnerFacingLocalePackageForWrite(structuredClone(source));

    expect(source).toEqual(snapshot);
    expect(
      source.sections.some((section) => section.role.includes("Video block")),
    ).toBe(true);
  });

  it("sanitizes and title-locks learner-facing ar-MSA output", async () => {
    const source = withInternalProductionVideoSection(
      await loadMsaLessonPackage(PILOT_LESSON_ID),
    );
    const drifted = structuredClone(source);
    drifted.title = "وش هو الذكاء الاصطناعي";

    const { sanitized, errors } = finalizeLearnerFacingLocalePackageForWrite(drifted);

    expect(errors).toEqual([]);
    expect(sanitized.title).toBe(source.title);
    expect(
      sanitized.sections.some((section) => section.role.includes("Video block")),
    ).toBe(false);
  });

  it("finalizePhase13PilotLessonForWrite remains compatible with title lock", async () => {
    const source = await loadMsaLessonPackage(PILOT_LESSON_ID);
    const pipeline = runFragmentLocalizationPipeline(source, "en");
    const { sanitized, errors } = finalizePhase13PilotLessonForWrite(pipeline.artifact);

    expect(errors).toEqual([]);
    expect(sanitized.title).toBe("What Is AI");
  });
});
