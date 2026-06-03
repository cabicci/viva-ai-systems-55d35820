/**
 * Builder Runtime Helpers
 * -----------------------
 * Centralizes routing + status/access computations that were previously
 * duplicated across dashboard, curriculum, and the builder path page.
 *
 * Pure functions only. No UI, no side effects, no behavior changes —
 * each helper just packages logic that already existed at the call sites.
 */

import type { LessonStatus } from "./lesson-progress";
import type { CurriculumLesson, CurriculumModule } from "./curriculum-data";

/* -------------------------------------------------------------- */
/*  getLessonHref — intro vs engine lesson routing                */
/* -------------------------------------------------------------- */

export type LessonHref =
  | { kind: "learn"; pathId: string; lessonId: string }
  | { kind: "missing"; id: string };

/**
 * Resolve the right route target for a curriculum lesson.
 * Shipped lessons all live under `/learn/{pathId}/{lessonId}` now.
 */
export function getLessonHref(lesson: {
  id: string;
  route?: string;
}): LessonHref {
  if (lesson.route?.startsWith("/learn/")) {
    const rest = lesson.route.slice("/learn/".length);
    const slash = rest.indexOf("/");
    if (slash > 0) {
      return {
        kind: "learn",
        pathId: rest.slice(0, slash),
        lessonId: rest.slice(slash + 1),
      };
    }
  }
  return { kind: "missing", id: lesson.id };
}

/* -------------------------------------------------------------- */
/*  getModuleStatus — module-level locked / available / done      */
/* -------------------------------------------------------------- */

export interface ModuleStatus {
  /** previous module finished (or no previous module) */
  prevDone: boolean;
  /** module has at least one shipped (available) lesson */
  hasAvailable: boolean;
  /** count of shipped lessons in the module */
  availableCount: number;
  /** count of completed shipped lessons */
  doneCount: number;
  /** every shipped lesson in the module is completed */
  moduleCompleted: boolean;
  /** previous module not finished yet → module is locked */
  moduleLocked: boolean;
  /** unlocked but no shipped lessons yet → "coming soon" */
  soon: boolean;
  /** previous module not mastered (gated missions not all passed) */
  prevNotMastered: boolean;
  /** number of gated missions in previous module still missing a pass */
  prevMissingMissionCount: number;
}

export function getModuleStatus(
  module: CurriculumModule,
  prevModule: CurriculumModule | undefined,
  getStatus: (id: string) => LessonStatus,
  prevMastery?: { isMastered: boolean; missingMissionIds: string[] },
  /** when true (admin / pro) all gating flags collapse to "unlocked" */
  bypassLocks = false,
): ModuleStatus {
  const prevDone = !prevModule
    ? true
    : prevModule.lessons
        .filter((l) => l.state === "available")
        .every((l) => getStatus(l.id) === "completed");

  const hasAvailable = module.lessons.some((l) => l.state === "available");
  const availableCount = module.lessons.filter(
    (l) => l.state === "available",
  ).length;
  const doneCount = module.lessons.filter(
    (l) => l.state === "available" && getStatus(l.id) === "completed",
  ).length;
  const moduleCompleted = hasAvailable && availableCount === doneCount;
  const rawPrevNotMastered = !prevModule
    ? false
    : prevMastery
      ? !prevMastery.isMastered
      : false;
  const prevNotMastered = bypassLocks ? false : rawPrevNotMastered;
  const prevMissingMissionCount = bypassLocks
    ? 0
    : (prevMastery?.missingMissionIds.length ?? 0);
  const unlocked = bypassLocks || (prevDone && !prevNotMastered);
  const moduleLocked = !unlocked;
  const soon = unlocked && !hasAvailable;

  return {
    prevDone,
    hasAvailable,
    availableCount,
    doneCount,
    moduleCompleted,
    moduleLocked,
    soon,
    prevNotMastered,
    prevMissingMissionCount,
  };
}

/* -------------------------------------------------------------- */
/*  getLessonAccess — lesson-level access / unlock / status       */
/* -------------------------------------------------------------- */

export interface LessonAccess {
  status: LessonStatus;
  isAvailable: boolean;
  /** unlocked by the sequential gating in lesson-progress */
  isUnlocked: boolean;
  /** unlocked AND parent module is unlocked AND lesson is available */
  isAccessible: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
}

export function getLessonAccess(
  lesson: CurriculumLesson,
  _store: Record<string, LessonStatus>,
  _orderedIds: string[],
  getStatus: (id: string) => LessonStatus,
  moduleUnlocked = true,
): LessonAccess {
  const status = getStatus(lesson.id);
  const isAvailable = lesson.state === "available";
  // Sequential per-lesson unlocking is disabled by design — see
  // system-state/data.ts. Availability is decided at the curriculum level.
  const unlocked = isAvailable;
  return {
    status,
    isAvailable,
    isUnlocked: unlocked,
    isAccessible: moduleUnlocked && unlocked,
    isCompleted: status === "completed",
    isInProgress: status === "in-progress",
  };
}
