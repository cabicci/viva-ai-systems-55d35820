import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { LocaleDocumentSync } from "@/components/locale/LocaleDocumentSync";
import { readLocaleCookie } from "./locale-cookie";
import { LocaleProvider } from "./locale-context";
import {
  persistValidLocaleCookie,
  readClientUrlLocale,
} from "./locale-search";
import { isSupportedLocale } from "./resolve-locale";
import { resolvePublicLocale } from "./resolve-public-locale";
import type { SupportedLocale } from "./types";

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
  const routerSearchLocale = useRouterState({
    select: (state) => readUrlLocaleFromSearch(state.location.search),
  });
  const urlLocale = routerSearchLocale ?? readClientUrlLocale();
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
      setCookieLocale(urlLocale.trim() as SupportedLocale);
      return;
    }
    setCookieLocale(readLocaleCookie());
  }, [urlLocale]);

  return (
    <LocaleProvider
      urlLocale={urlLocale}
      cookieLocale={cookieLocale}
      initialLocale={initialLocale}
      effectiveLocale={effectiveLocale}
    >
      <LocaleDocumentSync />
      {children}
    </LocaleProvider>
  );
}
