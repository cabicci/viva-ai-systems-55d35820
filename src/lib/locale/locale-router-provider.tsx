import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { LocaleDocumentSync } from "@/components/locale/LocaleDocumentSync";
import { readLocaleCookie } from "./locale-cookie";
import { LocaleProvider } from "./locale-context";
import {
  persistValidLocaleCookie,
  readUrlLocaleFromHref,
} from "./locale-search";
import { isSupportedLocale } from "./resolve-locale";
import { resolvePublicLocale } from "./resolve-public-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

function readUrlLocaleFromSearch(search: unknown): string | undefined {
  if (!search || typeof search !== "object") return undefined;
  const locale = (search as Record<string, unknown>).locale;
  return typeof locale === "string" && locale.trim() !== "" ? locale.trim() : undefined;
}

type LocaleRouterProviderProps = {
  children: ReactNode;
  initialLocale: SupportedLocale;
};

export function LocaleRouterProvider({
  children,
  initialLocale,
}: LocaleRouterProviderProps) {
  const locationHref = useRouterState({ select: (state) => state.location.href });
  const routerSearchLocale = useRouterState({
    select: (state) => readUrlLocaleFromSearch(state.location.search),
  });
  const urlLocale = useMemo(() => {
    const fromHref = readUrlLocaleFromHref(locationHref);
    if (fromHref) return fromHref;
    return routerSearchLocale;
  }, [locationHref, routerSearchLocale]);
  const [cookieLocale, setCookieLocale] = useState(() => readLocaleCookie());

  const effectiveLocale = useMemo(
    () =>
      resolvePublicLocale({
        urlLocale,
        cookieLocale,
      }).locale,
    [urlLocale, cookieLocale],
  );

  useEffect(() => {
    if (urlLocale && isSupportedLocale(urlLocale.trim())) {
      persistValidLocaleCookie(urlLocale);
      setCookieLocale(readLocaleCookie());
      return;
    }
    setCookieLocale(readLocaleCookie());
  }, [urlLocale]);

  const handleLocalePersisted = () => {
    setCookieLocale(readLocaleCookie());
  };

  return (
    <LocaleProvider
      urlLocale={urlLocale}
      cookieLocale={cookieLocale}
      initialLocale={initialLocale}
      effectiveLocale={effectiveLocale}
      onLocalePersisted={handleLocalePersisted}
    >
      <LocaleDocumentSync />
      {children}
    </LocaleProvider>
  );
}
