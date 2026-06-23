import { useNavigate, useRouterState } from "@tanstack/react-router";
import { writeLocaleCookie } from "./locale-cookie";
import { useLocale } from "./locale-context";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

/** Persist locale and sync `?locale=` on lesson routes when practical. */
export function useLocaleNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setLocale } = useLocale();

  return (nextLocale: SupportedLocale) => {
    writeLocaleCookie(nextLocale);
    setLocale(nextLocale);

    if (!pathname.startsWith("/learn/")) return;

    void navigate({
      to: pathname,
      search: (previous: Record<string, unknown>) => {
        const base =
          previous && typeof previous === "object" ? previous : {};
        const nextSearch = { ...base };
        if (nextLocale === DEFAULT_LOCALE) {
          delete nextSearch.locale;
        } else {
          nextSearch.locale = nextLocale;
        }
        return nextSearch;
      },
      replace: true,
    });
  };
}
