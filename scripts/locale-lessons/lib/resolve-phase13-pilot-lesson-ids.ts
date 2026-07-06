import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_TARGET_LOCALES } from "../../../src/lib/locale-lessons/types.ts";
import {
  clampPhase13PilotCount,
  selectPhase13PilotLessonIds,
  type Phase13SourceScope,
} from "./phase13-pilot-manifest.ts";
import { parseLessonIdsArg } from "./resolve-fragment-pilot-lesson-ids.ts";

export interface Phase13PilotMatrixCell {
  locale: AdaptationTargetLocale;
  lesson_id: string;
  source_scope: Phase13SourceScope;
}

export function localesForPhase13Target(
  target: AdaptationTargetLocale | "all",
): AdaptationTargetLocale[] {
  return target === "all" ? [...ADAPTATION_TARGET_LOCALES] : [target];
}

export function parsePhase13TargetLocales(
  raw: string | null,
): AdaptationTargetLocale | "all" {
  if (!raw || raw === "all") return "all";
  if (raw === "ar-Gulf" || raw === "en") return raw;
  throw new Error("target_locales must be ar-Gulf, en, or all");
}

export function parsePhase13SourceScope(raw: string | null): Phase13SourceScope {
  const scope = raw ?? "ar-MSA";
  if (scope !== "ar-MSA") {
    throw new Error(
      `Unsupported source_scope "${scope}". Phase 13A currently supports ar-MSA only.`,
    );
  }
  return scope;
}

export async function buildPhase13PilotMatrix(input: {
  sourceScope: Phase13SourceScope;
  target: AdaptationTargetLocale | "all";
  count: number;
  lessonIdsOverride?: string[];
  retryCells?: Phase13PilotMatrixCell[];
}): Promise<Phase13PilotMatrixCell[]> {
  if (input.retryCells?.length) {
    return input.retryCells.filter((cell) => cell.source_scope === input.sourceScope);
  }

  const lessonIds = await selectPhase13PilotLessonIds({
    count: clampPhase13PilotCount(input.count),
    lessonIdsOverride: input.lessonIdsOverride,
  });
  const locales = localesForPhase13Target(input.target);

  return locales.flatMap((locale) =>
    lessonIds.map((lesson_id) => ({
      locale,
      lesson_id,
      source_scope: input.sourceScope,
    })),
  );
}

export function phase13PilotArtifactName(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return `locale-phase13a-pilot-${locale}-${lessonId}`;
}

export function phase13PilotFailedArtifactName(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return `${phase13PilotArtifactName(locale, lessonId)}-failed`;
}

export { parseLessonIdsArg };
