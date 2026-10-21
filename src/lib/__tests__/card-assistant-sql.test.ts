// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { readFileSync } from "node:fs";
import { CARD_REGISTRY } from "../card-assistant/registry";
import { sourceChunks, type SourceDocument } from "../card-assistant/corpus";

const user = "11111111-1111-4111-8111-111111111111", child = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(`CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions;
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE SCHEMA billing;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email_confirmed_at timestamptz);
    INSERT INTO auth.users VALUES('${user}',now());
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${user}'::uuid $$;
    CREATE TYPE public.app_role AS ENUM('admin');
    CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION billing.commerce_account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE public.kids_content_approvals(level_id text,lesson_number integer,locale text,approved_sha256 text,PRIMARY KEY(level_id,lesson_number,locale));
    CREATE TABLE public.technical_lesson_content(lesson_id text,locale text,source_sha256 text,payload jsonb,PRIMARY KEY(lesson_id,locale));
    CREATE TABLE public.fixture_permissions(product text,step text,profile uuid,allowed boolean);
    CREATE FUNCTION public.kids_can_access_lesson(requested_profile uuid,requested_level text,requested_lesson integer,requested_locale text)
    RETURNS boolean LANGUAGE sql AS $$ SELECT requested_locale='en' AND EXISTS(SELECT 1 FROM public.fixture_permissions
      WHERE product='kids' AND step=requested_level||':'||requested_lesson AND profile=requested_profile AND allowed)
      AND EXISTS(SELECT 1 FROM public.kids_content_approvals WHERE level_id=requested_level AND lesson_number=requested_lesson AND locale=requested_locale) $$;
    CREATE FUNCTION public.technical_can_access(p_lesson text) RETURNS boolean LANGUAGE sql AS $$ SELECT EXISTS(SELECT 1 FROM public.fixture_permissions
      WHERE product='technical' AND step=p_lesson AND allowed) $$;
    CREATE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text)
    RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
      IF p_lease_token<>'55555555-5555-4555-8555-555555555555'::uuid THEN RAISE EXCEPTION 'BAD_LEASE'; END IF;
      IF EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.column_name='user_id'
        AND c.table_name NOT IN ('lesson_progress')) THEN RAISE EXCEPTION 'LC09_UNCLASSIFIED_USER_TABLE'; END IF;
      RETURN jsonb_build_object('stage',p_next_stage);
    END $$;`);
  await db.exec(readFileSync(new URL("../../../scripts/card-assistant/assistant-candidate.sql", import.meta.url), "utf8"));
  await db.exec(readFileSync(new URL("../../../scripts/card-assistant/assistant-registry-seed.sql", import.meta.url), "utf8"));
}, 60000);
afterAll(async () => { await db?.close(); });

describe("candidate SQL executed only in isolated PGlite", () => {
  it("registry seed equals canonical registry and starts disabled", async () => {
    const result = await db.query<{area:string;card_id:string;step_id:string;station_id:string;preview:boolean}>("SELECT area,card_id,step_id,station_id,preview FROM card_assistant_steps ORDER BY area,card_id,step_id");
    const expected = CARD_REGISTRY.flatMap(card => card.steps.map(step => ({ area: card.area, card_id: card.id, step_id: step.id,
      station_id: step.stationId, preview: step.preview }))).sort((a,b) => `${a.area}:${a.card_id}:${a.step_id}`.localeCompare(`${b.area}:${b.card_id}:${b.step_id}`, "en"));
    expect(result.rows).toEqual(expected);
    expect((await db.query("SELECT * FROM card_assistant_policy WHERE runtime_enabled")).rows).toHaveLength(0);
    await expect(db.exec("INSERT INTO card_assistant_steps SELECT area,card_id,'duplicate',station_id,source_key,preview,kids_level,kids_lesson,technical_lesson FROM card_assistant_steps LIMIT 1")).rejects.toThrow();
  });
  it("blocks previews, uses exact child/admin profile and locale, and never borrows a Technical grant", async () => {
    await db.exec(`UPDATE card_assistant_policy SET runtime_enabled=true;
      INSERT INTO kids_content_approvals VALUES('level-1',1,'en',repeat('a',64)),('level-1',3,'en',repeat('a',64));
      INSERT INTO fixture_permissions VALUES('kids','level-1:1','${child}',true),('technical','M01-L02',NULL,true);`);
    const access = async (profile: string, locale = "en") => (await db.query<{allowed:boolean}>(
      "SELECT card_assistant_access('kids','level-1','1',$1,$2) allowed", [locale,profile])).rows[0].allowed;
    expect(await access(child)).toBe(false);
    await db.exec(`INSERT INTO fixture_permissions VALUES('kids','level-1:3','${child}',true);`);
    expect(await access(child)).toBe(true);
    expect(await access(user)).toBe(false);
    expect(await access(child, "ar-EG")).toBe(false);
    await db.exec(`INSERT INTO fixture_permissions VALUES('kids','level-1:1','${user}',true),('kids','level-1:3','${user}',true);`);
    expect(await access(user)).toBe(true);
  });
  it("enforces operational limits and idempotency without billing records", async () => {
    await db.exec("UPDATE card_assistant_policy SET questions_per_hour=1 WHERE area='kids' AND card_id='level-1'");
    const take = async (id: string) => (await db.query<{allowed:boolean}>(
      "SELECT card_assistant_take_question('kids','level-1','1','en',$1,$2) allowed", [child,id])).rows[0].allowed;
    expect(await take("33333333-3333-4333-8333-333333333333")).toBe(true);
    expect(await take("33333333-3333-4333-8333-333333333333")).toBe(false);
    expect(await take("44444444-4444-4444-8444-444444444444")).toBe(false);
  });
  it("atomically replaces complete source scopes, excludes changed approvals, and preserves other scopes", async () => {
    const s: SourceDocument = { area:"kids",cardId:"level-1",stepId:"3",locale:"en",sourceSha256:"a".repeat(64),kind:"kids",
      payload:{locale:"en",title:"Lesson",reading:[{title:"First",text:"First source"},{title:"Second",text:"Second source"}]} };
    const chunks = await sourceChunks(s);
    const embedding = JSON.stringify(Array.from({length:1536},(_,i)=>i?0:1));
    const sync = async (rows: typeof chunks, sha = s.sourceSha256) => db.query("SELECT card_assistant_sync_source('kids','level-1','3','en',$1,$2,$3,$4)",
      [sha,rows[0]?.payloadSha256 ?? null,s.payload,rows.map(c=>({...c,sourceSha256:sha,embedding,embeddingModel:"text-embedding-3-small",embeddingDimensions:1536}))]);
    await sync(chunks);
    const retrieve = async () => (await db.query<{result:unknown[]}>("SELECT card_assistant_match('kids','level-1','en',$1,6) result",[embedding])).rows[0].result;
    expect(await retrieve()).toHaveLength(2);
    await sync([chunks[0]]);
    expect(await retrieve()).toHaveLength(1);
    await db.exec("UPDATE kids_content_approvals SET approved_sha256=repeat('b',64) WHERE level_id='level-1' AND lesson_number=3");
    expect(await retrieve()).toHaveLength(0);
    await expect(sync(chunks)).rejects.toThrow("CARD_SOURCE_CHANGED");
    expect((await db.query("SELECT * FROM card_assistant_chunks")).rows).toHaveLength(1);
    await db.exec("DELETE FROM kids_content_approvals WHERE level_id='level-1' AND lesson_number=3");
    await db.query("SELECT card_assistant_sync_source('kids','level-1','3','en',NULL,NULL,NULL,'[]')");
    expect((await db.query("SELECT * FROM card_assistant_chunks")).rows).toHaveLength(0);
  });
  it("has no direct learner access to private source/vector functions", async () => {
    const result = await db.query<{allowed:boolean}>(`SELECT has_function_privilege('authenticated',
      'public.card_assistant_match(text,text,text,extensions.vector,integer)','EXECUTE') allowed`);
    expect(result.rows[0].allowed).toBe(false);
    expect((await db.query<{allowed:boolean}>("SELECT has_table_privilege('authenticated','card_assistant_chunks','SELECT') allowed")).rows[0].allowed).toBe(false);
  });
  it("classifies operational windows in LC09 and preserves lease validation before erasure", async () => {
    expect((await db.query("SELECT * FROM card_assistant_question_windows")).rows).toHaveLength(1);
    await expect(db.query("SELECT lc09_advance_deletion($1,$2,'learner_erased')",[user,child])).rejects.toThrow("BAD_LEASE");
    expect((await db.query("SELECT * FROM card_assistant_question_windows")).rows).toHaveLength(1);
    const result = await db.query<{result:{stage:string}}>("SELECT lc09_advance_deletion($1,'55555555-5555-4555-8555-555555555555','learner_erased') result",[user]);
    expect(result.rows[0].result).toEqual({stage:"learner_erased"});
    expect((await db.query("SELECT * FROM card_assistant_question_windows")).rows).toHaveLength(0);
    expect((await db.query<{allowed:boolean}>("SELECT has_function_privilege('authenticated','public.card_assistant_previous_advance(uuid,uuid,text)','EXECUTE') allowed")).rows[0].allowed).toBe(false);
  });
});
