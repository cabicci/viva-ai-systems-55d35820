import { describe, expect, it } from "vitest";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { getCurriculumLessonLabel, getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { getUiString } from "@/lib/locale/ui-strings";
import { META_UI_KEYS } from "@/lib/locale/meta-ui-keys";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;
const SAMPLE_LESSON = "intro-m1-l1-what-is-ai";
const SAMPLE_PATH = "intro" as const;

describe("locale route meta (Phase 12.6 Batch 3)", () => {
  it("serves all meta keys for four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of META_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("returns no Arabic in en learn meta", () => {
    const { meta } = buildLocalizedLearnerMeta("en", "learn", {
      pathId: SAMPLE_PATH,
      lessonId: SAMPLE_LESSON,
    });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    const descriptionTag = meta.find(
      (tag): tag is { name: string; content: string } =>
        "name" in tag && tag.name === "description",
    );
    const description = descriptionTag?.content ?? "";
    expect(title).not.toMatch(ARABIC);
    expect(description).not.toMatch(ARABIC);
    expect(title).toContain("What Is AI");
    expect(title).toContain("Introduction");
  });

  it("returns no Arabic in en curriculum and dashboard meta", () => {
    for (const kind of ["curriculum", "dashboard"] as const) {
      const { meta } = buildLocalizedLearnerMeta("en", kind);
      const blob = JSON.stringify(meta);
      expect(blob, kind).not.toMatch(ARABIC);
    }
  });

  it("uses localized path and lesson labels for ar-MSA learn meta", () => {
    const pathTitle = getCurriculumPathLabel("ar-MSA", SAMPLE_PATH, "title");
    const lessonTitle = getCurriculumLessonLabel("ar-MSA", SAMPLE_LESSON);
    const { meta } = buildLocalizedLearnerMeta("ar-MSA", "learn", {
      pathId: SAMPLE_PATH,
      lessonId: SAMPLE_LESSON,
    });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    expect(title).toContain(pathTitle);
    expect(title).toContain(lessonTitle);
  });

  it("uses localized path and lesson labels for ar-Gulf learn meta", () => {
    const pathTitle = getCurriculumPathLabel("ar-Gulf", SAMPLE_PATH, "title");
    const lessonTitle = getCurriculumLessonLabel("ar-Gulf", SAMPLE_LESSON);
    const { meta } = buildLocalizedLearnerMeta("ar-Gulf", "learn", {
      pathId: SAMPLE_PATH,
      lessonId: SAMPLE_LESSON,
    });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    expect(title).toContain(pathTitle);
    expect(title).toContain(lessonTitle);
  });

  it("keeps ar-EG learn meta on canonical curriculum labels", () => {
    const pathTitle = getCurriculumPathLabel("ar-EG", SAMPLE_PATH, "title");
    const lessonTitle = getCurriculumLessonLabel("ar-EG", SAMPLE_LESSON);
    const { meta } = buildLocalizedLearnerMeta("ar-EG", "learn", {
      pathId: SAMPLE_PATH,
      lessonId: SAMPLE_LESSON,
    });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    expect(title).toBe(`${lessonTitle} — ${pathTitle}`);
    expect(title).toMatch(ARABIC);
  });

  it("interpolates lessonTitle, pathTitle, and brandSuffix placeholders", () => {
    const { meta } = buildLocalizedLearnerMeta("en", "learn", {
      pathId: "builder",
      lessonId: "builder-m1-l1-what-is-llm",
    });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    expect(title).not.toContain("{lessonTitle}");
    expect(title).not.toContain("{pathTitle}");
    expect(title).not.toContain("{brandSuffix}");
  });

  it("uses localized unknown fallback for invalid learn path", () => {
    const { meta } = buildLocalizedLearnerMeta("en", "learn", { unknownPath: true });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    expect(title).toBe(getUiString("en", "meta.learn.titleUnknown"));
    expect(title).not.toBe("Lesson");
  });

  it("prefers package title overlay when provided", () => {
    const { meta } = buildLocalizedLearnerMeta("en", "learn", {
      pathId: SAMPLE_PATH,
      lessonId: SAMPLE_LESSON,
      packageTitle: "Custom Package Title",
    });
    const title = meta.find((tag) => "title" in tag)?.title ?? "";
    expect(title).toContain("Custom Package Title");
  });

  it("passes locale leak scan after Batch 3 meta wiring", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
