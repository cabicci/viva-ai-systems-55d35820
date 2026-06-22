import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import type { SupportedLocale } from "@/lib/locale/types";
import type { LessonPackageLocale } from "./types";
import arGulfManifest from "./ar-Gulf/manifest.json";
import arMsaManifest from "./ar-MSA/manifest.json";
import enManifest from "./en/manifest.json";

export type LessonContentSource = "egyptian-ts" | "locale-package-json";

export type LessonRegistryStatus = "published" | "sample" | "unavailable";

/** ar-Gulf and en remain sample-only in runtime until a later import phase. */
export const SAMPLE_PACKAGE_LESSON_LIMIT = 3;

const PACKAGE_MANIFESTS: Record<
  LessonPackageLocale,
  { lessonIds: string[]; packageStatus?: string }
> = {
  "ar-MSA": arMsaManifest,
  "ar-Gulf": arGulfManifest,
  en: enManifest,
};

const PACKAGE_LESSON_ID_SETS: Record<LessonPackageLocale, ReadonlySet<string>> = {
  "ar-MSA": new Set(arMsaManifest.lessonIds),
  "ar-Gulf": new Set(arGulfManifest.lessonIds),
  en: new Set(enManifest.lessonIds),
};

export const EGYPTIAN_LESSON_IDS: readonly string[] = Object.freeze(
  Object.keys(INTRO_LESSON_CONTENT).sort(),
);

export function isPackageLocale(
  locale: SupportedLocale,
): locale is LessonPackageLocale {
  return locale === "ar-MSA" || locale === "ar-Gulf" || locale === "en";
}

export function getPackageLessonIds(locale: LessonPackageLocale): ReadonlySet<string> {
  return PACKAGE_LESSON_ID_SETS[locale];
}

export function getPackageLessonCount(locale: LessonPackageLocale): number {
  return PACKAGE_MANIFESTS[locale].lessonIds.length;
}

export function isEgyptianLessonId(lessonId: string): boolean {
  return Object.hasOwn(INTRO_LESSON_CONTENT, lessonId);
}

export function isLessonInLocalePackage(
  lessonId: string,
  locale: LessonPackageLocale,
): boolean {
  return PACKAGE_LESSON_ID_SETS[locale].has(lessonId);
}

export function getLessonRegistryStatus(
  lessonId: string,
  locale: SupportedLocale,
): LessonRegistryStatus {
  if (locale === "ar-EG") {
    return isEgyptianLessonId(lessonId) ? "published" : "unavailable";
  }

  if (!isLessonInLocalePackage(lessonId, locale)) {
    return "unavailable";
  }

  const manifest = PACKAGE_MANIFESTS[locale];
  if (manifest.packageStatus === "sample") {
    return "sample";
  }

  return "published";
}

export function egyptianLessonContentRef(lessonId: string): string {
  return `src/components/intro/lessons/${lessonId}.ts`;
}

export function lessonPackageContentRef(
  lessonId: string,
  locale: LessonPackageLocale,
): string {
  return `src/lib/locale-lessons/${locale}/lessons/${lessonId}.json`;
}
