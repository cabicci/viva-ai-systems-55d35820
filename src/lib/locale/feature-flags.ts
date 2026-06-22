function readTrueFlag(value: unknown): boolean {
  return value === true || value === "true";
}

/** Phase 1A — localization runtime flags default off. */
export const localeRuntimeEnabled = false;

/** Phase 1F — preview-only; set VITE_LOCALE_UI_ENABLED=true to show LanguageSelector locally. */
export const localeUiEnabled = readTrueFlag(import.meta.env.VITE_LOCALE_UI_ENABLED);

export const localizedLessonsEnabled = false;
export const localizedVideosEnabled = false;
export const localizedRagEnabled = false;

export interface LocalizedLessonAccessOptions {
  /** Phase 3 — internal/test only; never set by live routes while flag is off. */
  internalTestOverride?: boolean;
}

/** True when resolveLessonAccess may return locale-package JSON instead of ar-EG. */
export function isLocalizedLessonAccessActive(
  options: LocalizedLessonAccessOptions = {},
): boolean {
  return localizedLessonsEnabled || options.internalTestOverride === true;
}
