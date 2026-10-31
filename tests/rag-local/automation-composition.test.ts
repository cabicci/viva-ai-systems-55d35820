import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, expect, it } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { automaticTick } from "../../src/lib/assistant-automation/worker.server";
import { automaticPlans, type AutomaticPlan } from "../../src/lib/assistant-automation/manifest";
import type { RegisteredCard } from "../../src/lib/card-assistant/registry";
import { performance } from "node:perf_hooks";

// Real PostgreSQL and actual existing queue SQL. Vector columns are opaque text
// schema fixtures in this QUEUE test; publication/retrieval/vector RPCs are NOT executed. These prerequisite
// source tables/roles are disposable schema fixtures, not deployed parity/JWT.
let db: PGlite;
const evidence: Record<string, unknown> = { boundary: "embedded PostgreSQL; fixture source metadata and indexing executor; no provider", checks: [] };
const sha = "a".repeat(64), build = "b".repeat(64), release = "c".repeat(64);
const ai = { releaseId: release, chunks: 1 };
const noSources = { kids: [], technical: [], academicCourses: [], academic: [] };
const dbPath = `../evidence/automation-pg-${Date.now()}`;
const registry: RegisteredCard[] = [{ area: "technical", id: "local-proof", steps: [
  { id: "T01", stationId: "M01", preview: false, source: { adapter: "technical", lessonId: "T01" } },
] }];

beforeAll(async () => {
  mkdirSync("../evidence", { recursive: true });
  db = new PGlite(dbPath);
  await db.exec(`CREATE SCHEMA extensions;
    CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
    GRANT USAGE ON SCHEMA public,extensions TO service_role;
    CREATE FUNCTION extensions.digest(bytea,text) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$ SELECT sha256($1) $$;
    CREATE FUNCTION public.rag_require_service_role() RETURNS void LANGUAGE plpgsql AS $$ BEGIN
      IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role required';END IF;END $$;
    CREATE TABLE card_assistant_policy(area text,card_id text,runtime_enabled boolean DEFAULT false,PRIMARY KEY(area,card_id));
    CREATE TABLE card_assistant_steps(area text,card_id text,step_id text,station_id text,source_key text,preview boolean,kids_level text,kids_lesson integer,technical_lesson text,PRIMARY KEY(area,card_id,step_id));
    CREATE TABLE card_assistant_chunks(area text,card_id text,step_id text,locale text,chunk_id text,source_sha256 text,payload_sha256 text,content_sha256 text,content text,embedding text,embedding_model text,embedding_dimensions integer,PRIMARY KEY(area,card_id,step_id,locale,chunk_id));
    CREATE TABLE kids_content_approvals(level_id text,lesson_number integer,locale text,approved_sha256 text);
    CREATE TABLE technical_lesson_content(lesson_id text,locale text,source_sha256 text);
    CREATE TABLE rag_current_batches(release_id text,state text,lease_until timestamptz,provider_reserved boolean);
    CREATE TABLE academic_courses(id text,enabled boolean,assistant_enabled boolean,assistant_review_enabled boolean);
    CREATE TABLE academic_lesson_content(course_id text,lesson_id text,locale text,approved boolean,source_sha256 text,payload jsonb);
    CREATE TABLE academic_rag_chunks(course_id text,lesson_id text,locale text,section_id text,source_sha256 text,content_version text,content_sha256 text,content text,embedding text,embedding_model text,embedding_dimensions integer);
    CREATE TABLE academic_assistant_policy(course_id text PRIMARY KEY,runtime_enabled boolean DEFAULT false);`);
  for (const f of ["automatic-indexing-candidate.sql", "automatic-publication-candidate.sql", "automatic-source-events-candidate.sql"])
    await db.exec(readFileSync(`scripts/assistant/${f}`, "utf8"));
});
afterAll(async () => {
  if (db) { await db.close(); evidence.dbPath = dbPath; evidence.providerCalls = 0; }
  writeFileSync("../evidence/automation-results.json", JSON.stringify(evidence, null, 2));
});

async function rpc<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!/^assistant_auto_[a-z_]+$/.test(name) || Object.keys(args).some(k => !/^p_[a-z_]+$/.test(k))) throw new Error("invalid test RPC");
  return db.transaction(async tx => {
    await tx.exec("SET LOCAL ROLE service_role");
    const values = Object.values(args).map(v => v !== null && typeof v === "object" ? JSON.stringify(v) : v);
    const result = await tx.query<{ data: T }>(`SELECT public.${name}(${Object.keys(args).map((k,i) => `${k} => $${i+1}`).join(",")}) AS data`, values);
    return result.rows[0].data;
  });
}
async function isolatedPlan(cardId: string, count = 1): Promise<AutomaticPlan[]> {
  const plans = await automaticPlans(build, ai, [], noSources);
  const m = { ...plans[0].manifest, cardId, scopeCount: count };
  const { canonicalJson, sha256 } = await import("../../src/lib/card-assistant/corpus");
  const material = canonicalJson(m);return [{ manifest: m, material, key: await sha256(material) }];
}

it("captures approved-source metadata transactionally, deduplicates no-op updates, fences reapproval, and maps all three DB-backed areas", async () => {
  for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"])
    await db.query("INSERT INTO technical_lesson_content VALUES('T01',$1,$2)", [locale, sha]);
  const first = await rpc<Record<string,string>>("assistant_auto_source_revisions", { p_registry: registry });
  expect(Number(first["technical:local-proof"])).toBe(4);
  await db.exec("UPDATE technical_lesson_content SET source_sha256=source_sha256");
  expect(await rpc("assistant_auto_source_revisions", { p_registry: registry })).toEqual(first);
  const source = { ...noSources, technical: ["ar-EG", "ar-MSA", "ar-Gulf", "en"].map(locale => ({ lesson_id: "T01", locale, source_sha256: sha })) };
  const plans = await automaticPlans(build, ai, registry, source, first);
  await rpc("assistant_auto_register", { p_jobs: plans.map(({key,material}) => ({key,material})), p_registry: registry });
  await rpc("assistant_auto_link_sources", { p_keys: plans.map(x => x.key) });
  expect((await db.query<{state:string}>("SELECT state FROM assistant_auto_intake_status")).rows.every(r => r.state === "pending")).toBe(true);
  await db.exec("UPDATE card_assistant_policy SET runtime_enabled=true;DELETE FROM technical_lesson_content WHERE locale='en'");
  expect((await db.query<{runtime_enabled:boolean}>("SELECT runtime_enabled FROM card_assistant_policy")).rows[0].runtime_enabled).toBe(false);
  await db.query("INSERT INTO technical_lesson_content VALUES('T01','en',$1)", [sha]);
  const revised = await rpc<Record<string,string>>("assistant_auto_source_revisions", { p_registry: registry });
  expect(Number(revised["technical:local-proof"])).toBeGreaterThan(Number(first["technical:local-proof"]));
  const next = await automaticPlans(build, ai, registry, source, revised);
  expect(next[1].key).not.toBe(plans[1].key);
  await db.query("INSERT INTO kids_content_approvals VALUES('level-1',1,'en',$1)", [sha]);
  await db.exec("INSERT INTO academic_courses VALUES('AC-PROOF',true,true,false)");
  await db.query("INSERT INTO academic_lesson_content VALUES('AC-PROOF','AC-PROOF-M01-L01','en',true,$1,'{}')", [sha]);
  expect((await db.query<{area:string}>("SELECT DISTINCT area FROM assistant_auto_source_events ORDER BY area")).rows.map(r => r.area)).toEqual(["academic","kids","technical"]);
  await rpc("assistant_auto_register",{p_jobs:[{key:next[1].key,material:next[1].material}],p_registry:registry});
  await db.exec("UPDATE assistant_auto_policy SET enabled=true");
  const claim=await rpc<Record<string,unknown>>("assistant_auto_claim",{p_keys:[next[1].key],p_request:randomUUID()});
  const args={p_job:claim.jobId,p_request:claim.requestId,p_lease:claim.leaseToken};
  expect(await rpc("assistant_auto_check",args)).toBe(true);
  await db.query("INSERT INTO kids_content_approvals VALUES('unrelated',1,'en',$1)",[sha]);
  expect(await rpc("assistant_auto_check",args)).toBe(true);
  await db.exec("DELETE FROM technical_lesson_content WHERE locale='en'");
  expect(await rpc("assistant_auto_check",args)).toBe(false);
  await expect(rpc("assistant_auto_reserve",args)).rejects.toThrow("LEASE_UNAVAILABLE");
  await rpc("assistant_auto_hold",{...args,p_code:"AUTOMATION_SOURCE_CHANGED"});
  evidence.sourceEventBoundaries = "real triggers, real source event metadata, no production source approval asserted";
});

it("reconciles a committed finish whose network ACK is lost, without repeating execute or finish", async () => {
  await db.exec("UPDATE assistant_auto_policy SET enabled=true");
  const plans = await isolatedPlan("lost-ack");let executes=0, finishes=0;
  const result = await automaticTick(randomUUID(), { plans: async () => plans, registry: [],
    execute: async () => { executes++;return { proof: "bounded-fixture-executor" }; },
    rpc: async <T>(name: string,args: Record<string,unknown>) => {
      const data = await rpc<T>(name,args);
      if (name === "assistant_auto_finish") { finishes++;throw new Error("simulated response loss AFTER DB commit"); }
      return data;
    },
  });
  expect(result.progressed).toBe(true);expect(executes).toBe(1);expect(finishes).toBe(1);
  const row = (await db.query("SELECT state,next_offset FROM assistant_auto_jobs WHERE job_id=$1", [plans[0].key])).rows[0];
  expect(row).toEqual({ state: "complete", next_offset: 1 });
  const attempt = (await db.query<{request_id:string}>("SELECT request_id FROM assistant_auto_attempts WHERE job_id=$1",[plans[0].key])).rows[0];
  expect(await rpc("assistant_auto_receipt", { p_job: plans[0].key, p_request: attempt.request_id, p_offset: 0, p_receipt: { proof: "wrong" } })).toBe(false);
  evidence.lostFinishAck = { executes,finishes,realReceiptConfirmed:true };
});

it("holds an uncommitted/unknown finish and bounds provider retries at zero", async () => {
  const plans = await isolatedPlan("unknown-ack");let executes=0;
  const ports = { plans: async () => plans, registry: [], execute: async () => { executes++;return { proof:"unknown" }; },
    rpc: async <T>(name:string,args:Record<string,unknown>) => name === "assistant_auto_finish" ? false as T : rpc<T>(name,args) };
  expect((await automaticTick(randomUUID(),ports)).code).toBe("AUTOMATION_FINISH_UNCONFIRMED");
  expect((await automaticTick(randomUUID(),ports)).held).toBeGreaterThan(0);
  expect(executes).toBe(1);
  expect((await db.query("SELECT state,error_code FROM assistant_auto_jobs WHERE job_id=$1",[plans[0].key])).rows[0])
    .toEqual({ state:"held",error_code:"AUTOMATION_FINISH_UNCONFIRMED" });
});

it("allows only one concurrent claimant of one real SQL job and contains the others without provider calls", async () => {
  const plans = await isolatedPlan("concurrent-requests");let executes=0;
  const ports = { plans:async()=>plans,registry:[],rpc,execute:async()=>{executes++;await new Promise(resolve=>setTimeout(resolve,25));return {proof:"fixture"};} };
  const start=performance.now();const results=await Promise.all(Array.from({length:16},()=>automaticTick(randomUUID(),ports)));
  const durationMs=performance.now()-start;
  expect(executes).toBe(1);expect(results.filter(r=>r.progressed===true)).toHaveLength(1);
  expect(results.every(r=>r.progressed===true||r.busy===true||r.done===true)).toBe(true);
  evidence.concurrency={requests:16,executes,durationMs,requestsPerSecond:16/(durationMs/1000),boundary:"one embedded PostgreSQL process; fixture executor; not provider or site capacity"};
});

it("denies learner access to intake metadata and receipt/revision RPCs using real PostgreSQL grants", async () => {
  for (const name of ["assistant_auto_source_events","assistant_auto_intake_status"])
    await expect(db.transaction(async tx=>{await tx.exec("SET LOCAL ROLE authenticated");await tx.query(`SELECT * FROM ${name}`);})).rejects.toThrow("permission denied");
  const grants=(await db.query<{learner:boolean;anon:boolean}>(`SELECT has_function_privilege('authenticated',oid,'EXECUTE') learner,has_function_privilege('anon',oid,'EXECUTE') anon FROM pg_proc WHERE proname IN('assistant_auto_receipt','assistant_auto_source_revisions','assistant_auto_link_sources','assistant_auto_capture_source')`)).rows;
  expect(grants).toHaveLength(4);expect(grants.every(x=>!x.learner&&!x.anon)).toBe(true);
  evidence.privilegeChecks="real embedded PostgreSQL grants; no deployed parity or app-auth claim";
});

it("retains real queue attempts and source-event states after closing and reopening the on-disk local database",async()=>{
  const before=(await db.query<{n:number}>("SELECT count(*)::int n FROM assistant_auto_attempts")).rows[0].n;
  expect(before).toBeGreaterThan(0);
  await db.close();db=new PGlite(dbPath);
  expect((await db.query<{n:number}>("SELECT count(*)::int n FROM assistant_auto_attempts")).rows[0].n).toBe(before);
  const states=(await db.query<{state:string}>("SELECT DISTINCT state FROM assistant_auto_jobs ORDER BY state")).rows.map(r=>r.state);
  expect(states).toContain("complete");expect(states).toContain("held");
  evidence.persistence={closedAndReopened:true,attempts:before,queueStates:states,scope:"local on-disk PostgreSQL queue only; not learner history or remote durability"};
});
