#!/usr/bin/env bun
/**
 * Pre-paid gate: fail closed before any OpenAI embedding API call.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { discoverApprovedPackages } from "../../src/lib/rag/corpus-discovery";
import {
  buildChunkManifest,
  buildPackageManifest,
  generateAllChunks,
} from "../../src/lib/rag/manifests";
import { computeExactTokenStats } from "../../src/lib/rag/exact-token-count";
import { verifyCorpus } from "../../src/lib/rag/corpus-verification";
import {
  CANDIDATE_SHA,
  CONTENT_FREEZE_SHA,
  EXPECTED_CHUNK_COUNT,
  EXPECTED_CHUNK_MANIFEST_CHECKSUM,
  EXPECTED_INPUT_TOKENS,
  EXPECTED_PACKAGE_COUNT,
  EXPECTED_PACKAGE_MANIFEST_CHECKSUM,
  BATCH_SIZE,
  EXPECTED_INITIAL_REQUESTS,
  MAX_APPROVED_COST_USD,
  COST_PER_MILLION_TOKENS_USD,
} from "./constants";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "artifacts/rag/paid-embedding");

function fail(msg: string): never {
  console.error(`PREFLIGHT FAIL: ${msg}`);
  process.exit(1);
}

function gitHead(): string {
  return execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
}

const pinned = process.env.CANDIDATE_SHA ?? CANDIDATE_SHA;
if (pinned !== CANDIDATE_SHA) {
  fail(`candidate SHA mismatch: expected ${CANDIDATE_SHA}, got ${pinned}`);
}
try {
  execSync(`git cat-file -e ${CANDIDATE_SHA}^{commit}`, { cwd: ROOT });
} catch {
  fail(`candidate SHA missing from git objects: ${CANDIDATE_SHA}`);
}
try {
  execSync(`git merge-base --is-ancestor ${CANDIDATE_SHA} HEAD`, { cwd: ROOT });
} catch {
  fail(`HEAD ${gitHead()} is not a descendant of candidate ${CANDIDATE_SHA}`);
}

const ragDrift = execSync(
  `git diff --name-only ${CANDIDATE_SHA} -- src/lib/rag src/lib/locale-lessons artifacts/rag supabase/migrations/20260711200000_rag_locale_index_versioning.sql package.json bun.lock`,
  { cwd: ROOT, encoding: "utf8" },
).trim();
if (ragDrift) {
  fail(`immutable RAG candidate paths drifted:\n${ragDrift}`);
}

const corpus = verifyCorpus(ROOT);
if (!corpus.ok) {
  fail(`corpus verification failed: ${JSON.stringify(corpus.errors)}`);
}
if (corpus.totalPackages !== EXPECTED_PACKAGE_COUNT) {
  fail(`package count ${corpus.totalPackages} != ${EXPECTED_PACKAGE_COUNT}`);
}

const packages = discoverApprovedPackages(ROOT);
const chunks = generateAllChunks(ROOT, packages);
if (chunks.length !== EXPECTED_CHUNK_COUNT) {
  fail(`chunk count ${chunks.length} != ${EXPECTED_CHUNK_COUNT}`);
}

const packageManifest = buildPackageManifest(ROOT, packages, chunks);
const chunkManifest = buildChunkManifest(chunks);

if (packageManifest.manifestChecksum !== EXPECTED_PACKAGE_MANIFEST_CHECKSUM) {
  fail(
    `package manifest checksum mismatch: ${packageManifest.manifestChecksum} != ${EXPECTED_PACKAGE_MANIFEST_CHECKSUM}`,
  );
}
if (chunkManifest.manifestChecksum !== EXPECTED_CHUNK_MANIFEST_CHECKSUM) {
  fail(
    `chunk manifest checksum mismatch: ${chunkManifest.manifestChecksum} != ${EXPECTED_CHUNK_MANIFEST_CHECKSUM}`,
  );
}
if (packageManifest.sourceSha !== CONTENT_FREEZE_SHA || chunkManifest.sourceSha !== CONTENT_FREEZE_SHA) {
  fail(`sourceSha mismatch vs content freeze ${CONTENT_FREEZE_SHA}`);
}

let incompleteMeta = 0;
let crossLocaleInId = 0;
const chunkIds = new Set<string>();
let duplicateIds = 0;

for (const c of chunks) {
  if (
    !c.locale ||
    !c.lessonId ||
    !c.trackId ||
    !c.moduleId ||
    !c.packagePath ||
    !c.textChecksum ||
    !c.displayText
  ) {
    incompleteMeta += 1;
  }
  if (!c.chunkId.startsWith(`${c.locale}/`)) {
    crossLocaleInId += 1;
  }
  if (!c.packagePath.includes(`/locale-lessons/${c.locale}/`)) {
    crossLocaleInId += 1;
  }
  if (!c.chunkId.includes(`/${c.lessonId}/`)) {
    // lesson id must appear in chunk id path segment
    crossLocaleInId += 1;
  }
  if (chunkIds.has(c.chunkId)) duplicateIds += 1;
  chunkIds.add(c.chunkId);
}

if (incompleteMeta > 0) fail(`incomplete metadata on ${incompleteMeta} chunks`);
if (crossLocaleInId > 0) fail(`cross-locale/lesson contamination signals: ${crossLocaleInId}`);
if (duplicateIds > 0) fail(`duplicate chunk IDs: ${duplicateIds}`);

for (const p of packageManifest.packages) {
  if (!p.packageChecksum || !p.sourceSha || !p.locale || !p.lessonId || !p.trackId || !p.moduleId || !p.packagePath) {
    fail(`incomplete package metadata: ${p.packagePath}`);
  }
  if (p.sourceSha !== CONTENT_FREEZE_SHA) fail(`package sourceSha drift: ${p.packagePath}`);
}

const tokenStats = computeExactTokenStats(chunks);
if (tokenStats.total !== EXPECTED_INPUT_TOKENS) {
  fail(`exact token total ${tokenStats.total} != ${EXPECTED_INPUT_TOKENS}`);
}

const estimatedRequests = Math.ceil(chunks.length / BATCH_SIZE);
if (estimatedRequests !== EXPECTED_INITIAL_REQUESTS) {
  fail(`estimated requests ${estimatedRequests} != ${EXPECTED_INITIAL_REQUESTS}`);
}

const projectedBaseCost = (tokenStats.total / 1_000_000) * COST_PER_MILLION_TOKENS_USD;
if (projectedBaseCost > MAX_APPROVED_COST_USD) {
  fail(`projected base cost $${projectedBaseCost} exceeds max $${MAX_APPROVED_COST_USD}`);
}

const report = {
  ok: true,
  candidateSha: CANDIDATE_SHA,
  contentFreezeSha: CONTENT_FREEZE_SHA,
  packageCount: packages.length,
  chunkCount: chunks.length,
  packageManifestChecksum: packageManifest.manifestChecksum,
  chunkManifestChecksum: chunkManifest.manifestChecksum,
  exactInputTokens: tokenStats.total,
  tokenStats: { min: tokenStats.min, max: tokenStats.max, avg: tokenStats.avg },
  estimatedInitialRequests: estimatedRequests,
  projectedBaseCostUsd: Number(projectedBaseCost.toFixed(6)),
  maxApprovedCostUsd: MAX_APPROVED_COST_USD,
  incompleteMeta,
  crossLocaleContamination: crossLocaleInId,
  duplicateChunkIds: duplicateIds,
  localeCounts: chunkManifest.localeCounts,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "preflight.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
