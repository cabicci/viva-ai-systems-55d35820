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

function pickNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (value != null && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

/**
 * Resolve the shell locale for LocaleRouterProvider.
 * Merges SSR loader inputs with client router/cookie so geo never beats URL/cookie.
 */
export function resolveRouterEffectiveLocale(
  input: RouterLocaleInputs,
): SupportedLocale {
  const urlForResolve = pickNonEmpty(input.urlLocale, input.serverUrlLocale);
  const cookieForResolve = pickNonEmpty(input.cookieLocale, input.serverCookieLocale);
  const countryForResolve =
    urlForResolve || cookieForResolve ? undefined : input.serverCountryCode ?? undefined;

  return resolvePublicLocale({
    urlLocale: urlForResolve,
    cookieLocale: cookieForResolve,
    countryCode: countryForResolve,
  }).locale;
}
