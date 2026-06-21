import { REQUIRED_LESSON_COUNT } from "../../../src/lib/locale-lessons/types.ts";
import { loadMsaManifest } from "./source-package.ts";
import { SAMPLE_LESSON_COUNT, SAMPLE_LESSON_IDS } from "./sample-lesson-ids.ts";

/** Default pilot batch size for Phase 2G GitHub Actions. */
export const DEFAULT_PILOT_LESSON_COUNT = 10;

/** Hard cap — pilot batches must stay partial; never the full 100-lesson package. */
export const MAX_PILOT_LESSON_COUNT = 25;

/** Pilot batches always include the three Phase 2C sample lessons. */
export const MIN_PILOT_LESSON_COUNT = SAMPLE_LESSON_COUNT;

export function clampPilotLessonCount(count: number | undefined): number {
  const parsed =
    count === undefined || Number.isNaN(count) ? DEFAULT_PILOT_LESSON_COUNT : Math.floor(count);

  return Math.min(
    MAX_PILOT_LESSON_COUNT,
    Math.max(MIN_PILOT_LESSON_COUNT, parsed),
  );
}

/**
 * Select a stable pilot batch from ar-MSA manifest order:
 * 1) the three committed sample lessons first,
 * 2) then the next lessons from the source manifest until count is reached.
 */
export async function selectPilotLessonIds(
  count: number | undefined = DEFAULT_PILOT_LESSON_COUNT,
): Promise<string[]> {
  const clamped = clampPilotLessonCount(count);
  const manifest = await loadMsaManifest();
  const ordered = manifest.lessonIds;

  if (ordered.length !== REQUIRED_LESSON_COUNT) {
    throw new Error(
      `ar-MSA manifest must list ${REQUIRED_LESSON_COUNT} lessons, found ${ordered.length}`,
    );
  }

  const selected = new Set<string>();
  const pilotIds: string[] = [];

  for (const lessonId of SAMPLE_LESSON_IDS) {
    if (!ordered.includes(lessonId)) {
      throw new Error(`sample lesson missing from ar-MSA manifest: ${lessonId}`);
    }
    selected.add(lessonId);
    pilotIds.push(lessonId);
  }

  for (const lessonId of ordered) {
    if (pilotIds.length >= clamped) break;
    if (selected.has(lessonId)) continue;
    selected.add(lessonId);
    pilotIds.push(lessonId);
  }

  if (pilotIds.length < clamped) {
    throw new Error(
      `could not select ${clamped} pilot lessons from ar-MSA manifest (got ${pilotIds.length})`,
    );
  }

  return pilotIds.slice(0, clamped);
}
