import { useCallback } from "react";
import { buildLocaleNavigationSearch } from "./locale-search";
import { useLocale } from "./locale-context";

/** Build router `search` that preserves the active locale on internal links. */
export function useLocaleLinkSearch() {
  const { locale } = useLocale();

  return useCallback(
    (base?: Record<string, unknown>) =>
      buildLocaleNavigationSearch(base, locale) as Record<string, unknown>,
    [locale],
  );
}
