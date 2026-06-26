import { geoLocaleEnabled } from "./feature-flags";
import { resolveGeoLocale } from "./resolve-geo-locale";
import { resolveLocale } from "./resolve-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

export type PublicLocaleSource =
  | "url"
  | "cookie"
  | "user-preference"
  | "geo"
  | "default";

export type ResolvedPublicLocale = {
  locale: SupportedLocale;
  source: PublicLocaleSource;
};

export type ResolvePublicLocaleInput = {
  urlLocale?: string | null;
  cookieLocale?: string | null;
  /** Authenticated user preference — only honored when already provided by caller. */
  userPreferenceLocale?: string | null;
  /** ISO country from request geo headers (SSR first visit). */
  countryCode?: string | null;
};

/**
 * Phase 10 locale precedence:
 * 1. URL ?locale=
 * 2. Manual cookie masaarat_locale
 * 3. User preference (placeholder — only when caller supplies it)
 * 4. Geo/IP country
 * 5. Safe default (ar-EG)
 */
export function resolvePublicLocale(
  input: ResolvePublicLocaleInput,
): ResolvedPublicLocale {
  if (input.urlLocale != null && input.urlLocale.trim() !== "") {
    return {
      locale: resolveLocale(input.urlLocale),
      source: "url",
    };
  }

  if (input.cookieLocale != null && input.cookieLocale.trim() !== "") {
    return {
      locale: resolveLocale(input.cookieLocale),
      source: "cookie",
    };
  }

  if (
    input.userPreferenceLocale != null &&
    input.userPreferenceLocale.trim() !== ""
  ) {
    return {
      locale: resolveLocale(input.userPreferenceLocale),
      source: "user-preference",
    };
  }

  if (geoLocaleEnabled && input.countryCode != null && input.countryCode.trim() !== "") {
    const geoLocale = resolveGeoLocale(input.countryCode);
    if (geoLocale) {
      return { locale: geoLocale, source: "geo" };
    }
  }

  return {
    locale: DEFAULT_LOCALE,
    source: "default",
  };
}
