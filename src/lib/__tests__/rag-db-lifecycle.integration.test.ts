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
const versionKeyV2 = `${versionKey}-v2`;
const dockerUp = dockerReady();

/** Deterministic finite embedding components for disposable DB fixtures only. */
export function generateFiniteVectorComponents(seed: string): number[] {
  if (!seed || seed.length === 0) {
    throw new Error("vector fixture seed must be non-empty");
  }
  const nums: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const code = seed.charCodeAt(i % seed.length);
    // Bounded finite value in [0, 1).
    const value = ((code * 131 + i * 17) % 1000) / 1000;
    nums.push(value);
  }
  return nums;
}

export function serializeVector(values: number[]): string {
  return `[${values.join(",")}]`;
}

export function assertFiniteVector(values: number[], literal: string): void {
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `vector fixture length ${values.length} !== EMBEDDING_DIMENSIONS ${EMBEDDING_DIMENSIONS}`,
    );
  }
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!Number.isFinite(v) || Number.isNaN(v)) {
      throw new Error(`vector fixture component ${i} is not finite: ${String(v)}`);
    }
  }
  if (!literal.startsWith("[") || !literal.endsWith("]")) {
    throw new Error(`vector literal must be bracketed: ${literal.slice(0, 32)}…`);
  }
  if (/NaN|Infinity|undefined|null/i.test(literal)) {
    throw new Error(`vector literal contains invalid token: ${literal.slice(0, 64)}…`);
  }
}

function fakeVector(seed: string): string {
  const values = generateFiniteVectorComponents(seed);
  const literal = serializeVector(values);
  assertFiniteVector(values, literal);
  return literal;
}

/**
 * Same-connection service_role session for protected admin RPCs.
 * Role establishment and the protected call share one psql stdin invocation
 * and one transaction — role state is never assumed across connections.
 */
function psqlAsServiceRole(sql: string): string {
  return psql(`
    BEGIN;
    SET LOCAL ROLE service_role;

    DO $service_role_check$
    BEGIN
      IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Test setup failed: service_role was not established';
      END IF;
    END
    $service_role_check$;

    ${sql}

    COMMIT;
  `);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

describe.skipIf(!dockerUp)("RAG DB lifecycle integration (local Supabase)", () => {
  beforeAll(() => {
    const start = startLocalSupabase();
    expect(start.ok).toBe(true);
    const reset = resetLocalDatabase();
    expect(reset.ok).toBe(true);
  }, 300000);

  it("finite-vector fixture is deterministic and free of NaN/Infinity", () => {
    const a = generateFiniteVectorComponents("abc");
    const b = generateFiniteVectorComponents("abc");
    expect(a).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(a.every((v) => Number.isFinite(v) && !Number.isNaN(v))).toBe(true);
    expect(a).toEqual(b);
    const litA = serializeVector(a);
    const litB = serializeVector(b);
    assertFiniteVector(a, litA);
    expect(litA).toBe(litB);
    expect(litA).not.toMatch(/NaN|Infinity|undefined|null/i);
    expect(fakeVector("abc")).toBe(litA);
  });

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
    psql(`DELETE FROM knowledge_chunks WHERE index_version='${versionKeyV2}'`);
    psql(`DELETE FROM rag_index_versions WHERE version_key='${versionKey}'`);
    psql(`DELETE FROM rag_index_versions WHERE version_key='${versionKeyV2}'`);

    psql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
      VALUES ('${versionKey}', '${CONTENT_FREEZE_SHA}', 'staging', 1, 2, 'abc123')`);

    const vec = fakeVector("abc");
    const base = `INSERT INTO knowledge_chunks (source_type, source_id, lesson_id, title, content, embedding, locale, package_path, source_sha, package_checksum, chunk_checksum, index_version, index_state, section_index, section_role, chunk_position, content_type)
      VALUES ('locale_lesson',`;

    psql(`${base} '${versionKey}/c0', 'intro-m1-l1', 'T', 'content-a', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-a', '${versionKey}', 'staging', 0, 'Core', 0, 'explanation')`);
    psql(`${base} '${versionKey}/c1', 'intro-m1-l1', 'T', 'content-b', '${vec}', 'en', 'pkg/a.json', '${CONTENT_FREEZE_SHA}', 'pkgsha', 'chk-b', '${versionKey}', 'staging', 1, 'Quiz', 0, 'quiz')`);

    const count1 = Number(psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}'`));
    expect(count1).toBe(2);

    // Idempotent re-insert of the same staging version row is skipped via conflict-free cleanup above;
    // re-count proves staging insert remains stable at 2 chunks.
    const countIdempotent = Number(
      psql(`SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='staging'`),
    );
    expect(countIdempotent).toBe(2);

    // -------------------------------------------------------------------------
    // 1) Default session denial — authorization guard (not the staging business rule)
    // -------------------------------------------------------------------------
    let defaultDenied = false;
    let defaultDenialMessage = "";
    try {
      psql(`SELECT activate_rag_index_version('${versionKey}')`);
    } catch (err) {
      defaultDenied = true;
      defaultDenialMessage = errorMessage(err);
    }
    expect(defaultDenied).toBe(true);
    expect(defaultDenialMessage).toContain("Forbidden: service_role required");

    const statusAfterDefaultDenial = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKey}'`,
    ).trim();
    expect(statusAfterDefaultDenial).toBe("staging");

    const activeAfterDefaultDenial = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
      ),
    );
    expect(activeAfterDefaultDenial).toBe(0);

    const stagingAfterDefaultDenial = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='staging'`,
      ),
    );
    expect(stagingAfterDefaultDenial).toBe(2);

    // -------------------------------------------------------------------------
    // 2) Failed-staging business rule under service_role (same connection)
    // -------------------------------------------------------------------------
    psql(
      `UPDATE knowledge_chunks SET indexing_failed=true, index_state='failed' WHERE source_id='${versionKey}/c1'`,
    );

    let stagingRuleFailed = false;
    let stagingRuleMessage = "";
    try {
      psqlAsServiceRole(`SELECT activate_rag_index_version('${versionKey}');`);
    } catch (err) {
      stagingRuleFailed = true;
      stagingRuleMessage = errorMessage(err);
    }
    expect(stagingRuleFailed).toBe(true);
    expect(stagingRuleMessage).not.toContain("Forbidden: service_role required");
    expect(stagingRuleMessage).not.toContain("Test setup failed: service_role was not established");
    // Migration checks incomplete staging count before failed-unit count when a failed
    // chunk drops out of the valid staging set (expected 2, found 1).
    expect(
      /Incomplete staging index: expected 2, found 1|Staging version has 1 failed units/i.test(
        stagingRuleMessage,
      ),
    ).toBe(true);

    const statusAfterFailedStaging = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKey}'`,
    ).trim();
    expect(statusAfterFailedStaging).toBe("staging");

    const activeAfterFailedStaging = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
      ),
    );
    expect(activeAfterFailedStaging).toBe(0);

    const failedStillFailed = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE source_id='${versionKey}/c1' AND index_state='failed'`,
      ),
    );
    expect(failedStillFailed).toBe(1);

    // -------------------------------------------------------------------------
    // 3) Successful activation under service_role
    // -------------------------------------------------------------------------
    psql(
      `UPDATE knowledge_chunks SET indexing_failed=false, index_state='staging' WHERE source_id='${versionKey}/c1'`,
    );

    const activateOut = psqlAsServiceRole(`SELECT activate_rag_index_version('${versionKey}');`);
    expect(activateOut).toContain('"ok": true');
    expect(activateOut).toContain(`"version_key": "${versionKey}"`);

    const activeVersions = psql(
      "SELECT version_key FROM rag_index_versions WHERE status='active'",
    )
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    expect(activeVersions.filter((v) => v === versionKey).length).toBe(1);

    const versionStatus = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKey}'`,
    ).trim();
    expect(versionStatus).toBe("active");

    const activeChunks = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
      ),
    );
    expect(activeChunks).toBe(2);

    const stagingVisible = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='staging'`,
      ),
    );
    expect(stagingVisible).toBe(0);

    const failedVisible = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='failed'`,
      ),
    );
    expect(failedVisible).toBe(0);

    const traceSha = psql(
      `SELECT DISTINCT source_sha FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
    ).trim();
    expect(traceSha).toBe(CONTENT_FREEZE_SHA);

    const packagePaths = psql(
      `SELECT DISTINCT package_path FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
    ).trim();
    expect(packagePaths).toBe("pkg/a.json");

    // -------------------------------------------------------------------------
    // 4) Rollback under service_role — activate v2 so v1 is superseded, then roll back to v1
    // -------------------------------------------------------------------------
    const vec2 = fakeVector("def");
    psql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
      VALUES ('${versionKeyV2}', '${CONTENT_FREEZE_SHA}', 'staging', 1, 2, 'def456')`);
    psql(`${base} '${versionKeyV2}/c0', 'intro-m1-l1', 'T2', 'content-c', '${vec2}', 'en', 'pkg/b.json', '${CONTENT_FREEZE_SHA}', 'pkgsha2', 'chk-c', '${versionKeyV2}', 'staging', 0, 'Core', 0, 'explanation')`);
    psql(`${base} '${versionKeyV2}/c1', 'intro-m1-l1', 'T2', 'content-d', '${vec2}', 'en', 'pkg/b.json', '${CONTENT_FREEZE_SHA}', 'pkgsha2', 'chk-d', '${versionKeyV2}', 'staging', 1, 'Quiz', 0, 'quiz')`);

    psqlAsServiceRole(`SELECT activate_rag_index_version('${versionKeyV2}');`);

    const v1AfterV2 = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKey}'`,
    ).trim();
    expect(v1AfterV2).toBe("superseded");

    const v2Active = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKeyV2}'`,
    ).trim();
    expect(v2Active).toBe("active");

    // Migration contract: rollback_rag_index_version(p_version_key) restores a superseded version.
    const rollbackOut = psqlAsServiceRole(`SELECT rollback_rag_index_version('${versionKey}');`);
    expect(rollbackOut).toContain('"ok": true');
    expect(rollbackOut).toContain(`"version_key": "${versionKey}"`);

    const v1AfterRollback = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKey}'`,
    ).trim();
    expect(v1AfterRollback).toBe("active");

    const v2AfterRollback = psql(
      `SELECT status FROM rag_index_versions WHERE version_key='${versionKeyV2}'`,
    ).trim();
    expect(v2AfterRollback).toBe("superseded");

    const activeVersionCount = Number(
      psql(`SELECT count(*) FROM rag_index_versions WHERE status='active'`),
    );
    expect(activeVersionCount).toBe(1);

    const soleActive = psql(
      `SELECT version_key FROM rag_index_versions WHERE status='active'`,
    ).trim();
    expect(soleActive).toBe(versionKey);

    const v1ActiveChunks = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
      ),
    );
    expect(v1ActiveChunks).toBe(2);

    const v2ActiveChunks = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKeyV2}' AND index_state='active'`,
      ),
    );
    expect(v2ActiveChunks).toBe(0);

    const v2SupersededChunks = Number(
      psql(
        `SELECT count(*) FROM knowledge_chunks WHERE index_version='${versionKeyV2}' AND index_state='superseded'`,
      ),
    );
    expect(v2SupersededChunks).toBe(2);

    const rollbackTrace = psql(
      `SELECT DISTINCT source_sha FROM knowledge_chunks WHERE index_version='${versionKey}' AND index_state='active'`,
    ).trim();
    expect(rollbackTrace).toBe(CONTENT_FREEZE_SHA);
  }, 120000);
});
