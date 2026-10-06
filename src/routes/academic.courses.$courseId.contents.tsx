import { createFileRoute } from "@tanstack/react-router";
import { AcademicCataloguePage } from "@/components/academic-education/AcademicCataloguePage";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/academic/courses/$courseId/contents")({
  validateSearch: parseLocaleSearchParam,
  component: Page,
});
function Page() {
  const { courseId } = Route.useParams();
  return <AcademicCataloguePage courseId={courseId} contents />;
}
