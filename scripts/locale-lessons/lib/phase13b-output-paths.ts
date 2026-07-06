import path from "node:path";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  MSA_LESSONS_DIR,
  packageDirForLocale,
} from "./source-package.ts";

/** Canonical ar-MSA source packages (may retain internal production notes). */
export const AR_MSA_CANONICAL_LESSONS_DIR = MSA_LESSONS_DIR;

/**
 * Derived ar-MSA learner-final output — sanitized, title-locked packages.
 * Never overwrites canonical source under `ar-MSA/lessons/`.
 */
export function arMsaLearnerFinalLessonsDir(): string {
  return path.join(
    packageDirForLocale("ar-MSA"),
    "generated",
    "learner-final",
    "lessons",
  );
}

/** Write target for finalized learner packages during Phase 13B generation. */
export function learnerFinalLessonsDirForLocale(locale: LessonPackageLocale): string {
  if (locale === "ar-MSA") {
    return arMsaLearnerFinalLessonsDir();
  }
  return lessonsDirForLocale(locale);
}

export function isCanonicalArMsaLessonsPath(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join("/");
  return (
    normalized.includes("/ar-MSA/lessons/") &&
    !normalized.includes("/ar-MSA/generated/learner-final/")
  );
}

export function assertNotCanonicalArMsaWriteTarget(filePath: string): void {
  if (isCanonicalArMsaLessonsPath(filePath)) {
    throw new Error(
      `Refusing to write learner-final ar-MSA to canonical source path: ${filePath}`,
    );
  }
}
