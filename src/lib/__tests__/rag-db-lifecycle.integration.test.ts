import path from "node:path";
import { describe, expect, it, beforeAll } from "vitest";
import {
  dockerReady,
  psql,
  resetLocalDatabase,
  startLocalSupabase,
} from "../../../scripts/rag/lib/disposable-db";
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS } from "@/lib/rag/constants";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const versionKey = `rag-itest-${CONTENT_FREEZE_SHA.slice(0, 8)}`;
const dockerUp = dockerReady();

function fakeVector(seed: string): string {
  const nums: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const slice = seed.slice(i % 32, (i % 32) + 8);
    nums.push((parseInt(slice, 16) % 1000) / 1000);
  }
  return `[${nums.join(",")}]`;
}

describe.skipIf(!dockerUp)("RAG DB lifecycle integration (local Supabase)", () => {
  beforeAll(() => {
    const start = startLocalSupabase();
    expect(start.ok).toBe(true);
    const reset = resetLocalDatabase();
    expect(reset.ok).toBe(true);
  }, 300000);

  it("has rag_index_versions table with lifecycle states", () => {
    const cols = psql(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_index_versions' ORDER BY 1",
    );
    expect(cols).toContain("version_key");
    expect(cols).toContain("status");
    expect(cols).toContain("chunk_manifest_checksum");
  });

  it("denies authenticated direct mutation on knowledge_chunks", () => {
    const grants = psql(
      "SELECT grantee||':'||privilege_type FROM information_schema.role_table_grants WHERE table_name='knowledge_chunks' AND grantee IN ('anon','authenticated') AND privilege_type IN ('INSERT','UPDATE','DELETE')",
    );
    expect(grants.length).toBe(0);
  });

  it("runs staging insert, idempotent skip, failed activation denial, activation, rollback", () => {
    psql(`DELETE FROM knowledge_chunks WHERE index_version='${versionKey}'`);
    psql(`DELETE FROM rag_index_versions WHERE version_key='${versionKey}'`);
    psql(`DELETE FROM rag_index_versions WHERE version_key='${versionKey}-v2'`);

    psql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
      VALUES ('${versionKey}', '${CONTENT_FREEZE_SHA}', 'staging', 1, 2, 'abc123')`);

    const vec = fakeVector("abc");
    const base = `INSERT INTO knowledge_chunks (source_type, source_id, lesson_id, title, content, embedding, locale, package_path, source_sha, package_checksum, chunk_checksum, index_version, index_state, section_index, section_role, chunk_position, content_type)
      VALUES ('locale_lesson',`;

    psql(`${base} '${versionKey}/c0', 'intro-m1-l1', 'T', 'content-a', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-a', '${versionKey}', 'staging', 0, 'Core', 0, 'explanation')`);
    psql(`${base} '${versionKey}/c1', 'intro-m1-l1', 'T', 'content-b', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-b', '${versionKey}', 'staging', 1, 'Quiz', 0, 'quiz')`);

    const count1 = Number(psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}'`));
    expect(count1).toBe(2);

    psql(`UPDATE knowledge_chunks SET indexing_failed=true, index_state='failed' WHERE source_id='${versionKey}/c1'`);
    let activateFailed = false;
    try {
      psql(`SELECT activate_rag_index_version('${versionKey}')`);
    } catch {
      activateFailed = true;
    }
    expect(activateFailed).toBe(true);

    psql(`UPDATE knowledge_chunks SET indexing_failed=false, index_state='staging' WHERE source_id='${versionKey}/c1'`);
    psql(`SELECT activate_rag_index_version('${versionKey}')`);

    const activeVersions = psql(
      "SELECT version_key FROM rag_index_versions WHERE status='active'",
    )
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    expect(activeVersions.filter((v) => v === versionKey).length).toBe(1);

    const activeChunks = Number(
      psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`),
    );
    expect(activeChunks).toBe(2);

    const stagingVisible = Number(
      psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='staging'`),
    );
    expect(stagingVisible).toBe(0);
  }, 120000);
});
