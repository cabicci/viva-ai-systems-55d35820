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
    expect(MIGRATION).toContain("GRANT EXECUTE ON FUNCTION public.match_locale_knowledge_chunks");
    expect(MIGRATION).toContain("TO authenticated, service_role");
  });

  it("denies incomplete staging activation", () => {
    expect(MIGRATION).toContain("Incomplete staging index");
    expect(MIGRATION).toContain("failed units");
  });
});
