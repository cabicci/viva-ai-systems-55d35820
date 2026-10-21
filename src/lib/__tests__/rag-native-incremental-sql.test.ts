// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { sha256CanonicalHex } from "@/lib/rag/canonical-checksum";
import { validateReusableEmbeddingCandidate } from "@/lib/rag/inactive-importer/embedding-reuse";
import type { ReusableEmbeddingRow } from "@/lib/rag/inactive-importer/types";

const root = path.resolve(import.meta.dirname, "../../..");
const model = "text-embedding-3-small";
const content = "A concept already present in the current card.";
const checksum = sha256CanonicalHex(content);
const request = { chunkId: "en/current-step/s0/c0", pathId: "current-card", lessonId: "current-step", locale: "en", checksum };
const embedding = (dimensions = 1536) => JSON.stringify(Array.from({ length: dimensions }, () => 0.25));
let db: PGlite;
beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(`CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions;
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('role', true) $$;
    CREATE TABLE public.rag_index_versions(version_key text PRIMARY KEY,source_sha text,status text,embedding_model text);
    CREATE TABLE public.knowledge_chunks(source_id text,source_type text,path_id text,lesson_id text,locale text,
      chunk_checksum text,content text,embedding extensions.vector,index_state text,index_version text,source_sha text,indexing_failed boolean);`);
  const historical = fs.readFileSync(path.join(root, "supabase/migrations/20260727010000_rag_lovable_native_resumable_importer.sql"), "utf8");
  const roleGuard = historical.match(/CREATE OR REPLACE FUNCTION public\.rag_require_service_role\(\)[\s\S]*?GRANT EXECUTE ON FUNCTION public\.rag_require_service_role\(\) TO service_role;/)?.[0];
  if (!roleGuard) throw new Error("Missing verified role guard fixture");
  await db.exec(roleGuard);
  await db.exec(fs.readFileSync(path.join(root, "scripts/rag/incremental-embedding-reuse-candidate.sql"), "utf8"));
}, 60000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await db.exec("RESET ROLE; TRUNCATE public.knowledge_chunks,public.rag_index_versions;"); });

async function seed(overrides: Partial<Record<"pathId"|"lessonId"|"locale"|"checksum"|"content"|"rowState"|"versionState"|"model"|"sourceSha"|"registrySha"|"sourceType", string>> & { dimensions?: number; failed?: boolean; nullVector?: boolean } = {}, suffix = "valid") {
  const version = `version-${suffix}`;
  await db.query("INSERT INTO rag_index_versions VALUES($1,$2,$3,$4)", [version, overrides.registrySha ?? "b".repeat(40), overrides.versionState ?? "active", overrides.model ?? model]);
  await db.query(`INSERT INTO knowledge_chunks VALUES($1,$2,$3,$4,$5,$6,$7,$8::extensions.vector,$9,$10,$11,$12)`,
    [`source-${suffix}`, overrides.sourceType ?? "locale_lesson", overrides.pathId ?? request.pathId,
      overrides.lessonId ?? request.lessonId, overrides.locale ?? request.locale, overrides.checksum ?? checksum,
      overrides.content ?? content, overrides.nullVector ? null : embedding(overrides.dimensions), overrides.rowState ?? "active",
      version, overrides.sourceSha ?? "b".repeat(40), overrides.failed ?? false]);
}
async function reuse(requests: unknown = [request], role = "service_role") {
  await db.exec(`SET ROLE ${role}`);
  try { return (await db.query<{ result: Array<ReusableEmbeddingRow & { chunkId: string }> }>("SELECT public.rag_reusable_embeddings($1::jsonb) result", [JSON.stringify(requests)])).rows[0].result; }
  finally { await db.exec("RESET ROLE"); }
}

describe("native incremental read-only RPC in isolated PGlite with pgvector", () => {
  it("returns exact active model/dimension/provenance candidates and does not mutate any source rows", async () => {
    for (let i = 0; i < 8; i++) await seed({}, String(i));
    const before = (await db.query("SELECT source_id,index_state,index_version,source_sha FROM knowledge_chunks ORDER BY source_id")).rows;
    const rows = await reuse();
    expect(rows).toHaveLength(8);
    expect(rows[0]).toMatchObject({ chunkId: request.chunkId, content, chunkChecksum: checksum, model, dimensions: 1536,
      locale: "en", sourceSha: "b".repeat(40), registrySourceSha: "b".repeat(40), indexState: "active", versionStatus: "active", indexingFailed: false });
    expect(validateReusableEmbeddingCandidate({ content, checksum, locale: "en" }, rows[0], { model, dimensions: 1536 })).toHaveLength(1536);
    expect((await db.query("SELECT source_id,index_state,index_version,source_sha FROM knowledge_chunks ORDER BY source_id")).rows).toEqual(before);
  });

  it.each([
    { rowState: "superseded" }, { versionState: "superseded" }, { rowState: "staging" },
    { model: "different-model" }, { dimensions: 3 }, { nullVector: true }, { failed: true },
    { sourceSha: "c".repeat(40) }, { pathId: "foreign-card" }, { lessonId: "foreign-step" },
    { locale: "ar-EG" }, { checksum: "a".repeat(64) }, { sourceType: "legacy_lesson" },
  ])("excludes stale/incompatible/foreign candidate %j", async (invalid) => {
    await seed();
    await seed(invalid, "invalid");
    expect(await reuse()).toHaveLength(1);
  });

  it("leaves final exact-text/checksum validation to the shared gate before reusing vectors", async () => {
    await seed({ content: "Changed source with forged old checksum" });
    const rows = await reuse();
    expect(rows).toHaveLength(1);
    expect(validateReusableEmbeddingCandidate({ content, checksum, locale: "en" }, rows[0], { model, dimensions: 1536 })).toBeNull();
  });

  it("returns no deleted candidate and never reuses a superseded version after activation", async () => {
    await seed();
    await db.exec("UPDATE rag_index_versions SET status='superseded'; UPDATE knowledge_chunks SET index_state='superseded';");
    expect(await reuse()).toEqual([]);
    await db.exec("DELETE FROM knowledge_chunks");
    expect(await reuse()).toEqual([]);
  });

  it.each([null, {}, [], Array.from({ length: 65 }, () => request), [{ ...request, checksum: "bad" }], [{ ...request, locale: "fr" }], [{ ...request, lessonId: "" }]])("rejects invalid scoped requests %j", async (invalid) => {
    await expect(reuse(invalid)).rejects.toThrow("INVALID_REUSE_REQUEST");
  });

  it("allows only service_role and preserves the installed runtime guard", async () => {
    const privileges = await db.query<{ anon: boolean; authenticated: boolean; service: boolean }>(`SELECT
      has_function_privilege('anon','public.rag_reusable_embeddings(jsonb)','EXECUTE') anon,
      has_function_privilege('authenticated','public.rag_reusable_embeddings(jsonb)','EXECUTE') authenticated,
      has_function_privilege('service_role','public.rag_reusable_embeddings(jsonb)','EXECUTE') service`);
    expect(privileges.rows[0]).toEqual({ anon: false, authenticated: false, service: true });
    for (const role of ["anon", "authenticated"]) await expect(reuse([request], role)).rejects.toThrow(/permission denied/);
    await expect(db.query("SELECT public.rag_reusable_embeddings($1::jsonb)", [JSON.stringify([request])])).rejects.toThrow("service_role required");
  });

  it.each(["chunkId", "pathId", "lessonId", "locale", "checksum"])("rejects JSON coercion of scoped string field %s", async (field) => {
    await expect(reuse([{ ...request, [field]: 42 }])).rejects.toThrow("INVALID_REUSE_REQUEST");
  });
});
