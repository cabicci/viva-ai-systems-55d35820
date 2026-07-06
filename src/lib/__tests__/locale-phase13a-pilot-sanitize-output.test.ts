import { describe, expect, it } from "vitest";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";
import { runFragmentLocalizationPipeline } from "../../../scripts/locale-lessons/lib/fragment-localization-pipeline.ts";
import {
  finalizePhase13PilotLessonForWrite,
  validateTargetLearnerPackageNoProductionLeak,
} from "../../../scripts/locale-lessons/lib/phase13-pilot-lesson-output.ts";
import { PRODUCTION_LEAK_SUBSTRINGS } from "../../../scripts/locale-lessons/lib/sanitize-final-lesson-package.ts";

const PILOT_LESSON_ID = "intro-m1-l1-what-is-ai";

describe("Phase 13A sanitize-before-write", () => {
  it("ar-MSA source retains internal Video block section by design", async () => {
    const source = await loadMsaLessonPackage(PILOT_LESSON_ID);
    expect(source.locale).toBe("ar-MSA");
    const videoBlock = source.sections.find((section) =>
      section.role.includes("Video block"),
    );
    expect(videoBlock?.contentMarkdown).toContain("في الإنتاج");
    expect(videoBlock?.contentMarkdown).toContain("Bunny");

    const leakCheck = validateTargetLearnerPackageNoProductionLeak(source, "ar-MSA");
    expect(leakCheck.ok).toBe(true);
    expect(leakCheck.errors).toEqual([]);
  });

  it("removes internal Bunny production section from final EN package", async () => {
    const source = await loadMsaLessonPackage(PILOT_LESSON_ID);
    const pipeline = runFragmentLocalizationPipeline(source, "en");
    expect(
      pipeline.artifact.sections.some((section) =>
        section.role.includes("Video block"),
      ),
    ).toBe(true);

    const { sanitized, errors } = finalizePhase13PilotLessonForWrite(pipeline.artifact);
    expect(errors).toEqual([]);
    expect(sanitized.sections.some((section) => section.role.includes("Video block"))).toBe(
      false,
    );

    const joined = JSON.stringify(sanitized);
    for (const needle of PRODUCTION_LEAK_SUBSTRINGS) {
      expect(joined).not.toContain(needle);
    }
  });

  it("removes internal Bunny production section from final ar-Gulf package", async () => {
    const source = await loadMsaLessonPackage(PILOT_LESSON_ID);
    const pipeline = runFragmentLocalizationPipeline(source, "ar-Gulf");
    const { sanitized, errors } = finalizePhase13PilotLessonForWrite(pipeline.artifact);

    expect(errors).toEqual([]);
    expect(sanitized.sections.some((section) => section.role.includes("Video block"))).toBe(
      false,
    );
    expect(JSON.stringify(sanitized)).not.toContain("في الإنتاج: فيديو Bunny");
  });

  it("validator fails target packages that retain production reference sections", async () => {
    const source = await loadMsaLessonPackage(PILOT_LESSON_ID);
    const pipeline = runFragmentLocalizationPipeline(source, "en");

    const leak = validateTargetLearnerPackageNoProductionLeak(
      pipeline.artifact,
      "en",
    );
    expect(leak.ok).toBe(false);
    expect(leak.errors.some((error) => error.includes("production reference"))).toBe(
      true,
    );
    expect(leak.errors.some((error) => error.includes("في الإنتاج"))).toBe(true);
  });
});
