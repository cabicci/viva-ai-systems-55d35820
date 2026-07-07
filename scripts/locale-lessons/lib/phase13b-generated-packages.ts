import path from "node:path";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import { packageDirForLocale } from "./source-package.ts";

/** Artifact staging root — never reads/writes canonical or shipped lesson dirs. */
export const PHASE13B_GENERATED_PACKAGES_ROOT = path.join(
  packageDirForLocale("ar-MSA"),
  "reports",
  "phase13b-generated-packages",
);

export function phase13BGeneratedPackageDirForLocale(locale: LessonPackageLocale): string {
  return path.join(PHASE13B_GENERATED_PACKAGES_ROOT, locale);
}

export function phase13BGeneratedPackagePath(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return path.join(phase13BGeneratedPackageDirForLocale(locale), `${lessonId}.json`);
}

/** Final repo merge targets (used by docs/merge tooling, not CI writes). */
export function finalMergeTargetPathForLocale(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  if (locale === "ar-MSA") {
    return path.join(
      packageDirForLocale("ar-MSA"),
      "generated",
      "learner-final",
      "lessons",
      `${lessonId}.json`,
    );
  }
  return path.join(packageDirForLocale(locale), "lessons", `${lessonId}.json`);
}

export function isPhase13BGeneratedPackagePath(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join("/");
  return normalized.includes("/reports/phase13b-generated-packages/");
}
