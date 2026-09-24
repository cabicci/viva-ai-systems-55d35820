import { KIDS_LEVELS, isKidsFreeLesson, type KidsLevelId } from "./catalogue";

/**
 * A display decision only. A protected media/API endpoint must repeat this
 * check with trusted server-side subscription and content-review records.
 */
export type KidsAccess =
  | { kind: "unavailable" }
  | { kind: "open" }
  | { kind: "parent-required" }
  | { kind: "family-subscription-required" };

export function decideKidsLessonAccess(args: {
  level: KidsLevelId;
  lessonNumber: number;
  contentApproved: boolean;
  parentVerified: boolean;
  familySubscriptionActive: boolean;
}): KidsAccess {
  const level = KIDS_LEVELS.find((entry) => entry.id === args.level);
  if (
    !level ||
    !Number.isInteger(args.lessonNumber) ||
    args.lessonNumber < 1 ||
    args.lessonNumber > level.lessonCount
  ) {
    return { kind: "unavailable" };
  }
  if (!args.contentApproved) return { kind: "unavailable" };
  if (!args.parentVerified) return { kind: "parent-required" };
  if (isKidsFreeLesson(args.level, args.lessonNumber)) return { kind: "open" };
  return args.familySubscriptionActive
    ? { kind: "open" }
    : { kind: "family-subscription-required" };
}
