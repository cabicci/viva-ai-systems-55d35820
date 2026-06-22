import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import type { ResolvedLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import { isPackageLocale } from "@/lib/locale-lessons/registry";
import { resolveLocale } from "@/lib/locale/resolve-locale";

export type LessonNavFrom = "dashboard" | "curriculum";

export interface LessonPreviewSearch {
  from?: LessonNavFrom;
  locale?: string;
  previewLocale: boolean;
}

function readPreviewLocaleFlag(raw: unknown): boolean {
  return raw === true || raw === 1 || raw === "1" || raw === "true";
}

/** Parse `/learn/...` search params for optional internal locale preview. */
export function parseLessonPreviewSearch(
  raw: Record<string, unknown>,
): LessonPreviewSearch {
  const from =
    raw.from === "curriculum" || raw.from === "dashboard" ? raw.from : undefined;
  const locale =
    typeof raw.locale === "string" && raw.locale.trim() !== ""
      ? raw.locale.trim()
      : undefined;

  return {
    from,
    locale,
    previewLocale: readPreviewLocaleFlag(raw.previewLocale),
  };
}

/** True only when both preview flag and a package locale are explicitly set. */
export function isLessonLocalePreviewActive(search: LessonPreviewSearch): boolean {
  if (!search.previewLocale || !search.locale) return false;
  return isPackageLocale(resolveLocale(search.locale));
}

/**
 * Resolve lesson content access for live routes.
 * Default and `?locale=` without preview stay on ar-EG.
 */
export function resolveRouteLessonAccess(
  lessonId: string,
  search: LessonPreviewSearch,
): ResolvedLessonAccess {
  if (!isLessonLocalePreviewActive(search)) {
    return resolveLessonAccess(lessonId);
  }

  return resolveLessonAccess(lessonId, search.locale, {
    internalTestOverride: true,
  });
}
