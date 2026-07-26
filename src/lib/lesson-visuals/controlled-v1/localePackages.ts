import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AR_EG_LESSON_TS_DIR, LOCALE_LESSONS_DIR } from "./paths";
import type { Locale } from "./types";

export interface ResolvedLocalePackage {
  locale: Locale;
  lessonId: string;
  exists: boolean;
  kind: "json" | "ts-blocks";
  path: string;
  /** Localized title (may be non-Latin; not rasterized into the composition PNG). */
  title: string | null;
  /** ASCII-safe English title, when available (rasterized into the composition PNG). */
  titleEn: string | null;
  summary: string | null;
}

export interface LocalePackageResolveOptions {
  /** Override root for JSON locale packages (tests / synthetic fixtures). */
  localeLessonsRoot?: string;
  /** Resolve ar-EG as JSON under localeLessonsRoot instead of production TS blocks. */
  treatArEgAsJsonPackage?: boolean;
}

/**
 * Resolves the source content package for a given lesson + locale.
 * - ar-MSA / ar-Gulf / en: JSON packages under src/lib/locale-lessons/{locale}/lessons/{lessonId}.json
 * - ar-EG: TS component blocks under src/components/intro/lessons/{lessonId}.ts (no locale JSON;
 *   per docs/lesson-visuals/controlled-v1/inputs/ar-eg-media-map.md `_meta.arEg` note).
 */
export function resolveLocalePackagePath(
  lessonId: string,
  locale: Locale,
  options: LocalePackageResolveOptions = {},
): { path: string; kind: "json" | "ts-blocks" } {
  const localeRoot = options.localeLessonsRoot ?? LOCALE_LESSONS_DIR;
  if (locale === "ar-EG" && !options.treatArEgAsJsonPackage) {
    return {
      path: resolve(AR_EG_LESSON_TS_DIR, `${lessonId}.ts`),
      kind: "ts-blocks",
    };
  }
  return {
    path: resolve(localeRoot, locale, "lessons", `${lessonId}.json`),
    kind: "json",
  };
}

function extractFirstTsTitle(source: string): { title: string | null } {
  // Best-effort: pull the first `title: "..."` occurrence from the TS content-block array.
  const match = source.match(/title:\s*"((?:[^"\\]|\\.)*)"/);
  if (!match) return { title: null };
  try {
    return { title: JSON.parse(`"${match[1]}"`) };
  } catch {
    return { title: match[1] };
  }
}

export function resolveLocalePackage(
  lessonId: string,
  locale: Locale,
  fallbackTitle: string | null = null,
  options: LocalePackageResolveOptions = {},
): ResolvedLocalePackage {
  const { path, kind } = resolveLocalePackagePath(lessonId, locale, options);
  const exists = existsSync(path);

  if (!exists) {
    return {
      locale,
      lessonId,
      exists,
      kind,
      path,
      title: fallbackTitle,
      titleEn: null,
      summary: null,
    };
  }

  if (kind === "ts-blocks") {
    const source = readFileSync(path, "utf8");
    const { title } = extractFirstTsTitle(source);
    return {
      locale,
      lessonId,
      exists,
      kind,
      path,
      title: title ?? fallbackTitle,
      titleEn: null,
      summary: null,
    };
  }

  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as {
    title?: string;
    titleEn?: string;
    summary?: string;
  };
  return {
    locale,
    lessonId,
    exists,
    kind,
    path,
    title: parsed.title ?? fallbackTitle,
    titleEn: parsed.titleEn ?? null,
    summary: parsed.summary ?? null,
  };
}

export function resolveAllLocalePackages(
  lessonId: string,
  locales: readonly Locale[],
  fallbackTitle: string | null = null,
): Record<Locale, ResolvedLocalePackage> {
  const out = {} as Record<Locale, ResolvedLocalePackage>;
  for (const locale of locales) {
    out[locale] = resolveLocalePackage(lessonId, locale, fallbackTitle);
  }
  return out;
}
