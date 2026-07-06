import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import type { FragmentPilotJobResult } from "./fragment-pilot-job-result.ts";

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
}

export interface IndexedLessonArtifact {
  filePath: string;
  relativePath: string;
}

export interface Phase13ArtifactIndex {
  root: string;
  jobResults: Map<string, IndexedJobResult>;
  lessonArtifacts: Map<string, IndexedLessonArtifact>;
}

function relativeFromRoot(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function inferLocaleFromPath(filePath: string): AdaptationTargetLocale | null {
  const normalized = filePath.split(path.sep).join("/");
  const match = normalized.match(
    /locale-lessons\/(ar-Gulf|en|ar-MSA)\/(?:lessons|reports)\//,
  );
  if (!match) return null;
  const locale = match[1];
  if (locale === "ar-Gulf" || locale === "en") return locale;
  return null;
}

/**
 * Recursively index downloaded GitHub Actions artifacts.
 * Does not assume a single nesting layout — finds any *.result.json and
 * lesson JSON files under .../lessons/... .
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
        try {
          const raw = await fs.readFile(fullPath, "utf8");
          const parsed = JSON.parse(raw) as FragmentPilotJobResult;
          if (
            parsed?.locale &&
            parsed?.lessonId &&
            typeof parsed.ok === "boolean"
          ) {
            const key = phase13CellKey(parsed.locale, parsed.lessonId);
            jobResults.set(key, {
              result: parsed,
              filePath: fullPath,
              relativePath: relativeFromRoot(root, fullPath),
            });
          }
        } catch {
          // skip invalid result files
        }
        continue;
      }

      if (!entry.name.endsWith(".json")) continue;
      if (!fullPath.split(path.sep).includes("lessons")) continue;
      if (entry.name.endsWith(".result.json")) continue;

      const lessonId = entry.name.replace(/\.json$/, "");
      const locale = inferLocaleFromPath(fullPath);
      if (!locale || !lessonId) continue;

      const key = phase13CellKey(locale, lessonId);
      lessonArtifacts.set(key, {
        filePath: fullPath,
        relativePath: relativeFromRoot(root, fullPath),
      });
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
