import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

/** Old bookmarks return to lesson selection; tutoring is available inside each authorized lesson. */
export const Route = createFileRoute("/ai-assistant")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: async ({ search }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: search.locale });
    throw redirect({ to: "/my-learning", search: { locale }, replace: true });
  },
});
