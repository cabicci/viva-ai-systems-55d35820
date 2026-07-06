import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getExpectedLearnerLessonCount } from "@/lib/shipped-lessons";
import { INTRO_LESSON_CONTENT_KEYS } from "@/components/intro/lessons/lesson-registry";
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
  getPackageLessonCount,
  isLessonInLocalePackage,
} from "@/lib/locale-lessons/registry";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";
import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function activeLessonIds(): string[] {
  return INTRO_LESSON_CONTENT_KEYS.filter((id) => !ARCHIVED_LESSON_ID_SET.has(id)).sort();
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
    expect(activeIds).toHaveLength(getExpectedLearnerLessonCount());
    expect(EGYPTIAN_LESSON_IDS).toHaveLength(INTRO_LESSON_CONTENT_KEYS.length);

    const pathLessonIds = PATHS.flatMap((pathEntry) =>
      pathEntry.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
    );
    const shippedPathIds = pathLessonIds.filter((id) =>
      INTRO_LESSON_CONTENT_KEYS.includes(id as (typeof INTRO_LESSON_CONTENT_KEYS)[number]),
    );
    expect(shippedPathIds).toHaveLength(getExpectedLearnerLessonCount());
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

  it("loads ar-Gulf packages when localized lessons are enabled (Phase 9)", () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";
    const access = resolveLessonAccess(lessonId, "ar-Gulf");

    expect(localizedLessonsEnabled).toBe(true);
    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(access.contentSource).toBe("locale-package-json");
    expect(access.fallbackUsed).toBe(false);
    expect(access.available).toBe(true);
  });

  it("loads full Gulf packages when live mode is on", () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";
    expect(isLessonInLocalePackage(lessonId, "ar-Gulf")).toBe(true);

    const access = resolveLessonAccess(lessonId, "ar-Gulf");
    expect(localizedLessonsEnabled).toBe(true);
    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(access.contentSource).toBe("locale-package-json");
    expect(access.fallbackUsed).toBe(false);
    expect(access.available).toBe(true);
  });

  it("imports full ar-Gulf and en runtime packages while staying gated off", () => {
    expect(getPackageLessonCount("ar-Gulf")).toBe(REQUIRED_LESSON_COUNT);
    expect(getPackageLessonCount("en")).toBe(REQUIRED_LESSON_COUNT);
    expect(countJsonLessons("src/lib/locale-lessons/ar-Gulf/lessons")).toBe(
      REQUIRED_LESSON_COUNT,
    );
    expect(countJsonLessons("src/lib/locale-lessons/en/lessons")).toBe(
      REQUIRED_LESSON_COUNT,
    );
    expect(getPackageLessonCount("ar-MSA")).toBe(REQUIRED_LESSON_COUNT);
  });
});
