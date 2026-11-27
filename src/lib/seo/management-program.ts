import type { CurriculumSummary } from "@/lib/course-system/intake/client";
import { isProgramId } from "./ai-program";

export function isManagementCourse(course: Pick<CurriculumSummary, "area" | "id">) {
  return course.area === "academic" && course.id.startsWith("AC-MGT-") && isProgramId(course.id);
}

export const managementProgramPath = (id: string) =>
  `/programs/management/${encodeURIComponent(id)}`;
export const managementProgramUrl = (id: string) =>
  "https://masaarat.ai" + managementProgramPath(id);

export function managementSitemap(courses: CurriculumSummary[]) {
  const ids = [...new Set(courses.filter(isManagementCourse).map((course) => course.id))].sort();
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ids.map((id) => `  <url><loc>${managementProgramUrl(id)}</loc></url>`).join("\n") +
    "\n</urlset>\n"
  );
}
