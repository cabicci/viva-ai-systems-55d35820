import { createFileRoute } from "@tanstack/react-router";
import { TechnicalCatalogue } from "@/components/site/LineCurriculum";
import { lineMeta } from "@/lib/learning-lines";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

export const Route = createFileRoute("/technical/curriculum")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(
      await resolveRouteHeadLocale({ searchLocale: match.search.locale }),
      "technicalCurriculum",
    ),
  component: TechnicalCatalogue,
});
