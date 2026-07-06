import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import { PACKAGE_LOCALES } from "./localization-contract-rules.ts";
import { FULL_LESSON_COUNT, selectFullLessonIds } from "./full-lesson-ids.ts";

export const PHASE13B_FULL_CELL_COUNT = FULL_LESSON_COUNT * PACKAGE_LOCALES.length;

export const PHASE13B_ARTIFACT_PREFIX = "locale-phase13b-full-";

export type Phase13BPipelineMode = "learner-final-derived" | "fragment-adapt";

export type Phase13BSourceScope = "ar-MSA";

export interface Phase13BFullMatrixCell {
  locale: LessonPackageLocale;
  lesson_id: string;
  source_scope: Phase13BSourceScope;
  pipeline: Phase13BPipelineMode;
  requires_paid_api: boolean;
}

export const PHASE13B_TARGET_LOCALES = [...PACKAGE_LOCALES] as const satisfies readonly LessonPackageLocale[];

export function pipelineModeForLocale(locale: LessonPackageLocale): Phase13BPipelineMode {
  return locale === "ar-MSA" ? "learner-final-derived" : "fragment-adapt";
}

export function requiresPaidApiForLocale(locale: LessonPackageLocale): boolean {
  return locale !== "ar-MSA";
}

export function cellRequiresPaidApi(
  cell: Pick<Phase13BFullMatrixCell, "locale" | "pipeline">,
): boolean {
  return cell.pipeline === "fragment-adapt" && requiresPaidApiForLocale(cell.locale);
}

export async function selectPhase13BFullLessonIds(input?: {
  lessonIdsOverride?: string[];
}): Promise<string[]> {
  if (input?.lessonIdsOverride?.length) {
    return [...input.lessonIdsOverride];
  }
  return selectFullLessonIds();
}

export async function buildPhase13BFullMatrix(input: {
  sourceScope?: Phase13BSourceScope;
  targetLocales?: readonly LessonPackageLocale[];
  lessonIdsOverride?: string[];
  retryCells?: Phase13BFullMatrixCell[];
}): Promise<Phase13BFullMatrixCell[]> {
  const sourceScope = input.sourceScope ?? "ar-MSA";
  if (sourceScope !== "ar-MSA") {
    throw new Error(`Unsupported source_scope "${sourceScope}". Phase 13B supports ar-MSA only.`);
  }

  if (input.retryCells?.length) {
    return input.retryCells.map((cell) => ({
      ...cell,
      source_scope: sourceScope,
      pipeline: pipelineModeForLocale(cell.locale),
      requires_paid_api: requiresPaidApiForLocale(cell.locale),
    }));
  }

  const lessonIds = await selectPhase13BFullLessonIds({
    lessonIdsOverride: input.lessonIdsOverride,
  });
  const locales = input.targetLocales?.length
    ? [...input.targetLocales]
    : [...PHASE13B_TARGET_LOCALES];

  return locales.flatMap((locale) =>
    lessonIds.map((lesson_id) => ({
      locale,
      lesson_id,
      source_scope: sourceScope,
      pipeline: pipelineModeForLocale(locale),
      requires_paid_api: requiresPaidApiForLocale(locale),
    })),
  );
}

export function phase13BFullArtifactName(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return `${PHASE13B_ARTIFACT_PREFIX}${locale}-${lessonId}`;
}

export function phase13BFullFailedArtifactName(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return `${phase13BFullArtifactName(locale, lessonId)}-failed`;
}

export function parsePhase13BTargetLocales(
  raw: string | null,
): LessonPackageLocale[] | "all" {
  if (!raw || raw === "all") return "all";
  const parts = raw.split(",").map((value) => value.trim()).filter(Boolean);
  const locales: LessonPackageLocale[] = [];
  for (const part of parts) {
    if (part !== "ar-MSA" && part !== "ar-Gulf" && part !== "en") {
      throw new Error(`Invalid target locale "${part}". Use ar-MSA, ar-Gulf, en, or all.`);
    }
    if (!locales.includes(part)) locales.push(part);
  }
  return locales;
}

export function localesFromPhase13BTarget(
  target: LessonPackageLocale[] | "all",
): LessonPackageLocale[] {
  return target === "all" ? [...PHASE13B_TARGET_LOCALES] : target;
}

/**
 * Retry-only-failed input: comma-separated `locale/lessonId` pairs or JSON array.
 * Example: `en/intro-m1-l1-what-is-ai,ar-Gulf/intro-m1-l1-what-is-ai`
 */
export function parsePhase13BRetryCellsArg(
  raw: string | null,
): Phase13BFullMatrixCell[] | undefined {
  if (raw === null || raw.trim() === "") return undefined;

  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as Array<{
      locale: LessonPackageLocale;
      lesson_id?: string;
      lessonId?: string;
    }>;
    return parsed.map((cell) => {
      const lesson_id = cell.lesson_id ?? cell.lessonId;
      if (!lesson_id) {
        throw new Error("retry_cells JSON entries require lesson_id or lessonId");
      }
      return {
        locale: cell.locale,
        lesson_id,
        source_scope: "ar-MSA" as const,
        pipeline: pipelineModeForLocale(cell.locale),
        requires_paid_api: requiresPaidApiForLocale(cell.locale),
      };
    });
  }

  const cells = trimmed
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const slash = pair.indexOf("/");
      if (slash <= 0) {
        throw new Error(
          `Invalid retry cell "${pair}". Expected locale/lessonId (e.g. en/intro-m1-l1-what-is-ai).`,
        );
      }
      const locale = pair.slice(0, slash) as LessonPackageLocale;
      const lesson_id = pair.slice(slash + 1);
      if (locale !== "ar-MSA" && locale !== "ar-Gulf" && locale !== "en") {
        throw new Error(`Invalid retry locale "${locale}" in "${pair}"`);
      }
      if (!lesson_id) {
        throw new Error(`Missing lessonId in retry cell "${pair}"`);
      }
      return {
        locale,
        lesson_id,
        source_scope: "ar-MSA" as const,
        pipeline: pipelineModeForLocale(locale),
        requires_paid_api: requiresPaidApiForLocale(locale),
      };
    });

  if (cells.length === 0) {
    throw new Error("retry_cells must include at least one locale/lessonId pair");
  }

  return cells;
}

export function parsePhase13BSourceScope(raw: string | null): Phase13BSourceScope {
  const scope = raw ?? "ar-MSA";
  if (scope !== "ar-MSA") {
    throw new Error(`Unsupported source_scope "${scope}". Phase 13B supports ar-MSA only.`);
  }
  return scope;
}

export function parseLessonIdsArg(raw: string | null): string[] | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    throw new Error("lesson_ids must include at least one lesson ID when provided");
  }
  return ids;
}
