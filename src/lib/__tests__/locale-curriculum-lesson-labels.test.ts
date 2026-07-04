import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CURRICULUM_LESSON_IDS } from "@/lib/locale-curriculum/curriculum-label-keys";
import { getCurriculumLessonLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { PATHS } from "@/lib/curriculum-data";
import enLessonTitles from "@/lib/locale-lessons/en/lesson-titles.json";
import arMSALessonTitles from "@/lib/locale-lessons/ar-MSA/lesson-titles.json";
import arGulfLessonTitles from "@/lib/locale-lessons/ar-Gulf/lesson-titles.json";

const TITLE_INDEXES = {
  en: enLessonTitles as Record<string, string>,
  "ar-MSA": arMSALessonTitles as Record<string, string>,
  "ar-Gulf": arGulfLessonTitles as Record<string, string>,
} as const;

const WIRED_SOURCES = [
  "src/routes/curriculum.tsx",
  "src/routes/dashboard.tsx",
  "src/components/dashboard/ReviewsDueCard.tsx",
  "src/routes/learn.$pathId.$lessonId.tsx",
].map((path) => ({
  path,
  source: readFileSync(resolve(process.cwd(), path), "utf8"),
}));

function canonicalLessonTitle(lessonId: string): string {
  for (const path of PATHS) {
    for (const module of path.modules) {
      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.title;
    }
  }
  return lessonId;
}

describe("locale curriculum lesson labels (Phase 12.5C)", () => {
  it("covers exactly 100 active curriculum lesson IDs", () => {
    expect(CURRICULUM_LESSON_IDS).toHaveLength(100);
    expect(new Set(CURRICULUM_LESSON_IDS).size).toBe(100);
  });

  it("has 100 non-empty titles in en/ar-MSA/ar-Gulf indexes", () => {
    for (const [locale, titles] of Object.entries(TITLE_INDEXES)) {
      expect(Object.keys(titles), locale).toHaveLength(100);
      for (const lessonId of CURRICULUM_LESSON_IDS) {
        const value = titles[lessonId]?.trim();
        expect(value?.length, `${locale} ${lessonId}`).toBeGreaterThan(0);
      }
    }
  });

  it("resolves ar-EG titles from curriculum-data", () => {
    for (const lessonId of CURRICULUM_LESSON_IDS) {
      expect(getCurriculumLessonLabel("ar-EG", lessonId)).toBe(
        canonicalLessonTitle(lessonId),
      );
    }
  });

  it("falls back safely when title is missing", () => {
    expect(getCurriculumLessonLabel("en", "nonexistent-lesson-id")).toBe(
      "nonexistent-lesson-id",
    );
    expect(getCurriculumLessonLabel("ar-EG", "nonexistent-lesson-id")).toBe(
      "nonexistent-lesson-id",
    );
  });

  it("renders English titles for representative lessons", () => {
    expect(getCurriculumLessonLabel("en", "intro-m1-l1-what-is-ai")).toBe(
      "What Is AI",
    );
    expect(getCurriculumLessonLabel("en", "intro-m1-l2-first-prompt")).toBe(
      "First Prompt",
    );
    expect(getCurriculumLessonLabel("en", "intro-m1-l1-what-is-ai")).not.toBe(
      canonicalLessonTitle("intro-m1-l1-what-is-ai"),
    );
    expect(getCurriculumLessonLabel("en", "intro-m1-l1-what-is-ai")).not.toMatch(
      /[\u0600-\u06FF]/,
    );
  });

  it("does not edit curriculum-data or locale lesson packages", () => {
    const curriculumData = readFileSync(
      resolve(process.cwd(), "src/lib/curriculum-data.ts"),
      "utf8",
    );
    expect(curriculumData).toContain("AI يعني إيه فعلًا؟");

    const enPackage = readFileSync(
      resolve(
        process.cwd(),
        "src/lib/locale-lessons/en/lessons/intro-m1-l1-what-is-ai.json",
      ),
      "utf8",
    );
    expect(enPackage).toContain('"title": "What Is AI"');
  });

  it("wires learner-facing lesson titles through getCurriculumLessonLabel", () => {
    for (const { path, source } of WIRED_SOURCES) {
      expect(source, path).toContain("getCurriculumLessonLabel");
    }
  });
});
