import { getRequest } from "@tanstack/react-start/server";
import { parseLocaleCookieHeader } from "./locale-cookie";
import { readCountryCodeFromHeaders } from "./read-request-country";
import type { LocaleRuntimeInputs } from "./read-locale-runtime-inputs";

/** SSR-only cookie locale from the active request. */
export function readSsrCookieLocale(): string | undefined {
  const request = getRequest();
  return parseLocaleCookieHeader(request.headers.get("cookie"));
}

/** SSR-only geo country from the active request. */
export function readSsrRequestCountryCode(): string | undefined {
  const request = getRequest();
  return readCountryCodeFromHeaders(request.headers);
}

/** SSR-only URL locale, cookie locale, and geo country from the active request. */
export function readSsrLocaleRuntimeInputs(): LocaleRuntimeInputs {
  const request = getRequest();
  const url = new URL(request.url);
  return {
    urlLocale: url.searchParams.get("locale") ?? undefined,
    cookieLocale: parseLocaleCookieHeader(request.headers.get("cookie")),
    countryCode: readCountryCodeFromHeaders(request.headers),
  };
}
