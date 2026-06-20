import { describe, expect, it } from "vitest";
import type { AdaptationTargetLocale, AdaptedLessonPackage } from "@/lib/locale-lessons/types";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";
import {
  finalizeAdaptedPackage,
  validateAdaptedLessonPackage,
} from "../../../scripts/locale-lessons/lib/validate-adapted-lesson.ts";
import { requireAnthropicApiKey } from "../../../scripts/locale-lessons/providers/types.ts";
import {
  SAMPLE_LESSON_COUNT,
  SAMPLE_LESSON_IDS,
} from "../../../scripts/locale-lessons/lib/sample-lesson-ids.ts";

describe("locale-lessons sample adaptation validation", () => {
  it("defines exactly 3 pilot sample lesson IDs", () => {
    expect(SAMPLE_LESSON_COUNT).toBe(3);
    expect(SAMPLE_LESSON_IDS).toEqual([
      "intro-m1-l1-what-is-ai",
      "builder-m6-l1-idea-to-page",
      "business-m1-l2-reactive-vs-proactive",
    ]);
  });

  it("requires ANTHROPIC_API_KEY with a clear error when missing", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => requireAnthropicApiKey()).toThrow(/Missing ANTHROPIC_API_KEY/);
    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it("validates adapted package preserves structure from ar-MSA source", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const targetLocale: AdaptationTargetLocale = "en";

    const adapted = finalizeAdaptedPackage(
      source,
      {
        ...source,
        locale: targetLocale,
        title: "What is AI?",
        summary: "AI is a helper tool — not magic.",
        sections: source.sections.map((section) => ({
          ...section,
          contentMarkdown: `Adapted: ${section.contentMarkdown.slice(0, 40)}`,
        })),
        adaptedFrom: {
          locale: "ar-MSA",
          lessonId: source.lessonId,
          canonicalVersion: source.canonicalVersion,
          sourcePackagePath: "src/lib/locale-lessons/ar-MSA/lessons/intro-m1-l1-what-is-ai.json",
        },
        generatedAt: "2026-06-20T00:00:00.000Z",
      } as AdaptedLessonPackage,
      targetLocale,
      "src/lib/locale-lessons/ar-MSA/lessons/intro-m1-l1-what-is-ai.json",
      "2026-06-20T00:00:00.000Z",
    );

    const errors = validateAdaptedLessonPackage(source, adapted, targetLocale);
    expect(errors).toEqual([]);
    expect(adapted.lessonId).toBe(source.lessonId);
    expect(adapted.pathId).toBe(source.pathId);
    expect(adapted.sections.length).toBe(source.sections.length);
  });
});
