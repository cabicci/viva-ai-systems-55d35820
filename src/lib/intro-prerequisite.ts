import type { CurriculumPath } from "@/lib/curriculum-data";

/** Prerequisites count all available lessons, including those without a route. */
export function selectIntroPrerequisiteLessons(modules: CurriculumPath["modules"]) {
  return modules.flatMap((module) => module.lessons).filter((lesson) => lesson.state === "available");
}
