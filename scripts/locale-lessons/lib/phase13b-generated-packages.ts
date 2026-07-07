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

/**
 * Accept generated-package JSON in any of the shapes we encounter:
 *   - src/lib/locale-lessons/ar-MSA/reports/phase13b-generated-packages/{locale}/{lessonId}.json
 *     (canonical staging + also the layout of a committed workspace file)
 *   - reports/phase13b-generated-packages/{locale}/{lessonId}.json
 *     (GitHub artifact upload keeps the tail after the artifact `path:` prefix)
 *   - phase13b-generated-packages/{locale}/{lessonId}.json
 *     (GitHub artifact upload with the `reports/` prefix stripped —
 *      this is what actually ships inside `locale-phase13b-shard-*.zip`)
 *   - the same three shapes for the read-only committed recovery folder
 *     `phase13b-recovered-packages/…` produced by the artifact-recovery utility.
 */
export function isPhase13BGeneratedPackagePath(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join("/");
  const hay = `/${normalized}`;
  return (
    hay.includes("/phase13b-generated-packages/") ||
    hay.includes("/phase13b-recovered-packages/")
  );
}
