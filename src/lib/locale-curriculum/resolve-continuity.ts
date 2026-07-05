import { getContinuity, LESSON_CONTINUITY } from "@/components/intro/lesson-continuity";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

export interface ContinuityOptions {
  nextTitle?: string;
  pathTitle?: string;
  hasNext: boolean;
}

/**
 * Sparse per-locale continuity overrides (Batch 2 hybrid).
 * Populate from `{locale}/continuity.json` when per-lesson copy is added — not required for templates.
 */
export const CONTINUITY_BY_LOCALE: Partial<
  Record<Exclude<SupportedLocale, "ar-EG">, Record<string, string>>
> = {};

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function packageLocaleContinuity(
  locale: Exclude<SupportedLocale, "ar-EG">,
  lessonId: string,
  options: ContinuityOptions,
): string {
  const override = CONTINUITY_BY_LOCALE[locale]?.[lessonId]?.trim();
  if (override) return override;

  const { nextTitle, pathTitle, hasNext } = options;

  if (hasNext && nextTitle) {
    return interpolate(getUiString(locale, "learn.continuity.bridgeWithNext"), {
      nextTitle,
    });
  }
  if (pathTitle) {
    return interpolate(getUiString(locale, "learn.continuity.pathComplete"), {
      pathTitle,
    });
  }
  return getUiString(locale, "learn.continuity.lessonComplete");
}

/**
 * Locale-aware continuity bridge for the learn route "Next up" card.
 * ar-EG uses the canonical Egyptian LESSON_CONTINUITY map; other locales use ui.json templates.
 */
export function getContinuityForLocale(
  locale: SupportedLocale,
  lessonId: string,
  options: ContinuityOptions,
): string {
  if (locale === "ar-EG") {
    return getContinuity(lessonId, options.nextTitle, options.pathTitle);
  }
  return packageLocaleContinuity(locale, lessonId, options);
}

/** Exported for tests — ar-EG canonical map size. */
export { LESSON_CONTINUITY };
