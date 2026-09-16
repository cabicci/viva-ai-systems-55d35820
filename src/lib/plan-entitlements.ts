import { PATHS } from "@/lib/curriculum-data";

export type BillingTier = "free" | "pro" | "pro_plus";

export const PLAN_LESSON_COUNTS: Readonly<Record<BillingTier, number>> = {
  free: 12,
  pro: 71,
  pro_plus: 100,
};

function availableLessonIds(pathId?: string): string[] {
  return PATHS.filter((path) => !pathId || path.id === pathId)
    .flatMap((path) => path.modules)
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.state === "available")
    .map((lesson) => lesson.id);
}

function computeFreeLessonIds(): string[] {
  const free: string[] = [];

  for (const path of PATHS) {
    const ids = path.modules
      .flatMap((module) => module.lessons)
      .filter((lesson) => lesson.state === "available")
      .map((lesson) => lesson.id);

    if (path.id === "intro") free.push(...ids);
    else if (ids[0]) free.push(ids[0]);
  }

  return free;
}

const ALL_LESSON_IDS = availableLessonIds();
const NON_BUILDER_LESSON_IDS = PATHS.filter((path) => path.id !== "builder")
  .flatMap((path) => path.modules)
  .flatMap((module) => module.lessons)
  .filter((lesson) => lesson.state === "available")
  .map((lesson) => lesson.id);

const LESSON_IDS_BY_TIER: Readonly<Record<BillingTier, readonly string[]>> = {
  free: Object.freeze(computeFreeLessonIds()),
  pro: Object.freeze([...NON_BUILDER_LESSON_IDS]),
  pro_plus: Object.freeze([...ALL_LESSON_IDS]),
};

const LESSON_ID_SETS_BY_TIER: Readonly<Record<BillingTier, ReadonlySet<string>>> = {
  free: new Set(LESSON_IDS_BY_TIER.free),
  pro: new Set(LESSON_IDS_BY_TIER.pro),
  pro_plus: new Set(LESSON_IDS_BY_TIER.pro_plus),
};

export function lessonIdsForTier(tier: BillingTier): readonly string[] {
  return LESSON_IDS_BY_TIER[tier];
}

export function isLessonIncludedInTier(lessonId: string, tier: BillingTier): boolean {
  return LESSON_ID_SETS_BY_TIER[tier].has(lessonId);
}
