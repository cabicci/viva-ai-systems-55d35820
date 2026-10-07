import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
/** Legacy entry point; one canonical account journey, with locale preserved. */
export const Route = createFileRoute("/dashboard")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    buildLocalizedLearnerMeta(
      await resolveRouteHeadLocale({ searchLocale: match.search.locale }),
      "dashboard",
    ),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/my-learning", search, replace: true });
  },
});
