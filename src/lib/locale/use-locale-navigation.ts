import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  buildLocaleNavigationSearch,
  persistValidLocaleCookie,
} from "./locale-search";
import { useLocale } from "./locale-context";
import type { SupportedLocale } from "./types";

const LEARN_PATH_RE = /^\/learn\/([^/]+)\/([^/]+)/;
const DASHBOARD_PATH = "/dashboard";
const CURRICULUM_PATH = "/curriculum";

type LocaleNavigateOptions = {
  to?: string;
  params?: Record<string, string>;
  search: (previous: Record<string, unknown>) => Record<string, unknown>;
  replace: boolean;
};

/** Persist locale and sync `?locale=` on the current route. */
export function useLocaleNavigation() {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setLocale } = useLocale();

  const navigateWithLocale = (options: LocaleNavigateOptions) => {
    void (
      navigate as (opts: LocaleNavigateOptions) => Promise<void>
    )(options).then(() => router.invalidate());
  };

  return (nextLocale: SupportedLocale) => {
    persistValidLocaleCookie(nextLocale);
    setLocale(nextLocale);

    const nextSearch = (previous: Record<string, unknown>) =>
      buildLocaleNavigationSearch(previous, nextLocale);

    const learnMatch = pathname.match(LEARN_PATH_RE);
    if (learnMatch) {
      const [, pathId, lessonId] = learnMatch;
      navigateWithLocale({
        to: "/learn/$pathId/$lessonId",
        params: { pathId, lessonId },
        search: (previous) =>
          nextSearch(previous) as Record<string, unknown>,
        replace: true,
      });
      return;
    }

    if (pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`)) {
      navigateWithLocale({
        to: DASHBOARD_PATH,
        search: nextSearch,
        replace: true,
      });
      return;
    }

    if (pathname === CURRICULUM_PATH || pathname.startsWith(`${CURRICULUM_PATH}/`)) {
      navigateWithLocale({
        to: CURRICULUM_PATH,
        search: nextSearch,
        replace: true,
      });
      return;
    }

    navigateWithLocale({
      to: ".",
      search: nextSearch,
      replace: true,
    });
  };
}
