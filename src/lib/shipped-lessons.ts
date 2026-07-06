import { isArchivedLessonId } from "@/lib/archived-lessons";
import { PATHS } from "@/lib/curriculum-data";
import {
  hasIntroLessonContent,
  INTRO_LESSON_CONTENT_KEYS,
} from "@/components/intro/lessons/lesson-registry";

/** All lesson ids with shipped TypeScript content modules. */
export function getIntroLessonRegistryIds(): readonly string[] {
  return INTRO_LESSON_CONTENT_KEYS;
}

/**
 * Active learner-path lesson ids in curriculum order:
 * PATHS lessons with registry content, excluding archived Business slugs.
 */
export function getShippedLessonIdsInCurriculumOrder(): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const path of PATHS) {
    for (const mod of path.modules) {
      for (const lesson of mod.lessons) {
        if (seen.has(lesson.id)) continue;
        if (isArchivedLessonId(lesson.id)) continue;
        if (!hasIntroLessonContent(lesson.id)) continue;
        seen.add(lesson.id);
        ids.push(lesson.id);
      }
    }
  }

  return ids;
}

/** Dynamic expected count for RAG seed guards and scale checks. */
export function getExpectedLearnerLessonCount(): number {
  return getShippedLessonIdsInCurriculumOrder().length;
}

export function getActiveRegistryLessonIds(): string[] {
  return INTRO_LESSON_CONTENT_KEYS.filter((id) => !isArchivedLessonId(id)).sort();
}
