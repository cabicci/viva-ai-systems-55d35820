import { localizedLessonsEnabled } from "@/lib/locale/feature-flags";
import { getLocaleFallback } from "@/lib/locale/fallback";
import { resolveLocale } from "@/lib/locale/resolve-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/lib/locale/types";
import {
  type LessonContentSource,
  type LessonRegistryStatus,
  egyptianLessonContentRef,
  isEgyptianLessonId,
  isLessonInLocalePackage,
  isPackageLocale,
  lessonPackageContentRef,
  getLessonRegistryStatus,
} from "./registry";

export interface ResolvedLessonAccess {
  lessonId: string;
  requestedLocale: SupportedLocale;
  effectiveLocale: SupportedLocale;
  contentSource: LessonContentSource;
  contentRef: string;
  status: LessonRegistryStatus;
  fallbackUsed: boolean;
  available: boolean;
}

function resolveEgyptianAccess(
  lessonId: string,
  requestedLocale: SupportedLocale,
  forceFallback = false,
): ResolvedLessonAccess {
  const available = isEgyptianLessonId(lessonId);
  return {
    lessonId,
    requestedLocale,
    effectiveLocale: DEFAULT_LOCALE,
    contentSource: "egyptian-ts",
    contentRef: egyptianLessonContentRef(lessonId),
    status: available ? "published" : "unavailable",
    fallbackUsed: forceFallback || requestedLocale !== DEFAULT_LOCALE,
    available,
  };
}

/**
 * Internal lesson access resolver — foundation only.
 * Live routes still read INTRO_LESSON_CONTENT directly until a later phase.
 */
export function resolveLessonAccess(
  lessonId: string,
  localeInput?: string | null,
): ResolvedLessonAccess {
  const requestedLocale = resolveLocale(localeInput);

  if (!localizedLessonsEnabled || requestedLocale === DEFAULT_LOCALE) {
    return resolveEgyptianAccess(lessonId, requestedLocale);
  }

  if (!isPackageLocale(requestedLocale)) {
    return resolveEgyptianAccess(lessonId, requestedLocale, true);
  }

  if (isLessonInLocalePackage(lessonId, requestedLocale)) {
    return {
      lessonId,
      requestedLocale,
      effectiveLocale: requestedLocale,
      contentSource: "locale-package-json",
      contentRef: lessonPackageContentRef(lessonId, requestedLocale),
      status: getLessonRegistryStatus(lessonId, requestedLocale),
      fallbackUsed: false,
      available: true,
    };
  }

  const fallbackLocale = getLocaleFallback(requestedLocale);
  if (fallbackLocale !== DEFAULT_LOCALE) {
    return resolveEgyptianAccess(lessonId, requestedLocale, true);
  }

  return resolveEgyptianAccess(lessonId, requestedLocale, true);
}
