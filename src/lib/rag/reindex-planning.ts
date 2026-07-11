import fs from "node:fs";
import path from "node:path";
import { CONTENT_FREEZE_SHA } from "./constants";
import type {
  ChunkManifest,
  PackageManifest,
  ReindexPlanEntry,
  ReindexPlanReport,
} from "./types";
import type { LessonPackageLocale } from "@/lib/locale-lessons/types";

function emptyLocaleReport(): Record<
  LessonPackageLocale,
  { skip: number; reindex: number; delete: number; retry: number }
> {
  return {
    en: { skip: 0, reindex: 0, delete: 0, retry: 0 },
    "ar-MSA": { skip: 0, reindex: 0, delete: 0, retry: 0 },
    "ar-Gulf": { skip: 0, reindex: 0, delete: 0, retry: 0 },
  };
}

function loadManifestFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/** Diff current vs previous package manifests for incremental reindex planning. */
export function planReindex(
  current: PackageManifest,
  previous: PackageManifest | null,
  options?: {
    dryRun?: boolean;
    failedUnits?: string[];
    retryOnlyFailed?: boolean;
  },
): ReindexPlanReport {
  const entries: ReindexPlanEntry[] = [];
  const localeReports = emptyLocaleReport();
  const failedSet = new Set(options?.failedUnits ?? []);
  const retryOnlyFailed = options?.retryOnlyFailed ?? false;

  const previousByPath = new Map(
    (previous?.packages ?? []).map((p) => [p.packagePath, p]),
  );
  const currentByPath = new Map(current.packages.map((p) => [p.packagePath, p]));

  for (const pkg of current.packages) {
    const prev = previousByPath.get(pkg.packagePath);
    let action: ReindexPlanEntry["action"];
    let reason: string;

    if (retryOnlyFailed) {
      if (failedSet.has(pkg.packagePath)) {
        action = "retry";
        reason = "Listed in failed-units retry set";
      } else {
        action = "skip";
        reason = "Retry-only-failed mode: not in failed set";
      }
    } else if (!prev) {
      action = "reindex";
      reason = "New package not in previous manifest";
    } else if (prev.packageChecksum === pkg.packageChecksum) {
      action = "skip";
      reason = "Package checksum unchanged";
    } else {
      action = "reindex";
      reason = "Package checksum changed";
    }

    entries.push({
      packagePath: pkg.packagePath,
      lessonId: pkg.lessonId,
      locale: pkg.locale,
      action,
      previousChecksum: prev?.packageChecksum ?? null,
      currentChecksum: pkg.packageChecksum,
      reason,
    });

    localeReports[pkg.locale][action]++;
  }

  for (const [packagePath, prev] of previousByPath) {
    if (!currentByPath.has(packagePath)) {
      entries.push({
        packagePath,
        lessonId: prev.lessonId,
        locale: prev.locale,
        action: "delete",
        previousChecksum: prev.packageChecksum,
        currentChecksum: null,
        reason: "Package removed or superseded",
      });
      localeReports[prev.locale].delete++;
    }
  }

  entries.sort((a, b) => a.packagePath.localeCompare(b.packagePath));

  return {
    dryRun: options?.dryRun ?? true,
    sourceSha: CONTENT_FREEZE_SHA,
    skipCount: entries.filter((e) => e.action === "skip").length,
    reindexCount: entries.filter((e) => e.action === "reindex").length,
    deleteCount: entries.filter((e) => e.action === "delete").length,
    retryCount: entries.filter((e) => e.action === "retry").length,
    entries,
    localeReports,
  };
}

/** Load previous manifests from artifacts for diff-based planning. */
export function loadPreviousManifests(
  repoRoot: string,
  artifactsDir: string,
): {
  packageManifest: PackageManifest | null;
  chunkManifest: ChunkManifest | null;
} {
  const base = path.join(repoRoot, artifactsDir);
  return {
    packageManifest: loadManifestFile<PackageManifest>(
      path.join(base, "package-manifest.previous.json"),
    ),
    chunkManifest: loadManifestFile<ChunkManifest>(
      path.join(base, "chunk-manifest.previous.json"),
    ),
  };
}

/** Identify orphan active chunks not tied to current package manifest. */
export function planSupersededChunkCleanup(
  currentChunkManifest: ChunkManifest,
  previousChunkManifest: ChunkManifest | null,
): string[] {
  if (!previousChunkManifest) return [];

  const currentIds = new Set(currentChunkManifest.chunks.map((c) => c.chunkId));
  return previousChunkManifest.chunks
    .filter((c) => !currentIds.has(c.chunkId))
    .map((c) => c.chunkId)
    .sort();
}
