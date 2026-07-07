import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonPackageLocale } from "../../../src/lib/locale-lessons/types.ts";
import type { Phase13BJobResult } from "./phase13b-job-result.ts";
import {
  PHASE13B_BATCH_ARTIFACT_PREFIX,
  PHASE13B_CELL_ARTIFACT_PREFIX,
  PHASE13B_SHARD_ARTIFACT_PREFIX,
} from "./phase13b-full-matrix.ts";
import { isPhase13BGeneratedPackagePath } from "./phase13b-generated-packages.ts";

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
  if (!base.startsWith(PHASE13B_CELL_ARTIFACT_PREFIX)) return null;
  const rest = base.slice(PHASE13B_CELL_ARTIFACT_PREFIX.length);
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

/** Parse `locale-phase13b-batch-{locale}` artifact directory names. */
export function parsePhase13BBatchArtifactDirName(
  dirName: string,
): { locale: LessonPackageLocale } | null {
  if (!dirName.startsWith(PHASE13B_BATCH_ARTIFACT_PREFIX)) return null;
  const locale = dirName.slice(PHASE13B_BATCH_ARTIFACT_PREFIX.length);
  if (locale === "ar-MSA" || locale === "ar-Gulf" || locale === "en") {
    return { locale };
  }
  return null;
}

/** Parse `locale-phase13b-shard-{locale}-{shardIndex}` artifact directory names. */
export function parsePhase13BShardArtifactDirName(
  dirName: string,
): { locale: LessonPackageLocale; shardIndex: string } | null {
  if (!dirName.startsWith(PHASE13B_SHARD_ARTIFACT_PREFIX)) return null;
  const rest = dirName.slice(PHASE13B_SHARD_ARTIFACT_PREFIX.length);
  if (rest.startsWith("ar-Gulf-")) {
    return { locale: "ar-Gulf", shardIndex: rest.slice("ar-Gulf-".length) };
  }
  if (rest.startsWith("ar-MSA-")) {
    return { locale: "ar-MSA", shardIndex: rest.slice("ar-MSA-".length) };
  }
  if (rest.startsWith("en-")) {
    return { locale: "en", shardIndex: rest.slice("en-".length) };
  }
  return null;
}

function parseLessonIdFromResultFileName(fileName: string): string | null {
  if (!fileName.endsWith(".result.json")) return null;
  const lessonId = fileName.slice(0, -".result.json".length);
  return lessonId.length > 0 ? lessonId : null;
}

function inferBatchLocaleFromPath(filePath: string): {
  locale: LessonPackageLocale;
  artifactSource?: string;
} | null {
  for (const part of filePath.split(path.sep)) {
    const shard = parsePhase13BShardArtifactDirName(part);
    if (shard) {
      return { locale: shard.locale, artifactSource: part };
    }
    const parsed = parsePhase13BBatchArtifactDirName(part);
    if (parsed) {
      return { locale: parsed.locale, artifactSource: part };
    }
  }
  return null;
}

function inferNestedJobLocaleFromPath(normalized: string): LessonPackageLocale | null {
  const match = normalized.match(/phase13b-full-jobs\/(ar-MSA|ar-Gulf|en)\//);
  return match ? (match[1] as LessonPackageLocale) : null;
}

function inferFromPerCellArtifactAncestors(
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

export function resolvePhase13BJobResultIdentity(
  filePath: string,
  result: Phase13BJobResult,
): { locale: LessonPackageLocale; lessonId: string; artifactSource?: string } {
  const normalized = normalizePath(filePath);
  const nestedMatch = normalized.match(
    /phase13b-full-jobs\/(ar-MSA|ar-Gulf|en)\/([^/]+)\.result\.json$/,
  );
  if (nestedMatch) {
    const perCell = inferFromPerCellArtifactAncestors(filePath);
    return {
      locale: nestedMatch[1] as LessonPackageLocale,
      lessonId: nestedMatch[2],
      artifactSource: perCell?.artifactSource,
    };
  }

  const batch = inferBatchLocaleFromPath(filePath);
  const fileName = path.basename(filePath);
  const lessonIdFromName = parseLessonIdFromResultFileName(fileName);
  if (batch && lessonIdFromName) {
    return {
      locale: batch.locale,
      lessonId: lessonIdFromName,
      artifactSource: batch.artifactSource,
    };
  }

  const nestedLocale = inferNestedJobLocaleFromPath(normalized);
  if (nestedLocale && lessonIdFromName) {
    return {
      locale: nestedLocale,
      lessonId: lessonIdFromName,
      artifactSource: inferFromPerCellArtifactAncestors(filePath)?.artifactSource,
    };
  }

  if (result.locale && result.lessonId) {
    const perCell = inferFromPerCellArtifactAncestors(filePath);
    const batchSource = inferBatchLocaleFromPath(filePath);
    return {
      locale: result.locale,
      lessonId: result.lessonId,
      artifactSource: perCell?.artifactSource ?? batchSource?.artifactSource,
    };
  }

  throw new Error(`Could not resolve locale/lessonId for ${filePath}`);
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

function inferGeneratedPackageIdentity(
  normalized: string,
  filePath: string,
): { locale: LessonPackageLocale; lessonId: string; artifactSource?: string } | null {
  const match = normalized.match(
    /phase13b-generated-packages\/(ar-MSA|ar-Gulf|en)\/([^/]+)\.json$/,
  );
  if (!match) return null;
  const batch = inferBatchLocaleFromPath(filePath);
  return {
    locale: match[1] as LessonPackageLocale,
    lessonId: match[2],
    artifactSource: batch?.artifactSource,
  };
}

function indexLessonArtifact(
  lessonArtifacts: Map<string, IndexedPhase13BLessonArtifact>,
  root: string,
  filePath: string,
  identity: { locale: LessonPackageLocale; lessonId: string; artifactSource?: string },
): void {
  const key = phase13BCellKey(identity.locale, identity.lessonId);
  lessonArtifacts.set(key, {
    filePath,
    relativePath: relativeFromRoot(root, filePath),
    artifactSource: identity.artifactSource,
  });
}

function indexJobResult(
  jobResults: Map<string, IndexedPhase13BJobResult>,
  root: string,
  filePath: string,
  result: Phase13BJobResult,
  identity: { locale: LessonPackageLocale; lessonId: string; artifactSource?: string },
): void {
  const key = phase13BCellKey(identity.locale, identity.lessonId);
  jobResults.set(key, {
    result,
    filePath,
    relativePath: relativeFromRoot(root, filePath),
    artifactSource: identity.artifactSource,
  });
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

    if (normalized.endsWith(".result.json")) {
      try {
        const raw = await fs.readFile(filePath, "utf8");
        const result = JSON.parse(raw) as Phase13BJobResult;
        const identity = resolvePhase13BJobResultIdentity(filePath, result);
        indexJobResult(jobResults, root, filePath, result, identity);
      } catch {
        // skip invalid result files
      }
      continue;
    }

    if (normalized.endsWith(".json") && isPhase13BGeneratedPackagePath(normalized)) {
      const identity = inferGeneratedPackageIdentity(normalized, filePath);
      if (identity) {
        indexLessonArtifact(lessonArtifacts, root, filePath, identity);
      }
      continue;
    }
  }

  return { root, jobResults, lessonArtifacts };
}
