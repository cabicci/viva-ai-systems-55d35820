import { discoverApprovedPackages } from "./corpus-discovery";
import { verifyCorpus } from "./corpus-verification";
import { analyzeChunkQuality } from "./chunking";
import { generateAllChunks, buildPackageManifest, buildChunkManifest, writeRagArtifacts } from "./manifests";
import {
  planReindex,
  loadPreviousManifests,
  planSupersededChunkCleanup,
} from "./reindex-planning";
import { RAG_ARTIFACTS_DIR } from "./constants";
import type {
  CorpusVerificationReport,
  ChunkQualityReport,
  ReindexPlanReport,
} from "./types";

export interface RagPipelineReport {
  corpus: CorpusVerificationReport;
  packageCount: number;
  chunkCount: number;
  localeChunkCounts: Record<string, number>;
  quality: ChunkQualityReport;
  packageManifestChecksum: string;
  chunkManifestChecksum: string;
  reindexPlan: ReindexPlanReport;
  supersededChunkIds: string[];
  deterministicRerunEqual: boolean;
}

/** Run full local RAG pipeline (read-only, no paid API calls). */
export function runRagPipeline(
  repoRoot: string,
  options?: {
    artifactsDir?: string;
    dryRun?: boolean;
    failedUnits?: string[];
    retryOnlyFailed?: boolean;
  },
): RagPipelineReport {
  const artifactsDir = options?.artifactsDir ?? RAG_ARTIFACTS_DIR;

  const corpus = verifyCorpus(repoRoot);
  const packages = discoverApprovedPackages(repoRoot);

  const chunksRun1 = generateAllChunks(repoRoot, packages);
  const chunksRun2 = generateAllChunks(repoRoot, packages);

  const deterministicRerunEqual =
    JSON.stringify(chunksRun1) === JSON.stringify(chunksRun2);

  const quality = analyzeChunkQuality(chunksRun1);
  const packageManifest = buildPackageManifest(repoRoot, packages, chunksRun1);
  const chunkManifest = buildChunkManifest(chunksRun1);

  const { packageManifest: previousPackage } = loadPreviousManifests(
    repoRoot,
    artifactsDir,
  );

  const reindexPlan = planReindex(packageManifest, previousPackage, {
    dryRun: options?.dryRun ?? true,
    failedUnits: options?.failedUnits,
    retryOnlyFailed: options?.retryOnlyFailed,
  });

  const { chunkManifest: previousChunk } = loadPreviousManifests(
    repoRoot,
    artifactsDir,
  );
  const supersededChunkIds = planSupersededChunkCleanup(
    chunkManifest,
    previousChunk,
  );

  if (!options?.dryRun) {
    writeRagArtifacts(repoRoot, artifactsDir);
  }

  const localeChunkCounts: Record<string, number> = {};
  for (const chunk of chunksRun1) {
    localeChunkCounts[chunk.locale] = (localeChunkCounts[chunk.locale] ?? 0) + 1;
  }

  return {
    corpus,
    packageCount: packages.length,
    chunkCount: chunksRun1.length,
    localeChunkCounts,
    quality,
    packageManifestChecksum: packageManifest.manifestChecksum,
    chunkManifestChecksum: chunkManifest.manifestChecksum,
    reindexPlan,
    supersededChunkIds,
    deterministicRerunEqual,
  };
}

export * from "./constants";
export * from "./types";
export * from "./checksum";
export * from "./corpus-discovery";
export * from "./corpus-verification";
export * from "./section-extraction";
export * from "./chunking";
export * from "./manifests";
export * from "./citation-contract";
export * from "./retrieval";
export * from "./mock-index-store";
export * from "./indexing";
export * from "./embedding-dry-run";
export * from "./exact-token-count";
export * from "./resolve-assistant-locale";
export * from "./assistant-grounding-security";
