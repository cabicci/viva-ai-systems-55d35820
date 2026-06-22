import { REQUIRED_LESSON_COUNT } from "../../../src/lib/locale-lessons/types.ts";
import { loadMsaManifest } from "./source-package.ts";

/**
 * Full-mode lesson ID selector.
 * Returns ALL canonical ar-MSA lesson IDs (100), in manifest order.
 * Used by the full fragment-generation workflow only.
 */
export async function selectFullLessonIds(): Promise<string[]> {
  const manifest = await loadMsaManifest();
  if (manifest.lessonIds.length !== REQUIRED_LESSON_COUNT) {
    throw new Error(
      `ar-MSA manifest must list ${REQUIRED_LESSON_COUNT} lessons, found ${manifest.lessonIds.length}`,
    );
  }
  return [...manifest.lessonIds];
}

export const FULL_LESSON_COUNT = REQUIRED_LESSON_COUNT;
