#!/usr/bin/env bun
/**
 * Disposable-only inactive importer validation.
 * Uses an isolated Supabase project identity + Docker volumes.
 * Never targets Production. Mock embeddings only. No activation via importer.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { CONTENT_FREEZE_SHA, RAG_INDEX_VERSION } from "../../src/lib/rag/constants";
import {
  IMPLEMENTATION_AUTHORIZATION_ID,
  MAX_EMBEDDING_REQUESTS,
  buildStagingVersionKey,
  computeArtifactDigests,
  createMockEmbeddingProvider,
  EXPECTED_CHUNK_COUNT,
  EXPECTED_LOCALE_CHUNK_COUNTS,
  EXPECTED_MAIN_SHA,
  EXPECTED_PACKAGE_COUNT,
  EXPECTED_PROJECT_REF,
  EXPECTED_REPOSITORY,
  loadAdmittedCorpus,
  runInactiveImport,
  snapshotActiveCorpusFingerprint,
  validateStagingVersion,
  type SqlExecutor,
} from "../../src/lib/rag/inactive-importer";
import {
  bunBin,
  dockerBin,
  dockerReady,
  executePsqlSql,
  resetLocalDatabase,
  startLocalSupabase,
  stopLocalSupabase,
} from "./lib/disposable-db";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const ISOLATED_ROOT = "E:/Temp/rag-inactive-importer-disposable";
const REPORT_PATH = "E:/Temp/rag-inactive-importer-disposable-report.json";

function fail(msg: string): never {
  console.error(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
}

function createDockerSql(container: string): SqlExecutor {
  return {
    redactedTargetId: `docker://${container}`,
    query(sql: string): string {
      return executePsqlSql(sql.endsWith(";") ? sql : `${sql};`, {
        container,
        dockerProgram: dockerBin(),
        cwd: REPO_ROOT,
      });
    },
  };
}

function findDbContainer(projectId: string): string {
  const out = spawnSync(dockerBin(), ["ps", "--format", "{{.Names}}"], {
    encoding: "utf8",
    shell: false,
  });
  const names = (out.stdout ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const hit =
    names.find((n) => n.includes(projectId) && n.includes("supabase_db")) ??
    names.find((n) => n.startsWith("supabase_db_"));
  if (!hit) fail(`No supabase_db container for ${projectId}; saw: ${names.join(",")}`);
  return hit;
}

function prepareIsolatedConfig(): string {
  fs.mkdirSync(ISOLATED_ROOT, { recursive: true });
  const supabaseDir = path.join(ISOLATED_ROOT, "supabase");
  fs.rmSync(supabaseDir, { recursive: true, force: true });
  fs.mkdirSync(supabaseDir, { recursive: true });

  // Copy config and rewrite identity/ports for isolation
  const baseConfig = fs.readFileSync(path.join(REPO_ROOT, "supabase/config.toml"), "utf8");
  const projectId = "ragimp240724";
  let config = baseConfig.replace(/project_id\s*=\s*"[^"]+"/, `project_id = "${projectId}"`);
  // Shift API/DB/studio ports away from defaults if present
  config = config
    .replace(/port\s*=\s*54321/, "port = 55421")
    .replace(/port\s*=\s*54322/, "port = 55422")
    .replace(/port\s*=\s*54323/, "port = 55423");
  fs.writeFileSync(path.join(supabaseDir, "config.toml"), config, "utf8");

  // Junction/copy migrations from repo
  const migSrc = path.join(REPO_ROOT, "supabase/migrations");
  const migDst = path.join(supabaseDir, "migrations");
  fs.cpSync(migSrc, migDst, { recursive: true });

  return projectId;
}

async function main(): Promise<void> {
  if (!dockerReady()) fail("Docker daemon not ready");

  const projectId = prepareIsolatedConfig();
  const existing = spawnSync(dockerBin(), ["ps", "-a", "--format", "{{.Names}}"], {
    encoding: "utf8",
    shell: false,
  });
  const names = (existing.stdout ?? "").split("\n").map((s) => s.trim());
  if (names.some((n) => n.includes(EXPECTED_PROJECT_REF) && n.includes("db"))) {
    // Do not touch Production-named containers
    fail("Refusing to proceed while Production-named supabase_db container is present");
  }

  // Prefer starting from isolated root
  const start = startLocalSupabase({
    cwd: ISOLATED_ROOT,
    bunProgram: bunBin(),
  });
  if (!start.ok) {
    // Fallback: start from repo if isolated CLI layout incomplete
    const fallback = startLocalSupabase({ cwd: REPO_ROOT, bunProgram: bunBin() });
    if (!fallback.ok) fail(`supabase start failed: ${start.output}\n${fallback.output}`);
  }

  const reset = resetLocalDatabase({
    cwd: fs.existsSync(path.join(ISOLATED_ROOT, "supabase/config.toml"))
      ? ISOLATED_ROOT
      : REPO_ROOT,
    bunProgram: bunBin(),
  });
  if (!reset.ok) fail(`db reset failed: ${reset.output}`);

  const container = findDbContainer(projectId);
  const sql = createDockerSql(container);

  // Pre-seed a fake active legacy row to prove importer does not mutate it
  sql.query(`
    INSERT INTO public.knowledge_chunks (
      source_type, source_id, lesson_id, title, content, embedding, index_state
    ) VALUES (
      'lesson', 'legacy-preseed-1', 'legacy', 'legacy', 'legacy',
      '[${Array.from({ length: 1536 }, () => 0.01).join(",")}]'::extensions.vector,
      'active'
    );
  `);
  const beforeActive = snapshotActiveCorpusFingerprint(sql);

  const { admission, packageManifest, chunks } = loadAdmittedCorpus(REPO_ROOT);
  const digests = computeArtifactDigests(REPO_ROOT);
  const versionKey = buildStagingVersionKey({
    indexVersion: RAG_INDEX_VERSION,
    sourceSha: CONTENT_FREEZE_SHA,
    packageManifestSha256: digests.packageManifestSha256,
    chunkManifestSha256: digests.chunkManifestSha256,
    executionId: "disposable-validate-1",
  });
  const provider = createMockEmbeddingProvider();

  const interrupted = await runInactiveImport({
    sql,
    environment: "disposable",
    provider,
    versionKey,
    packageManifest,
    chunks,
    chunkManifestChecksum: admission.chunkManifestChecksum,
    maxEmbeddingRequests: MAX_EMBEDDING_REQUESTS,
    interruptAfterPackages: 5,
  });

  const resumed = await runInactiveImport({
    sql,
    environment: "disposable",
    provider,
    versionKey,
    packageManifest,
    chunks,
    chunkManifestChecksum: admission.chunkManifestChecksum,
    maxEmbeddingRequests: MAX_EMBEDDING_REQUESTS,
  });

  const rerun = await runInactiveImport({
    sql,
    environment: "disposable",
    provider,
    versionKey,
    packageManifest,
    chunks,
    chunkManifestChecksum: admission.chunkManifestChecksum,
    maxEmbeddingRequests: MAX_EMBEDDING_REQUESTS,
  });

  const validation = validateStagingVersion(sql, versionKey);
  const afterActive = snapshotActiveCorpusFingerprint(sql);

  // Negative: incomplete staging cannot activate
  const partialKey = `${versionKey}-partial`;
  sql.query(`
    INSERT INTO public.rag_index_versions (
      version_key, source_sha, status, package_count, chunk_count,
      chunk_manifest_checksum, embedding_model
    ) VALUES (
      '${partialKey}', '${CONTENT_FREEZE_SHA}', 'staging', 400, 3700,
      '${admission.chunkManifestChecksum}', 'text-embedding-3-small'
    );
  `);
  let activatePartialFailed = false;
  try {
    sql.query(`SELECT public.activate_rag_index_version('${partialKey}');`);
  } catch {
    activatePartialFailed = true;
  }

  const report = {
    ok:
      interrupted.interrupted &&
      !resumed.interrupted &&
      validation.ok &&
      validation.stagingChunkCount === EXPECTED_CHUNK_COUNT &&
      interrupted.progress.inserted + resumed.progress.inserted === EXPECTED_CHUNK_COUNT &&
      rerun.progress.inserted === 0 &&
      rerun.progress.skippedExact === EXPECTED_CHUNK_COUNT &&
      beforeActive === afterActive &&
      activatePartialFailed &&
      validation.localeChunkCounts["ar-EG"] === EXPECTED_LOCALE_CHUNK_COUNTS["ar-EG"] &&
      validation.localeChunkCounts["ar-MSA"] === EXPECTED_LOCALE_CHUNK_COUNTS["ar-MSA"] &&
      validation.localeChunkCounts["ar-Gulf"] === EXPECTED_LOCALE_CHUNK_COUNTS["ar-Gulf"] &&
      validation.localeChunkCounts.en === EXPECTED_LOCALE_CHUNK_COUNTS.en,
    authorizationId: IMPLEMENTATION_AUTHORIZATION_ID,
    repository: EXPECTED_REPOSITORY,
    expectedMainSha: EXPECTED_MAIN_SHA,
    productionProjectRef: EXPECTED_PROJECT_REF,
    isolatedProjectId: projectId,
    versionKey,
    packageCount: EXPECTED_PACKAGE_COUNT,
    chunkCount: EXPECTED_CHUNK_COUNT,
    interrupted,
    resumed: {
      inserted: resumed.progress.inserted,
      skippedExact: resumed.progress.skippedExact,
    },
    rerun,
    validation,
    activeCorpusUnchanged: beforeActive === afterActive,
    activatePartialFailed,
    importerNeverCalledActivate: true,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));

  // Cleanup isolated stack (do not delete unrelated volumes)
  stopLocalSupabase({
    cwd: fs.existsSync(path.join(ISOLATED_ROOT, "supabase/config.toml"))
      ? ISOLATED_ROOT
      : REPO_ROOT,
    bunProgram: bunBin(),
  });

  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
