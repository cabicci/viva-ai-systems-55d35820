/**
 * Load authoritative lesson visual masters from docs/lesson-visuals/v1/masters.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { LessonVisualMaster } from "../types";
import { masterRelativePathForLesson } from "./pilotManifest";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

/** Repo root: src/lib/lesson-visuals/v1/production → ../../../../.. */
export function defaultRepoRoot(): string {
  return resolve(MODULE_DIR, "../../../../..");
}

export { masterRelativePathForLesson };

export function resolveMasterAbsolutePath(
  lessonId: string,
  repoRoot: string = defaultRepoRoot(),
  masterRelativePath?: string | null,
): string {
  const rel = (masterRelativePath ?? masterRelativePathForLesson(lessonId)).replace(/\\/g, "/");
  if (rel.includes("..") || rel.startsWith("/") || /^[a-zA-Z]:/.test(rel)) {
    throw new Error(`refusing unsafe masterRelativePath: ${rel}`);
  }
  if (!rel.startsWith("docs/lesson-visuals/v1/masters/") || !rel.endsWith(".master.json")) {
    throw new Error(`masterRelativePath outside authorized masters tree: ${rel}`);
  }
  return resolve(repoRoot, rel);
}

export function loadLessonMaster(args: {
  lessonId: string;
  repoRoot?: string;
  masterRelativePath?: string | null;
}): LessonVisualMaster {
  const abs = resolveMasterAbsolutePath(
    args.lessonId,
    args.repoRoot ?? defaultRepoRoot(),
    args.masterRelativePath,
  );
  if (!existsSync(abs)) {
    throw new Error(`authoritative master missing: ${abs}`);
  }
  const parsed = JSON.parse(readFileSync(abs, "utf8")) as LessonVisualMaster;
  if (parsed.schemaVersion !== "lesson-visual-master/v1") {
    throw new Error(`unexpected master schemaVersion at ${abs}`);
  }
  if (parsed.lessonId !== args.lessonId) {
    throw new Error(`master lessonId mismatch expected=${args.lessonId} got=${parsed.lessonId}`);
  }
  return parsed;
}
