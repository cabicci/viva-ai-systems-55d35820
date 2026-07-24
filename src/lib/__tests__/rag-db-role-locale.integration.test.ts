import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  dockerReady,
  psql,
  resetLocalDatabase,
  startLocalSupabase,
} from "../../../scripts/rag/lib/disposable-db";
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS, RAG_INDEX_VERSION } from "@/lib/rag/constants";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const dockerUp = dockerReady();
const versionKey = `rag-role-${CONTENT_FREEZE_SHA.slice(0, 8)}`;

function fakeVector(seed: string): string {
  if (!seed || seed.length === 0) {
    throw new Error("vector fixture seed must be non-empty");
  }
  const nums: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const code = seed.charCodeAt(i % seed.length);
    const value = ((code * 131 + i * 17) % 1000) / 1000;
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      throw new Error(`vector fixture component ${i} is not finite`);
    }
    nums.push(value);
  }
  if (nums.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`vector fixture length mismatch: ${nums.length}`);
  }
  const literal = `[${nums.join(",")}]`;
  if (!literal.startsWith("[") || !literal.endsWith("]")) {
    throw new Error("vector literal must be bracketed");
  }
  if (/NaN|Infinity|undefined|null/i.test(literal)) {
    throw new Error("vector literal contains invalid token");
  }
  return literal;
}

function pkgChecksum(locale: string): string {
  return createFixedDigest(`pkg-${locale}`);
}

function chunkChecksum(locale: string, lesson: string): string {
  return createFixedDigest(`chunk-${locale}-${lesson}`);
}

function createFixedDigest(seed: string): string {
  // Deterministic fake 64-hex for SQL fixtures only (not admission tests).
  let out = "";
  let x = 0;
  for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 8; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

describe.skipIf(!dockerUp)("RAG DB role + locale isolation (disposable)", () => {
  beforeAll(() => {
    const start = startLocalSupabase();
    expect(start.ok).toBe(true);
    const reset = resetLocalDatabase();
    expect(reset.ok).toBe(true);

    psql(`DELETE FROM knowledge_chunks WHERE index_version='${versionKey}'`);
    psql(`DELETE FROM rag_index_versions WHERE version_key='${versionKey}'`);

    psql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
      VALUES ('${versionKey}', '${CONTENT_FREEZE_SHA}', 'active', 4, 4, '${createFixedDigest("manifest")}')`);

    const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
    for (const locale of locales) {
      const lessonId = `intro-m1-l1-${locale}`;
      const sourceId = `${locale}/${lessonId}/s0/c0`;
      const packagePath = `src/lib/locale-lessons/${locale}/lessons/${lessonId}.json`;
      const vec = fakeVector(locale);
      psql(`INSERT INTO knowledge_chunks (
        source_type, source_id, lesson_id, title, content, embedding, locale, package_path,
        source_sha, package_checksum, chunk_checksum, content_version, index_version, index_state,
        section_index, section_role, chunk_position, content_type, path_id, module_id
      ) VALUES (
        'locale_lesson', '${sourceId}', '${lessonId}', 'T-${locale}', 'content-${locale}',
        '${vec}', '${locale}', '${packagePath}', '${CONTENT_FREEZE_SHA}',
        '${pkgChecksum(locale)}', '${chunkChecksum(locale, lessonId)}', 'v1',
        '${versionKey}', 'active', 0, 'Orientation', 0, 'explanation', 'intro', 'intro-m1'
      )`);
    }

    // Inactive index row that must not be retrieved.
    psql(`INSERT INTO knowledge_chunks (
      source_type, source_id, lesson_id, title, content, embedding, locale, package_path,
      source_sha, package_checksum, chunk_checksum, index_version, index_state,
      section_index, section_role, chunk_position, content_type
    ) VALUES (
      'locale_lesson', 'en/inactive/s0/c0', 'inactive-lesson', 'inactive', 'inactive-content',
      '${fakeVector("inactive")}', 'en', 'src/lib/locale-lessons/en/lessons/inactive.json',
      '${CONTENT_FREEZE_SHA}', '${pkgChecksum("inactive")}', '${chunkChecksum("en", "inactive")}',
      '${versionKey}', 'staging', 0, 'Core', 0, 'explanation'
    )`);
  }, 300000);

  it("denies PUBLIC/anon/authenticated execute on match_locale_knowledge_chunks", () => {
    for (const role of ["PUBLIC", "anon", "authenticated"] as const) {
      const grants = psql(
        `SELECT privilege_type FROM information_schema.role_routine_grants
         WHERE routine_name='match_locale_knowledge_chunks'
           AND grantee='${role === "PUBLIC" ? "PUBLIC" : role}'
           AND privilege_type='EXECUTE'`,
      ).trim();
      expect(grants.length).toBe(0);
    }
  });

  it("permits service_role execute on match_locale_knowledge_chunks", () => {
    const grants = psql(
      `SELECT privilege_type FROM information_schema.role_routine_grants
       WHERE routine_name='match_locale_knowledge_chunks'
         AND grantee='service_role'
         AND privilege_type='EXECUTE'`,
    ).trim();
    expect(grants).toContain("EXECUTE");
  });

  it("service_role retrieval is locale-isolated for all four locales", () => {
    const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
    for (const locale of locales) {
      const rows = psql(
        `SELECT locale FROM match_locale_knowledge_chunks(
          '${fakeVector(locale)}'::extensions.vector(1536),
          '${locale}',
          10,
          NULL, NULL, NULL, NULL,
          0.0,
          false
        )`,
      )
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r === locale || r.startsWith(locale))).toBe(true);
      // Prefer exact locale column when available; fall back to source_id prefix check.
      const localesReturned = psql(
        `SELECT DISTINCT locale FROM match_locale_knowledge_chunks(
          '${fakeVector(locale)}'::extensions.vector(1536),
          '${locale}',
          10,
          NULL, NULL, NULL, NULL,
          0.0,
          false
        )`,
      )
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      expect(localesReturned).toEqual([locale]);
    }
  });

  it("unsupported locale returns no rows", () => {
    const rows = psql(
      `SELECT count(*) FROM match_locale_knowledge_chunks(
        '${fakeVector("xx")}'::extensions.vector(1536),
        'fr-FR',
        10,
        NULL, NULL, NULL, NULL,
        0.0,
        false
      )`,
    ).trim();
    expect(Number(rows)).toBe(0);
  });

  it("inactive/staging index rows are not returned", () => {
    const rows = psql(
      `SELECT source_id FROM match_locale_knowledge_chunks(
        '${fakeVector("inactive")}'::extensions.vector(1536),
        'en',
        20,
        NULL, NULL, NULL, NULL,
        0.0,
        false
      )`,
    );
    expect(rows).not.toContain("en/inactive/s0/c0");
  });

  it("documents index version contract used by fixtures", () => {
    expect(RAG_INDEX_VERSION).toBe("rag-index-v1");
    expect(REPO_ROOT.length).toBeGreaterThan(0);
  });
});
