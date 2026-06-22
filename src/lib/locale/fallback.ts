import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

/** Missing or unsupported locale content always falls back to live production. */
export function getLocaleFallback(_locale: SupportedLocale): SupportedLocale {
  return DEFAULT_LOCALE;
}

/** True when locale maps to the frozen Egyptian TypeScript lesson registry. */
export function isProductionEgyptianLocale(locale: SupportedLocale): boolean {
  return locale === DEFAULT_LOCALE;
}
