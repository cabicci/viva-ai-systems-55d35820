import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonMission,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  sanitizeAdaptedLessonMarkdown,
  alignEnglishCatalogTitle,
  repairQuizSection,
  validateAdaptedLessonWarnings,
} from "./quality-warnings.ts";

export { validateAdaptedLessonWarnings } from "./quality-warnings.ts";
export type { AdaptedLessonValidationResult } from "./quality-warnings.ts";
export {
  AdaptedLessonJsonParseError,
  extractAdaptedJsonText,
  formatAdaptationJsonParseFailure,
  parseAdaptedLessonJson,
} from "./parse-adapted-json.ts";

export function validateAdaptedLessonPackage(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
): string[] {
  const errors: string[] = [];

  if (adapted.locale !== targetLocale) {
    errors.push(`locale must be ${targetLocale}, got ${adapted.locale}`);
  }
  if (adapted.lessonId !== source.lessonId) {
    errors.push(
      `lessonId must remain ${source.lessonId}, got ${adapted.lessonId}`,
    );
  }
  if (adapted.pathId && source.pathId && adapted.pathId !== source.pathId) {
    errors.push(`pathId must remain ${source.pathId}, got ${adapted.pathId}`);
  }
  if (adapted.sections.length !== source.sections.length) {
    errors.push(
      `section count must remain ${source.sections.length}, got ${adapted.sections.length}`,
    );
  }

  for (let i = 0; i < source.sections.length; i++) {
    const srcSection = source.sections[i];
    const adaptedSection = adapted.sections[i];
    if (!adaptedSection) continue;
    if (adaptedSection.role !== srcSection.role) {
      errors.push(
        `section ${i} role must remain ${srcSection.role}, got ${adaptedSection.role}`,
      );
    }
    if (
      srcSection.quiz?.correctIndex !== undefined &&
      adaptedSection.quiz?.correctIndex !== undefined &&
      adaptedSection.quiz.correctIndex !== srcSection.quiz.correctIndex
    ) {
      errors.push(
        `quiz correctIndex must remain ${srcSection.quiz.correctIndex} for ${source.lessonId}`,
      );
    }
    const srcRubric = srcSection.mission?.rubric ?? [];
    const adaptedRubric = adaptedSection.mission?.rubric ?? [];
    if (srcRubric.length > 0 && adaptedRubric.length !== srcRubric.length) {
      errors.push(`mission rubric row count changed for ${source.lessonId}`);
    }
    for (let r = 0; r < srcRubric.length; r++) {
      if (adaptedRubric[r]?.weight !== srcRubric[r]?.weight) {
        errors.push(
          `rubric weight must remain ${srcRubric[r]?.weight} for ${source.lessonId}`,
        );
      }
    }
  }

  if (!adapted.title?.trim()) {
    errors.push("title must be non-empty");
  }
  if (!adapted.sections.some((section) => section.contentMarkdown.trim())) {
    errors.push("at least one section must include contentMarkdown");
  }

  return errors;
}

function preserveMissionMetadataFromSource(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  const sections = adapted.sections.map((section, index) => {
    const sourceSection = source.sections[index];
    if (!sourceSection?.mission || !section.mission) {
      return section;
    }

    const sourceMission = sourceSection.mission;
    const adaptedMission = section.mission;
    const mission: LocalizedLessonMission = {
      ...adaptedMission,
      yamlIntent: adaptedMission.yamlIntent ?? sourceMission.yamlIntent,
      yamlType: adaptedMission.yamlType ?? sourceMission.yamlType,
    };

    return { ...section, mission };
  });

  return { ...adapted, sections };
}

function repairAdaptedQuizSections(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  const sections = adapted.sections.map((section, index) =>
    repairQuizSection(
      source.sections[index],
      section,
      adapted.lessonId,
      adapted.locale as AdaptationTargetLocale,
    ),
  );

  return { ...adapted, sections };
}

export function finalizeAdaptedPackage(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
  sourcePackagePath: string,
  generatedAt: string,
): AdaptedLessonPackage {
  const locked = {
    ...adapted,
    locale: targetLocale,
    lessonId: source.lessonId,
    pathId: source.pathId,
    moduleId: source.moduleId,
    productionRoute: source.productionRoute,
    canonicalVersion: source.canonicalVersion,
    nextLessonId: source.nextLessonId,
    estimatedMinutes: source.estimatedMinutes,
    titleEn: adapted.titleEn ?? source.titleEn,
    adaptedFrom: {
      locale: "ar-MSA" as const,
      lessonId: source.lessonId,
      canonicalVersion: source.canonicalVersion,
      sourcePackagePath,
    },
    generatedAt,
  };

  const withMissionMetadata = preserveMissionMetadataFromSource(source, locked);
  const withQuizRepair = repairAdaptedQuizSections(source, withMissionMetadata);

  return sanitizeAdaptedLessonMarkdown(
    alignEnglishCatalogTitle(source, withQuizRepair),
  );
}
