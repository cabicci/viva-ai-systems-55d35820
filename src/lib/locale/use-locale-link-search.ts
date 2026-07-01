import { useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import { buildLocaleNavigationSearch } from "./locale-search";
import { useLocale } from "./locale-context";
import { isSupportedLocale } from "./resolve-locale";
import type { SupportedLocale } from "./types";

/**
 * Build router `search` that preserves the active locale on internal links.
 *
 * Prefers the current URL `?locale=` param over the context locale so links
 * rendered during hydration always match the URL the user is on — even before
 * the LocaleProvider has synced with cookie/geo.
 */
export function useLocaleLinkSearch() {
  const { locale: contextLocale } = useLocale();
  const urlLocale = useRouterState({
    select: (state) => {
      const raw = (state.location.search as Record<string, unknown> | undefined)
        ?.locale;
      return typeof raw === "string" && isSupportedLocale(raw.trim())
        ? (raw.trim() as SupportedLocale)
        : undefined;
    },
  });

  const effectiveLocale = urlLocale ?? contextLocale;

  return useCallback(
    (base?: Record<string, unknown>) =>
      buildLocaleNavigationSearch(base, effectiveLocale) as Record<
        string,
        unknown
      >,
    [effectiveLocale],
  );
}
