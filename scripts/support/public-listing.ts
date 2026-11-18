// Dev-time builder for the support bot's anonymous AI-path listing. It is the ONLY place that
// reads the curriculum structure for support, and it emits nothing but allowlisted public
// listing fields: program id/name, visible lesson id/title, free-vs-plan access and the
// lesson's navigation route. It never touches the lesson content registry's loaders.
// The support runtime imports only the generated JSON, never this file.
import { PATHS } from "../../src/lib/curriculum-data";
import {
  getCurriculumLessonLabel,
  getCurriculumPathLabel,
} from "../../src/lib/locale-curriculum/resolve-curriculum-label";
import { isLessonIncludedInTier } from "../../src/lib/plan-entitlements";

export type PublicListing = {
  programs: { id: string; name: { ar: string; en: string } }[];
  lessons: {
    id: string;
    program: string;
    title: { ar: string; en: string };
    access: "free" | "plan";
    route: string;
  }[];
};

export function buildPublicListing(): PublicListing {
  const programs: PublicListing["programs"] = [];
  const lessons: PublicListing["lessons"] = [];
  for (const path of PATHS) {
    programs.push({
      id: path.id,
      name: { ar: getCurriculumPathLabel("ar-EG", path.id, "title"), en: getCurriculumPathLabel("en", path.id, "title") },
    });
    for (const mod of path.modules)
      for (const lesson of mod.lessons) {
        if (lesson.state !== "available" || !lesson.route) continue;
        lessons.push({
          id: lesson.id,
          program: path.id,
          title: { ar: getCurriculumLessonLabel("ar-EG", lesson.id), en: getCurriculumLessonLabel("en", lesson.id) },
          access: isLessonIncludedInTier(lesson.id, "free") ? "free" : "plan",
          route: lesson.route,
        });
      }
  }
  return { programs, lessons };
}
