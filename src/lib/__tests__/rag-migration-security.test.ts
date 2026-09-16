import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const MIGRATION = readFileSync(
  path.join(REPO_ROOT, "supabase/migrations/20260711200000_rag_locale_index_versioning.sql"),
  "utf8",
);

describe("RAG migration security and idempotency", () => {
  it("defines rag_index_versions with single-active constraint", () => {
    expect(MIGRATION).toContain("CREATE TABLE IF NOT EXISTS public.rag_index_versions");
    expect(MIGRATION).toContain("rag_index_versions_one_active");
    expect(MIGRATION).toMatch(/status IN \('staging', 'active', 'superseded', 'failed'\)/);
  });

  it("adds locale-aware columns to knowledge_chunks", () => {
    for (const col of [
      "locale",
      "package_path",
      "source_sha",
      "package_checksum",
      "chunk_checksum",
      "content_version",
      "index_version",
      "index_state",
    ]) {
      expect(MIGRATION).toContain(col);
    }
  });

  it("uses IF NOT EXISTS / IF EXISTS for idempotent replay", () => {
    expect(MIGRATION).toContain("CREATE TABLE IF NOT EXISTS");
    expect(MIGRATION).toContain("ADD COLUMN IF NOT EXISTS");
    expect(MIGRATION).toContain("CREATE INDEX IF NOT EXISTS");
    expect(MIGRATION).toContain("DROP FUNCTION IF EXISTS");
  });

  it("locks activation and rollback to service_role", () => {
    expect(MIGRATION).toMatch(
      /REVOKE ALL ON FUNCTION public\.activate_rag_index_version\(text\) FROM PUBLIC, anon, authenticated/,
    );
    expect(MIGRATION).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.activate_rag_index_version\(text\) TO service_role/,
    );
    expect(MIGRATION).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.rollback_rag_index_version\(text\) TO service_role/,
    );
  });

  it("denies direct mutation on rag_index_versions and knowledge_chunks", () => {
    expect(MIGRATION).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.rag_index_versions FROM anon, authenticated",
    );
    expect(MIGRATION).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.knowledge_chunks FROM anon, authenticated",
    );
  });

  it("preserves authenticated read on rag_index_versions", () => {
    expect(MIGRATION).toContain("rag_index_versions_select_authenticated");
    expect(MIGRATION).toContain("GRANT SELECT ON public.rag_index_versions TO authenticated");
  });

  it("requires active index state in locale retrieval RPC", () => {
    expect(MIGRATION).toContain("match_locale_knowledge_chunks");
    expect(MIGRATION).toContain("kc.index_state = 'active'");
    expect(MIGRATION).toContain("kc.locale = p_locale");
  });

  it("denies incomplete staging activation", () => {
    expect(MIGRATION).toContain("Incomplete staging index");
    expect(MIGRATION).toContain("failed units");
  });
});

const LEAST_PRIVILEGE = readFileSync(
  path.join(REPO_ROOT, "supabase/migrations/20260722180001_rag_retrieval_rpc_least_privilege.sql"),
  "utf8",
);

const VERSIONED_IDENTITY = readFileSync(
  path.join(REPO_ROOT, "supabase/migrations/20260916090000_rag_versioned_chunk_identity.sql"),
  "utf8",
);

const GUARDED_UPGRADE = readFileSync(
  path.join(REPO_ROOT, "supabase/migrations/20260916100000_rag_guarded_upgrade_activation.sql"),
  "utf8",
);

describe("RAG versioned chunk identity migration", () => {
  it("preserves legacy identity while allowing parallel locale index versions", () => {
    expect(VERSIONED_IDENTITY).toContain("knowledge_chunks_unversioned_source_identity_unique");
    expect(VERSIONED_IDENTITY).toMatch(
      /WHERE source_type <> 'locale_lesson' OR index_version IS NULL/,
    );
    expect(VERSIONED_IDENTITY).toMatch(
      /DROP CONSTRAINT IF EXISTS knowledge_chunks_source_identity_unique/,
    );
    expect(VERSIONED_IDENTITY).not.toMatch(/DROP INDEX.*knowledge_chunks_locale_version_identity/);
  });
});

describe("RAG guarded upgrade migration", () => {
  it("locks exact active and staging versions behind service-role-only RPCs", () => {
    expect(GUARDED_UPGRADE).toContain("rag_activate_index_upgrade");
    expect(GUARDED_UPGRADE).toContain("rag_rollback_index_upgrade");
    expect(GUARDED_UPGRADE).toContain("ACTIVE_VERSION_MISMATCH");
    expect(GUARDED_UPGRADE).toContain("RESTORE_VERSION_NOT_SUPERSEDED");
    expect(GUARDED_UPGRADE).toMatch(
      /REVOKE ALL ON FUNCTION public\.rag_activate_index_upgrade\(text, text\)[\s\S]*?FROM PUBLIC, anon, authenticated/,
    );
    expect(GUARDED_UPGRADE).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.rag_rollback_index_upgrade\(text, text\) TO service_role/,
    );
  });

  it("clears a stale session error only after successful batch completion", () => {
    expect(GUARDED_UPGRADE).toContain("rag_clear_session_error_after_batch_success");
    expect(GUARDED_UPGRADE).toMatch(/NEW\.status = 'completed'/);
    expect(GUARDED_UPGRADE).toMatch(/b\.status = 'failed'/);
    expect(GUARDED_UPGRADE).toContain("rag-lovable-cf227e066b9b4550806c40adb1e8bde5");
    expect(GUARDED_UPGRADE).toContain("s.accepted_chunk_count = 3701");
  });
});

describe("RAG retrieval RPC least privilege", () => {
  it("denies authenticated and anon execute on match_locale_knowledge_chunks", () => {
    expect(LEAST_PRIVILEGE).toMatch(
      /REVOKE ALL ON FUNCTION public\.match_locale_knowledge_chunks\([\s\S]*?\) FROM PUBLIC, anon, authenticated/,
    );
    expect(LEAST_PRIVILEGE).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.match_locale_knowledge_chunks\([\s\S]*?\) TO service_role/,
    );
    expect(LEAST_PRIVILEGE).not.toMatch(
      /GRANT EXECUTE ON FUNCTION public\.match_locale_knowledge_chunks\([\s\S]*?\) TO authenticated/,
    );
  });

  it("denies authenticated execute on legacy match_knowledge_chunks", () => {
    expect(LEAST_PRIVILEGE).toMatch(
      /REVOKE ALL ON FUNCTION public\.match_knowledge_chunks\([\s\S]*?\) FROM PUBLIC, anon, authenticated/,
    );
    expect(LEAST_PRIVILEGE).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.match_knowledge_chunks\([\s\S]*?\) TO service_role/,
    );
  });

  it("leaves activation and rollback grants unchanged in prior migration", () => {
    expect(MIGRATION).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.activate_rag_index_version\(text\) TO service_role/,
    );
    expect(MIGRATION).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.rollback_rag_index_version\(text\) TO service_role/,
    );
    expect(LEAST_PRIVILEGE).not.toContain("activate_rag_index_version");
    expect(LEAST_PRIVILEGE).not.toContain("rollback_rag_index_version");
  });
});
