// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { approvedChunks, canonicalJson, sha256, ACADEMIC_EMBEDDING_MODEL, type ApprovedLesson } from "./assistant-corpus";

// A real disposable PostgreSQL engine with pgvector and pgcrypto. No production
// connection, provider request, or production policy/catalogue mutation is made.
let db: PGlite;
const embedding = JSON.stringify(Array(1536).fill(0.1));
const candidate = readFileSync(new URL("../../../scripts/academic-education/assistant-card-index-maintenance-candidate.sql", import.meta.url), "utf8");
beforeAll(async () => {
  db = await PGlite.create({ extensions: { vector, pgcrypto } });
  await db.exec(`
    CREATE SCHEMA extensions; CREATE SCHEMA billing;
    CREATE EXTENSION vector WITH SCHEMA extensions;
    CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    GRANT USAGE ON SCHEMA public,extensions,billing TO anon,authenticated,service_role;
    CREATE FUNCTION billing.is_service_role_caller() RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role',true)='service_role';
    $$;
    CREATE TABLE public.academic_courses(id text PRIMARY KEY,enabled boolean DEFAULT true,
      assistant_enabled boolean DEFAULT true,assistant_review_enabled boolean DEFAULT false);
    CREATE TABLE public.academic_lesson_content(course_id text REFERENCES public.academic_courses(id),
      lesson_id text,locale text,approved boolean NOT NULL,payload jsonb NOT NULL,source_sha256 text NOT NULL,
      PRIMARY KEY(course_id,lesson_id,locale));
    CREATE TABLE public.academic_rag_chunks(course_id text REFERENCES public.academic_courses(id),
      lesson_id text NOT NULL,locale text NOT NULL,section_id text NOT NULL,content_version text NOT NULL,
      source_sha256 text NOT NULL,content_sha256 text NOT NULL,content text NOT NULL,
      embedding extensions.vector(1536) NOT NULL,
      PRIMARY KEY(course_id,lesson_id,locale,section_id,content_version),
      FOREIGN KEY(course_id,lesson_id,locale) REFERENCES public.academic_lesson_content(course_id,lesson_id,locale));
    GRANT SELECT,INSERT,UPDATE ON public.academic_rag_chunks TO service_role;
    GRANT SELECT ON public.academic_courses,public.academic_lesson_content TO service_role;
    ALTER TABLE public.academic_courses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.academic_lesson_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.academic_rag_chunks ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION public.academic_import_chunks(jsonb) RETURNS integer LANGUAGE sql AS $$ SELECT 0; $$;
    GRANT EXECUTE ON FUNCTION public.academic_import_chunks(jsonb) TO service_role;
  `);
  await db.exec(candidate);
}, 30000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec("RESET ROLE; TRUNCATE public.academic_courses CASCADE; INSERT INTO public.academic_courses(id) VALUES('AC-NEW'),('AC-OTHER');");
  await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
});

async function saveSource(course = "AC-NEW", locale = "en", version = "1", sectionIds = ["s1", "s2"], approved = true): Promise<ApprovedLesson> {
  const id = `${course}-M01-L01`;
  const payload = { id, locale, version,
    sections: sectionIds.map(sectionId => ({ id: sectionId, title: `Title ${sectionId}`, text: `Approved ${sectionId} version ${version}` })) };
  const row = { course_id: course, lesson_id: id, locale, approved, payload, source_sha256: await sha256(canonicalJson(payload)) };
  await db.query(`INSERT INTO public.academic_lesson_content(course_id,lesson_id,locale,approved,payload,source_sha256)
    VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(course_id,lesson_id,locale) DO UPDATE SET
    approved=EXCLUDED.approved,payload=EXCLUDED.payload,source_sha256=EXCLUDED.source_sha256`,
  [course, id, locale, approved, payload, row.source_sha256]);
  return row;
}
const scope = (row: ApprovedLesson) => ({ lesson_id: row.lesson_id, locale: row.locale, approved: row.approved, source_sha256: row.source_sha256 });
async function chunks(row: ApprovedLesson) {
  return (await approvedChunks(row)).map(chunk => ({ ...chunk, embedding,
    embedding_model: ACADEMIC_EMBEDDING_MODEL, embedding_dimensions: 1536 }));
}
async function sync(row: ApprovedLesson, rows: unknown[]) {
  return db.query("SELECT public.academic_sync_chunks($1,$2::jsonb,$3::jsonb)", [row.course_id, JSON.stringify([scope(row)]), JSON.stringify(rows)]);
}
async function stored(course = "AC-NEW") {
  return (await db.query<{ section_id: string; content_version: string }>(
    "SELECT section_id,content_version FROM public.academic_rag_chunks WHERE course_id=$1 ORDER BY section_id,content_version", [course])).rows;
}
async function retrieved(course = "AC-NEW", locale = "en") {
  return (await db.query("SELECT * FROM public.academic_rag_match($1,$2,$3::extensions.vector,6)", [course, locale, embedding])).rows;
}

it("executes the candidate with real vector/hash extensions and preserves exact card/locale retrieval", async () => {
  for (const [course, locale] of [["AC-NEW", "en"], ["AC-OTHER", "en"], ["AC-NEW", "ar-EG"]]) {
    const row = await saveSource(course, locale); await sync(row, await chunks(row));
  }
  const rows = await retrieved();
  expect(rows).toHaveLength(2);
  expect(rows.every((row: any) => row.course_id === "AC-NEW" && row.locale === "en")).toBe(true);
  expect((await db.query("SELECT to_regprocedure('public.academic_import_chunks(jsonb)') AS obsolete")).rows[0]).toEqual({ obsolete: null });
});

it("allows the service role to synchronize and retrieve while RLS remains enabled", async () => {
  const row = await saveSource(); const entries = await chunks(row);
  await db.exec("SET ROLE service_role");
  await sync(row, entries);
  expect(await retrieved()).toHaveLength(2);
  await db.exec("RESET ROLE");
  const flags = (await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.academic_rag_chunks'::regclass")).rows;
  expect(flags[0]).toEqual({ relrowsecurity: true });
});

it("requires a provenance refresh for legacy vectors and rejects half-populated model metadata", async () => {
  const row = await saveSource(); const entries = await chunks(row);
  await sync(row, entries);
  await expect(db.exec("UPDATE public.academic_rag_chunks SET embedding_model=NULL WHERE section_id='s1'")).rejects.toThrow(/academic_embedding_contract/);
  await db.exec("UPDATE public.academic_rag_chunks SET embedding_model=NULL,embedding_dimensions=NULL");
  expect(await retrieved()).toEqual([]);
  await sync(row, entries);
  expect(await retrieved()).toHaveLength(2);
});

it("denies browser roles and non-service callers before index writes", async () => {
  const row = await saveSource(); const entries = await chunks(row);
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`SET ROLE ${role}`);
    await expect(sync(row, entries)).rejects.toThrow(/permission denied/);
    await db.exec("RESET ROLE");
  }
  await db.query("SELECT set_config('request.jwt.claim.role','authenticated',false)");
  await expect(sync(row, entries)).rejects.toThrow("SERVICE_ONLY");
  expect(await stored()).toEqual([]);
});

it("excludes changed source immediately, rolls back incomplete replacement, then prunes obsolete versions atomically", async () => {
  const original = await saveSource(); await sync(original, await chunks(original));
  const next = await saveSource("AC-NEW", "en", "2"); const replacements = await chunks(next);
  expect(await retrieved()).toEqual([]);
  await expect(sync(next, replacements.slice(0, 1))).rejects.toThrow("ACADEMIC_INDEX_REPLACEMENT_INCOMPLETE");
  expect(await stored()).toEqual([{ section_id: "s1", content_version: "1" }, { section_id: "s2", content_version: "1" }]);
  await sync(next, replacements);
  expect(await stored()).toEqual([{ section_id: "s1", content_version: "2" }, { section_id: "s2", content_version: "2" }]);
  expect(await retrieved()).toHaveLength(2);
});

it("removes a deleted section only after its current lesson replacement succeeds", async () => {
  const original = await saveSource(); await sync(original, await chunks(original));
  const next = await saveSource("AC-NEW", "en", "2", ["s1"]);
  await sync(next, await chunks(next));
  expect(await stored()).toEqual([{ section_id: "s1", content_version: "2" }]);
});

it("rejects stale source snapshots without partially changing or deleting the old index", async () => {
  const original = await saveSource(); await sync(original, await chunks(original));
  const stale = await saveSource("AC-NEW", "en", "2");
  await saveSource("AC-NEW", "en", "3");
  await expect(sync(stale, await chunks(stale))).rejects.toThrow("ACADEMIC_IMPORT_SOURCE_CHANGED");
  expect(await stored()).toEqual([{ section_id: "s1", content_version: "1" }, { section_id: "s2", content_version: "1" }]);
});

it("stops returning unapproved content immediately and removes its index without embedding", async () => {
  const original = await saveSource(); await sync(original, await chunks(original));
  const hidden = await saveSource("AC-NEW", "en", "1", ["s1", "s2"], false);
  expect(await retrieved()).toEqual([]);
  await sync(hidden, []);
  expect(await stored()).toEqual([]);
});

it("physically removes a deleted lesson index by FK cascade and preserves other cards", async () => {
  for (const course of ["AC-NEW", "AC-OTHER"]) {
    const row = await saveSource(course); await sync(row, await chunks(row));
  }
  await db.query("DELETE FROM public.academic_lesson_content WHERE course_id=$1", ["AC-NEW"]);
  expect(await stored()).toEqual([]);
  expect(await stored("AC-OTHER")).toHaveLength(2);
});

it("rolls back all writes for mismatched content, model, dimensions, or foreign-card input", async () => {
  const row = await saveSource(); const entries = await chunks(row);
  for (const bad of [{ ...entries[1], content: "UNAPPROVED" },
    { ...entries[1], embedding_model: "different-model" },
    { ...entries[1], embedding_dimensions: 1024 },
    { ...entries[1], embedding: "[1,2,3]" },
    { ...entries[1], course_id: "AC-OTHER" }]) {
    await expect(sync(row, [entries[0], bad])).rejects.toThrow();
    expect(await stored()).toEqual([]);
  }
});

it("verifies current section text and content hash during retrieval, not only a claimed source hash", async () => {
  const row = await saveSource(); await sync(row, await chunks(row));
  await db.query("UPDATE public.academic_rag_chunks SET content=$1 WHERE section_id='s1'", ["CORRUPTED_TEXT"]);
  const rows = await retrieved();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ section_id: "s2" });
});
