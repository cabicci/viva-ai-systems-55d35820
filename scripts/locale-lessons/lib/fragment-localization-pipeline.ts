import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { extractLocalizableFields } from "./extract-localizable-fields.ts";
import { injectLocalizedFields } from "./inject-localized-fields.ts";
import {
  mockLocalizeTextMap,
  type MockLocalizeOptions,
} from "./mock-localize-text-map.ts";
import type { LocalizedTextMap } from "./localized-text-map.ts";
import {
  validateFragmentPipelineArtifact,
  type FragmentPipelineValidationResult,
} from "./validate-structural-parity.ts";

export interface FragmentLocalizationResult {
  source: LocalizedLessonPackage;
  textMap: LocalizedTextMap;
  localizedTextMap: LocalizedTextMap;
  artifact: AdaptedLessonPackage;
  validation: FragmentPipelineValidationResult;
}

/** Extract → mock adapt text only → inject → validate final artifact. */
export function runFragmentLocalizationPipeline(
  source: LocalizedLessonPackage,
  targetLocale: AdaptationTargetLocale,
  mockOptions: Omit<MockLocalizeOptions, "targetLocale"> = {},
  generatedAt = new Date().toISOString(),
): FragmentLocalizationResult {
  const textMap = extractLocalizableFields(source);
  const localizedTextMap = mockLocalizeTextMap(textMap, {
    ...mockOptions,
    targetLocale,
  });
  const artifact = injectLocalizedFields(
    source,
    localizedTextMap,
    targetLocale,
    generatedAt,
  );
  const validation = validateFragmentPipelineArtifact(
    source,
    artifact,
    targetLocale,
  );

  return {
    source,
    textMap,
    localizedTextMap,
    artifact,
    validation,
  };
}
