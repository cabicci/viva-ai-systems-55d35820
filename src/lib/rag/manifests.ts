import fs from "node:fs";
import path from "node:path";
import {
  CONTENT_FREEZE_SHA,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_PLACEHOLDER,
  RAG_INDEX_VERSION,
} from "./constants";
import { sha256Json } from "./checksum";
import { discoverApprovedPackages, loadPackageByPath } from "./corpus-discovery";
import { generateChunksForPackage } from "./chunking";
import type {
  ApprovedPackageRecord,
  ChunkManifest,
  ChunkManifestEntry,
  PackageManifest,
  PackageManifestEntry,
  RagChunkRecord,
} from "./types";
import type { LessonPackageLocale } from "@/lib/locale-lessons/types";

function countByLocale<T extends { locale: LessonPackageLocale }>(
  items: T[],
): Record<LessonPackageLocale, number> {
  return {
    en: items.filter((i) => i.locale === "en").length,
    "ar-MSA": items.filter((i) => i.locale === "ar-MSA").length,
    "ar-Gulf": items.filter((i) => i.locale === "ar-Gulf").length,
  };
}

/** Generate all chunks for the approved corpus. */
export function generateAllChunks(
  repoRoot: string,
  packages?: ApprovedPackageRecord[],
): RagChunkRecord[] {
  const records = packages ?? discoverApprovedPackages(repoRoot);
  const allChunks: RagChunkRecord[] = [];

  for (const record of records) {
    const pkg = loadPackageByPath(repoRoot, record.packagePath);
    const chunks = generateChunksForPackage(pkg, record);
    allChunks.push(...chunks);
  }

  allChunks.sort((a, b) => a.chunkId.localeCompare(b.chunkId));
  return allChunks;
}

/** Build package manifest from discovered packages and chunk counts. */
export function buildPackageManifest(
  repoRoot: string,
  packages?: ApprovedPackageRecord[],
  chunks?: RagChunkRecord[],
): PackageManifest {
  const records = packages ?? discoverApprovedPackages(repoRoot);
  const allChunks = chunks ?? generateAllChunks(repoRoot, records);

  const chunkCountByPath = new Map<string, number>();
  for (const chunk of allChunks) {
    chunkCountByPath.set(
      chunk.packagePath,
      (chunkCountByPath.get(chunk.packagePath) ?? 0) + 1,
    );
  }

  const packagesEntries: PackageManifestEntry[] = records.map((r) => ({
    lessonId: r.lessonId,
    locale: r.locale,
    moduleId: r.moduleId,
    trackId: r.trackId,
    packagePath: r.packagePath,
    productionRoute: r.productionRoute,
    sourceSha: r.sourceSha,
    packageChecksum: r.packageChecksum,
    canonicalVersion: r.canonicalVersion,
    chunkCount: chunkCountByPath.get(r.packagePath) ?? 0,
  }));

  packagesEntries.sort((a, b) =>
    a.locale === b.locale
      ? a.lessonId.localeCompare(b.lessonId)
      : a.locale.localeCompare(b.locale),
  );

  const body = {
    schemaVersion: "package-manifest-v1" as const,
    indexVersion: RAG_INDEX_VERSION,
    sourceSha: CONTENT_FREEZE_SHA,
    generatedAt: new Date(0).toISOString(),
    packageCount: packagesEntries.length,
    localeCounts: countByLocale(records),
    packages: packagesEntries,
  };

  return {
    ...body,
    generatedAt: new Date().toISOString(),
    manifestChecksum: sha256Json({ ...body, manifestChecksum: undefined }),
  };
}

/** Build chunk manifest from generated chunks. */
export function buildChunkManifest(chunks: RagChunkRecord[]): ChunkManifest {
  const entries: ChunkManifestEntry[] = chunks.map((c) => ({
    chunkId: c.chunkId,
    lessonId: c.lessonId,
    locale: c.locale,
    moduleId: c.moduleId,
    trackId: c.trackId,
    sectionIndex: c.sectionIndex,
    sectionRole: c.sectionRole,
    chunkIndex: c.chunkIndex,
    contentType: c.contentType,
    textChecksum: c.textChecksum,
    charCount: c.charCount,
    packagePath: c.packagePath,
  }));

  const body = {
    schemaVersion: "chunk-manifest-v1" as const,
    indexVersion: RAG_INDEX_VERSION,
    sourceSha: CONTENT_FREEZE_SHA,
    generatedAt: new Date(0).toISOString(),
    embeddingModel: EMBEDDING_MODEL_PLACEHOLDER,
    embeddingDimensions: EMBEDDING_DIMENSIONS,
    chunkCount: entries.length,
    localeCounts: countByLocale(chunks),
    chunks: entries,
  };

  return {
    ...body,
    generatedAt: new Date().toISOString(),
    manifestChecksum: sha256Json({ ...body, manifestChecksum: undefined }),
  };
}

/** Write manifests and chunk payload to artifacts directory. */
export function writeRagArtifacts(
  repoRoot: string,
  outputDir: string,
  options?: { dryRun?: boolean },
): {
  packageManifest: PackageManifest;
  chunkManifest: ChunkManifest;
  chunks: RagChunkRecord[];
  outputPaths: { packageManifest: string; chunkManifest: string; chunks: string };
} {
  const packages = discoverApprovedPackages(repoRoot);
  const chunks = generateAllChunks(repoRoot, packages);
  const packageManifest = buildPackageManifest(repoRoot, packages, chunks);
  const chunkManifest = buildChunkManifest(chunks);

  const absOutput = path.join(repoRoot, outputDir);
  const packageManifestPath = path.join(absOutput, "package-manifest.json");
  const chunkManifestPath = path.join(absOutput, "chunk-manifest.json");
  const chunksPath = path.join(absOutput, "chunks.json");

  if (!options?.dryRun) {
    fs.mkdirSync(absOutput, { recursive: true });
    fs.writeFileSync(packageManifestPath, `${JSON.stringify(packageManifest, null, 2)}\n`);
    fs.writeFileSync(chunkManifestPath, `${JSON.stringify(chunkManifest, null, 2)}\n`);
    fs.writeFileSync(chunksPath, `${JSON.stringify(chunks, null, 2)}\n`);
  }

  return {
    packageManifest,
    chunkManifest,
    chunks,
    outputPaths: {
      packageManifest: path.relative(repoRoot, packageManifestPath).replace(/\\/g, "/"),
      chunkManifest: path.relative(repoRoot, chunkManifestPath).replace(/\\/g, "/"),
      chunks: path.relative(repoRoot, chunksPath).replace(/\\/g, "/"),
    },
  };
}
