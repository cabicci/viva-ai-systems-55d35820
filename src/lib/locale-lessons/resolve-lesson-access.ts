import {
  isLocalizedLessonAccessActive,
  type LocalizedLessonAccessOptions,
} from "@/lib/locale/feature-flags";
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
import type { LessonPackageLocale } from "./types";

export type ResolveLessonAccessOptions = LocalizedLessonAccessOptions;

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

function resolvePackageAccess(
  lessonId: string,
  requestedLocale: LessonPackageLocale,
): ResolvedLessonAccess {
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

/**
 * Internal lesson access resolver.
 * Live routes use ar-EG unless `?locale=…&previewLocale=1` activates package preview.
 * Pass `{ internalTestOverride: true }` for direct test access without query params.
 */
export function resolveLessonAccess(
  lessonId: string,
  localeInput?: string | null,
  options: ResolveLessonAccessOptions = {},
): ResolvedLessonAccess {
  const requestedLocale = resolveLocale(localeInput);

  if (requestedLocale === DEFAULT_LOCALE) {
    return resolveEgyptianAccess(lessonId, requestedLocale);
  }

  if (!isLocalizedLessonAccessActive(options)) {
    return resolveEgyptianAccess(lessonId, requestedLocale, true);
  }

  if (!isPackageLocale(requestedLocale)) {
    return resolveEgyptianAccess(lessonId, requestedLocale, true);
  }

  if (isLessonInLocalePackage(lessonId, requestedLocale)) {
    return resolvePackageAccess(lessonId, requestedLocale);
  }

  return resolveEgyptianAccess(lessonId, requestedLocale, true);
}
