import type { AcademicCourse } from "./types";
type Lesson = AcademicCourse["lessons"][number];

/** Use only the runtime catalogue's order, checking each candidate with server access. */
export async function academicAdjacentLessons(
  courses: AcademicCourse[],
  courseId: string,
  lessonId: string,
  canAccess: (lessonId: string) => Promise<boolean>,
): Promise<{ previous?: Lesson; next?: Lesson }> {
  const course = courses.find((item) => item.id === courseId);
  if (!course || new Set(course.lessons.map((item) => item.id)).size !== course.lessons.length)
    return {};
  const index = course.lessons.findIndex((item) => item.id === lessonId);
  if (index < 0) return {};
  async function firstAllowed(candidates: Lesson[]) {
    for (const candidate of candidates) {
      if (await canAccess(candidate.id)) return candidate;
    }
    return undefined;
  }
  const [previous, next] = await Promise.all([
    firstAllowed(course.lessons.slice(0, index).reverse()),
    firstAllowed(course.lessons.slice(index + 1)),
  ]);
  return { previous, next };
}
