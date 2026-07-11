#!/usr/bin/env bun
/**
 * Generate RAG manifests and chunks locally — no embedding API calls.
 * Usage: bun run scripts/rag/generate-manifests.ts [--dry-run]
 */
import path from "node:path";
import { runRagPipeline } from "../../src/lib/rag/index";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const dryRun = process.argv.includes("--dry-run");

const report = runRagPipeline(REPO_ROOT, { dryRun });

console.log(
  JSON.stringify(
    {
      ok: report.corpus.ok,
      sourceSha: report.corpus.sourceSha,
      packageCount: report.packageCount,
      chunkCount: report.chunkCount,
      localeChunkCounts: report.localeChunkCounts,
      packageManifestChecksum: report.packageManifestChecksum,
      chunkManifestChecksum: report.chunkManifestChecksum,
      deterministicRerunEqual: report.deterministicRerunEqual,
      reindexPlan: {
        skip: report.reindexPlan.skipCount,
        reindex: report.reindexPlan.reindexCount,
        delete: report.reindexPlan.deleteCount,
        retry: report.reindexPlan.retryCount,
      },
      quality: report.quality,
      dryRun,
    },
    null,
    2,
  ),
);

process.exit(report.corpus.ok ? 0 : 1);
