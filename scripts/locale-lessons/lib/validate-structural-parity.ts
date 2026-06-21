import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  detectEnglishTitleMismatchWarning,
  detectGulfTitleMismatchWarning,
  detectInternalSectionLabelWarnings,
  detectProductionResidueWarnings,
  detectQuizMarkdownLeakageWarnings,
  detectQuizOptionPrefixWarnings,
  detectUnbalancedLearnerMarkdownWarnings,
  sanitizeAdaptedLessonMarkdown,
} from "./quality-warnings.ts";
import { getValueAtFieldPath } from "./inject-localized-fields.ts";
import { extractLocalizableFields } from "./extract-localizable-fields.ts";

export interface FragmentPipelineValidationResult {
  ok: boolean;
  errors: string[];
}

function compareQuizParity(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string[] {
  const errors: string[] = [];
  const sourceQuizSections = source.sections.filter((s) => s.role === "Quiz");
  const adaptedQuizSections = adapted.sections.filter((s) => s.role === "Quiz");

  if (sourceQuizSections.length !== adaptedQuizSections.length) {
    errors.push(
      `quiz section count changed (${sourceQuizSections.length} -> ${adaptedQuizSections.length})`,
    );
    return errors;
  }

  for (let index = 0; index < sourceQuizSections.length; index++) {
    const srcQuiz = sourceQuizSections[index]?.quiz;
    const adaptedQuiz = adaptedQuizSections[index]?.quiz;
    const label = `${adapted.lessonId} quiz[${index}]`;

    if (!srcQuiz || !adaptedQuiz) {
      if (!srcQuiz && !adaptedQuiz) continue;
      errors.push(`${label}: quiz object presence mismatch`);
      continue;
    }

    if (srcQuiz.options.length !== adaptedQuiz.options.length) {
      errors.push(
        `${label}: quiz.options.length changed (${srcQuiz.options.length} -> ${adaptedQuiz.options.length})`,
      );
    }

    if (srcQuiz.correctIndex !== adaptedQuiz.correctIndex) {
      errors.push(
        `${label}: correctIndex changed (${srcQuiz.correctIndex} -> ${adaptedQuiz.correctIndex})`,
      );
    }
  }

  return errors;
}

function compareNonTextSnapshot(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string[] {
  const errors: string[] = [];

  const structuralKeys = [
    "lessonId",
    "canonicalVersion",
    "pathId",
    "moduleId",
    "productionRoute",
    "nextLessonId",
    "estimatedMinutes",
  ] as const satisfies ReadonlyArray<keyof LocalizedLessonPackage>;

  for (const key of structuralKeys) {
    if (source[key] !== adapted[key]) {
      errors.push(`non-text field ${key} changed`);
    }
  }

  if (source.sections.length !== adapted.sections.length) {
    errors.push(
      `section count changed (${source.sections.length} -> ${adapted.sections.length})`,
    );
    return errors;
  }

  source.sections.forEach((srcSection, sectionIndex) => {
    const adaptedSection = adapted.sections[sectionIndex];
    if (!adaptedSection) {
      errors.push(`missing adapted section at index ${sectionIndex}`);
      return;
    }

    if (srcSection.role !== adaptedSection.role) {
      errors.push(
        `sections[${sectionIndex}].role changed (${srcSection.role} -> ${adaptedSection.role})`,
      );
    }

    if (srcSection.bullets.length !== adaptedSection.bullets.length) {
      errors.push(`sections[${sectionIndex}].bullets length changed`);
    }

    if (srcSection.tables.length !== adaptedSection.tables.length) {
      errors.push(`sections[${sectionIndex}].tables length changed`);
    }

    srcSection.tables.forEach((srcTable, tableIndex) => {
      const adaptedTable = adaptedSection.tables[tableIndex];
      if (!adaptedTable) return;
      if (srcTable.headers.length !== adaptedTable.headers.length) {
        errors.push(
          `sections[${sectionIndex}].tables[${tableIndex}] header count changed`,
        );
      }
      if (srcTable.rows.length !== adaptedTable.rows.length) {
        errors.push(
          `sections[${sectionIndex}].tables[${tableIndex}] row count changed`,
        );
      }
      srcTable.rows.forEach((srcRow, rowIndex) => {
        const adaptedRow = adaptedTable.rows[rowIndex];
        if (srcRow.length !== adaptedRow?.length) {
          errors.push(
            `sections[${sectionIndex}].tables[${tableIndex}].rows[${rowIndex}] column count changed`,
          );
        }
      });
    });

    const srcRubric = srcSection.mission?.rubric ?? [];
    const adaptedRubric = adaptedSection.mission?.rubric ?? [];
    if (srcRubric.length !== adaptedRubric.length) {
      errors.push(`sections[${sectionIndex}].mission.rubric row count changed`);
    }
    srcRubric.forEach((row, rowIndex) => {
      if (adaptedRubric[rowIndex]?.weight !== row.weight) {
        errors.push(
          `sections[${sectionIndex}].mission.rubric[${rowIndex}].weight changed`,
        );
      }
    });

    if (srcSection.mission?.yamlIntent !== adaptedSection.mission?.yamlIntent) {
      errors.push(`sections[${sectionIndex}].mission.yamlIntent changed`);
    }
    if (srcSection.mission?.yamlType !== adaptedSection.mission?.yamlType) {
      errors.push(`sections[${sectionIndex}].mission.yamlType changed`);
    }
  });

  return errors;
}

/** Only extracted learner text paths may differ from canonical source. */
export function validateInjectedTextOnlyChanges(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  textMapLessonId: string,
): string[] {
  const errors: string[] = [];
  const extracted = extractLocalizableFields(source);
  const extractedPaths = new Set(extracted.fields.map((field) => field.fieldPath));

  for (const field of extracted.fields) {
    const sourceValue = getValueAtFieldPath(source, field.fieldPath);
    const adaptedValue = getValueAtFieldPath(adapted, field.fieldPath);
    if (typeof sourceValue !== "string" || typeof adaptedValue !== "string") {
      errors.push(`extracted path ${field.fieldPath} is not a string field`);
    }
  }

  for (const fieldPath of extractedPaths) {
    const sourceValue = getValueAtFieldPath(source, fieldPath);
    const adaptedValue = getValueAtFieldPath(adapted, fieldPath);
    if (sourceValue === adaptedValue) {
      continue;
    }
    if (typeof sourceValue !== "string" || typeof adaptedValue !== "string") {
      errors.push(`unexpected type change at ${fieldPath}`);
    }
  }

  if (textMapLessonId !== source.lessonId) {
    errors.push("text map lessonId mismatch during injection audit");
  }

  return errors;
}

export function validateStructuralParity(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): FragmentPipelineValidationResult {
  const errors = [
    ...compareNonTextSnapshot(source, adapted),
    ...compareQuizParity(source, adapted),
  ];
  return { ok: errors.length === 0, errors };
}

/** Schema checks for fragment inject — literal canonical source, not repaired quiz overrides. */
export function validateFragmentSchemaParity(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
): string[] {
  const errors: string[] = [];

  if (adapted.locale !== targetLocale) {
    errors.push(`locale must be ${targetLocale}, got ${adapted.locale}`);
  }
  if (adapted.lessonId !== source.lessonId) {
    errors.push(`lessonId must remain ${source.lessonId}`);
  }
  if (adapted.sections.length !== source.sections.length) {
    errors.push("section count changed");
  }

  source.sections.forEach((srcSection, index) => {
    const adaptedSection = adapted.sections[index];
    if (!adaptedSection) return;
    if (adaptedSection.role !== srcSection.role) {
      errors.push(`sections[${index}].role changed`);
    }
    const srcRubric = srcSection.mission?.rubric ?? [];
    const adaptedRubric = adaptedSection.mission?.rubric ?? [];
    srcRubric.forEach((row, rowIndex) => {
      if (adaptedRubric[rowIndex]?.weight !== row.weight) {
        errors.push(`sections[${index}].mission.rubric[${rowIndex}].weight changed`);
      }
    });
  });

  return errors;
}

/** Learner-text quality on sanitized output — production/prefix/markdown gates only. */
export function validateFragmentLearnerTextQuality(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
): string[] {
  const sanitized = sanitizeAdaptedLessonMarkdown(adapted);
  const warnings: string[] = [];

  const titleWarning =
    targetLocale === "en"
      ? detectEnglishTitleMismatchWarning(source, sanitized)
      : detectGulfTitleMismatchWarning(source, sanitized);
  if (titleWarning) warnings.push(titleWarning);

  warnings.push(...detectQuizMarkdownLeakageWarnings(sanitized));
  warnings.push(...detectProductionResidueWarnings(sanitized));
  warnings.push(...detectInternalSectionLabelWarnings(sanitized));
  warnings.push(...detectUnbalancedLearnerMarkdownWarnings(sanitized));
  warnings.push(...detectQuizOptionPrefixWarnings(sanitized));

  return [...new Set(warnings)];
}

export function validateFragmentPipelineArtifact(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
  targetLocale: AdaptationTargetLocale,
): FragmentPipelineValidationResult {
  const errors = [
    ...validateFragmentSchemaParity(source, adapted, targetLocale),
    ...validateStructuralParity(source, adapted).errors,
    ...validateFragmentLearnerTextQuality(source, adapted, targetLocale),
  ];

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
  };
}
