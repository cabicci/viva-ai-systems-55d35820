import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { isInternalProductionReferenceSection } from "./quality-warnings.ts";
import {
  PRODUCTION_LEAK_SUBSTRINGS,
  sanitizeFinalLessonPackage,
} from "./sanitize-final-lesson-package.ts";

const TARGET_LEARNER_LOCALES = new Set<AdaptationTargetLocale>(["en", "ar-Gulf"]);

/**
 * Hard gate for en / ar-Gulf learner packages. ar-MSA canonical source may
 * retain internal production-reference sections by design.
 */
export function validateTargetLearnerPackageNoProductionLeak(
  pkg: AdaptedLessonPackage | LocalizedLessonPackage,
  locale: AdaptationTargetLocale | "ar-MSA" | string,
): { ok: boolean; errors: string[] } {
  if (locale === "ar-MSA" || !TARGET_LEARNER_LOCALES.has(locale as AdaptationTargetLocale)) {
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

/** Sanitize injected artifact and validate the final learner-facing output. */
export function finalizePhase13PilotLessonForWrite(artifact: AdaptedLessonPackage): {
  sanitized: AdaptedLessonPackage;
  errors: string[];
} {
  const sanitized = sanitizeFinalLessonPackage(artifact) as AdaptedLessonPackage;
  const leak = validateTargetLearnerPackageNoProductionLeak(
    sanitized,
    artifact.locale,
  );
  return { sanitized, errors: leak.errors };
}
