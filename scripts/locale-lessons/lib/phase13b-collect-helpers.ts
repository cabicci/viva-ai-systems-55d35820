import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import type { Phase13BJobResult } from "./phase13b-job-result.ts";
import {
  parsePhase13BArtifactDirName,
  type Phase13BArtifactIndex,
} from "./phase13b-artifact-index.ts";

export function phase13BCellKey(locale: LessonPackageLocale, lessonId: string): string {
  return `${locale}/${lessonId}`;
}

export { parsePhase13BArtifactDirName, type Phase13BArtifactIndex };

export function lookupPhase13BJobResult(
  index: Phase13BArtifactIndex | null,
  locale: LessonPackageLocale,
  lessonId: string,
): { result: Phase13BJobResult; filePath: string; artifactSource?: string } | null {
  if (!index) return null;
  return index.jobResults.get(phase13BCellKey(locale, lessonId)) ?? null;
}

export function lookupPhase13BLessonArtifact(
  index: Phase13BArtifactIndex | null,
  locale: LessonPackageLocale,
  lessonId: string,
): { filePath: string; relativePath?: string; artifactSource?: string } | null {
  if (!index) return null;
  return index.lessonArtifacts.get(phase13BCellKey(locale, lessonId)) ?? null;
}
