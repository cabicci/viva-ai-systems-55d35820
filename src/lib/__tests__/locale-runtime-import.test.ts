import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localizedLessonsEnabled } from "@/lib/locale/feature-flags";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function readManifest(locale: "ar-Gulf" | "en") {
  return JSON.parse(
    readFileSync(
      path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "manifest.json"),
      "utf8",
    ),
  ) as {
    locale: string;
    packageStatus: string;
    lessonCount: number;
    importedAt?: string;
    source?: string;
  };
}

function countRuntimeLessons(locale: "ar-Gulf" | "en"): number {
  const dir = path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "lessons");
  return readdirSync(dir).filter((file) => file.endsWith(".json")).length;
}

describe("locale runtime import (gated)", () => {
  it("imports 100 lessons per target locale with full manifest status", () => {
    for (const locale of ["ar-Gulf", "en"] as const) {
      const manifest = readManifest(locale);
      expect(countRuntimeLessons(locale)).toBe(REQUIRED_LESSON_COUNT);
      expect(manifest.packageStatus).toBe("full");
      expect(manifest.lessonCount).toBe(REQUIRED_LESSON_COUNT);
      expect(manifest.locale).toBe(locale);
      expect(manifest.importedAt).toBeTruthy();
      expect(manifest.source).toContain("final-v3 sanitized import");
    }
  });

  it("keeps default runtime on ar-EG even when full packages exist", () => {
    expect(localizedLessonsEnabled).toBe(false);
    const access = resolveLessonAccess("intro-m1-l1-what-is-ai", "en");
    expect(access.requestedLocale).toBe("en");
    expect(access.effectiveLocale).toBe(DEFAULT_LOCALE);
    expect(access.contentSource).toBe("egyptian-ts");
    expect(access.fallbackUsed).toBe(true);
  });
});
