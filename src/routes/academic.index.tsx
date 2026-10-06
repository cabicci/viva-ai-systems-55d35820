import { createFileRoute } from "@tanstack/react-router";
import { AcademicCataloguePage } from "@/components/academic-education/AcademicCataloguePage";
import { lineMeta } from "@/lib/learning-lines";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/academic/")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "academic"),
  component: AcademicCataloguePage,
});
