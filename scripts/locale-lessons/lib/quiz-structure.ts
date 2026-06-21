import type {
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "../../../src/lib/locale-lessons/types.ts";

function normalizeSourceQuizOptionText(text: string): string {
  return text
    .replace(
      /^(\*{1,2})?(الإجابة الصحيحة|Correct answer|Correct Answer)[^:*]*(\([^)]*\))?\*{0,2}\s*:?\s*/i,
      "",
    )
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .replace(/^\*\*|\*\*$/g, "")
    .trim();
}

export interface CorruptedSourceQuizOverride {
  optionCount: number;
  correctIndex: number;
}

/**
 * Canonical quiz structure for ar-MSA lessons whose source quiz JSON is incomplete.
 * Do not edit ar-MSA source packages — overrides apply at localization finalization only.
 */
export const CORRUPTED_SOURCE_QUIZ_OVERRIDES: Record<
  string,
  CorruptedSourceQuizOverride
> = {
  "intro-m1-l1-what-is-ai": { optionCount: 4, correctIndex: 1 },
  "business-m1-l2-reactive-vs-proactive": { optionCount: 4, correctIndex: 1 },
  "analyst-m1-l1-from-automation-to-insight": { optionCount: 3, correctIndex: 2 },
  "analyst-m4-automated-dashboard": { optionCount: 3, correctIndex: 0 },
};

export interface ResolvedQuizStructure {
  optionCount: number;
  correctIndex: number;
  sourceSchemaValid: boolean;
  usesOverride: boolean;
  /** Normalized source option text per index (may be shorter than optionCount). */
  sourceOptionTextsByIndex: string[];
}

export type ResolveQuizStructureResult =
  | { ok: true; structure: ResolvedQuizStructure }
  | { ok: false; lessonId: string; issues: string[] };

function isExplanationBullet(text: string): boolean {
  return /^(\*\*)?(التفسير|Explanation)\b/i.test(text.trim());
}

export function countQuizOptionBullets(bullets: string[]): number {
  return bullets.filter((bullet) => {
    const trimmed = bullet.trim();
    return trimmed.length > 0 && !isExplanationBullet(trimmed);
  }).length;
}

export function extractQuizOptionBullets(bullets: string[]): string[] {
  return bullets
    .filter((bullet) => {
      const trimmed = bullet.trim();
      return trimmed.length > 0 && !isExplanationBullet(trimmed);
    })
    .map((bullet) => normalizeSourceQuizOptionText(bullet));
}

function minimumOptionCountForCorrectIndex(correctIndex: number): number {
  let minimum = 2;
  if (correctIndex >= 0) {
    minimum = Math.max(minimum, correctIndex + 1);
  }
  if (correctIndex >= 2) {
    minimum = Math.max(minimum, 3);
  }
  return minimum;
}

export function isSourceQuizSchemaValid(
  section: LocalizedLessonSection | undefined,
  lessonId: string,
): boolean {
  if (CORRUPTED_SOURCE_QUIZ_OVERRIDES[lessonId]) return false;

  const quiz = section?.quiz;
  if (!quiz) return false;

  const correctIndex = quiz.correctIndex;
  const options = quiz.options ?? [];
  if (correctIndex === undefined || correctIndex < 0) return false;
  if (options.length <= correctIndex) return false;
  if (options.some((option) => !option?.trim())) return false;
  if (options.length < minimumOptionCountForCorrectIndex(correctIndex)) return false;

  const optionBullets = countQuizOptionBullets(section?.bullets ?? []);
  if (optionBullets > 0 && options.length < optionBullets) return false;

  return true;
}

function buildSourceOptionTextsByIndex(
  section: LocalizedLessonSection | undefined,
  optionCount: number,
): string[] {
  const fromBullets = extractQuizOptionBullets(section?.bullets ?? []);
  const fromQuiz = (section?.quiz?.options ?? []).map((option) =>
    normalizeSourceQuizOptionText(option),
  );

  const texts: string[] = [];
  for (let index = 0; index < optionCount; index++) {
    const candidate = fromBullets[index]?.trim() || fromQuiz[index]?.trim() || "";
    texts.push(candidate);
  }
  return texts;
}

export function resolveSourceQuizStructure(
  sourceSection: LocalizedLessonSection | undefined,
  lessonId: string,
): ResolveQuizStructureResult {
  const quiz = sourceSection?.quiz;
  const issues: string[] = [];

  if (!quiz) {
    return { ok: false, lessonId, issues: ["missing structured quiz object"] };
  }

  const correctIndex = quiz.correctIndex;
  if (correctIndex === undefined || correctIndex < 0) {
    issues.push("missing or invalid correctIndex");
  }

  const override = CORRUPTED_SOURCE_QUIZ_OVERRIDES[lessonId];
  if (override) {
    if (correctIndex !== undefined && correctIndex !== override.correctIndex) {
      issues.push(
        `override correctIndex ${override.correctIndex} differs from source correctIndex ${String(correctIndex)}`,
      );
    }

    return {
      ok: true,
      structure: {
        optionCount: override.optionCount,
        correctIndex: override.correctIndex,
        sourceSchemaValid: false,
        usesOverride: true,
        sourceOptionTextsByIndex: buildSourceOptionTextsByIndex(
          sourceSection,
          override.optionCount,
        ),
      },
    };
  }

  if (isSourceQuizSchemaValid(sourceSection, lessonId)) {
    const options = quiz.options ?? [];
    return {
      ok: true,
      structure: {
        optionCount: options.length,
        correctIndex: correctIndex ?? 0,
        sourceSchemaValid: true,
        usesOverride: false,
        sourceOptionTextsByIndex: options.map((option) =>
          normalizeSourceQuizOptionText(option),
        ),
      },
    };
  }

  const optionBullets = countQuizOptionBullets(sourceSection?.bullets ?? []);
  const options = quiz.options ?? [];
  const derivedCount = Math.max(
    optionBullets,
    options.length,
    correctIndex !== undefined && correctIndex >= 0 ? correctIndex + 1 : 0,
  );

  if (correctIndex === undefined || correctIndex < 0) {
    return {
      ok: false,
      lessonId,
      issues: issues.length > 0 ? issues : ["missing or invalid correctIndex"],
    };
  }

  if (derivedCount < minimumOptionCountForCorrectIndex(correctIndex)) {
    issues.push(
      `cannot derive ${minimumOptionCountForCorrectIndex(correctIndex)} options for correctIndex ${correctIndex} (derived ${derivedCount})`,
    );
    return { ok: false, lessonId, issues };
  }

  if (derivedCount < 2) {
    issues.push("cannot derive at least 2 quiz options from source");
    return { ok: false, lessonId, issues };
  }

  return {
    ok: true,
    structure: {
      optionCount: derivedCount,
      correctIndex,
      sourceSchemaValid: false,
      usesOverride: false,
      sourceOptionTextsByIndex: buildSourceOptionTextsByIndex(
        sourceSection,
        derivedCount,
      ),
    },
  };
}

export function identifyCorruptedSourceQuizIssues(
  source: LocalizedLessonPackage,
): string[] {
  const issues: string[] = [];

  for (const section of source.sections) {
    if (section.role !== "Quiz") continue;

    const resolved = resolveSourceQuizStructure(section, source.lessonId);
    if (resolved.ok) {
      if (!resolved.structure.sourceSchemaValid) {
        const label = `${source.lessonId} quiz section`;
        if (resolved.structure.usesOverride) {
          issues.push(
            `${label}: corrupted source quiz schema — using explicit override (${resolved.structure.optionCount} options, correctIndex ${resolved.structure.correctIndex})`,
          );
        } else {
          issues.push(
            `${label}: corrupted source quiz schema — derived ${resolved.structure.optionCount} options from bullets`,
          );
        }
      }
      continue;
    }

    issues.push(
      `${source.lessonId} quiz section: ${resolved.issues.join("; ")} — no override defined`,
    );
  }

  return issues;
}

export interface LockedQuizOptionsResult {
  options: string[];
  correctIndex: number;
  structureRestored: boolean;
  missingLocalizedSlots: number[];
}

/**
 * Lock adapted quiz text to source structure by index.
 * AI may only localize quiz.options[i] in place; order, count, and correctIndex are fixed.
 */
export function lockQuizOptionsToSourceStructure(
  structure: ResolvedQuizStructure,
  adaptedOptions: string[],
  adaptedOptionBullets: string[],
): LockedQuizOptionsResult {
  const locked: string[] = [];
  const missingLocalizedSlots: number[] = [];
  let structureRestored = false;

  if (adaptedOptions.length !== structure.optionCount) {
    structureRestored = true;
  }

  const indexAlignedAdaptedOptions =
    adaptedOptions.length === structure.optionCount;

  for (let index = 0; index < structure.optionCount; index++) {
    const localized = indexAlignedAdaptedOptions
      ? adaptedOptions[index]?.trim() || adaptedOptionBullets[index]?.trim() || ""
      : adaptedOptionBullets[index]?.trim() ||
        adaptedOptions[index]?.trim() ||
        "";

    locked.push(localized);
    if (!localized) {
      missingLocalizedSlots.push(index);
    }
  }

  return {
    options: locked,
    correctIndex: structure.correctIndex,
    structureRestored,
    missingLocalizedSlots,
  };
}

export function detectQuizStructureDriftWarnings(
  lessonId: string,
  structure: ResolvedQuizStructure,
  adaptedOptions: string[],
  adaptedCorrectIndex: number | undefined,
): string[] {
  const warnings: string[] = [];
  const label = `${lessonId} quiz section`;

  if (adaptedOptions.length !== structure.optionCount) {
    warnings.push(
      `${label}: quiz option count must remain ${structure.optionCount}, found ${adaptedOptions.length}`,
    );
  }

  if (
    adaptedCorrectIndex !== undefined &&
    adaptedCorrectIndex !== structure.correctIndex
  ) {
    warnings.push(
      `${label}: correctIndex must remain ${structure.correctIndex}, found ${adaptedCorrectIndex}`,
    );
  }

  return warnings;
}
