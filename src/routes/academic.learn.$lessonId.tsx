import { createFileRoute } from "@tanstack/react-router";
import { AcademicLessonPage } from "@/components/academic-education/AcademicLessonPage";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/academic/learn/$lessonId")({
  validateSearch: parseLocaleSearchParam,
  head: () => ({
    meta: [{ title: "Masaarat Academic" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Page,
});
function Page() {
  const { lessonId } = Route.useParams();
  const courseId = lessonId.replace(/-M[0-9]{2}-L[0-9]{2}$/, "");
  return <AcademicLessonPage courseId={courseId} lessonId={lessonId} />;
}
