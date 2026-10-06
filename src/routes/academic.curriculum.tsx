import { createFileRoute } from "@tanstack/react-router";
import { AcademicCataloguePage } from "@/components/academic-education/AcademicCataloguePage";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/academic/curriculum")({
  validateSearch: parseLocaleSearchParam,
  head: () => ({
    meta: [
      { title: "Academic courses | Masaarat" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
function Page() {
  return <AcademicCataloguePage />;
}
