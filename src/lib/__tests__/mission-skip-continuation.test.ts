import { PGlite } from "@electric-sql/pglite";
import { readFileSync,readdirSync } from "node:fs";
import assert from "node:assert/strict";
import { it, expect, vi } from "vitest";
const source = (prefix:string) => readFileSync("supabase/migrations/"+readdirSync("supabase/migrations").find(n=>n.startsWith(prefix)),"utf8").replace(/\r\n/g,"\n");
it("actual skip migration preserves grading and continuation across source-trigger scenarios",async()=>{
 const db = new PGlite(); const cases:Array<{name:string;status:string;error?:string}>=[];
 const bootstrapUser = (await db.query<{name:string}>("SELECT session_user AS name")).rows[0]!.name;
 const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
 async function owner(){await db.exec('SET SESSION AUTHORIZATION '+JSON.stringify(bootstrapUser));}
 async function actor(){await db.exec('SET SESSION AUTHORIZATION authenticated');}
 async function run(name:string,fn:()=>Promise<void>){try{await fn();cases.push({name,status:"passed"});}catch(error){cases.push({name,status:"failed",error:String(error)});}finally{await owner();}}
 async function skip(m:string,l=m+'-lesson'){return (await db.query<{r:Record<string,any>}>("SELECT to_jsonb(public.skip_mission_for_user($1,$2)) AS r",[m,l])).rows[0]!.r;}
 async function row(id:string){return (await db.query<{r:Record<string,any>}>("SELECT to_jsonb(m) AS r FROM public.mission_submissions m WHERE id=$1",[id])).rows[0]?.r;}
 async function seed(m:string,status='needs_revision',user=a,meta:Record<string,unknown>={nextStep:'Original feedback'}){await owner();return (await db.query<{id:string}>(`INSERT INTO public.mission_submissions(user_id,mission_id,lesson_id,status,score,feedback,evaluated_at,attempt_count,submission_text,submission_metadata) VALUES($1,$2,$3,$4,42,'Actual stored feedback',now(),2,'Original learner answer',$5) RETURNING id`,[user,m,m+'-lesson',status,meta])).rows[0]!.id;}
 try {
await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT CASE WHEN session_user='authenticated' THEN '${a}'::uuid ELSE NULL::uuid END $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT session_user::text $$;
GRANT USAGE ON SCHEMA auth,public TO authenticated,anon;`);
await db.exec(source('20260509012347').slice(source('20260509012347').indexOf('CREATE OR REPLACE FUNCTION public.update_updated_at_column()')).split('CREATE TRIGGER')[0]);
await db.exec(source('20260512122051'));
await db.exec('GRANT SELECT,INSERT,UPDATE,DELETE ON public.mission_submissions TO authenticated');
await db.exec(source('20260526105950').split('-- ============================================================\n-- 2.')[0]);
await db.exec(source('20260526110507'));
await db.exec(source('20260603211928'));
await db.exec(source('20260706133000').split('\n').filter(l=>l.includes('skip_mission_for_user')||l.includes('submit_mission_for_evaluation')).join('\n'));
await run('original existing owned graded submission refuses skip at protected-column trigger',async()=>{const id=await seed('old-existing');const before=(await row(id))!;await actor();await assert.rejects(skip('old-existing'),/admin-controlled columns/);await owner();assert.deepEqual(await row(id),before);});
await run('original fresh skip returns draft marker not passed; current passed-only gate misses it',async()=>{await actor();const r=await skip('old-fresh');assert.equal(r.status,'draft');assert.equal(r.score,null);assert.equal(r.feedback,null);assert.equal(r.evaluated_at,null);assert.equal(r.submission_metadata.skipped,true);const q=await db.query("SELECT id FROM public.mission_submissions WHERE user_id=$1 AND mission_id='old-fresh' AND status='passed'",[a]);assert.equal(q.rows.length,0);});
await run('original repeating fresh skip fails after insert succeeded',async()=>{await actor();await assert.rejects(skip('old-fresh'),/admin-controlled columns/);});
await run('original skip against other owner creates only caller draft and does not alter other row',async()=>{const id=await seed('other-owner','needs_revision',b);const before=(await row(id))!;await actor();const r=await skip('other-owner');assert.equal(r.user_id,a);assert.notEqual(r.id,id);await owner();assert.deepEqual(await row(id),before);});
await db.exec(readFileSync('drizzle/migrations/0052_cloud_mission_skip_continuation.sql','utf8'));
await run('proposal fresh marker permits navigation but never educational pass',async()=>{await actor();const r=await skip('new-fresh');assert.equal(r.status,'draft');assert.equal(r.score,null);assert.equal(r.attempt_count,0);assert.equal(r.submission_metadata.skipped,true);assert.equal(String(r.status)==='passed'&&!r.submission_metadata.skipped,false);assert.equal(r.submission_metadata.skipped===true,true);});
await run('proposal repeat marker is a byte-for-byte no-op',async()=>{await actor();const before=await skip('new-fresh');const after=await skip('new-fresh');assert.deepEqual(after,before);});
await run('proposal preserves existing evaluated row and creates separate marker',async()=>{const id=await seed('new-existing');const before=(await row(id))!;await actor();const r=await skip('new-existing');assert.notEqual(r.id,id);await owner();assert.deepEqual(await row(id),before);});
await run('proposal actual passed row is untouched and no marker is added',async()=>{const id=await seed('new-passed','passed');const before=(await row(id))!;await actor();const r=await skip('new-passed');assert.deepEqual(r,before);assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM public.mission_submissions WHERE mission_id='new-passed'")).rows[0].n,1);});
await run('proposal evaluating claim timestamp is preserved and conditional completion succeeds',async()=>{const id=await seed('new-evaluating','evaluating',a,{claim:'active'});const before=(await row(id))!;await actor();const marker=await skip('new-evaluating');await owner();assert.deepEqual(await row(id),before);const done=await db.query("UPDATE public.mission_submissions SET status='passed',score=88,submission_metadata='{}' WHERE id=$1 AND status='evaluating' AND updated_at=$2 RETURNING id",[id,before.updated_at]);assert.equal(done.rows.length,1);assert.equal((await row(marker.id))!.submission_metadata.skipped,true);});
await run('proposal skip before resubmit keeps a durable separate marker through evaluation',async()=>{const id=await seed('new-retry');await actor();const marker=await skip('new-retry');await db.query('SELECT public.submit_mission_for_evaluation($1)',[id]);await owner();await db.query("UPDATE public.mission_submissions SET status='evaluating' WHERE id=$1",[id]);await db.query("UPDATE public.mission_submissions SET status='needs_revision',submission_metadata='{}' WHERE id=$1",[id]);assert.equal((await row(marker.id))!.submission_metadata.skipped,true);});
await run('proposal other-owner and same-mission different-lesson rows remain untouched',async()=>{const id=await seed('new-owner','needs_revision',b);const before=(await row(id))!;await actor();const x=await skip('new-owner');const y=await skip('new-owner','different-lesson');assert.equal(x.user_id,a);assert.notEqual(x.id,y.id);await owner();assert.deepEqual(await row(id),before);});
await run('proposal reuses legacy fresh-skip marker without rewriting it',async()=>{await actor();const original=(await db.query<{r:Record<string,unknown>}>("SELECT to_jsonb(m) AS r FROM public.mission_submissions m WHERE mission_id='old-fresh'")).rows[0].r;assert.deepEqual(await skip('old-fresh'),original);});
await run('proposal leaves direct authenticated grade/status protection intact',async()=>{const id=await seed('protected');await actor();await assert.rejects(db.query('UPDATE public.mission_submissions SET score=100 WHERE id=$1',[id]),/admin-controlled columns/);await assert.rejects(db.query("UPDATE public.mission_submissions SET status='passed' WHERE id=$1",[id]),/Not allowed to set status/);});
await run('proposal anon execute remains revoked and owner without actor is refused',async()=>{await db.exec('SET SESSION AUTHORIZATION anon');await assert.rejects(skip('anon'),/permission denied/);await owner();await assert.rejects(skip('owner-no-actor'),/Not authenticated/);});
await run('proposal invalid mission or lesson refuses before insertion',async()=>{await actor();await assert.rejects(skip('', 'l'),/Invalid/);await assert.rejects(skip('m',''),/Invalid/);});

 await run("actual submit RPC refuses an owned skip marker without changing it",async()=>{await actor();const marker=await skip('submit-marker');await assert.rejects(db.query('SELECT public.submit_mission_for_evaluation($1)',[marker.id]),/not found or not owned/);await owner();assert.deepEqual(await row(marker.id),marker);});
 expect(cases.filter(c=>c.status==='failed'),JSON.stringify(cases)).toEqual([]);
 expect(cases).toHaveLength(16);
 }finally{await owner();await db.close();}
},30000);

const mocks=vi.hoisted(()=>({rpc:vi.fn(),rate:vi.fn()}));
vi.mock("@tanstack/react-start",()=>({createServerFn:()=>{const q:any={};let validate=(x:unknown)=>x;q.middleware=()=>q;q.inputValidator=(v:typeof validate)=>{validate=v;return q;};q.handler=(fn:any)=>(args:any)=>fn({...args,data:validate(args.data)});return q;}}));
vi.mock("@/integrations/supabase/auth-middleware",()=>({requireSupabaseAuth:{}}));
vi.mock("@/lib/rate-limit.server",()=>({enforceRateLimit:mocks.rate}));
import {skipMissionServer} from "@/lib/mission-skip.functions";
const callSkip=skipMissionServer as unknown as (args:any)=>Promise<{id:string;outcome:string}>;
it.each([
 {name:"marker",row:{id:"marker",status:"draft",submission_metadata:{skipped:true}},outcome:"skipped"},
 {name:"actual pass",row:{id:"pass",status:"passed",submission_metadata:{}},outcome:"already-passed"},
 {name:"legacy marker",row:{id:"legacy",status:"passed",submission_metadata:{skipped:true}},outcome:"skipped"},
])("server returns truthful $name outcome",async({row,outcome})=>{
 mocks.rpc.mockResolvedValue({data:{user_id:"actor",mission_id:"mission",lesson_id:"lesson",...row},error:null});
 expect(await callSkip({data:{missionId:"mission",lessonId:"lesson"},context:{userId:"actor",supabase:{rpc:mocks.rpc}}})).toEqual({id:row.id,outcome});
});
it.each([{user_id:"other"},{mission_id:"other"},{lesson_id:"other"},{status:"draft",submission_metadata:{}},{id:undefined}])("server refuses mismatched or non-marker RPC result %j",async(change)=>{
 mocks.rpc.mockResolvedValue({data:{id:"marker",user_id:"actor",mission_id:"mission",lesson_id:"lesson",status:"draft",submission_metadata:{skipped:true},...change},error:null});
 await expect(callSkip({data:{missionId:"mission",lessonId:"lesson"},context:{userId:"actor",supabase:{rpc:mocks.rpc}}})).rejects.toThrow();
});
