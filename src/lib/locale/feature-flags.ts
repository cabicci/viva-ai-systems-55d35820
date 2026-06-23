function readTrueFlag(value: unknown): boolean {
  return value === true || value === "true";
}

function readFeatureFlag(value: unknown, defaultEnabled: boolean): boolean {
  if (value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  return defaultEnabled;
}

/** Phase 1A — master kill switch; follows localized lessons in Phase 9. */
export const localeRuntimeEnabled = readFeatureFlag(
  import.meta.env.VITE_LOCALE_RUNTIME_ENABLED,
  readFeatureFlag(import.meta.env.VITE_LOCALIZED_LESSONS_ENABLED, true),
);

/** Phase 9 — manual selector; disable with VITE_LOCALE_UI_ENABLED=false. */
export const localeUiEnabled = readFeatureFlag(
  import.meta.env.VITE_LOCALE_UI_ENABLED,
  true,
);

/** Phase 9 — live package lessons via ?locale= and cookie; disable for rollback. */
export const localizedLessonsEnabled = readFeatureFlag(
  import.meta.env.VITE_LOCALIZED_LESSONS_ENABLED,
  true,
);

export const localizedVideosEnabled = false;
export const localizedRagEnabled = false;

export interface LocalizedLessonAccessOptions {
  /** Legacy internal preview escape hatch while localizedLessonsEnabled is off. */
  internalTestOverride?: boolean;
}

/** True when resolveLessonAccess may return locale-package JSON instead of ar-EG. */
export function isLocalizedLessonAccessActive(
  options: LocalizedLessonAccessOptions = {},
): boolean {
  return localizedLessonsEnabled || options.internalTestOverride === true;
}
