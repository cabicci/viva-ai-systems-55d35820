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

  it("has exactly 100 unique titles per locale (en, ar-MSA, ar-Gulf)", () => {
    for (const [locale, titles] of Object.entries(TITLE_INDEXES)) {
      const values = Object.values(titles);
      expect(values.length, `${locale} count`).toBe(100);
      expect(new Set(values).size, `${locale} unique`).toBe(100);
    }
  });

  it("has no forbidden generic titles in ar-MSA / ar-Gulf", () => {
    const FORBIDDEN = new Set([
      "بداية الدرس",
      "ماذا ستفهم؟",
      "بداية المسار",
      "بداية واضحة",
      "بدء الدرس",
      "الدرس الأول",
    ]);
    for (const locale of ["ar-MSA", "ar-Gulf"] as const) {
      for (const [lid, title] of Object.entries(TITLE_INDEXES[locale])) {
        expect(FORBIDDEN.has(title), `${locale} ${lid} = "${title}"`).toBe(
          false,
        );
      }
    }
  });

  it("intro-m1 has 7 distinct titles across en / ar-MSA / ar-Gulf", () => {
    const introIds = CURRICULUM_LESSON_IDS.filter((id) =>
      id.startsWith("intro-m1-"),
    );
    expect(introIds).toHaveLength(7);
    for (const [locale, titles] of Object.entries(TITLE_INDEXES)) {
      const introTitles = introIds.map((id) => titles[id]);
      expect(new Set(introTitles).size, `${locale} intro-m1 unique`).toBe(7);
    }
  });

  it("lesson-titles.json matches each package `title` field for en / ar-MSA / ar-Gulf", () => {
    for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
      for (const [lid, indexTitle] of Object.entries(TITLE_INDEXES[locale])) {
        const pkgPath = resolve(
          process.cwd(),
          `src/lib/locale-lessons/${locale}/lessons/${lid}.json`,
        );
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
          title: string;
        };
        expect(pkg.title, `${locale} ${lid}`).toBe(indexTitle);
      }
    }
  });

  it("title index IDs exactly match active curriculum lesson IDs", () => {
    const active = new Set(CURRICULUM_LESSON_IDS);
    for (const [locale, titles] of Object.entries(TITLE_INDEXES)) {
      const ids = new Set(Object.keys(titles));
      expect(ids.size, `${locale} size`).toBe(active.size);
      for (const id of active) {
        expect(ids.has(id), `${locale} missing ${id}`).toBe(true);
      }
    }
  });

  it("does not eager-import full lesson JSON in curriculum/dashboard", () => {
    for (const { path, source } of WIRED_SOURCES) {
      expect(
        /from ["']@\/lib\/locale-lessons\/(en|ar-MSA|ar-Gulf)\/lessons\//.test(
          source,
        ),
        `${path} eager lesson import`,
      ).toBe(false);
    }
  });
});
