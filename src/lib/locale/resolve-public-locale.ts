import { geoLocaleEnabled } from "./feature-flags";
import { resolveGeoLocale } from "./resolve-geo-locale";
import { isSupportedLocale } from "./resolve-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

export type PublicLocaleSource = "url" | "cookie" | "user-preference" | "geo" | "default";

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

function canonicalLocale(value?: string | null): SupportedLocale | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  return isSupportedLocale(trimmed) ? trimmed : undefined;
}

/**
 * Phase 10 locale precedence:
 * 1. URL ?locale=
 * 2. Manual cookie masaarat_locale
 * 3. User preference (placeholder — only when caller supplies it)
 * 4. Geo/IP country
 * 5. Safe default (ar-EG)
 */
export function resolvePublicLocale(input: ResolvePublicLocaleInput): ResolvedPublicLocale {
  const urlLocale = canonicalLocale(input.urlLocale);
  if (urlLocale) {
    return {
      locale: urlLocale,
      source: "url",
    };
  }

  const cookieLocale = canonicalLocale(input.cookieLocale);
  if (cookieLocale) {
    return {
      locale: cookieLocale,
      source: "cookie",
    };
  }

  const userPreferenceLocale = canonicalLocale(input.userPreferenceLocale);
  if (userPreferenceLocale) {
    return {
      locale: userPreferenceLocale,
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
