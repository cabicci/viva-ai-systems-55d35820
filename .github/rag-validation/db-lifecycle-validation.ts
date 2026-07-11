#!/usr/bin/env bun
/**
 * CI-only RAG DB lifecycle validation with deterministic mock vectors.
 * Replaces candidate vitest integration test on Ubuntu (fakeVector NaN bug with 1536 dims).
 */
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS } from "../../src/lib/rag/constants";
import { dockerReady, psql } from "../../scripts/rag/lib/disposable-db";

const versionKey = `rag-val-${CONTENT_FREEZE_SHA.slice(0, 8)}`;
const priorVersionKey = `${versionKey}-prior`;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function fakeVector(seed: string): string {
  const nums: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const ch = seed.charCodeAt(i % seed.length);
    nums.push(((ch + i) % 1000) / 1000);
  }
  return `[${nums.join(",")}]`;
}

function runPsql(sql: string): string {
  return psql(sql);
}

function runServiceRpc(sql: string): string {
  return psql(`SET role service_role; ${sql}`);
}

function runPsqlExpectFail(sql: string): boolean {
  try {
    runPsql(sql);
    return false;
  } catch {
    return true;
  }
}

function main(): void {
  if (!dockerReady()) {
    console.error("Docker not ready");
    process.exit(1);
  }

  const cols = runPsql(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_index_versions' ORDER BY 1",
  );
  assert(cols.includes("version_key"), "rag_index_versions.version_key missing");
  assert(cols.includes("status"), "rag_index_versions.status missing");
  assert(cols.includes("chunk_manifest_checksum"), "rag_index_versions.chunk_manifest_checksum missing");

  const grants = runPsql(
    "SELECT grantee||':'||privilege_type FROM information_schema.role_table_grants WHERE table_name='knowledge_chunks' AND grantee IN ('anon','authenticated') AND privilege_type IN ('INSERT','UPDATE','DELETE')",
  );
  assert(grants.trim().length === 0, "authenticated/anon mutation grants should be denied");

  runPsql(`DELETE FROM knowledge_chunks WHERE index_version IN ('${versionKey}','${priorVersionKey}')`);
  runPsql(`DELETE FROM rag_index_versions WHERE version_key IN ('${versionKey}','${priorVersionKey}')`);

  runPsql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
    VALUES ('${versionKey}', '${CONTENT_FREEZE_SHA}', 'staging', 1, 2, 'abc123')`);

  const vec = fakeVector("rag-validation-seed");
  const base = `INSERT INTO knowledge_chunks (source_type, source_id, lesson_id, title, content, embedding, locale, package_path, source_sha, package_checksum, chunk_checksum, index_version, index_state, section_index, section_role, chunk_position, content_type)
    VALUES ('locale_lesson',`;

  runPsql(`${base} '${versionKey}/c0', 'intro-m1-l1', 'T', 'content-a', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-a', '${versionKey}', 'staging', 0, 'Core', 0, 'explanation')`);
  runPsql(`${base} '${versionKey}/c1', 'intro-m1-l1', 'T', 'content-b', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-b', '${versionKey}', 'staging', 1, 'Quiz', 0, 'quiz')`);

  const count1 = Number(runPsql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}'`));
  assert(count1 === 2, `expected 2 staging chunks, got ${count1}`);

  // Idempotent re-insert should not duplicate when using distinct source_id conflict target
  runPsql(`${base} '${versionKey}/c0', 'intro-m1-l1', 'T', 'content-a', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-a', '${versionKey}', 'staging', 0, 'Core', 0, 'explanation') ON CONFLICT DO NOTHING`);
  const countAfterIdempotent = Number(runPsql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}'`));
  assert(countAfterIdempotent === 2, `idempotent insert duplicated rows: ${countAfterIdempotent}`);

  runPsql(`UPDATE knowledge_chunks SET indexing_failed=true, index_state='failed' WHERE source_id='${versionKey}/c1'`);
  assert(runPsqlExpectFail(`SET role service_role; SELECT activate_rag_index_version('${versionKey}')`), "failed staging activation should be denied");

  runPsql(`UPDATE knowledge_chunks SET indexing_failed=false, index_state='staging' WHERE source_id='${versionKey}/c1'`);
  runServiceRpc(`SELECT activate_rag_index_version('${versionKey}')`);

  const activeVersions = runPsql("SELECT version_key FROM rag_index_versions WHERE status='active'")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  assert(activeVersions.filter((v) => v === versionKey).length === 1, "single active version expected");

  const activeChunks = Number(runPsql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`));
  assert(activeChunks === 2, `expected 2 active chunks, got ${activeChunks}`);

  const stagingVisible = Number(runPsql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='staging'`));
  assert(stagingVisible === 0, `staging rows should be hidden after activation, got ${stagingVisible}`);

  // Replacement activation + rollback
  runPsql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
    VALUES ('${priorVersionKey}', '${CONTENT_FREEZE_SHA}', 'staging', 1, 1, 'prior123')`);
  runPsql(`${base} '${priorVersionKey}/c0', 'intro-m1-l1', 'T', 'prior', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-p', '${priorVersionKey}', 'staging', 0, 'Core', 0, 'explanation')`);
  runServiceRpc(`SELECT activate_rag_index_version('${priorVersionKey}')`);
  const activeAfterReplace = runPsql("SELECT version_key FROM rag_index_versions WHERE status='active'")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  assert(activeAfterReplace.length === 1 && activeAfterReplace[0] === priorVersionKey, "replacement activation failed");

  runServiceRpc(`SELECT rollback_rag_index_version('${versionKey}')`);
  const activeAfterRollback = runPsql("SELECT version_key FROM rag_index_versions WHERE status='active'")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  assert(activeAfterRollback.length === 1 && activeAfterRollback[0] === versionKey, "rollback did not restore superseded version");

  console.log(JSON.stringify({
    ok: true,
    versionKey,
    priorVersionKey,
    activeVersionsAfterActivation: 1,
    activeChunks,
    rollbackOk: true,
    mutationDenied: true,
    failedActivationDenied: true,
    idempotentSkipOk: true,
  }, null, 2));
}

main();
