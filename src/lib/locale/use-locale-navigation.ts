import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { LessonPreviewSearch } from "@/lib/locale-lessons/lesson-preview-search";
import { writeLocaleCookie } from "./locale-cookie";
import { buildLocaleNavigationSearch } from "./locale-search";
import { useLocale } from "./locale-context";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

const LEARN_PATH_RE = /^\/learn\/([^/]+)\/([^/]+)/;

function syncLocaleInBrowserUrl(nextLocale: SupportedLocale): void {
  const url = new URL(window.location.href);
  if (nextLocale === DEFAULT_LOCALE) {
    url.searchParams.delete("locale");
  } else {
    url.searchParams.set("locale", nextLocale);
  }
  url.searchParams.delete("previewLocale");
  window.history.replaceState(window.history.state, "", url);
}

/** Persist locale and sync `?locale=` on the current route. */
export function useLocaleNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setLocale } = useLocale();

  return (nextLocale: SupportedLocale) => {
    writeLocaleCookie(nextLocale);
    setLocale(nextLocale);

    const learnMatch = pathname.match(LEARN_PATH_RE);
    if (learnMatch) {
      const [, pathId, lessonId] = learnMatch;
      void navigate({
        to: "/learn/$pathId/$lessonId",
        params: { pathId, lessonId },
        search: (previous) =>
          buildLocaleNavigationSearch(
            previous as Record<string, unknown>,
            nextLocale,
          ) as LessonPreviewSearch,
        replace: true,
      });
      return;
    }

    syncLocaleInBrowserUrl(nextLocale);
  };
}
