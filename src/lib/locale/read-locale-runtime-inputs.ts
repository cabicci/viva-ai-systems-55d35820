import { parseLocaleCookieHeader, readLocaleCookie } from "./locale-cookie";
import { readCountryCodeFromHeaders } from "./read-request-country";

export type LocaleRuntimeInputs = {
  urlLocale?: string;
  cookieLocale?: string;
  /** ISO country from geo headers (SSR only). */
  countryCode?: string;
};

/** Read URL `locale` query + cookie + geo country consistently on SSR and client. */
export async function readLocaleRuntimeInputs(): Promise<LocaleRuntimeInputs> {
  if (import.meta.env.SSR) {
    const modId = "@tanstack/react-start/server";
    const { getRequest } = await import(/* @vite-ignore */ modId);
    const request = getRequest();
    const url = new URL(request.url);
    return {
      urlLocale: url.searchParams.get("locale") ?? undefined,
      cookieLocale: parseLocaleCookieHeader(request.headers.get("cookie")),
      countryCode: readCountryCodeFromHeaders(request.headers),
    };
  }

  const url = new URL(window.location.href);
  return {
    urlLocale: url.searchParams.get("locale") ?? undefined,
    cookieLocale: readLocaleCookie(),
  };
}
