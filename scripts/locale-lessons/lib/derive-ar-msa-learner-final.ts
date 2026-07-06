import type { LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import { finalizeLearnerFacingLocalePackageForWrite } from "./phase13-pilot-lesson-output.ts";

/**
 * Deterministic ar-MSA learner-final package from canonical source.
 * No OpenAI — sanitize, leak-check, and title-lock only.
 */
export function deriveArMsaLearnerFinalPackage(source: LocalizedLessonPackage): {
  pkg: LocalizedLessonPackage;
  errors: string[];
} {
  if (source.locale !== "ar-MSA") {
    return {
      pkg: source,
      errors: [`expected ar-MSA source, got ${source.locale}`],
    };
  }

  const { sanitized, errors } = finalizeLearnerFacingLocalePackageForWrite(source);
  return { pkg: sanitized as LocalizedLessonPackage, errors };
}
