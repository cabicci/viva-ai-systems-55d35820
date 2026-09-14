import { describe, expect, it } from "vitest";
import {
  INTRO_LESSON_CONTENT_KEYS,
  loadIntroLessonContent,
} from "@/components/intro/lessons/lesson-registry";
import {
  adaptPackageMissionsFromSections,
  packageMissionId,
} from "@/lib/locale-lessons/adapt-package-to-live-mission";
import { loadLocalePackageLesson } from "@/lib/locale-lessons/load-locale-package-lesson";
import {
  resolveCanonicalMissionEvaluationSource,
  type MissionEvaluationLocale,
} from "@/lib/mission-evaluation-source.server";

describe("canonical mission evaluation source", () => {
  it("resolves every current ar-EG rubric mission from the real lesson registry", async () => {
    let resolvedCount = 0;
    for (const lessonId of INTRO_LESSON_CONTENT_KEYS) {
      const content = await loadIntroLessonContent(lessonId);
      for (const section of content ?? []) {
        if (section.block.kind !== "mission" || !section.block.rubric?.length) continue;
        const missionId =
          section.block.missionId ??
          packageMissionId(section.block.lessonId ?? lessonId);
        const resolved = await resolveCanonicalMissionEvaluationSource({
          locale: "ar-EG",
          lessonId: section.block.lessonId ?? lessonId,
          missionId,
        });
        expect(resolved.missionId).toBe(missionId);
        expect(resolved.missionPrompt).toBe(section.block.prompt.trim());
        expect(resolved.rubric).toEqual(
          section.block.rubric.map((row) => ({
            label: row.label.trim(),
            weight: row.weight,
            criteria: row.criteria.map((criterion) => criterion.trim()),
          })),
        );
        resolvedCount += 1;
      }
    }
    expect(resolvedCount).toBe(104);
  });

  it.each(["ar-MSA", "ar-Gulf", "en"] as const)(
    "resolves the real %s package mission without cross-locale fallback",
    async (locale) => {
      const lessonId = "intro-m1-l2-first-prompt";
      const pkg = await loadLocalePackageLesson(locale, lessonId);
      expect(pkg).not.toBeNull();
      const expected = adaptPackageMissionsFromSections(lessonId, pkg!.sections)[0]!;
      const resolved = await resolveCanonicalMissionEvaluationSource({
        locale,
        lessonId,
        missionId: expected.missionId,
      });
      expect(resolved.lessonTitle).toBe(pkg!.title.trim());
      expect(resolved.missionPrompt).toBe(expected.prompt.trim());
      expect(resolved.rubric).toEqual(expected.rubric);
    },
  );

  it("rejects unavailable, mismatched, and unsupported source keys", async () => {
    await expect(
      resolveCanonicalMissionEvaluationSource({
        locale: "ar-EG",
        lessonId: "intro-m1-l2-first-prompt",
        missionId: "tampered::mission",
      }),
    ).rejects.toThrow("does not contain the requested mission");

    await expect(
      resolveCanonicalMissionEvaluationSource({
        locale: "en",
        lessonId: "missing-lesson",
        missionId: "missing-lesson::mission",
      }),
    ).rejects.toThrow("does not contain the requested localized lesson");

    await expect(
      resolveCanonicalMissionEvaluationSource({
        locale: "invalid" as MissionEvaluationLocale,
        lessonId: "intro-m1-l2-first-prompt",
        missionId: "intro-m1-l2-first-prompt::mission",
      }),
    ).rejects.toThrow("unsupported locale");
  });
});
