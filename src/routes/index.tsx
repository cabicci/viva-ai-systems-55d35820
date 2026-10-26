import { createFileRoute } from "@tanstack/react-router";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { PlatformHomePage as Index } from "@/components/site/PlatformHomePage";
export { Index };

export const Route = createFileRoute("/")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    buildLocalizedPublicMeta(
      await resolveRouteHeadLocale({ searchLocale: match.search.locale }),
      "home",
    ),
  component: Index,
});
