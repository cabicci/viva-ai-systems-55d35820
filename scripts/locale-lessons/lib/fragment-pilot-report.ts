import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import type { FragmentPipelineValidationResult } from "./validate-structural-parity.ts";

export interface FragmentPilotLessonResult {
  lessonId: string;
  fieldCount: number;
  validation: FragmentPipelineValidationResult;
}

export interface FragmentPilotGenerationReport {
  targetLocale: AdaptationTargetLocale;
  pipeline: "fragment";
  mode: "pilot";
  provider: "openai-fragment";
  providerModel: string;
  generatedAt: string;
  generatedCount: number;
  lessonIds: string[];
  pilotLessonIds: string[];
  allValid: boolean;
  lessons: FragmentPilotLessonResult[];
}

export function buildFragmentPilotReport(input: {
  targetLocale: AdaptationTargetLocale;
  providerModel: string;
  generatedAt: string;
  pilotLessonIds: string[];
  lessonResults: FragmentPilotLessonResult[];
}): FragmentPilotGenerationReport {
  const allValid = input.lessonResults.every((result) => result.validation.ok);

  return {
    targetLocale: input.targetLocale,
    pipeline: "fragment",
    mode: "pilot",
    provider: "openai-fragment",
    providerModel: input.providerModel,
    generatedAt: input.generatedAt,
    generatedCount: input.lessonResults.length,
    lessonIds: input.lessonResults.map((result) => result.lessonId).sort(),
    pilotLessonIds: input.pilotLessonIds,
    allValid,
    lessons: input.lessonResults,
  };
}
