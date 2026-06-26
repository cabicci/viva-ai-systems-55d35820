import { localizedLessonsEnabled } from "@/lib/locale/feature-flags";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import type { ResolvedLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import { isPackageLocale } from "@/lib/locale-lessons/registry";
import { resolveLocale } from "@/lib/locale/resolve-locale";
import { stripFalseBooleanSearchParams } from "@/lib/locale/locale-search";

export type LessonNavFrom = "dashboard" | "curriculum";

export interface LessonPreviewSearch {
  from?: LessonNavFrom;
  locale?: string;
  /** Legacy internal preview flag — only present when explicitly enabled. */
  previewLocale?: true;
}

function readPreviewLocaleFlag(raw: unknown): boolean {
  return raw === true || raw === 1 || raw === "1" || raw === "true";
}

/** Parse `/learn/...` search params for locale preview and live routing. */
export function parseLessonPreviewSearch(
  raw: Record<string, unknown>,
): LessonPreviewSearch {
  const sanitized = stripFalseBooleanSearchParams(raw);
  const from =
    sanitized.from === "curriculum" || sanitized.from === "dashboard"
      ? sanitized.from
      : undefined;
  const locale =
    typeof sanitized.locale === "string" && sanitized.locale.trim() !== ""
      ? sanitized.locale.trim()
      : undefined;

  const parsed: LessonPreviewSearch = { from, locale };
  if (readPreviewLocaleFlag(sanitized.previewLocale)) {
    parsed.previewLocale = true;
  }
  return parsed;
}

/** Legacy internal preview gate: preview flag + package locale. */
export function isLessonLocalePreviewActive(search: LessonPreviewSearch): boolean {
  if (!search.previewLocale || !search.locale) return false;
  return isPackageLocale(resolveLocale(search.locale));
}

/** True when a package locale should load (live or legacy preview). */
export function isLessonPackageLocaleActive(
  search: LessonPreviewSearch,
  cookieLocale?: string | null,
  countryCode?: string | null,
): boolean {
  const resolved = resolvePublicLocale({
    urlLocale: search.locale,
    cookieLocale,
    countryCode,
  });

  if (!isPackageLocale(resolved.locale)) {
    return false;
  }

  if (localizedLessonsEnabled) return true;
  return isLessonLocalePreviewActive(search);
}

export function buildLessonLocaleSearch(
  search: LessonPreviewSearch,
  cookieLocale?: string | null,
  countryCode?: string | null,
): { locale?: string; previewLocale?: true } | undefined {
  const urlLocale = search.locale;
  const resolved = resolvePublicLocale({ urlLocale, cookieLocale, countryCode });
  if (resolved.locale === DEFAULT_LOCALE) return undefined;

  const next: { locale: string; previewLocale?: true } = {
    locale: resolved.locale,
  };
  if (search.previewLocale) next.previewLocale = true;
  return next;
}

/**
 * Resolve lesson content access for live routes.
 * Phase 9: valid package locale via URL or cookie loads JSON without previewLocale.
 */
export function resolveRouteLessonAccess(
  lessonId: string,
  search: LessonPreviewSearch,
  cookieLocale?: string | null,
  countryCode?: string | null,
): ResolvedLessonAccess {
  const { locale: requestedLocale } = resolvePublicLocale({
    urlLocale: search.locale,
    cookieLocale,
    countryCode,
  });

  if (!isLessonPackageLocaleActive(search, cookieLocale, countryCode)) {
    return resolveLessonAccess(lessonId);
  }

  return resolveLessonAccess(lessonId, requestedLocale, {
    internalTestOverride: isLessonLocalePreviewActive(search),
  });
}

export type { ResolvedLessonAccess };
