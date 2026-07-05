import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import { CURRICULUM_LESSON_IDS } from "../../../src/lib/locale-curriculum/curriculum-label-keys.ts";

export const PACKAGE_LOCALES = ["en", "ar-MSA", "ar-Gulf"] as const satisfies readonly LessonPackageLocale[];

export const UI_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;

export const FORBIDDEN_GENERIC_TITLES = new Set([
  "بداية الدرس",
  "ماذا ستفهم؟",
  "بداية المسار",
  "بداية واضحة",
  "بدء الدرس",
  "الدرس الأول",
]);

export const ARABIC_LETTER = /[\u0600-\u06FF]/;

/** Active shipped learner lesson IDs from curriculum (100). */
export function activeCurriculumLessonIds(): readonly string[] {
  return CURRICULUM_LESSON_IDS;
}

export interface ValidatorResult {
  name: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function mergeResults(results: ValidatorResult[]): ValidatorResult {
  return {
    name: "localization-contract",
    ok: results.every((r) => r.ok),
    errors: results.flatMap((r) => r.errors.map((e) => `[${r.name}] ${e}`)),
    warnings: results.flatMap((r) => r.warnings.map((w) => `[${r.name}] ${w}`)),
  };
}

export function printResult(result: ValidatorResult): void {
  const label = result.ok ? "OK" : "FAIL";
  console.log(`${result.name}: ${label}`);
  for (const warning of result.warnings) {
    console.warn(`  WARN: ${warning}`);
  }
  for (const error of result.errors) {
    console.error(`  ERROR: ${error}`);
  }
}
