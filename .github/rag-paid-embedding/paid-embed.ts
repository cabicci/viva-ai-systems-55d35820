#!/usr/bin/env bun
/**
 * Paid embedding generation into disposable local staging only.
 * Exports complete portable vector artifact for future Production-compatible import.
 * Never activates index. Never writes to Production / remote Supabase.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { discoverApprovedPackages } from "../../src/lib/rag/corpus-discovery";
import {
  buildChunkManifest,
  buildPackageManifest,
  generateAllChunks,
} from "../../src/lib/rag/manifests";
import { countChunkTokens } from "../../src/lib/rag/exact-token-count";
import { writePortableArtifact } from "../../src/lib/rag/portable-artifact";
import type { RagChunkRecord } from "../../src/lib/rag/types";
import {
  BATCH_SIZE,
  CANDIDATE_SHA,
  CONTENT_FREEZE_SHA,
  COST_PER_MILLION_TOKENS_USD,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  EXPECTED_CHUNK_COUNT,
  MAX_APPROVED_COST_USD,
  MAX_RETRY_ATTEMPTS,
  VERSION_KEY,
} from "./constants";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "artifacts/rag/paid-embedding");
const PORTABLE_OUT = path.join(ROOT, "artifacts/rag/portable-export");
const DOCKER_BIN = process.env.DOCKER_BIN ?? "docker";

function run(cmd: string): string {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function dbContainer(): string {
  const out = run(`"${DOCKER_BIN}" ps --filter name=supabase_db --format {{.Names}}`);
  const name = out.split("\n").map((s) => s.trim()).find(Boolean);
  if (!name) throw new Error("supabase_db container not found — disposable stack required");
  return name;
}

function psql(sql: string): string {
  const container = dbContainer();
  const escaped = sql.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return run(
    `"${DOCKER_BIN}" exec -i ${container} psql -U postgres -d postgres -v ON_ERROR_STOP=1 -t -A -c "${escaped}"`,
  );
}

function psqlFile(sql: string): string {
  const container = dbContainer();
  const local = path.join(OUT, `_tmp_${Date.now()}.sql`);
  fs.writeFileSync(local, sql, "utf8");
  const remote = `/tmp/${path.basename(local)}`;
  run(`"${DOCKER_BIN}" cp "${local}" ${container}:${remote}`);
  const out = run(
    `"${DOCKER_BIN}" exec ${container} psql -U postgres -d postgres -v ON_ERROR_STOP=1 -t -A -f ${remote}`,
  );
  fs.unlinkSync(local);
  return out;
}

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY || process.env.NEW_OPENAI || "";
  if (!key) throw new Error("OPENAI_API_KEY (or NEW_OPENAI) is required");
  return key;
}

function costUsd(tokens: number): number {
  return (tokens / 1_000_000) * COST_PER_MILLION_TOKENS_USD;
}

interface EmbedResult {
  vectors: number[][];
  totalTokens: number;
}

async function embedBatch(texts: string[]): Promise<EmbedResult> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
    usage?: { total_tokens?: number; prompt_tokens?: number };
  };
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  for (const row of sorted) {
    if (!row.embedding || row.embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`bad embedding dimension: ${row.embedding?.length}`);
    }
  }
  const totalTokens =
    json.usage?.total_tokens ??
    json.usage?.prompt_tokens ??
    texts.reduce((n, t) => n + countChunkTokens(t), 0);
  return { vectors: sorted.map((r) => r.embedding), totalTokens };
}

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function vectorLiteral(v: number[]): string {
  return `[${v.map((n) => (Number.isFinite(n) ? n : 0)).join(",")}]`;
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const logLines: string[] = [];
  const log = (m: string) => {
    logLines.push(m);
    console.log(m);
  };

  const packages = discoverApprovedPackages(ROOT);
  const chunks = generateAllChunks(ROOT, packages);
  if (chunks.length !== EXPECTED_CHUNK_COUNT) {
    throw new Error(`chunk count ${chunks.length} != ${EXPECTED_CHUNK_COUNT}`);
  }
  const packageManifest = buildPackageManifest(ROOT, packages, chunks);
  const chunkManifest = buildChunkManifest(chunks);
  const pkgChecksums = new Map(packageManifest.packages.map((p) => [p.packagePath, p.packageChecksum]));

  const successful = new Map<string, number[]>();
  const failed = new Set<string>();
  let skipped = 0;
  let retried = 0;
  let requestCount = 0;
  let actualTokens = 0;
  let abortedForCost = false;

  async function processChunks(batchChunks: RagChunkRecord[], isRetry: boolean): Promise<void> {
    for (let i = 0; i < batchChunks.length; i += BATCH_SIZE) {
      const batch = batchChunks.slice(i, i + BATCH_SIZE);
      const projectedTokens = batch.reduce((n, c) => n + countChunkTokens(c.displayText), 0);
      if (costUsd(actualTokens + projectedTokens) > MAX_APPROVED_COST_USD) {
        abortedForCost = true;
        for (const c of batch) failed.add(c.chunkId);
        log(`COST GATE: refusing batch; projected cost would exceed $${MAX_APPROVED_COST_USD}`);
        return;
      }

      try {
        requestCount += 1;
        if (isRetry) retried += batch.length;
        const { vectors, totalTokens } = await embedBatch(batch.map((c) => c.displayText));
        actualTokens += totalTokens;
        if (costUsd(actualTokens) > MAX_APPROVED_COST_USD) {
          abortedForCost = true;
          log(`COST GATE: actual cost $${costUsd(actualTokens).toFixed(6)} exceeded after request`);
          for (const c of batch) failed.add(c.chunkId);
          return;
        }
        for (let j = 0; j < batch.length; j++) {
          successful.set(batch[j].chunkId, vectors[j]);
          failed.delete(batch[j].chunkId);
        }
        log(`OK batch size=${batch.length} request=${requestCount} tokens+=${totalTokens} totalTokens=${actualTokens}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`FAIL batch: ${msg}`);
        for (const c of batch) failed.add(c.chunkId);
      }
    }
  }

  log(`Starting paid embedding: ${chunks.length} chunks, model=${EMBEDDING_MODEL}`);
  await processChunks(chunks, false);

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS && failed.size > 0 && !abortedForCost; attempt++) {
    const retryList = chunks.filter((c) => failed.has(c.chunkId) && !successful.has(c.chunkId));
    log(`Retry-only-failed attempt ${attempt}: ${retryList.length} chunks`);
    await processChunks(retryList, true);
  }

  psqlFile(`
DELETE FROM public.knowledge_chunks WHERE index_version = '${VERSION_KEY}';
DELETE FROM public.rag_index_versions WHERE version_key = '${VERSION_KEY}';
INSERT INTO public.rag_index_versions (
  version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum, embedding_model
) VALUES (
  '${VERSION_KEY}',
  '${CONTENT_FREEZE_SHA}',
  'staging',
  ${packages.length},
  ${chunks.length},
  '${chunkManifest.manifestChecksum}',
  '${EMBEDDING_MODEL}'
);
`);

  const successChunks = chunks.filter((c) => successful.has(c.chunkId));
  for (let i = 0; i < successChunks.length; i += 25) {
    const slice = successChunks.slice(i, i + 25);
    const values = slice
      .map((c) => {
        const vec = successful.get(c.chunkId)!;
        const pkgChecksum = pkgChecksums.get(c.packagePath) ?? "";
        return `(
          'locale_lesson',
          '${sqlEscape(c.chunkId)}',
          '${sqlEscape(c.trackId)}',
          '${sqlEscape(c.moduleId)}',
          '${sqlEscape(c.lessonId)}',
          '${sqlEscape(c.sectionHeading.slice(0, 200))}',
          '${sqlEscape(c.displayText.slice(0, 8000))}',
          '${vectorLiteral(vec)}'::vector,
          '${sqlEscape(c.locale)}',
          '${sqlEscape(c.packagePath)}',
          '${CONTENT_FREEZE_SHA}',
          '${sqlEscape(pkgChecksum)}',
          '${sqlEscape(c.textChecksum)}',
          NULL,
          '${VERSION_KEY}',
          'staging',
          ${c.sectionIndex},
          '${sqlEscape(c.sectionRole)}',
          ${c.chunkIndex},
          '${sqlEscape(c.contentType)}',
          ${c.productionRoute ? `'${sqlEscape(c.productionRoute)}'` : "NULL"},
          false
        )`;
      })
      .join(",\n");

    psqlFile(`
INSERT INTO public.knowledge_chunks (
  source_type, source_id, path_id, module_id, lesson_id, title, content, embedding,
  locale, package_path, source_sha, package_checksum, chunk_checksum, content_version,
  index_version, index_state, section_index, section_role, chunk_position, content_type,
  production_route, indexing_failed
) VALUES
${values};
`);
  }

  const stagingCount = Number(
    psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${VERSION_KEY}' AND index_state='staging'`),
  );
  const activeCount = Number(
    psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${VERSION_KEY}' AND index_state='active'`),
  );
  const versionStatus = psql(`SELECT status FROM rag_index_versions WHERE version_key='${VERSION_KEY}'`).trim();

  const localeLeak = Number(
    psql(`
SELECT count(*) FROM knowledge_chunks kc
WHERE index_version='${VERSION_KEY}'
  AND locale IS NOT NULL
  AND source_id NOT LIKE locale || '/%'
`),
  );
  const lessonLeak = Number(
    psql(`
SELECT count(*) FROM knowledge_chunks kc
WHERE index_version='${VERSION_KEY}'
  AND lesson_id IS NOT NULL
  AND source_id NOT LIKE '%/' || lesson_id || '/%'
`),
  );

  const actualCost = costUsd(actualTokens);
  const ok =
    !abortedForCost &&
    failed.size === 0 &&
    successful.size === EXPECTED_CHUNK_COUNT &&
    stagingCount === EXPECTED_CHUNK_COUNT &&
    activeCount === 0 &&
    versionStatus === "staging" &&
    localeLeak === 0 &&
    lessonLeak === 0 &&
    actualCost <= MAX_APPROVED_COST_USD;

  let portableManifest = null;
  if (ok) {
    fs.mkdirSync(PORTABLE_OUT, { recursive: true });
    portableManifest = writePortableArtifact({
      outputDir: PORTABLE_OUT,
      indexVersion: VERSION_KEY,
      chunks,
      embeddings: successful,
      packageManifest,
      chunkManifest,
      stats: {
        exactTokenCount: actualTokens,
        requestCount,
        successful: successful.size,
        failed: failed.size,
        retried,
        skipped,
      },
      model: EMBEDDING_MODEL,
    });
    log(`Portable artifact exported to ${PORTABLE_OUT}`);
  }

  const summary = {
    ok,
    candidateSha: CANDIDATE_SHA,
    contentFreezeSha: CONTENT_FREEZE_SHA,
    workflowCommitSha: process.env.GITHUB_SHA ?? null,
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    workflowRunUrl: process.env.GITHUB_RUN_ID
      ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
    model: EMBEDDING_MODEL,
    vectorDimensions: EMBEDDING_DIMENSIONS,
    batchSize: BATCH_SIZE,
    versionKey: VERSION_KEY,
    packageCount: packages.length,
    chunkCount: chunks.length,
    packageManifestChecksum: packageManifest.manifestChecksum,
    chunkManifestChecksum: chunkManifest.manifestChecksum,
    successful: successful.size,
    failed: failed.size,
    failedChunkIds: [...failed].slice(0, 50),
    retried,
    skipped,
    requestCount,
    actualTokens,
    actualCostUsd: Number(actualCost.toFixed(6)),
    maxApprovedCostUsd: MAX_APPROVED_COST_USD,
    costFormula: `(actualTokens / 1_000_000) * ${COST_PER_MILLION_TOKENS_USD}`,
    stagingIndexRecordCount: stagingCount,
    activeIndexRecordCount: activeCount,
    versionStatus,
    portableArtifactExported: Boolean(portableManifest),
    portableArtifactPath: portableManifest ? PORTABLE_OUT : null,
    portablePayloadChecksum: portableManifest?.payloadChecksum ?? null,
    duplicateValidation: {
      uniqueSuccessful: successful.size,
      expected: EXPECTED_CHUNK_COUNT,
    },
    localeLessonIsolation: {
      crossLocaleLeakage: localeLeak,
      crossLessonLeakage: lessonLeak,
    },
    confirmations: {
      noProductionAccess: true,
      noRemoteMigration: true,
      noIndexActivation: activeCount === 0 && versionStatus === "staging",
      noVectorsCommittedToGit: true,
      noMergeOrPushToMain: true,
      disposableStagingOnly: true,
      noCompletePaidRerunAfterFailure: true,
      completePortableVectorsExported: Boolean(portableManifest),
    },
    abortedForCost,
  };

  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    path.join(OUT, "summary.md"),
    `# RAG Paid Embedding Summary

- **Candidate SHA:** \`${CANDIDATE_SHA}\`
- **Model:** ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}-d)
- **Successful / Failed / Retried units:** ${successful.size} / ${failed.size} / ${retried}
- **Requests:** ${requestCount}
- **Actual tokens:** ${actualTokens}
- **Actual cost:** $${actualCost.toFixed(6)} (max approved $${MAX_APPROVED_COST_USD})
- **Staging records:** ${stagingCount} (status=\`${versionStatus}\`)
- **Portable export:** ${portableManifest ? "YES" : "NO"}
- **Activation:** NOT performed (active=${activeCount})
- **Cross-locale leakage:** ${localeLeak}
- **Cross-lesson leakage:** ${lessonLeak}
- **Overall:** ${ok ? "PASS" : "FAIL"}
`,
  );
  fs.writeFileSync(path.join(OUT, "execution.log"), logLines.join("\n"));

  console.log(JSON.stringify(summary, null, 2));
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
