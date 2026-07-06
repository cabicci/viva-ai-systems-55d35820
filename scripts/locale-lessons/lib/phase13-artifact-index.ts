import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import type { FragmentPilotJobResult } from "./fragment-pilot-job-result.ts";

export const PHASE13_ARTIFACT_PREFIX = "locale-phase13a-pilot-";

export function phase13CellKey(
  locale: AdaptationTargetLocale,
  lessonId: string,
): string {
  return `${locale}/${lessonId}`;
}

export interface IndexedJobResult {
  result: FragmentPilotJobResult;
  filePath: string;
  relativePath: string;
  /** GitHub artifact directory name when present in the download tree. */
  artifactSource?: string;
}

export interface IndexedLessonArtifact {
  filePath: string;
  relativePath: string;
  artifactSource?: string;
}

export interface Phase13ArtifactIndex {
  root: string;
  jobResults: Map<string, IndexedJobResult>;
  lessonArtifacts: Map<string, IndexedLessonArtifact>;
}

export interface Phase13ArtifactCellIdentity {
  locale: AdaptationTargetLocale;
  lessonId: string;
  artifactSource?: string;
}

function relativeFromRoot(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

/**
 * Parse `locale-phase13a-pilot-{locale}-{lessonId}` or `...-failed` artifact names.
 */
export function parsePhase13ArtifactDirName(
  dirName: string,
): { locale: AdaptationTargetLocale; lessonId: string } | null {
  const base = dirName.replace(/-failed$/, "");
  if (!base.startsWith(PHASE13_ARTIFACT_PREFIX)) return null;
  const rest = base.slice(PHASE13_ARTIFACT_PREFIX.length);
  if (rest.startsWith("ar-Gulf-")) {
    return { locale: "ar-Gulf", lessonId: rest.slice("ar-Gulf-".length) };
  }
  if (rest.startsWith("en-")) {
    return { locale: "en", lessonId: rest.slice("en-".length) };
  }
  return null;
}

function inferFromArtifactAncestors(
  filePath: string,
): Phase13ArtifactCellIdentity | null {
  for (const part of filePath.split(path.sep)) {
    const parsed = parsePhase13ArtifactDirName(part);
    if (parsed) {
      return { ...parsed, artifactSource: part.replace(/-failed$/, "") };
    }
  }
  return null;
}

function inferLocaleFromPath(filePath: string): AdaptationTargetLocale | null {
  const normalized = normalizePath(filePath);
  const match = normalized.match(
    /locale-lessons\/(ar-Gulf|en|ar-MSA)\/(?:lessons|reports)\//,
  );
  if (!match) return null;
  const locale = match[1];
  if (locale === "ar-Gulf" || locale === "en") return locale;
  return null;
}

export function inferLocaleLessonFromResultPath(
  filePath: string,
): { locale: AdaptationTargetLocale; lessonId: string } | null {
  const normalized = normalizePath(filePath);

  const nestedMatch = normalized.match(
    /fragment-pilot-jobs\/(ar-Gulf|en)\/([^/]+)\.result\.json$/,
  );
  if (nestedMatch) {
    return {
      locale: nestedMatch[1] as AdaptationTargetLocale,
      lessonId: nestedMatch[2]!,
    };
  }

  const legacyMatch = normalized.match(
    /locale-lessons\/(ar-Gulf|en)\/reports\/fragment-pilot-jobs\/([^/]+)\.result\.json$/,
  );
  if (legacyMatch) {
    return {
      locale: legacyMatch[1] as AdaptationTargetLocale,
      lessonId: legacyMatch[2]!,
    };
  }

  return null;
}

function resolveResultIdentity(
  filePath: string,
  parsed: FragmentPilotJobResult | null,
): Phase13ArtifactCellIdentity | null {
  const artifactAncestor = inferFromArtifactAncestors(filePath);
  const pathIdentity = inferLocaleLessonFromResultPath(filePath);

  const locale =
    parsed?.locale ??
    artifactAncestor?.locale ??
    pathIdentity?.locale ??
    inferLocaleFromPath(filePath);

  const lessonId =
    parsed?.lessonId ??
    artifactAncestor?.lessonId ??
    pathIdentity?.lessonId ??
    (filePath.endsWith(".result.json")
      ? path.basename(filePath).replace(/\.result\.json$/, "")
      : null);

  if (!locale || !lessonId) return null;

  return {
    locale,
    lessonId,
    artifactSource: artifactAncestor?.artifactSource,
  };
}

function resolveLessonIdentity(
  filePath: string,
  lessonId: string,
): Phase13ArtifactCellIdentity | null {
  const artifactAncestor = inferFromArtifactAncestors(filePath);
  const locale = artifactAncestor?.locale ?? inferLocaleFromPath(filePath);
  if (!locale) return null;
  return {
    locale,
    lessonId: artifactAncestor?.lessonId ?? lessonId,
    artifactSource: artifactAncestor?.artifactSource,
  };
}

function shouldReplaceIndexedJobResult(
  existing: IndexedJobResult,
  incoming: IndexedJobResult,
): boolean {
  if (!existing.artifactSource && incoming.artifactSource) return true;
  if (!existing.result.ok && incoming.result.ok) return true;
  return false;
}

/**
 * Recursively index downloaded GitHub Actions artifacts.
 * Keys are always `{locale}/{lessonId}` — never lessonId alone.
 */
export async function buildPhase13ArtifactIndex(
  artifactsRoot: string,
): Promise<Phase13ArtifactIndex> {
  const root = path.resolve(artifactsRoot);
  const jobResults = new Map<string, IndexedJobResult>();
  const lessonArtifacts = new Map<string, IndexedLessonArtifact>();

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.name.endsWith(".result.json")) {
        let parsed: FragmentPilotJobResult | null = null;
        try {
          const raw = await fs.readFile(fullPath, "utf8");
          const json = JSON.parse(raw) as FragmentPilotJobResult;
          if (json && typeof json.ok === "boolean") {
            parsed = json;
          }
        } catch {
          // fall back to path / artifact-name inference
        }

        const identity = resolveResultIdentity(fullPath, parsed);
        if (!identity) continue;

        const key = phase13CellKey(identity.locale, identity.lessonId);
        const incoming: IndexedJobResult = {
          result:
            parsed ??
            ({
              locale: identity.locale,
              lessonId: identity.lessonId,
              ok: false,
              fieldCount: 0,
              errors: ["result JSON unreadable"],
              generatedAt: new Date(0).toISOString(),
            } satisfies FragmentPilotJobResult),
          filePath: fullPath,
          relativePath: relativeFromRoot(root, fullPath),
          artifactSource: identity.artifactSource,
        };

        const existing = jobResults.get(key);
        if (!existing || shouldReplaceIndexedJobResult(existing, incoming)) {
          jobResults.set(key, incoming);
        }
        continue;
      }

      if (!entry.name.endsWith(".json")) continue;
      if (!fullPath.split(path.sep).includes("lessons")) continue;

      const lessonId = entry.name.replace(/\.json$/, "");
      const identity = resolveLessonIdentity(fullPath, lessonId);
      if (!identity) continue;

      const key = phase13CellKey(identity.locale, identity.lessonId);
      const incoming: IndexedLessonArtifact = {
        filePath: fullPath,
        relativePath: relativeFromRoot(root, fullPath),
        artifactSource: identity.artifactSource,
      };

      const existing = lessonArtifacts.get(key);
      if (!existing || (!existing.artifactSource && incoming.artifactSource)) {
        lessonArtifacts.set(key, incoming);
      }
    }
  }

  await walk(root);
  return { root, jobResults, lessonArtifacts };
}

export function lookupIndexedJobResult(
  index: Phase13ArtifactIndex | null | undefined,
  locale: AdaptationTargetLocale,
  lessonId: string,
): IndexedJobResult | null {
  if (!index) return null;
  return index.jobResults.get(phase13CellKey(locale, lessonId)) ?? null;
}

export function lookupIndexedLessonArtifact(
  index: Phase13ArtifactIndex | null | undefined,
  locale: AdaptationTargetLocale,
  lessonId: string,
): IndexedLessonArtifact | null {
  if (!index) return null;
  return index.lessonArtifacts.get(phase13CellKey(locale, lessonId)) ?? null;
}
