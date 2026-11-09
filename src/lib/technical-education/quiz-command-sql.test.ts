import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {beforeAll,afterAll,it,expect} from 'vitest';

const db=new PGlite();
const readSql = (file: string) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const technical=readSql('supabase/migrations/20261005100000_technical_education_integration.sql');
const learning=readSql('drizzle/migrations/0031_student_learning_records.sql');
const free=readSql('drizzle/migrations/0026_assistant_source_events_and_free_access.sql');
function fn(text:string,prefix:string){const a=text.indexOf(prefix);if(a<0)throw Error('Missing source function '+prefix);return text.slice(a,text.indexOf('END $$;',a)+7);}
function table(text:string,name:string){const a=text.indexOf('CREATE TABLE '+name+' ');const b=text.indexOf('CREATE TABLE '+name+'(');const start=a<0?b:a;if(start<0)throw Error('Missing source table '+name);return text.slice(start,text.indexOf(';',start)+1);}
async function rows<T=Record<string,unknown>>(sql:string,args:any[]=[]){return (await db.query<T>(sql,args)).rows;}
async function call(action:string,lesson:string,data:any={},locale='en'){return (await rows<{r:any}>('SELECT public.technical_command($1,$2,$3,$4::jsonb) AS r',[action,lesson,locale,data]))[0]!.r;}
function intent(revision:number,answers:any={q:0},extra:any={}){return {answers,_technicalCommand:{requestId:randomUUID(),actorId:A,expectedRevision:revision,...extra}};}
async function progress(lesson:string){return (await rows<any>('SELECT * FROM public.technical_progress WHERE user_id=$1 AND lesson_id=$2',[A,lesson]))[0]??null;}
let previousBody='',freeBody='',changedBaseRefused=false;
beforeAll(async()=>{
 await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA billing;CREATE SCHEMA learning_private;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,allowed boolean NOT NULL DEFAULT true);
 CREATE TABLE public.kids_profiles(id uuid PRIMARY KEY,parent_id uuid);
 INSERT INTO auth.users(id) VALUES('${A}'),('${B}');
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION billing.commerce_account_allowed(u uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT coalesce((SELECT allowed FROM auth.users WHERE id=u),false)$$;
 CREATE FUNCTION billing.commercial_account_allowed(u uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT billing.commerce_account_allowed(u)$$;
 CREATE FUNCTION billing.commerce_assert_identity(u uuid) RETURNS text LANGUAGE plpgsql AS $$BEGIN IF NOT billing.commerce_account_allowed(u) THEN RAISE EXCEPTION 'COMMERCE_ACCOUNT_UNAVAILABLE'; END IF;RETURN 'synthetic'; END$$;
 CREATE FUNCTION public.has_role(u uuid,r text) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT false$$;
 CREATE TYPE public.app_role AS ENUM('admin');
 CREATE FUNCTION public.has_role(u uuid,r public.app_role) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT false$$;
 CREATE TABLE billing.commerce_control(access_enabled boolean);INSERT INTO billing.commerce_control VALUES(true);
 CREATE TABLE billing.commerce_entitlements(user_id uuid,package text,revoked_at timestamptz,starts_at timestamptz,ends_at timestamptz);
 INSERT INTO billing.commerce_entitlements VALUES('${A}','technical',NULL,now()-interval '1day',now()+interval '1day'),('${B}','technical',NULL,now()-interval '1day',now()+interval '1day');`);
 const policy=readSql('drizzle/migrations/0027_commercial_policy_20261102.sql');await db.exec(fn(policy,'CREATE FUNCTION billing.commercial_lock('));
 for(const name of ['public.technical_release_control','public.technical_lesson_content','public.technical_progress','public.technical_asset_manifest','billing.technical_stripe_subscriptions'])await db.exec(table(technical,name));
 await db.exec('INSERT INTO public.technical_release_control VALUES(true,true)');
 for(let n=1;n<=30;n++)for(const locale of ['en','ar-EG'])await db.query(`INSERT INTO public.technical_lesson_content VALUES($1,$2,'lesson',$3::jsonb,'00000000-0000-4000-8000-000000000000',$4)`,[`M99-L${String(n).padStart(2,'0')}`,locale,JSON.stringify({quiz:[{id:'q',options:['Synthetic correct','Synthetic incorrect'],correct:0}],assignment:{fields:['Synthetic field']}}),'a'.repeat(64)]);
 // Actual source access function; account/lifecycle foundations above are
 // explicitly synthetic adapters, not an Auth/RLS or current-rights proof.
 const ac=technical.indexOf('CREATE FUNCTION public.technical_can_access(');await db.exec(technical.slice(ac,technical.indexOf('$$;',ac)+3));
 for(const name of ['learning_private.courses','learning_private.events','learning_private.commands'])await db.exec(table(learning,name));
 await db.exec(fn(learning,'CREATE FUNCTION learning_private.record('));
 await db.exec(fn(learning,'CREATE FUNCTION learning_private.capture('));
 await db.exec('CREATE TRIGGER learning_record_capture AFTER INSERT OR UPDATE ON public.technical_progress FOR EACH ROW EXECUTE FUNCTION learning_private.capture()');
 const core=fn(technical,'CREATE FUNCTION public.technical_command(');await db.exec(core.replace('public.technical_command(','billing.free_window_previous_technical_command('));
 await db.exec(`CREATE FUNCTION billing.free_window_previous_technical_access(l text) RETURNS boolean LANGUAGE sql AS $$SELECT public.technical_can_access(l)$$;CREATE FUNCTION billing.free_window_tag_delivery(r jsonb,k text) RETURNS jsonb LANGUAGE sql AS $$SELECT r||jsonb_build_object('fixtureTag',k)$$;`);
 await db.exec(fn(free,'CREATE OR REPLACE FUNCTION public.technical_command('));
 await db.exec('ALTER FUNCTION public.technical_command(text,text,text,jsonb) RENAME TO learning_previous_technical_command');
 await db.exec(fn(learning,'CREATE FUNCTION public.technical_command('));
 previousBody=(await rows<any>("SELECT prosrc FROM pg_proc WHERE oid='public.learning_previous_technical_command(text,text,text,jsonb)'::regprocedure"))[0].prosrc;
 freeBody=(await rows<any>("SELECT prosrc FROM pg_proc WHERE oid='public.technical_command(text,text,text,jsonb)'::regprocedure"))[0].prosrc;
 const migrationSql=readSql('drizzle/migrations/0053_cloud_technical_quiz_command_ordering.sql');
 await db.exec(core.replace('CREATE FUNCTION public.technical_command(','CREATE OR REPLACE FUNCTION billing.free_window_previous_technical_command(').replace('DECLARE u uuid','DECLARE /* unexpected definition */ u uuid'));
 try {await db.exec(migrationSql);}catch(error){changedBaseRefused=String(error).includes('BASE_DEFINITION_CHANGED');await db.exec('ROLLBACK');}
 expect(changedBaseRefused).toBe(true);expect((await rows<any>("SELECT column_name FROM information_schema.columns WHERE table_name='technical_progress' AND column_name='quiz_revision'")).length).toBe(0);
 await db.exec(core.replace('CREATE FUNCTION public.technical_command(','CREATE OR REPLACE FUNCTION billing.free_window_previous_technical_command('));await db.exec(migrationSql);
 await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[A]);
},30000);
afterAll(()=>db.close());

it('changed installed base definition is refused before any migration effect',()=>{expect(changedBaseRefused).toBe(true);});

it('preserves both installed free-window and learning wrapper bodies',async()=>{
 expect((await rows<any>("SELECT prosrc FROM pg_proc WHERE oid='public.learning_previous_technical_command(text,text,text,jsonb)'::regprocedure"))[0].prosrc).toBe(previousBody);
 expect((await rows<any>("SELECT prosrc FROM pg_proc WHERE oid='public.technical_command_before_quiz_ordering(text,text,text,jsonb)'::regprocedure"))[0].prosrc).toBe(freeBody);
});
it('accepts published-client writes until the learner and lesson use a versioned command', async () => {
 const lessonId = 'M99-L01';
 await expect(call('reset_quiz', lessonId)).resolves.toMatchObject({ allowed: true });
 expect(await progress(lessonId)).toMatchObject({ quiz_revision: 1, quiz_passed: false });

 await expect(call('quiz', lessonId, intent(1))).resolves.toMatchObject({
  passed: true,
  command: { currentRevision: 2 },
 });
 const acceptedProgress = await progress(lessonId);
 await expect(call('reset_quiz', lessonId)).rejects.toThrow(/COMMAND_REQUIRED/);
 await expect(call('reset_quiz', lessonId, { _technicalCommand: null })).rejects.toThrow(/COMMAND_REQUIRED/);
 expect(await progress(lessonId)).toEqual(acceptedProgress);
});
it.each([{expectedRevision:-1},{expectedRevision:'0'},{expectedRevision:0.5},{expectedRevision:9007199254740992},{requestId:'not-uuid'},{extraField:true}])('rejects malformed command %j before mutation',async(change)=>{await expect(call('quiz','M99-L02',intent(0,{q:0},change))).rejects.toThrow(/COMMAND_INVALID/);expect(await progress('M99-L02')).toBeNull();});
it('wrong actor is refused before any command or progress write',async()=>{await expect(call('quiz','M99-L03',intent(0,{q:0},{actorId:B}))).rejects.toThrow(/ACTOR_MISMATCH/);expect(await progress('M99-L03')).toBeNull();});
it('quiz increments revision once and exact replay writes no duplicate event',async()=>{
 const x=intent(0),r=await call('quiz','M99-L04',x);expect(r).toMatchObject({passed:true,command:{appliedRevision:1,currentRevision:1,replayed:false}});
 const before=await rows<any>("SELECT origin,kind FROM learning_private.events WHERE lesson='M99-L04'");expect(before.filter(x=>x.origin==='technical_command'&&x.kind==='quiz')).toHaveLength(1);expect(before.filter(x=>x.origin==='technical_progress')).toHaveLength(2); // initial insert plus original quiz UPDATE, no revision-only UPDATE
 expect(await call('quiz','M99-L04',x)).toMatchObject({passed:true,command:{appliedRevision:1,currentRevision:1,replayed:true}});expect(await rows("SELECT origin,kind FROM learning_private.events WHERE lesson='M99-L04'")).toEqual(before);
 await expect(call('reset_quiz','M99-L04',intent(0))).rejects.toThrow(/COMMAND_CONFLICT/);expect((await progress('M99-L04')).quiz_passed).toBe(true);
});
it('historical replay reports current revision without reapplying an earlier grade',async()=>{
 const x=intent(0);await call('quiz','M99-L05',x);await call('reset_quiz','M99-L05',intent(1));await call('quiz','M99-L05',intent(2,{q:1}));
 const before=await progress('M99-L05');expect(before.quiz_passed).toBe(false);expect(await call('quiz','M99-L05',x)).toMatchObject({passed:true,command:{appliedRevision:1,currentRevision:3,replayed:true}});expect(await progress('M99-L05')).toEqual(before);
});
it('same UUID changed answers or another command namespace cannot mutate',async()=>{
 const x=intent(0);await call('quiz','M99-L06',x);await expect(call('quiz','M99-L06',{...x,answers:{q:1}})).rejects.toThrow(/REQUEST_MISMATCH/);
 const y=intent(0);await db.query("INSERT INTO learning_private.commands(account_id,request_id,fingerprint,result) VALUES($1,$2,'{\"action\":\"note\"}','{}')",[A,y._technicalCommand.requestId]);await expect(call('quiz','M99-L07',y)).rejects.toThrow(/REQUEST_MISMATCH/);expect(await progress('M99-L07')).toBeNull();
});
it('failed grading rolls back initial source capture and command writes together',async()=>{
 const x=intent(0,{});await expect(call('quiz','M99-L08',x)).rejects.toThrow(/INCOMPLETE_QUIZ/);expect(await progress('M99-L08')).toBeNull();expect(await rows("SELECT id FROM learning_private.events WHERE lesson='M99-L08'")).toEqual([]);expect(await rows('SELECT request_id FROM learning_private.commands WHERE request_id=$1',[x._technicalCommand.requestId])).toEqual([]);
});
it('current access, release and identity are checked before historical replay',async()=>{
 const x=intent(0);await call('quiz','M99-L09',x);
 await db.exec('UPDATE public.technical_release_control SET enabled=false');await expect(call('quiz','M99-L09',x)).rejects.toThrow(/TECHNICAL_UNAVAILABLE/);await db.exec('UPDATE public.technical_release_control SET enabled=true');
 await db.query('UPDATE billing.commerce_entitlements SET revoked_at=now() WHERE user_id=$1',[A]);expect(await call('quiz','M99-L09',x)).toEqual({allowed:false});await db.query('UPDATE billing.commerce_entitlements SET revoked_at=NULL WHERE user_id=$1',[A]);
 await db.query('UPDATE auth.users SET allowed=false WHERE id=$1',[A]);await expect(call('quiz','M99-L09',x)).rejects.toThrow(/ACCOUNT_UNAVAILABLE/);await db.query('UPDATE auth.users SET allowed=true WHERE id=$1',[A]);
 await expect(call('quiz','M99-L09',x,'invalid')).rejects.toThrow(/INVALID_LOCALE/);
});
it('read and practice preserve quiz revision and shared locale scope rejects stale reset',async()=>{
 await call('quiz','M99-L10',intent(0));await call('read','M99-L10');await call('practice','M99-L10',{values:['Synthetic answer'],criteria:[true,true,true]});const p=await progress('M99-L10');expect(p).toMatchObject({read:true,quiz_passed:true,practice_reviewed:true,quiz_revision:1});
 await expect(call('reset_quiz','M99-L10',intent(0),'ar-EG')).rejects.toThrow(/COMMAND_CONFLICT/);expect((await call('status','M99-L10')).progress['M99-L10'].quizRevision).toBe(1);
});
it('confirmed absence is version0 and a wrong initial version never creates a row',async()=>{await expect(call('quiz','M99-L11',intent(1))).rejects.toThrow(/COMMAND_CONFLICT/);expect(await progress('M99-L11')).toBeNull();expect((await call('quiz','M99-L11',intent(0))).command.currentRevision).toBe(1);});
it('private pre-version delegates are not callable by authenticated users',async()=>{
 await db.exec('GRANT USAGE ON SCHEMA public,billing,auth TO authenticated');await db.exec('SET ROLE authenticated');
 try{for(const f of ['public.technical_command_before_quiz_ordering','public.learning_previous_technical_command','billing.free_window_previous_technical_command'])await expect(rows(`SELECT ${f}('reset_quiz','M99-L10','en','{}')`)).rejects.toThrow(/permission denied/);}finally{await db.exec('RESET ROLE');}
});
