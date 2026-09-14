import { isSupportedLocale } from "./resolve-locale";
import { resolvePublicLocale } from "./resolve-public-locale";
import type { SupportedLocale } from "./types";

export type RouterLocaleInputs = {
  /** Client/router URL ?locale= (may be absent on SSR before router hydrates). */
  urlLocale?: string | null;
  /** Client document cookie (undefined on SSR). */
  cookieLocale?: string | null;
  /** SSR request URL ?locale= from root loader. */
  serverUrlLocale?: string | null;
  /** SSR request cookie from root loader. */
  serverCookieLocale?: string | null;
  /** SSR geo country — only when URL and cookie are both absent. */
  serverCountryCode?: string | null;
};

function pickCanonical(...values: Array<string | null | undefined>): SupportedLocale | undefined {
  for (const value of values) {
    if (value == null) {
      continue;
    }
    const trimmed = value.trim();
    if (isSupportedLocale(trimmed)) {
      return trimmed;
    }
  }
  return undefined;
}

/**
 * Resolve the shell locale for LocaleRouterProvider.
 * Merges SSR loader inputs with client router/cookie so geo never beats URL/cookie.
 */
export function resolveRouterEffectiveLocale(input: RouterLocaleInputs): SupportedLocale {
  const urlForResolve = pickCanonical(input.urlLocale, input.serverUrlLocale);
  const cookieForResolve = pickCanonical(input.cookieLocale, input.serverCookieLocale);

  return resolvePublicLocale({
    urlLocale: urlForResolve,
    cookieLocale: cookieForResolve,
    countryCode: input.serverCountryCode ?? undefined,
  }).locale;
}
