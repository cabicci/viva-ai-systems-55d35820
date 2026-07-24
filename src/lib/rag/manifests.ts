import fs from "node:fs";
import path from "node:path";
import {
  CONTENT_FREEZE_SHA,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_PLACEHOLDER,
  RAG_ARTIFACTS_DIR,
  RAG_INDEX_VERSION,
  RAG_MANIFEST_GENERATED_AT,
} from "./constants";
import { sha256Json } from "./checksum";
import { discoverApprovedPackages, loadPackageByPath } from "./corpus-discovery";
import { generateChunksForPackage } from "./chunking";
import {
  buildAuthoritativeLookupFromManifests,
  serializeAuthoritativeLookup,
  type AuthoritativeCorpusLookup,
} from "./authoritative-manifest-lookup";
import type {
  ApprovedPackageRecord,
  ChunkManifest,
  ChunkManifestEntry,
  PackageManifest,
  PackageManifestEntry,
  RagChunkRecord,
} from "./types";
import { APPROVED_LOCALES, type ApprovedLocale } from "./constants";

function countByLocale<T extends { locale: string }>(items: T[]): Record<ApprovedLocale, number> {
  const counts = Object.fromEntries(APPROVED_LOCALES.map((l) => [l, 0])) as Record<
    ApprovedLocale,
    number
  >;
  for (const item of items) {
    if ((APPROVED_LOCALES as readonly string[]).includes(item.locale)) {
      counts[item.locale as ApprovedLocale] += 1;
    }
  }
  return counts;
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
    chunkCountByPath.set(chunk.packagePath, (chunkCountByPath.get(chunk.packagePath) ?? 0) + 1);
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
    a.locale === b.locale ? a.lessonId.localeCompare(b.lessonId) : a.locale.localeCompare(b.locale),
  );

  const body = {
    schemaVersion: "package-manifest-v1" as const,
    indexVersion: RAG_INDEX_VERSION,
    sourceSha: CONTENT_FREEZE_SHA,
    generatedAt: RAG_MANIFEST_GENERATED_AT,
    packageCount: packagesEntries.length,
    localeCounts: countByLocale(records),
    packages: packagesEntries,
  };

  return {
    ...body,
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
    generatedAt: RAG_MANIFEST_GENERATED_AT,
    embeddingModel: EMBEDDING_MODEL_PLACEHOLDER,
    embeddingDimensions: EMBEDDING_DIMENSIONS,
    chunkCount: entries.length,
    localeCounts: countByLocale(chunks),
    chunks: entries,
  };

  return {
    ...body,
    manifestChecksum: sha256Json({ ...body, manifestChecksum: undefined }),
  };
}

function writeJsonDeterministic(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

/** Write manifests, chunk payload, and authoritative lookup artifacts. */
export function writeRagArtifacts(
  repoRoot: string,
  outputDir: string,
  options?: { dryRun?: boolean },
): {
  packageManifest: PackageManifest;
  chunkManifest: ChunkManifest;
  chunks: RagChunkRecord[];
  authoritativeLookup: AuthoritativeCorpusLookup;
  outputPaths: {
    packageManifest: string;
    chunkManifest: string;
    chunks: string;
    authoritativeLookup: string;
    edgeAuthoritativeLookup: string;
  };
} {
  const packages = discoverApprovedPackages(repoRoot);
  const chunks = generateAllChunks(repoRoot, packages);
  const packageManifest = buildPackageManifest(repoRoot, packages, chunks);
  const chunkManifest = buildChunkManifest(chunks);
  const authoritativeLookup = buildAuthoritativeLookupFromManifests(packageManifest, chunkManifest);

  const absOutput = path.join(repoRoot, outputDir);
  const packageManifestPath = path.join(absOutput, "package-manifest.json");
  const chunkManifestPath = path.join(absOutput, "chunk-manifest.json");
  const chunksPath = path.join(absOutput, "chunks.json");
  const authoritativeLookupPath = path.join(absOutput, "authoritative-lookup.json");
  const edgeAuthoritativeLookupPath = path.join(
    repoRoot,
    "supabase/functions/assistant-runtime/authoritative-corpus-lookup.json",
  );

  if (!options?.dryRun) {
    fs.mkdirSync(absOutput, { recursive: true });
    writeJsonDeterministic(packageManifestPath, packageManifest);
    writeJsonDeterministic(chunkManifestPath, chunkManifest);
    writeJsonDeterministic(chunksPath, chunks);
    const lookupJson = serializeAuthoritativeLookup(authoritativeLookup);
    writeJsonDeterministic(authoritativeLookupPath, lookupJson);
    // Only refresh the Edge runtime twin when writing the canonical artifacts dir.
    const normalizedOutput = outputDir.replace(/\\/g, "/").replace(/^\.\//, "");
    if (normalizedOutput === RAG_ARTIFACTS_DIR) {
      fs.mkdirSync(path.dirname(edgeAuthoritativeLookupPath), { recursive: true });
      writeJsonDeterministic(edgeAuthoritativeLookupPath, lookupJson);
    }
  }

  return {
    packageManifest,
    chunkManifest,
    chunks,
    authoritativeLookup,
    outputPaths: {
      packageManifest: path.relative(repoRoot, packageManifestPath).replace(/\\/g, "/"),
      chunkManifest: path.relative(repoRoot, chunkManifestPath).replace(/\\/g, "/"),
      chunks: path.relative(repoRoot, chunksPath).replace(/\\/g, "/"),
      authoritativeLookup: path.relative(repoRoot, authoritativeLookupPath).replace(/\\/g, "/"),
      edgeAuthoritativeLookup: path
        .relative(repoRoot, edgeAuthoritativeLookupPath)
        .replace(/\\/g, "/"),
    },
  };
}
