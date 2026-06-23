import { resolveLocale } from "./resolve-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

export type PublicLocaleSource = "url" | "cookie" | "default";

export type ResolvedPublicLocale = {
  locale: SupportedLocale;
  source: PublicLocaleSource;
};

/** Phase 9 — URL locale first, cookie second, ar-EG fallback. No geo/IP. */
export function resolvePublicLocale(input: {
  urlLocale?: string | null;
  cookieLocale?: string | null;
}): ResolvedPublicLocale {
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

  return {
    locale: DEFAULT_LOCALE,
    source: "default",
  };
}
