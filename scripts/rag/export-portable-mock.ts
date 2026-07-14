#!/usr/bin/env bun
/** Export deterministic mock portable artifact (no paid API calls). */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { discoverApprovedPackages } from "../../src/lib/rag/corpus-discovery";
import {
  buildChunkManifest,
  buildPackageManifest,
  generateAllChunks,
} from "../../src/lib/rag/manifests";
import { MockRagIndexStore } from "../../src/lib/rag/mock-index-store";
import {
  CANDIDATE_SHA,
  writePortableArtifact,
} from "../../src/lib/rag/portable-artifact";
import { computeExactTokenStats } from "../../src/lib/rag/exact-token-count";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const outArg = process.argv.find((a) => a.startsWith("--out="));
const OUTPUT = outArg
  ? path.resolve(outArg.slice("--out=".length))
  : path.join(ROOT, "artifacts/rag/portable-mock");

const packages = discoverApprovedPackages(ROOT);
const chunks = generateAllChunks(ROOT, packages);
const packageManifest = buildPackageManifest(ROOT, packages, chunks);
const chunkManifest = buildChunkManifest(chunks);
const tokenStats = computeExactTokenStats(chunks.map((c) => c.displayText));

const store = new MockRagIndexStore();
const embeddings = new Map<string, number[]>();
for (const chunk of chunks) {
  embeddings.set(chunk.chunkId, store.fakeEmbedding(chunk.textChecksum));
}

const versionKey = `rag-portable-mock-${CANDIDATE_SHA.slice(0, 8)}`;
fs.mkdirSync(OUTPUT, { recursive: true });

const manifest = writePortableArtifact({
  outputDir: OUTPUT,
  indexVersion: versionKey,
  chunks,
  embeddings,
  packageManifest,
  chunkManifest,
  stats: {
    exactTokenCount: tokenStats.total,
    requestCount: Math.ceil(chunks.length / 64),
    successful: chunks.length,
    failed: 0,
    retried: 0,
    skipped: 0,
  },
});

console.log(JSON.stringify({ ok: true, outputDir: OUTPUT, manifest }, null, 2));
