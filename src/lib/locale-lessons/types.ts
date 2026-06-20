/** Runtime-ready localized lesson package (not wired to live routes in Phase 2A). */

export type LocalizedLessonLocale = "ar-MSA";

export interface LocalizedLessonTable {
  headers: string[];
  rows: string[][];
}

export interface LocalizedLessonQuiz {
  question?: string;
  correctIndex?: number;
  options: string[];
  explanation?: string;
}

export interface LocalizedLessonRubricRow {
  dimension: string;
  weight: number;
  criteria: string;
}

export interface LocalizedLessonMission {
  intro?: string;
  delivery: string[];
  rubric: LocalizedLessonRubricRow[];
  yamlIntent?: string;
  yamlType?: string;
}

export interface LocalizedLessonSection {
  role: string;
  heading: string;
  subtitle?: string;
  contentMarkdown: string;
  bullets: string[];
  tables: LocalizedLessonTable[];
  quiz?: LocalizedLessonQuiz;
  mission?: LocalizedLessonMission;
}

export interface LocalizedLessonPackage {
  locale: LocalizedLessonLocale;
  lessonId: string;
  canonicalVersion: string;
  pathId?: string;
  moduleId?: string;
  productionRoute?: string;
  titleEn?: string;
  title: string;
  summary?: string;
  estimatedMinutes?: number;
  nextLessonId?: string;
  sections: LocalizedLessonSection[];
  sourceFile: string;
  generatedAt: string;
}

export interface LocalizedLessonManifest {
  locale: LocalizedLessonLocale;
  generatedAt: string;
  canonicalSource: string;
  lessonCount: number;
  lessonIds: string[];
}
