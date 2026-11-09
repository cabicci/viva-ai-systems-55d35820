import { getRequest } from "@tanstack/react-start/server";
import { parseLocaleCookieHeader } from "./locale-cookie";
import { readCountryCodeFromHeaders } from "./read-request-country";
import type { LocaleRuntimeInputs } from "./read-locale-runtime-inputs";

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
