import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { lockPackageTitleToLocaleIndex } from "./lesson-title-index.ts";
import { isInternalProductionReferenceSection } from "./quality-warnings.ts";
import {
  PRODUCTION_LEAK_SUBSTRINGS,
  sanitizeFinalLessonPackage,
} from "./sanitize-final-lesson-package.ts";

const ADAPTATION_TARGET_LEARNER_LOCALES = new Set<AdaptationTargetLocale>([
  "en",
  "ar-Gulf",
]);

/** Learner-final outputs including ar-MSA packages written for learners. */
export const LEARNER_FINAL_PACKAGE_LOCALES = new Set<LessonPackageLocale>([
  "en",
  "ar-Gulf",
  "ar-MSA",
]);

function validatePackageNoProductionLeak(
  pkg: AdaptedLessonPackage | LocalizedLessonPackage,
  locale: string,
  applicableLocales: ReadonlySet<string>,
): { ok: boolean; errors: string[] } {
  if (!applicableLocales.has(locale)) {
    return { ok: true, errors: [] };
  }

  const errors: string[] = [];

  pkg.sections.forEach((section, index) => {
    if (isInternalProductionReferenceSection(section)) {
      errors.push(
        `sections[${index}]: internal production reference section retained (${section.role})`,
      );
    }
    const role = section.role ?? "";
    const heading = section.heading ?? "";
    if (/production reference only/i.test(role) || /production reference only/i.test(heading)) {
      errors.push(
        `sections[${index}]: production reference only label in role/heading`,
      );
    }
  });

  const serialized = JSON.stringify(pkg);
  for (const needle of PRODUCTION_LEAK_SUBSTRINGS) {
    if (serialized.includes(needle)) {
      errors.push(`production leak substring: ${needle}`);
    }
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

/**
 * Hard gate for en / ar-Gulf learner packages. ar-MSA canonical source may
 * retain internal production-reference sections by design.
 */
export function validateTargetLearnerPackageNoProductionLeak(
  pkg: AdaptedLessonPackage | LocalizedLessonPackage,
  locale: AdaptationTargetLocale | "ar-MSA" | string,
): { ok: boolean; errors: string[] } {
  return validatePackageNoProductionLeak(
    pkg,
    locale,
    ADAPTATION_TARGET_LEARNER_LOCALES,
  );
}

/** Production-leak gate for packages finalized for learners (includes ar-MSA). */
export function validateLearnerFinalPackageNoProductionLeak(
  pkg: AdaptedLessonPackage | LocalizedLessonPackage,
  locale: LessonPackageLocale | string,
): { ok: boolean; errors: string[] } {
  return validatePackageNoProductionLeak(
    pkg,
    locale,
    LEARNER_FINAL_PACKAGE_LOCALES,
  );
}

/**
 * Sanitize, validate production leaks, and lock title to lesson-titles.json
 * before writing learner-facing locale packages. Does not mutate canonical
 * ar-MSA source files unless explicitly passed in as the package to finalize.
 */
export function finalizeLearnerFacingLocalePackageForWrite(
  artifact: AdaptedLessonPackage | LocalizedLessonPackage,
): {
  sanitized: AdaptedLessonPackage | LocalizedLessonPackage;
  errors: string[];
} {
  const sanitized = sanitizeFinalLessonPackage(artifact);

  const leak = validateLearnerFinalPackageNoProductionLeak(
    sanitized,
    artifact.locale,
  );
  const titleLock = lockPackageTitleToLocaleIndex(sanitized, artifact.locale);

  return {
    sanitized: titleLock.pkg,
    errors: [...leak.errors, ...titleLock.errors],
  };
}

/** @deprecated Prefer finalizeLearnerFacingLocalePackageForWrite. */
export function finalizePhase13PilotLessonForWrite(artifact: AdaptedLessonPackage): {
  sanitized: AdaptedLessonPackage;
  errors: string[];
} {
  const result = finalizeLearnerFacingLocalePackageForWrite(artifact);
  return {
    sanitized: result.sanitized as AdaptedLessonPackage,
    errors: result.errors,
  };
}
