import { PATHS, type PathId } from "../../../src/lib/curriculum-data.ts";
import { REQUIRED_LESSON_COUNT } from "../../../src/lib/locale-lessons/types.ts";
import { loadMsaManifest } from "./source-package.ts";
import { SAMPLE_LESSON_IDS } from "./sample-lesson-ids.ts";

/** Default Phase 13A pilot batch size (workflow_dispatch). */
export const PHASE13_DEFAULT_PILOT_COUNT = 10;

/** Hard cap for Phase 13A — never generate the full 300-lesson matrix in one run. */
export const PHASE13_MAX_PILOT_COUNT = 20;

export const PHASE13_MIN_PILOT_COUNT = 3;

export type Phase13SourceScope = "ar-MSA";

export const PHASE13_SOURCE_SCOPES = ["ar-MSA"] as const satisfies readonly Phase13SourceScope[];

export function clampPhase13PilotCount(count: number | undefined): number {
  const parsed =
    count === undefined || Number.isNaN(count)
      ? PHASE13_DEFAULT_PILOT_COUNT
      : Math.floor(count);

  return Math.min(
    PHASE13_MAX_PILOT_COUNT,
    Math.max(PHASE13_MIN_PILOT_COUNT, parsed),
  );
}

function pathIdForLessonId(lessonId: string): PathId | null {
  for (const path of PATHS) {
    for (const mod of path.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) return path.id;
      }
    }
  }
  return null;
}

/**
 * Deterministic cross-path pilot selection:
 * 1) Phase 2C sample lessons (intro · builder · business),
 * 2) round-robin first unused lesson from each path in PATHS order,
 * 3) fill remainder from ar-MSA manifest order.
 */
export async function selectPhase13PilotLessonIds(input: {
  count?: number;
  lessonIdsOverride?: string[];
}): Promise<string[]> {
  if (input.lessonIdsOverride?.length) {
    return [...input.lessonIdsOverride];
  }

  const clamped = clampPhase13PilotCount(input.count);
  const manifest = await loadMsaManifest();

  if (manifest.lessonIds.length !== REQUIRED_LESSON_COUNT) {
    throw new Error(
      `ar-MSA manifest must list ${REQUIRED_LESSON_COUNT} lessons, found ${manifest.lessonIds.length}`,
    );
  }

  const available = new Set(manifest.lessonIds);
  const selected: string[] = [];
  const seen = new Set<string>();

  const push = (lessonId: string) => {
    if (seen.has(lessonId) || !available.has(lessonId)) return;
    seen.add(lessonId);
    selected.push(lessonId);
  };

  for (const lessonId of SAMPLE_LESSON_IDS) {
    if (!available.has(lessonId)) {
      throw new Error(`sample lesson missing from ar-MSA manifest: ${lessonId}`);
    }
    push(lessonId);
  }

  const pathOrder = PATHS.map((p) => p.id);
  const lessonsByPath = new Map<PathId, string[]>();
  for (const lessonId of manifest.lessonIds) {
    const pathId = pathIdForLessonId(lessonId);
    if (!pathId) continue;
    const list = lessonsByPath.get(pathId) ?? [];
    list.push(lessonId);
    lessonsByPath.set(pathId, list);
  }

  let round = 0;
  while (selected.length < clamped) {
    let added = false;
    for (const pathId of pathOrder) {
      if (selected.length >= clamped) break;
      const list = lessonsByPath.get(pathId) ?? [];
      const candidate = list[round];
      if (candidate && !seen.has(candidate)) {
        push(candidate);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  for (const lessonId of manifest.lessonIds) {
    if (selected.length >= clamped) break;
    push(lessonId);
  }

  if (selected.length < clamped) {
    throw new Error(
      `could not select ${clamped} Phase 13 pilot lessons (got ${selected.length})`,
    );
  }

  return selected.slice(0, clamped);
}

export function pathsRepresented(lessonIds: readonly string[]): PathId[] {
  const paths = new Set<PathId>();
  for (const lessonId of lessonIds) {
    const pathId = pathIdForLessonId(lessonId);
    if (pathId) paths.add(pathId);
  }
  return [...paths].sort();
}
