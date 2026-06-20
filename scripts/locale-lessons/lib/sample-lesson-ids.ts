/** Three pilot lessons across intro, builder, and business paths for Phase 2C samples. */
export const SAMPLE_LESSON_IDS = [
  "intro-m1-l1-what-is-ai",
  "builder-m6-l1-idea-to-page",
  "business-m1-l2-reactive-vs-proactive",
] as const;

export type SampleLessonId = (typeof SAMPLE_LESSON_IDS)[number];

export const SAMPLE_LESSON_COUNT = SAMPLE_LESSON_IDS.length;
