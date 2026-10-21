// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { buildCurrentAiRelease, loadCurrentAiSources } from '../rag/current-source-release';
import { validateCurrentRelease } from '../rag/current-release/corpus';
import { executeCurrentRelease } from '../rag/current-release/executor.server';
import { confirmationFor, type CurrentOperation } from '../rag/current-release/contracts';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../..');
const sources=loadCurrentAiSources(root);const lesson=sources[0].record.lessonId;
const generated=buildCurrentAiRelease(sources.filter(s=>s.record.lessonId===lesson));
const corpus=validateCurrentRelease(generated.approval,generated.chunks),release=corpus.approval.releaseId;
const version=corpus.approval.indexVersion;
const vec=()=>Array(1536).fill(0.25);
let db:PGlite;let executionId:string;let providerCalls:number;
beforeAll(async()=>{
 db=new PGlite({extensions:{vector}});
 await db.exec(`CREATE SCHEMA extensions;CREATE EXTENSION vector WITH SCHEMA extensions;
 CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE FUNCTION public.rag_require_service_role() RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_role required';END IF;END $$;
 CREATE FUNCTION extensions.digest(bytea,text) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$ SELECT sha256($1) $$;
 CREATE TABLE public.rag_index_versions(version_key text PRIMARY KEY,source_sha text,status text,package_count integer,
 chunk_count integer,chunk_manifest_checksum text,embedding_model text,activated_at timestamptz,superseded_at timestamptz);
 CREATE UNIQUE INDEX one_active ON public.rag_index_versions(status) WHERE status='active';
 CREATE TABLE public.knowledge_chunks(source_type text,source_id text,path_id text,module_id text,lesson_id text,title text,
 content text,metadata jsonb,embedding extensions.vector(1536),locale text,package_path text,source_sha text,package_checksum text,
 chunk_checksum text,content_version text,index_version text,index_state text,section_index integer,section_role text,
 chunk_position integer,content_type text,production_route text,indexing_failed boolean);
 CREATE UNIQUE INDEX chunk_identity ON public.knowledge_chunks(index_version,source_id);
 GRANT USAGE ON SCHEMA public,extensions TO service_role;`);
 await db.exec(readFileSync(path.join(root,'scripts/rag/current-release-candidate.sql'),'utf8'));
 await db.exec(readFileSync(path.join(root,'scripts/rag/incremental-embedding-reuse-candidate.sql'),'utf8'));
},60000);
afterAll(async()=>{await db?.close()});
beforeEach(async()=>{
 await db.exec('RESET ROLE;TRUNCATE rag_current_requests,rag_current_batches,rag_current_releases,knowledge_chunks,rag_index_versions;');
 providerCalls=0;executionId='';
});
async function rpc(name:string,args:Record<string,unknown>){
 const params=Object.values(args);const keys=Object.keys(args);
 await db.exec('SET ROLE service_role');
 try{return (await db.query<{result:unknown}>(`SELECT public.${name}(${keys.map((k,i)=>`${k} => $${i+1}`).join(',')}) result`,
  params.map(v=>v!==null&&typeof v==='object'?JSON.stringify(v):v))).rows[0].result;}
 finally{await db.exec('RESET ROLE');}
}
async function run(operation:CurrentOperation,extra:Record<string,unknown>={}){
 return executeCurrentRelease({operation,releaseId:release,executionId,requestId:randomUUID(),
 confirmation:operation==='status'?undefined:confirmationFor(operation,release),...extra},
 {authorized:async()=>true,load:()=>corpus,rpc,embed:async texts=>{providerCalls++;return {vectors:texts.map(vec)}}});
}
async function init(){const r=await run('initialize');executionId=String(r.executionId);return r;}
async function finish(){for(let i=0;i<10;i++){const r=await run('batch');if(r.done===true)return;}throw new Error('fixture too large');}
async function seedPrior(){
 await db.query(`INSERT INTO rag_index_versions VALUES('prior',$1,'active',1,1,$2,'text-embedding-3-small',now(),NULL)`,['b'.repeat(40),'a'.repeat(64)]);
 await db.query(`INSERT INTO knowledge_chunks(source_type,source_id,content,source_sha,index_version,index_state,embedding,indexing_failed)
 VALUES('locale_lesson','prior-chunk','preserved',$1,'prior','active',$2::extensions.vector,false)`,['b'.repeat(40),JSON.stringify(vec())]);
}
describe('current source lifecycle in real disposable PostgreSQL with vectors',()=>{
 it('gives bounded maintenance operations time to finish without widening learner access or role timeouts',async()=>{
  const rows=(await db.query<{proname:string;proconfig:string[]}>(`SELECT proname,proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname LIKE 'rag_current_%'`)).rows;
  expect(rows.filter(r=>r.proconfig?.includes('statement_timeout=60s')).map(r=>r.proname).sort()).toEqual(['rag_current_activate','rag_current_commit','rag_current_rollback']);
  expect((await db.query(`SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role') AND rolconfig IS NOT NULL`)).rows).toEqual([]);
  for(const name of ['rag_current_commit','rag_current_activate','rag_current_rollback']){
   const access=(await db.query<{anonymous:boolean;learner:boolean}>(`SELECT has_function_privilege('anon',p.oid,'EXECUTE') AS anonymous,has_function_privilege('authenticated',p.oid,'EXECUTE') AS learner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname=$1`,[name])).rows[0];
   expect(access).toEqual({anonymous:false,learner:false});
  }
 });
 it('registers immutable content, rejects forged digest and keeps registration idempotent',async()=>{
  const first=await init();expect(first).toMatchObject({state:'staging',providerAttempts:0});
  expect(await run('initialize')).toMatchObject({executionId});
  await expect(rpc('rag_current_initialize',{p_release_id:release,p_material:corpus.material+' ',p_request_id:randomUUID()})).rejects.toThrow('DIGEST_MISMATCH');
 });
 it('blocks incomplete activation and checks exact active version',async()=>{
  await init();await expect(run('activate',{expectedActiveVersion:null})).rejects.toThrow('INCOMPLETE');
  await finish();await expect(run('activate',{expectedActiveVersion:'changed'})).rejects.toThrow('ACTIVE_CHANGED');
  expect(await run('activate',{expectedActiveVersion:null})).toMatchObject({activated:true,version});
  expect((await db.query<{n:number}>(`SELECT count(*) n FROM knowledge_chunks WHERE index_state='active'`)).rows[0].n).toBe(corpus.chunks.length);
 });
 it('consumes one request permanently and refuses overlapping in-flight work',async()=>{
  await init();const request=randomUUID();
  const args={p_release_id:release,p_execution_id:executionId,p_request_id:request};
  const claim=await rpc('rag_current_claim',args) as Record<string,unknown>;
  expect(await rpc('rag_current_claim',args)).toMatchObject({replayed:true});
  await expect(rpc('rag_current_claim',{...args,p_request_id:randomUUID()})).rejects.toThrow('BATCH_BUSY');
  const lease={...args,p_lease_token:claim.leaseToken};
  expect(await rpc('rag_current_reserve_provider',lease)).toEqual({reserved:true});
  await expect(rpc('rag_current_reserve_provider',lease)).rejects.toThrow('LEASE_INVALID');
  await rpc('rag_current_fail',lease);
  expect(await rpc('rag_current_claim',args)).toMatchObject({replayed:true});
  expect(providerCalls).toBe(0);
 });
 it('does not activate tampered stored text, missing rows, zero vectors or foreign provenance',async()=>{
  for(const corruption of ["content='tampered'","source_sha='foreign'","embedding='["+Array(1536).fill(0).join(',')+"]'::extensions.vector"]){
   await db.exec('TRUNCATE rag_current_requests,rag_current_batches,rag_current_releases,knowledge_chunks,rag_index_versions');
   await init();await finish();await db.exec(`UPDATE knowledge_chunks SET ${corruption}`);
   await expect(run('activate',{expectedActiveVersion:null})).rejects.toThrow('INCOMPLETE');
  }
 });
 it('atomically retains predecessor and supports guarded rollback and reactivation without embedding',async()=>{
  await seedPrior();await init();await finish();const calls=providerCalls;
  expect(await run('activate',{expectedActiveVersion:'prior'})).toMatchObject({activated:true,previousVersion:'prior'});
  expect((await db.query(`SELECT content,index_state FROM knowledge_chunks WHERE source_id='prior-chunk'`)).rows[0]).toEqual({content:'preserved',index_state:'superseded'});
  await expect(run('rollback',{expectedActiveVersion:'other'})).rejects.toThrow('ACTIVE_CHANGED');
  expect(await run('rollback',{expectedActiveVersion:version})).toMatchObject({rolledBack:true,version:'prior'});
  expect(await run('activate',{expectedActiveVersion:'prior'})).toMatchObject({activated:true});
  expect(providerCalls).toBe(calls);
 });
 it('reuses active identical inputs in a second release, with fresh current metadata',async()=>{
  await init();await finish();await run('activate',{expectedActiveVersion:null});
  const changed=structuredClone(corpus.approval);const first=Object.keys(changed.packages)[0];
  changed.packages[first].canonicalVersion='revised-provenance';
  const {releaseId:_r,indexVersion:_i,...body}=changed;
  const {sha256CanonicalJson}=await import('../rag/canonical-checksum');
  changed.releaseId=sha256CanonicalJson(body);changed.indexVersion=`rag-current-v1-${changed.releaseId}`;
  const next=validateCurrentRelease(changed,corpus.chunks);let nextExecution='';
  async function nextRun(operation:CurrentOperation){return executeCurrentRelease({operation,releaseId:changed.releaseId,requestId:randomUUID(),executionId:nextExecution,
   confirmation:operation==='status'?undefined:confirmationFor(operation,changed.releaseId)},
   {authorized:async()=>true,load:()=>next,rpc,embed:async()=>{throw new Error('should reuse')}});}
  nextExecution=String((await nextRun('initialize')).executionId);
  const batch=await nextRun('batch');expect(batch.providerCalls).toBe(0);expect(batch.reusedChunks).toBeGreaterThan(0);
  expect((await db.query(`SELECT DISTINCT source_sha FROM knowledge_chunks WHERE index_version=$1`,[changed.indexVersion])).rows).toEqual([{source_sha:changed.releaseId}]);
 });
 it('denies direct learner/anonymous table and function access',async()=>{
  for(const role of ['anon','authenticated']){
   await db.exec(`SET ROLE ${role}`);
   await expect(db.query('SELECT public.rag_current_status($1)',[release])).rejects.toThrow('permission denied');
   await expect(db.query('SELECT * FROM public.rag_current_releases')).rejects.toThrow('permission denied');
   await db.exec('RESET ROLE');
  }
  await expect(db.query('SELECT public.rag_current_status($1)',[release])).rejects.toThrow('service_role required');
 });
});
