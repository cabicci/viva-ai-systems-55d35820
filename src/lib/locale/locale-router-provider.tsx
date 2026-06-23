import { useEffect, useMemo, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { LocaleDocumentSync } from "@/components/locale/LocaleDocumentSync";
import { readLocaleCookie, writeLocaleCookie } from "./locale-cookie";
import { LocaleProvider } from "./locale-context";
import { isSupportedLocale, resolveLocale } from "./resolve-locale";
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
  const urlLocale = useRouterState({
    select: (state) => readUrlLocaleFromSearch(state.location.search),
  });
  const cookieLocale = readLocaleCookie();

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
      writeLocaleCookie(resolveLocale(urlLocale));
    }
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
