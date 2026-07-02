import { readLocaleCookie } from "./locale-cookie";

export type LocaleRuntimeInputs = {
  urlLocale?: string;
  cookieLocale?: string;
  /** ISO country from geo headers (SSR only). */
  countryCode?: string;
};

/** Read URL `locale` query + cookie + geo country consistently on SSR and client. */
export async function readLocaleRuntimeInputs(): Promise<LocaleRuntimeInputs> {
  if (import.meta.env.SSR) {
    try {
      const { readSsrLocaleRuntimeInputs } = await import(
        "./locale-ssr-request.server"
      );
      return readSsrLocaleRuntimeInputs();
    } catch {
      return {};
    }
  }

  if (typeof window === "undefined") {
    return {};
  }
  const url = new URL(window.location.href);
  return {
    urlLocale: url.searchParams.get("locale") ?? undefined,
    cookieLocale: readLocaleCookie(),
  };
}
