import { readFileSync } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import { PACKAGE_LOCALES } from "./localization-contract-rules.ts";
import { packageDirForLocale } from "./source-package.ts";

const indexCache = new Map<string, Record<string, string>>();

/** Same path used by validate-title-index-parity-core.ts. */
export function lessonTitlesIndexPath(locale: string): string {
  return path.join(packageDirForLocale(locale), "lesson-titles.json");
}

export function loadLessonTitleIndex(locale: string): Record<string, string> {
  const cached = indexCache.get(locale);
  if (cached) return cached;

  const raw = readFileSync(lessonTitlesIndexPath(locale), "utf8");
  const index = JSON.parse(raw) as Record<string, string>;
  indexCache.set(locale, index);
  return index;
}

export function clearLessonTitleIndexCache(): void {
  indexCache.clear();
}

export function localeHasLessonTitleIndex(
  locale: string,
): locale is LessonPackageLocale {
  if (!(PACKAGE_LOCALES as readonly string[]).includes(locale)) {
    return false;
  }
  try {
    readFileSync(lessonTitlesIndexPath(locale), "utf8");
    return true;
  } catch {
    return false;
  }
}

export function lookupLessonTitleIndexEntry(
  locale: string,
  lessonId: string,
): { ok: true; title: string } | { ok: false; error: string } {
  let index: Record<string, string>;
  try {
    index = loadLessonTitleIndex(locale);
  } catch {
    return { ok: false, error: `${locale}: missing lesson-titles.json` };
  }

  const title = index[lessonId]?.trim() ?? "";
  if (!title) {
    return {
      ok: false,
      error: `${locale} ${lessonId}: missing title in lesson-titles.json`,
    };
  }

  return { ok: true, title };
}

export function lockPackageTitleToLocaleIndex<
  T extends { lessonId: string; title?: string },
>(pkg: T, locale: string): { pkg: T; errors: string[] } {
  if (!localeHasLessonTitleIndex(locale)) {
    return {
      pkg,
      errors: [`${locale}: no lesson-titles.json for learner-facing finalization`],
    };
  }

  const lookup = lookupLessonTitleIndexEntry(locale, pkg.lessonId);
  if (!lookup.ok) {
    return { pkg, errors: [lookup.error] };
  }

  return { pkg: { ...pkg, title: lookup.title }, errors: [] };
}
