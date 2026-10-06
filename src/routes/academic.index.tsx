import { createFileRoute } from "@tanstack/react-router";
import { AcademicOverviewPage } from "@/components/academic-education/AcademicOverviewPage";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/academic/")({
  validateSearch: parseLocaleSearchParam,
  head: () => ({
    meta: [{ title: "Masaarat Academic" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Page,
});
function Page() {
  return <AcademicOverviewPage />;
}
