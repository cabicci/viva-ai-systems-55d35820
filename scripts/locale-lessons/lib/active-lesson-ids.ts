import { ARCHIVED_LESSON_ID_SET } from "../../../src/lib/archived-lessons.ts";
import { INTRO_LESSON_CONTENT_KEYS } from "../../../src/components/intro/lessons/lesson-registry.ts";

export function activeLessonIds(): string[] {
  return INTRO_LESSON_CONTENT_KEYS.filter((id) => !ARCHIVED_LESSON_ID_SET.has(id)).sort();
}

export function activeLessonIdSet(): Set<string> {
  return new Set(activeLessonIds());
}
