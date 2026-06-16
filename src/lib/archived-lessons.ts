/**
 * Archived Business lesson slugs — excluded from PATHS learner navigation and RAG seed.
 * Registry/Bunny/files may retain these for stability; see CURRICULUM_FREEZE_CONTRACT.md.
 */
export const ARCHIVED_LESSON_IDS = [
  "business-m1-l3-ai-thinking-partner",
  "business-m2-l4-pricing-cash-flow",
  "business-m3-l4-hiring-onboarding",
  "business-m4-l5-business-os-dashboard",
] as const;

export type ArchivedLessonId = (typeof ARCHIVED_LESSON_IDS)[number];

export const ARCHIVED_LESSON_ID_SET = new Set<string>(ARCHIVED_LESSON_IDS);

export function isArchivedLessonId(id: string): boolean {
  return ARCHIVED_LESSON_ID_SET.has(id);
}
