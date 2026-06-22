import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import { ARCHIVED_LESSON_ID_SET } from "@/lib/archived-lessons";
import { PATHS } from "@/lib/curriculum-data";
import { getLocaleFallback, isProductionEgyptianLocale } from "@/lib/locale/fallback";
import { localizedLessonsEnabled } from "@/lib/locale/feature-flags";
import { resolveLocale, isSupportedLocale } from "@/lib/locale/resolve-locale";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  SUPPORTED_LOCALES,
} from "@/lib/locale/types";
import {
  EGYPTIAN_LESSON_IDS,
  SAMPLE_PACKAGE_LESSON_LIMIT,
  getPackageLessonCount,
  isLessonInLocalePackage,
} from "@/lib/locale-lessons/registry";
import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function activeLessonIds(): string[] {
  return Object.keys(INTRO_LESSON_CONTENT)
    .filter((id) => !ARCHIVED_LESSON_ID_SET.has(id))
    .sort();
}

function countJsonLessons(relativeDir: string): number {
  const dir = path.join(REPO_ROOT, relativeDir);
  return readdirSync(dir).filter((file) => file.endsWith(".json")).length;
}

describe("locale runtime foundation", () => {
  it("defaults to ar-EG when locale is missing or unsupported", () => {
    expect(resolveLocale()).toBe("ar-EG");
    expect(resolveLocale(null)).toBe("ar-EG");
    expect(resolveLocale("")).toBe("ar-EG");
    expect(resolveLocale("de-DE")).toBe("ar-EG");
    expect(getLocaleFallback("en")).toBe("ar-EG");
  });

  it("recognizes all supported locale values", () => {
    expect(SUPPORTED_LOCALES).toEqual(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);
    for (const locale of SUPPORTED_LOCALES) {
      expect(isSupportedLocale(locale)).toBe(true);
      expect(LOCALE_META[locale].displayName).toBeTruthy();
    }
    expect(isProductionEgyptianLocale("ar-EG")).toBe(true);
    expect(isProductionEgyptianLocale("en")).toBe(false);
  });

  it("keeps shipped lesson id count unchanged", () => {
    const activeIds = activeLessonIds();
    expect(activeIds).toHaveLength(100);
    expect(EGYPTIAN_LESSON_IDS).toHaveLength(Object.keys(INTRO_LESSON_CONTENT).length);

    const pathLessonIds = PATHS.flatMap((pathEntry) =>
      pathEntry.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
    );
    const shippedPathIds = pathLessonIds.filter((id) => INTRO_LESSON_CONTENT[id]);
    expect(shippedPathIds).toHaveLength(100);
  });

  it("resolves ar-EG lesson access through the frozen TypeScript registry", () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    const access = resolveLessonAccess(lessonId);

    expect(access.requestedLocale).toBe(DEFAULT_LOCALE);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
    expect(access.fallbackUsed).toBe(false);
    expect(access.available).toBe(true);
    expect(access.contentRef).toContain(`${lessonId}.ts`);
  });

  it("falls back to ar-EG when localized lesson data is unavailable", () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";
    const access = resolveLessonAccess(lessonId, "ar-Gulf");

    expect(localizedLessonsEnabled).toBe(false);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
    expect(access.fallbackUsed).toBe(true);
    expect(access.available).toBe(true);
  });

  it("falls back to ar-EG for Gulf lessons outside the sample package", () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";
    expect(isLessonInLocalePackage(lessonId, "ar-Gulf")).toBe(false);

    const access = resolveLessonAccess(lessonId, "ar-Gulf");
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.fallbackUsed).toBe(true);
  });

  it("keeps ar-Gulf and en runtime folders sample-only (no mass import)", () => {
    expect(getPackageLessonCount("ar-Gulf")).toBe(SAMPLE_PACKAGE_LESSON_LIMIT);
    expect(getPackageLessonCount("en")).toBe(SAMPLE_PACKAGE_LESSON_LIMIT);
    expect(countJsonLessons("src/lib/locale-lessons/ar-Gulf/lessons")).toBe(
      SAMPLE_PACKAGE_LESSON_LIMIT,
    );
    expect(countJsonLessons("src/lib/locale-lessons/en/lessons")).toBe(
      SAMPLE_PACKAGE_LESSON_LIMIT,
    );
    expect(getPackageLessonCount("ar-MSA")).toBe(100);
  });
});
