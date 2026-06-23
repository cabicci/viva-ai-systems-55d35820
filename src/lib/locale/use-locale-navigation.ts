import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import type { LessonPreviewSearch } from "@/lib/locale-lessons/lesson-preview-search";
import { writeLocaleCookie } from "./locale-cookie";
import { buildLocaleNavigationSearch } from "./locale-search";
import { useLocale } from "./locale-context";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

const LEARN_PATH_RE = /^\/learn\/([^/]+)\/([^/]+)/;
const DASHBOARD_PATH = "/dashboard";
const CURRICULUM_PATH = "/curriculum";

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
  const router = useRouter();
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
      }).then(() => router.invalidate());
      return;
    }

    if (pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`)) {
      void navigate({
        to: DASHBOARD_PATH,
        search: (previous) =>
          buildLocaleNavigationSearch(
            previous as Record<string, unknown>,
            nextLocale,
          ),
        replace: true,
      });
      return;
    }

    if (pathname === CURRICULUM_PATH || pathname.startsWith(`${CURRICULUM_PATH}/`)) {
      void navigate({
        to: CURRICULUM_PATH,
        search: (previous) =>
          buildLocaleNavigationSearch(
            previous as Record<string, unknown>,
            nextLocale,
          ),
        replace: true,
      });
      return;
    }

    syncLocaleInBrowserUrl(nextLocale);
  };
}
