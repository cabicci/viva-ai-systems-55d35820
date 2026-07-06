import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import type { Phase13BJobResult } from "./phase13b-job-result.ts";
import { PHASE13B_ARTIFACT_PREFIX } from "./phase13b-full-matrix.ts";

export interface IndexedPhase13BJobResult {
  result: Phase13BJobResult;
  filePath: string;
  relativePath: string;
  artifactSource?: string;
}

export interface IndexedPhase13BLessonArtifact {
  filePath: string;
  relativePath: string;
  artifactSource?: string;
}

export interface Phase13BArtifactIndex {
  root: string;
  jobResults: Map<string, IndexedPhase13BJobResult>;
  lessonArtifacts: Map<string, IndexedPhase13BLessonArtifact>;
}

function relativeFromRoot(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function phase13BCellKey(locale: LessonPackageLocale, lessonId: string): string {
  return `${locale}/${lessonId}`;
}

/**
 * Parse `locale-phase13b-full-{locale}-{lessonId}` or `...-failed` artifact names.
 */
export function parsePhase13BArtifactDirName(
  dirName: string,
): { locale: LessonPackageLocale; lessonId: string } | null {
  const base = dirName.replace(/-failed$/, "");
  if (!base.startsWith(PHASE13B_ARTIFACT_PREFIX)) return null;
  const rest = base.slice(PHASE13B_ARTIFACT_PREFIX.length);
  if (rest.startsWith("ar-Gulf-")) {
    return { locale: "ar-Gulf", lessonId: rest.slice("ar-Gulf-".length) };
  }
  if (rest.startsWith("ar-MSA-")) {
    return { locale: "ar-MSA", lessonId: rest.slice("ar-MSA-".length) };
  }
  if (rest.startsWith("en-")) {
    return { locale: "en", lessonId: rest.slice("en-".length) };
  }
  return null;
}

function inferFromArtifactAncestors(
  filePath: string,
): { locale: LessonPackageLocale; lessonId: string; artifactSource?: string } | null {
  for (const part of filePath.split(path.sep)) {
    const parsed = parsePhase13BArtifactDirName(part);
    if (parsed) {
      return { ...parsed, artifactSource: part.replace(/-failed$/, "") };
    }
  }
  return null;
}

async function walkFiles(root: string, dir = root): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(root, full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

export async function buildPhase13BArtifactIndex(
  root: string,
): Promise<Phase13BArtifactIndex> {
  const jobResults = new Map<string, IndexedPhase13BJobResult>();
  const lessonArtifacts = new Map<string, IndexedPhase13BLessonArtifact>();

  let files: string[] = [];
  try {
    files = await walkFiles(root);
  } catch {
    return { root, jobResults, lessonArtifacts };
  }

  for (const filePath of files) {
    const normalized = normalizePath(filePath);
    const inferred = inferFromArtifactAncestors(filePath);

    if (normalized.endsWith(".result.json") && normalized.includes("phase13b-full-jobs/")) {
      const localeMatch = normalized.match(/phase13b-full-jobs\/(ar-MSA|ar-Gulf|en)\/([^/]+)\.result\.json$/);
      if (!localeMatch) continue;
      const locale = localeMatch[1] as LessonPackageLocale;
      const lessonId = localeMatch[2];
      try {
        const raw = await fs.readFile(filePath, "utf8");
        const result = JSON.parse(raw) as Phase13BJobResult;
        const key = phase13BCellKey(locale, lessonId);
        jobResults.set(key, {
          result,
          filePath,
          relativePath: relativeFromRoot(root, filePath),
          artifactSource: inferred?.artifactSource,
        });
      } catch {
        // skip invalid result files
      }
      continue;
    }

    if (normalized.endsWith(".json") && normalized.includes("/lessons/")) {
      const localeMatch = normalized.match(
        /locale-lessons\/(ar-MSA|ar-Gulf|en)\/(?:generated\/learner-final\/)?lessons\/([^/]+)\.json$/,
      );
      if (!localeMatch) continue;
      const locale = localeMatch[1] as LessonPackageLocale;
      const lessonId = localeMatch[2];
      const key = phase13BCellKey(locale, lessonId);
      lessonArtifacts.set(key, {
        filePath,
        relativePath: relativeFromRoot(root, filePath),
        artifactSource: inferred?.artifactSource,
      });
    }
  }

  return { root, jobResults, lessonArtifacts };
}
