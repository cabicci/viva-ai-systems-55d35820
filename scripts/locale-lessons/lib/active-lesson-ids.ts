import { ARCHIVED_LESSON_ID_SET } from "../../../src/lib/archived-lessons.ts";
import { INTRO_LESSON_CONTENT } from "../../../src/components/intro/lessons/index.ts";

export function activeLessonIds(): string[] {
  return Object.keys(INTRO_LESSON_CONTENT)
    .filter((id) => !ARCHIVED_LESSON_ID_SET.has(id))
    .sort();
}

export function activeLessonIdSet(): Set<string> {
  return new Set(activeLessonIds());
}
