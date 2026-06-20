/** Runtime-ready localized lesson packages (not wired to live routes). */

export type LessonPackageLocale = "ar-MSA" | "ar-Gulf" | "en";

/** Source locale for contextual adaptation (Phase 2B+). */
export type AdaptationSourceLocale = "ar-MSA";

/** Target locales derived from Arabic Fusha via contextual adaptation. */
export type AdaptationTargetLocale = "ar-Gulf" | "en";

export const ADAPTATION_TARGET_LOCALES = ["ar-Gulf", "en"] as const;

export const REQUIRED_LESSON_COUNT = 100;

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
  locale: LessonPackageLocale;
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
  locale: LessonPackageLocale;
  generatedAt: string;
  canonicalSource?: string;
  sourceLocale?: AdaptationSourceLocale;
  lessonCount: number;
  lessonIds: string[];
}

/** Phase 2C — incomplete sample package manifest (3 lessons only). */
export interface LocalizedSampleManifest extends LocalizedLessonManifest {
  packageStatus: "sample";
  incomplete: true;
  requiredLessonCount: typeof REQUIRED_LESSON_COUNT;
  sampleLessonIds: string[];
  provider: string;
  providerModel: string;
}

/** Constraints enforced by adaptation prompts and validation. */
export interface AdaptationConstraints {
  preserveLessonId: true;
  preservePathId: true;
  preserveSectionRoles: true;
  preserveMissionIntent: true;
  preserveRubricCriteria: true;
  preserveQuizCorrectIndex: true;
  preserveRubricWeights: true;
  noLiteralTranslation: true;
  noInventedBusinessLogic: true;
  consistentProductTerminology: true;
}

export const ADAPTATION_CONSTRAINTS: AdaptationConstraints = {
  preserveLessonId: true,
  preservePathId: true,
  preserveSectionRoles: true,
  preserveMissionIntent: true,
  preserveRubricCriteria: true,
  preserveQuizCorrectIndex: true,
  preserveRubricWeights: true,
  noLiteralTranslation: true,
  noInventedBusinessLogic: true,
  consistentProductTerminology: true,
};

export interface AdaptationPromptMeta {
  targetLocale: AdaptationTargetLocale;
  promptVersion: string;
  systemTemplate: string;
  userTemplate: string;
}

/** Dry-run or future generation plan — not a completed target package. */
export interface AdaptationPlanManifest {
  locale: AdaptationTargetLocale;
  sourceLocale: AdaptationSourceLocale;
  status: "planned" | "partial" | "complete";
  mode: "dry-run" | "generate";
  lessonCount: number;
  requiredLessonCount: typeof REQUIRED_LESSON_COUNT;
  lessonIds: string[];
  sourceManifestPath: string;
  outputLessonsDir: string;
  outputManifestPath: string;
  prompt: AdaptationPromptMeta;
  generationBlocked: boolean;
  generationBlockReason?: string;
  generatedAt: string;
  nextSteps: string[];
}

/** Contextual adaptation output shape (future Phase 2C+). */
export interface AdaptedLessonPackage extends Omit<
  LocalizedLessonPackage,
  "locale" | "sourceFile"
> {
  locale: AdaptationTargetLocale;
  adaptedFrom: {
    locale: AdaptationSourceLocale;
    lessonId: string;
    canonicalVersion: string;
    sourcePackagePath: string;
  };
  generatedAt: string;
}

export interface LocalizedPackageValidationResult {
  ok: boolean;
  locale: LessonPackageLocale | AdaptationTargetLocale;
  expectedLessonCount: number;
  foundLessonCount: number;
  missingIds: string[];
  extraIds: string[];
  archivedIncluded: string[];
  errors: string[];
}
