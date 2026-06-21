import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_TARGET_LOCALES } from "../../../src/lib/locale-lessons/types.ts";
import { selectPilotLessonIds } from "./pilot-lesson-ids.ts";

export interface FragmentPilotMatrixCell {
  locale: AdaptationTargetLocale;
  lesson_id: string;
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

export function localesForTarget(
  target: AdaptationTargetLocale | "all",
): AdaptationTargetLocale[] {
  return target === "all" ? [...ADAPTATION_TARGET_LOCALES] : [target];
}

export async function resolveFragmentPilotLessonIds(input: {
  count: number;
  lessonIdsOverride?: string[];
}): Promise<string[]> {
  if (input.lessonIdsOverride?.length) {
    return [...input.lessonIdsOverride];
  }
  return selectPilotLessonIds(input.count);
}

export async function buildFragmentPilotMatrix(input: {
  target: AdaptationTargetLocale | "all";
  count: number;
  lessonIdsOverride?: string[];
}): Promise<FragmentPilotMatrixCell[]> {
  const lessonIds = await resolveFragmentPilotLessonIds({
    count: input.count,
    lessonIdsOverride: input.lessonIdsOverride,
  });
  const locales = localesForTarget(input.target);

  return locales.flatMap((locale) =>
    lessonIds.map((lesson_id) => ({ locale, lesson_id })),
  );
}

export function fragmentPilotArtifactName(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return `locale-fragment-pilot-${locale}-${lessonId}`;
}
