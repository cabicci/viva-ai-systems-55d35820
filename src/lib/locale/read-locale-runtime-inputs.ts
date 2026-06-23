import { parseLocaleCookieHeader, readLocaleCookie } from "./locale-cookie";

export type LocaleRuntimeInputs = {
  urlLocale?: string;
  cookieLocale?: string;
};

/** Read URL `locale` query + cookie consistently on SSR and client. */
export async function readLocaleRuntimeInputs(): Promise<LocaleRuntimeInputs> {
  if (import.meta.env.SSR) {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const url = new URL(request.url);
    return {
      urlLocale: url.searchParams.get("locale") ?? undefined,
      cookieLocale: parseLocaleCookieHeader(request.headers.get("cookie")),
    };
  }

  const url = new URL(window.location.href);
  return {
    urlLocale: url.searchParams.get("locale") ?? undefined,
    cookieLocale: readLocaleCookie(),
  };
}
