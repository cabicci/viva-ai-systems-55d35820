import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";

/** Prototype scope — fragment pipeline dry-run only. */
export const FRAGMENT_PROTOTYPE_LESSON_IDS = [
  "intro-m1-l1-what-is-ai",
  "analyst-m1-l1-from-automation-to-insight",
  "analyst-m2-l2-right-question-rule",
] as const;

export type FragmentPrototypeLessonId =
  (typeof FRAGMENT_PROTOTYPE_LESSON_IDS)[number];

export type LocalizableFieldType =
  | "title"
  | "titleEn"
  | "summary"
  | "section.heading"
  | "section.subtitle"
  | "section.contentMarkdown"
  | "section.bullet"
  | "section.table.header"
  | "section.table.cell"
  | "quiz.question"
  | "quiz.option"
  | "quiz.explanation"
  | "mission.intro"
  | "mission.delivery"
  | "mission.rubric.dimension"
  | "mission.rubric.criteria";

export interface LocalizedTextField {
  fieldPath: string;
  sourceText: string;
  fieldType: LocalizableFieldType;
  /** Populated by mock/AI adapter — never written by extract. */
  localizedText?: string;
}

export interface LocalizedTextMap {
  lessonId: string;
  sourceLocale: "ar-MSA";
  targetLocale?: AdaptationTargetLocale;
  canonicalVersion: string;
  fields: LocalizedTextField[];
}

export function localizedTextForField(field: LocalizedTextField): string {
  return field.localizedText ?? field.sourceText;
}
