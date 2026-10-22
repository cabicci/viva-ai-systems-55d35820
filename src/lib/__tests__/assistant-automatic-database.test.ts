// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
let db: PGlite;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
const sourceSha = "a".repeat(64), payloadSha = "b".repeat(64), content = "Approved learner explanation";
const contentSha = digest(content), embedding = JSON.stringify(Array(1536).fill(0.25));
beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(`CREATE SCHEMA extensions;CREATE EXTENSION vector WITH SCHEMA extensions;
    CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
    GRANT USAGE ON SCHEMA public,extensions TO service_role;
    CREATE FUNCTION extensions.digest(bytea,text) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$ SELECT sha256($1) $$;
    CREATE FUNCTION public.rag_require_service_role() RETURNS void LANGUAGE plpgsql AS $$ BEGIN
      IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role required';END IF;END $$;
    CREATE TABLE public.card_assistant_policy(area text,card_id text,runtime_enabled boolean DEFAULT false,PRIMARY KEY(area,card_id));
    CREATE TABLE public.card_assistant_steps(area text,card_id text,step_id text,station_id text,source_key text,preview boolean,kids_level text,kids_lesson integer,technical_lesson text,PRIMARY KEY(area,card_id,step_id));
    CREATE TABLE public.card_assistant_chunks(area text,card_id text,step_id text,locale text,chunk_id text,source_sha256 text,payload_sha256 text,content_sha256 text,content text,embedding extensions.vector(1536),embedding_model text,embedding_dimensions integer,PRIMARY KEY(area,card_id,step_id,locale,chunk_id));
    CREATE TABLE public.kids_content_approvals(level_id text,lesson_number integer,locale text,approved_sha256 text);
    CREATE TABLE public.technical_lesson_content(lesson_id text,locale text,source_sha256 text);
    CREATE TABLE public.rag_current_batches(release_id text,state text,lease_until timestamptz,provider_reserved boolean);
    CREATE TABLE public.academic_courses(id text,enabled boolean,assistant_enabled boolean,assistant_review_enabled boolean);
    CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,approved boolean,source_sha256 text,payload jsonb);
    CREATE TABLE public.academic_rag_chunks(course_id text,lesson_id text,locale text,section_id text,source_sha256 text,content_version text,content_sha256 text,content text,embedding extensions.vector(1536),embedding_model text,embedding_dimensions integer);
    CREATE TABLE public.academic_assistant_policy(course_id text PRIMARY KEY,runtime_enabled boolean DEFAULT false);`);
  await db.exec(readFileSync("scripts/assistant/automatic-indexing-candidate.sql", "utf8"));
  await db.exec(readFileSync("scripts/assistant/automatic-publication-candidate.sql", "utf8"));
}, 60000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec(`RESET ROLE;TRUNCATE assistant_auto_attempts,assistant_auto_jobs,card_assistant_policy,card_assistant_steps,card_assistant_chunks,kids_content_approvals,technical_lesson_content,rag_current_batches,academic_courses,academic_lesson_content,academic_rag_chunks,academic_assistant_policy;
    UPDATE assistant_auto_policy SET enabled=false,excluded_cards='[]';`);
});
async function rpc(name: string, args: Record<string, unknown> = {}) {
  await db.exec("SET ROLE service_role");
  try {
    const values = Object.values(args).map(value => value !== null && typeof value === "object" ? JSON.stringify(value) : value);
    const result = await db.query<{ data: Record<string, unknown> | boolean }>(`SELECT public.${name}(${values.map((_, i) => `$${i + 1}`).join(",")}) AS data`, values);
    return result.rows[0].data;
  } finally { await db.exec("RESET ROLE"); }
}
async function register(area = "ai", scopeCount = 3, scopes: unknown[] = [], registry: unknown[] = []) {
  const material = JSON.stringify({ schemaVersion: "assistant-auto-v1", area, cardId: area === "ai" ? "current" : area === "academic" ? "AC-NEW" : "level-1", scopeCount, scopes, issue: null });
  const key = digest(material);
  await rpc("assistant_auto_register", { p_jobs: [{ key, material }], p_registry: registry });
  return key;
}
const claim = async (key: string, request = randomUUID()) => await rpc("assistant_auto_claim", { p_keys: [key], p_request: request }) as Record<string, unknown>;
const lease = (value: Record<string, unknown>) => ({ p_job: value.jobId, p_request: value.requestId, p_lease: value.leaseToken });
async function enabled() { await db.exec("UPDATE assistant_auto_policy SET enabled=true"); }
async function completeScope(c: Record<string, unknown>, receipt: unknown = {}, done = false) {
  return rpc("assistant_auto_finish", { ...lease(c), p_done: done, p_receipt: receipt });
}
describe("durable automatic preparation without duplicate paid calls", () => {
  it("is disabled on installation and does not claim or reserve provider work", async () => {
    const key = await register(); expect(await claim(key)).toEqual({ disabled: true });
    expect(await rpc("assistant_auto_status")).toEqual({ schemaVersion: "assistant-auto-v1", enabled: false });
    expect((await db.query("SELECT * FROM assistant_auto_attempts")).rows).toEqual([]);
  });
  it("records one reservation before provider work and refuses duplicate/overlapping requests", async () => {
    const key = await register(); await enabled(); const request = randomUUID(), c = await claim(key, request);
    expect(c.claimed).toBe(true); expect(await rpc("assistant_auto_reserve", lease(c))).toBe(true);
    await expect(rpc("assistant_auto_reserve", lease(c))).rejects.toThrow("ALREADY_RESERVED");
    expect(await claim(key, request)).toEqual({ replayed: true, state: "running" }); expect(await claim(key)).toEqual({ busy: true });
    await completeScope(c); expect((await claim(key)).offset).toBe(1);
    expect((await db.query("SELECT provider_calls FROM assistant_auto_jobs")).rows[0]).toEqual({ provider_calls: 1 });
  });
  it("holds an expired uncertain request permanently instead of issuing a new paid attempt", async () => {
    const key = await register(); await enabled(); const c = await claim(key); await rpc("assistant_auto_reserve", lease(c));
    await db.exec("UPDATE assistant_auto_jobs SET lease_until=now()-interval '1 second'");
    expect(await claim(key)).toEqual({ done: true, held: 1 });
    expect((await db.query<{n:number}>("SELECT count(*) AS n FROM assistant_auto_attempts")).rows[0].n).toBe(1);
    expect((await db.query("SELECT state,error_code FROM assistant_auto_jobs")).rows[0]).toEqual({ state: "held", error_code: "AUTOMATION_UNCERTAIN_REQUEST" });
  });
  it("does not repeat a completed scope after a lost completion response", async () => {
    const key = await register(); await enabled(); const request = randomUUID(), c = await claim(key, request); await completeScope(c);
    expect(await claim(key, request)).toEqual({ replayed: true, state: "done" }); expect((await claim(key)).offset).toBe(1);
  });
  it("retains an uncertain paid hold across new source or build manifests of the same card", async () => {
    const old = await register(); await enabled(); const c = await claim(old); await rpc("assistant_auto_reserve", lease(c));
    await db.exec("UPDATE assistant_auto_jobs SET lease_until=now()-interval '1 second'");
    const revised = await register("ai", 4);
    expect(await claim(revised)).toEqual({ done: true, held: 1 });
    expect((await db.query("SELECT state,error_code FROM assistant_auto_jobs WHERE job_id=$1", [revised])).rows)
      .toEqual([{ state: "held", error_code: "AUTOMATION_PRIOR_REQUEST_NEEDS_REVIEW" }]);
    expect((await db.query<{n:number}>("SELECT count(*) AS n FROM assistant_auto_attempts")).rows[0].n).toBe(1);
  });
  it("respects exclusion, global stop, and an existing manually owned AI lease", async () => {
    const key = await register(); await enabled();
    await db.exec("INSERT INTO rag_current_batches VALUES('existing','inflight',now()+interval '10 minutes',true)");
    expect(await claim(key)).toEqual({ busy: true });
    await db.exec("TRUNCATE rag_current_batches;UPDATE assistant_auto_policy SET excluded_cards='[\"ai:current\"]'");
    expect(await claim(key)).toEqual({ done: true, held: 0 });
    await db.exec("UPDATE assistant_auto_policy SET excluded_cards='[]'"); const c = await claim(key);
    await db.exec("UPDATE assistant_auto_policy SET enabled=false"); await expect(rpc("assistant_auto_reserve", lease(c))).rejects.toThrow("LEASE_UNAVAILABLE");
  });
  it("requires review of a legacy failed or inflight AI request regardless of lease age", async () => {
    await db.exec("INSERT INTO rag_current_batches VALUES('old','pending',NULL,true)");
    expect(await rpc("assistant_auto_ai_clear", { p_release: "old" })).toBe(false);
    await db.exec("UPDATE rag_current_batches SET state='done'"); expect(await rpc("assistant_auto_ai_clear", { p_release: "old" })).toBe(true);
  });
  it("denies anonymous/learner access to queue, policy, receipts and every automatic RPC", async () => {
    const rows = (await db.query<{ anon: boolean; learner: boolean }>(`SELECT has_function_privilege('anon',p.oid,'EXECUTE') anon,has_function_privilege('authenticated',p.oid,'EXECUTE') learner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'assistant_auto_%'`)).rows;
    expect(rows.length).toBeGreaterThan(8); expect(rows.every(row => !row.anon && !row.learner)).toBe(true);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`); await expect(db.query("SELECT * FROM assistant_auto_jobs")).rejects.toThrow("permission denied"); await db.exec("RESET ROLE");
    }
  });
});

async function preparedCard() {
  const scopes = locales.map(locale => ({ stepId: "1", locale, sourceSha }));
  const registry = [{ area: "kids", id: "level-1", steps: [{ id: "1", stationId: "level-1", preview: false, source: { adapter: "kids", levelId: "level-1", lessonNumber: 1 } }] }];
  const key = await register("kids", 5, scopes, registry); await enabled();
  for (const scope of scopes) {
    await db.query("INSERT INTO kids_content_approvals VALUES('level-1',1,$1,$2)", [scope.locale, sourceSha]);
    await db.query("INSERT INTO card_assistant_chunks VALUES('kids','level-1','1',$1,'section',$2,$3,$4,$5,$6::extensions.vector,'text-embedding-3-small',1536)", [scope.locale, sourceSha, payloadSha, contentSha, content, embedding]);
    await completeScope(await claim(key), { proofs: [{ ...scope, chunks: [{ id: "section", payloadSha, contentSha }] }] });
  }
  return claim(key);
}
describe("automatic publication still requires exact approved complete coverage", () => {
  it("enables only the prepared native card after all source receipts and actual vectors agree", async () => {
    const c = await preparedCard(); expect(await rpc("assistant_auto_publish_card", lease(c))).toBe(true);
    expect((await db.query<{runtime_enabled:boolean}>("SELECT runtime_enabled FROM card_assistant_policy")).rows[0].runtime_enabled).toBe(true);
    expect(await completeScope(c, { activated: true }, true)).toBe(true);
  });
  it.each(["UPDATE card_assistant_chunks SET content='changed' WHERE locale='en'", "DELETE FROM card_assistant_chunks WHERE locale='en'", "UPDATE card_assistant_chunks SET embedding=NULL WHERE locale='en'", "UPDATE card_assistant_chunks SET embedding_model=NULL WHERE locale='en'", "UPDATE card_assistant_chunks SET embedding='[" + Array(1536).fill(0).join(",") + "]'::extensions.vector WHERE locale='en'"])("rejects stored index corruption before enabling a card", async corruption => {
    const c = await preparedCard(); await db.exec(corruption); await expect(rpc("assistant_auto_publish_card", lease(c))).rejects.toThrow("INDEX_INCOMPLETE");
    expect((await db.query<{runtime_enabled:boolean}>("SELECT runtime_enabled FROM card_assistant_policy")).rows[0].runtime_enabled).toBe(false);
  });
  it("rejects a source changed after a successful embedding/write receipt", async () => {
    const c = await preparedCard(); await db.exec("UPDATE kids_content_approvals SET approved_sha256='changed' WHERE locale='en'");
    await expect(rpc("assistant_auto_publish_card", lease(c))).rejects.toThrow("SOURCE_CHANGED");
  });
});

async function preparedAcademic() {
  const scopes = locales.map(locale => ({ stepId: "AC-NEW-L01", locale, sourceSha }));
  const key = await register("academic", 5, scopes); await enabled();
  await db.exec("INSERT INTO academic_courses VALUES('AC-NEW',false,false,true);INSERT INTO academic_assistant_policy VALUES('AC-NEW',false)");
  const section = { id: "concept", title: "Approved concept", text: content };
  const text = section.title + "\n" + section.text;
  for (const scope of scopes) {
    await db.query("INSERT INTO academic_lesson_content VALUES('AC-NEW',$1,$2,true,$3,$4)", [scope.stepId, scope.locale, sourceSha, JSON.stringify({ version: "2.0.0", sections: [section] })]);
    await db.query("INSERT INTO academic_rag_chunks VALUES('AC-NEW',$1,$2,'concept',$3,'2.0.0',$4,$5,$6::extensions.vector,'text-embedding-3-small',1536)", [scope.stepId, scope.locale, sourceSha, digest(text), text, embedding]);
    await completeScope(await claim(key), { proofs: [{ ...scope, chunks: [{ id: "concept", contentSha: digest(text) }] }] });
  }
  return claim(key);
}
describe("automatic Academic publication with existing commercial policy", () => {
  it("publishes a complete approved index while retaining course release and subscription settings", async () => {
    const c = await preparedAcademic();
    expect(await rpc("assistant_auto_publish_academic", lease(c))).toBe(true);
    expect((await db.query("SELECT * FROM academic_courses")).rows).toEqual([{ id: "AC-NEW", enabled: false, assistant_enabled: false, assistant_review_enabled: true }]);
    expect((await db.query("SELECT runtime_enabled FROM academic_assistant_policy")).rows).toEqual([{ runtime_enabled: true }]);
  });
  it.each([
    "UPDATE academic_rag_chunks SET content='different' WHERE locale='en'",
    "UPDATE academic_rag_chunks SET content_version='old' WHERE locale='en'",
    "DELETE FROM academic_rag_chunks WHERE locale='en'",
    "UPDATE academic_rag_chunks SET embedding=NULL WHERE locale='en'",
    "UPDATE academic_rag_chunks SET embedding='[" + Array(1536).fill(0).join(",") + "]'::extensions.vector WHERE locale='en'",
  ])("rejects an incomplete or corrupt Academic index", async corruption => {
    const c = await preparedAcademic(); await db.exec(corruption);
    await expect(rpc("assistant_auto_publish_academic", lease(c))).rejects.toThrow("INDEX_INCOMPLETE");
    expect((await db.query("SELECT runtime_enabled FROM academic_assistant_policy")).rows).toEqual([{ runtime_enabled: false }]);
  });
  it.each([
    "UPDATE academic_lesson_content SET approved=false WHERE locale='en'",
    "UPDATE academic_lesson_content SET source_sha256='changed' WHERE locale='en'",
    "DELETE FROM academic_lesson_content WHERE locale='en'",
  ])("blocks publication after approval or source changes", async mutation => {
    const c = await preparedAcademic(); await db.exec(mutation);
    await expect(rpc("assistant_auto_publish_academic", lease(c))).rejects.toThrow("SOURCE_CHANGED");
    expect((await db.query("SELECT runtime_enabled FROM academic_assistant_policy")).rows).toEqual([{ runtime_enabled: false }]);
  });
  it("does not invent a missing Academic commercial policy", async () => {
    const c = await preparedAcademic(); await db.exec("DELETE FROM academic_assistant_policy");
    await expect(rpc("assistant_auto_publish_academic", lease(c))).rejects.toThrow("POLICY_MISSING");
    expect((await db.query("SELECT * FROM academic_assistant_policy")).rows).toEqual([]);
  });
});
