import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localizedLessonsEnabled } from "@/lib/locale/feature-flags";
import { resolveLocale } from "@/lib/locale/resolve-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import {
  getPackageLessonCount,
  isLessonInLocalePackage,
} from "@/lib/locale-lessons/registry";
import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const INTERNAL = { internalTestOverride: true } as const;

function countJsonLessons(relativeDir: string): number {
  const dir = path.join(REPO_ROOT, relativeDir);
  return readdirSync(dir).filter((file) => file.endsWith(".json")).length;
}

describe("locale runtime wiring (internal override)", () => {
  it("keeps production flag off and defaults to ar-EG", () => {
    expect(localizedLessonsEnabled).toBe(false);
    expect(resolveLocale()).toBe(DEFAULT_LOCALE);

    const access = resolveLessonAccess("intro-m1-l1-what-is-ai");
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
    expect(access.fallbackUsed).toBe(false);
  });

  it("falls back unsupported locale to ar-EG", () => {
    const access = resolveLessonAccess("intro-m1-l1-what-is-ai", "fr-FR");
    expect(access.requestedLocale).toBe("ar-EG");
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("falls back ar-MSA/ar-Gulf/en to ar-EG without internal override", () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";

    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      expect(isLessonInLocalePackage(lessonId, locale)).toBe(true);
      const access = resolveLessonAccess(lessonId, locale);
      expect(access.effectiveLocale).toBe("ar-EG");
      expect(access.contentSource).toBe("egyptian-ts");
      expect(access.fallbackUsed).toBe(true);
    }
  });

  it("resolves ar-MSA canonical JSON with internal test override", () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    const access = resolveLessonAccess(lessonId, "ar-MSA", INTERNAL);

    expect(access.effectiveLocale).toBe("ar-MSA");
    expect(access.contentSource).toBe("locale-package-json");
    expect(access.contentRef).toBe(
      `src/lib/locale-lessons/ar-MSA/lessons/${lessonId}.json`,
    );
    expect(access.fallbackUsed).toBe(false);
    expect(access.available).toBe(true);
  });

  it("resolves ar-Gulf JSON with internal test override", () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";
    const access = resolveLessonAccess(lessonId, "ar-Gulf", INTERNAL);

    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(access.contentSource).toBe("locale-package-json");
    expect(access.contentRef).toBe(
      `src/lib/locale-lessons/ar-Gulf/lessons/${lessonId}.json`,
    );
    expect(access.fallbackUsed).toBe(false);
  });

  it("resolves en JSON with internal test override", () => {
    const lessonId = "builder-m6-l1-idea-to-page";
    const access = resolveLessonAccess(lessonId, "en", INTERNAL);

    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
    expect(access.contentRef).toBe(
      `src/lib/locale-lessons/en/lessons/${lessonId}.json`,
    );
    expect(access.fallbackUsed).toBe(false);
  });

  it("aligns package lesson counts at 100 for ar-MSA, ar-Gulf, and en", () => {
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      expect(getPackageLessonCount(locale)).toBe(REQUIRED_LESSON_COUNT);
      expect(countJsonLessons(`src/lib/locale-lessons/${locale}/lessons`)).toBe(
        REQUIRED_LESSON_COUNT,
      );
    }
  });
});
