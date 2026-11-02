// @vitest-environment node
import {it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {vector} from '@electric-sql/pglite-pgvector';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {readFileSync,readdirSync} from 'node:fs';import {createHash,randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
import {release} from '../../../scripts/assistant/ready-result/core';
it('compact activation preserves complete validation, atomic switching, replay and legacy audit',async()=>{
const read=(p:string)=>readFileSync(new URL('../../../'+p,import.meta.url),'utf8'),sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const db:any=new PGlite({extensions:{vector,pgcrypto}}),q=async(s:string,a:any[]=[])=> (await db.query(s,a)).rows[0];
let original='',compact='';const oldVersion='synthetic-old-active',request=randomUUID();
const source=release.chunks.slice(0,130),body:any=JSON.parse(release.material);
body.chunks=Object.fromEntries(source.map(c=>[c.chunkId,body.chunks[c.chunkId]]));body.packages=Object.fromEntries([...new Set(Object.values(body.chunks).map((c:any)=>c.packageKey))].map(k=>[k,body.packages[k as string]]));
const material=JSON.stringify(body),id=sha(material),version='rag-current-v1-'+id,checks:string[]=[];
let execution:string;
const snapshot=async()=> (await q(`SELECT jsonb_build_object(
 'versions',(SELECT jsonb_agg(to_jsonb(t) ORDER BY version_key) FROM rag_index_versions t),
 'releases',(SELECT jsonb_agg(to_jsonb(t) ORDER BY release_id) FROM rag_current_releases t),
 'batches',(SELECT jsonb_agg(to_jsonb(t) ORDER BY release_id,ordinal) FROM rag_current_batches t),
 'requests',(SELECT jsonb_agg(to_jsonb(t) ORDER BY request_id) FROM rag_current_requests t),
 'chunks',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM knowledge_chunks t)) value`)).value;
async function invoke(args:any[]=[id,execution,request,oldVersion]){
 await db.exec('SAVEPOINT invoke;SET LOCAL ROLE service_role');
 let value:any,error:any;try{value=(await q('SELECT rag_current_activate($1,$2,$3,$4) value',args)).value;}
 catch(e:any){error={message:e.message,code:e.code};await db.exec('ROLLBACK TO SAVEPOINT invoke');}
 finally{await db.exec('RESET ROLE;RELEASE SAVEPOINT invoke');}
 return{value,error};
}
try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA extensions;CREATE SCHEMA auth;
 CREATE EXTENSION vector WITH SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT NULL::text$$;
 CREATE FUNCTION rag_require_service_role() RETURNS void LANGUAGE plpgsql AS $$BEGIN IF COALESCE(auth.role(),current_setting('role',true)) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'SERVICE_REQUIRED';END IF;END$$;
 CREATE TABLE rag_index_versions(version_key text PRIMARY KEY,source_sha text,status text,package_count integer,chunk_count integer,chunk_manifest_checksum text,embedding_model text,activated_at timestamptz,superseded_at timestamptz);
 CREATE UNIQUE INDEX one_active ON rag_index_versions(status) WHERE status='active';
 CREATE TABLE knowledge_chunks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),source_type text,source_id text,path_id text,module_id text,lesson_id text,title text,content text,metadata jsonb,embedding extensions.vector(1536),locale text,package_path text,source_sha text,package_checksum text,chunk_checksum text,content_version text,index_version text,index_state text,section_index integer,section_role text,chunk_position integer,content_type text,production_route text,indexing_failed boolean,updated_at timestamptz DEFAULT now(),UNIQUE(source_type,source_id,index_version));
 GRANT USAGE ON SCHEMA auth,extensions TO service_role;GRANT ALL ON knowledge_chunks,rag_index_versions TO service_role;
 CREATE FUNCTION fixture_touch() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.updated_at=now();RETURN NEW;END$$;
 CREATE TRIGGER fixture_touch BEFORE UPDATE ON knowledge_chunks FOR EACH ROW EXECUTE FUNCTION fixture_touch();`);
 await db.exec(read('scripts/rag/current-release-candidate.sql'));
 const migrationRoot=new URL('../../../supabase/migrations/',import.meta.url);
 const boundedName=readdirSync(migrationRoot).find(f=>f.endsWith('_original_ai_bounded_validation.sql'))!;
 const compactName=readdirSync(migrationRoot).find(f=>f.endsWith('_original_ai_compact_activation.sql'))!;
 await db.exec(read('supabase/migrations/'+boundedName));
 original=(await q("SELECT pg_get_functiondef('rag_current_activate(text,uuid,uuid,text)'::regprocedure) value")).value;
 await db.exec(read('supabase/migrations/'+compactName));
 compact=(await q("SELECT pg_get_functiondef('rag_current_activate(text,uuid,uuid,text)'::regprocedure) value")).value;
 await db.exec('SET ROLE service_role');execution=(await q('SELECT rag_current_initialize($1,$2,$3) value',[id,material,randomUUID()])).value.executionId;await db.exec('RESET ROLE');
 await db.query("INSERT INTO rag_index_versions VALUES($1,'old-source','active',1,70,'old-source','text-embedding-3-small',now(),NULL)",[oldVersion]);
 const stored=source.map(c=>{const d=body.chunks[c.chunkId],p=body.packages[d.packageKey];return{source_type:'locale_lesson',source_id:c.chunkId,path_id:p.trackId,module_id:p.moduleId,lesson_id:p.lessonId,title:d.sectionHeading,content:c.displayText,metadata:{currentReleaseId:id},embedding:JSON.stringify([1,...Array(1535).fill(0)]),locale:p.locale,package_path:p.packagePath,source_sha:id,package_checksum:p.packageChecksum,chunk_checksum:d.textChecksum,content_version:p.canonicalVersion,index_version:version,index_state:'staging',section_index:d.sectionIndex,section_role:d.sectionRole,chunk_position:d.chunkIndex,content_type:d.contentType,production_route:p.productionRoute,indexing_failed:false};});
 const names=Object.keys(stored[0]).join(',');
 await db.query('INSERT INTO knowledge_chunks('+names+') SELECT '+names+' FROM jsonb_populate_recordset(NULL::knowledge_chunks,$1)',[JSON.stringify(stored)]);
 await db.query('INSERT INTO knowledge_chunks('+names+') SELECT '+names+' FROM jsonb_populate_recordset(NULL::knowledge_chunks,$1)',[JSON.stringify(stored.slice(0,70).map(k=>({...k,index_version:oldVersion,index_state:'active',source_sha:'old-source'})))]);
 await db.query("UPDATE rag_current_batches SET state='done',request_id=gen_random_uuid() WHERE release_id=$1",[id]);
 const legacy='e'.repeat(64);await db.query("INSERT INTO rag_current_releases(release_id,material,approval,provider_attempts) VALUES($1,'immutable','{}',20)",[legacy]);await db.query("INSERT INTO rag_current_batches(release_id,ordinal,chunk_ids,state,provider_reserved) VALUES($1,19,'[]','inflight',true)",[legacy]);
 await db.exec(compact);const candidate=(await q("SELECT md5(pg_get_functiondef('rag_current_activate(text,uuid,uuid,text)'::regprocedure)) digest")).digest;
 await db.exec('BEGIN;SAVEPOINT baseline');await db.exec(original);
 const a=await invoke();assert.equal(a.value.activated,true);const expected=await snapshot();
 assert.equal((await invoke()).value.replayed,true);assert.deepEqual(await snapshot(),expected);
 await db.exec('ROLLBACK TO SAVEPOINT baseline');await db.exec(compact);const b=await invoke();assert.equal(b.value.activated,true);assert.deepEqual(await snapshot(),expected);
 assert.equal((await invoke()).value.replayed,true);assert.deepEqual(await snapshot(),expected);await db.exec('ROLLBACK');checks.push('original and compact activation produce identical full database state and idempotent receipts including update-trigger timestamps');
 const cases:[string,string,any[],RegExp][]=[
  ['pending batch',"UPDATE rag_current_batches SET state='pending' WHERE release_id=$1 AND ordinal=2",[id],/RELEASE_INCOMPLETE/],
  ['missing last stored row','DELETE FROM knowledge_chunks WHERE index_version=$1 AND source_id=$2',[version,source[129].chunkId],/RELEASE_INCOMPLETE/],
  ['corrupt last content','UPDATE knowledge_chunks SET content=content||$1 WHERE index_version=$2 AND source_id=$3',['changed',version,source[129].chunkId],/RELEASE_INCOMPLETE/],
  ['wrong last source SHA','UPDATE knowledge_chunks SET source_sha=$1 WHERE index_version=$2 AND source_id=$3',['wrong',version,source[129].chunkId],/RELEASE_INCOMPLETE/],
  ['wrong last index state','UPDATE knowledge_chunks SET index_state=$1 WHERE index_version=$2 AND source_id=$3',['active',version,source[129].chunkId],/RELEASE_INCOMPLETE/],
  ['zero last vector','UPDATE knowledge_chunks SET embedding=$1 WHERE index_version=$2 AND source_id=$3',[JSON.stringify(Array(1536).fill(0)),version,source[129].chunkId],/RELEASE_INCOMPLETE/],
  ['missing last descriptor with unchanged count',"UPDATE rag_current_releases SET approval=jsonb_set(approval,'{chunks}',((approval->'chunks')-$2::text)||jsonb_build_object('unrelated',(approval->'chunks')->$2::text)) WHERE release_id=$1",[id,source[129].chunkId],/RELEASE_INCOMPLETE/],
  ['missing required package with unchanged count',"UPDATE rag_current_releases SET approval=jsonb_set(approval,'{packages}',((approval->'packages')-$2::text)||jsonb_build_object('unrelated',(approval->'packages')->$2::text)) WHERE release_id=$1",[id,body.chunks[source[129].chunkId].packageKey],/RELEASE_INCOMPLETE/],
  ['wrong embedding model',"UPDATE rag_index_versions SET embedding_model='wrong' WHERE version_key=$1",[version],/RELEASE_INCOMPLETE/],
 ];
 for(const [name,change,args,pattern] of cases){for(const definition of [original,compact]){
  await db.exec(definition);await db.exec('BEGIN');await db.query(change,args);const before=await snapshot();const result=await invoke();assert.match(result.error?.message??'',pattern,name);assert.deepEqual(await snapshot(),before,name);await db.exec('ROLLBACK');
 }checks.push(name+' rejects identically with no state/receipt/audit changes');}
 for(const [name,args,pattern] of [['wrong execution',[id,randomUUID(),request,oldVersion],/EXECUTION_MISMATCH/],['NULL request',[id,execution,null,oldVersion],/EXECUTION_MISMATCH/],['wrong active CAS',[id,execution,request,'wrong'],/ACTIVE_CHANGED/]] as [string,any[],RegExp][]){
  for(const definition of [original,compact]){await db.exec(definition);await db.exec('BEGIN');const before=await snapshot();const result=await invoke(args);assert.match(result.error?.message??'',pattern);assert.deepEqual(await snapshot(),before);await db.exec('ROLLBACK');}checks.push(name+' preserves all rows and receipts');
 }
 for(const definition of [original,compact]){
  await db.exec(definition);await db.exec('BEGIN');
  await db.exec(`CREATE FUNCTION fixture_late_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.index_state='active' AND NEW.index_version<>'synthetic-old-active' THEN RAISE EXCEPTION 'SYNTHETIC_LATE_UPDATE_FAILURE';END IF;RETURN NEW;END$$;CREATE TRIGGER fixture_late_failure BEFORE UPDATE ON knowledge_chunks FOR EACH ROW EXECUTE FUNCTION fixture_late_failure();`);
  const before=await snapshot();const result=await invoke();assert.equal(result.error?.message,'SYNTHETIC_LATE_UPDATE_FAILURE');assert.deepEqual(await snapshot(),before);await db.exec('ROLLBACK');
 }checks.push('late new-index UPDATE failure rolls back prior old-index superseding and every earlier state write atomically');
 await db.exec(compact);await assert.rejects(()=>q('SELECT rag_current_activate($1,$2,$3,$4)',[id,execution,request,oldVersion]),/SERVICE_REQUIRED/);checks.push('real service-role authorization remains enforced without fabricated claims');
 const result={result:'passed',cases:checks.length,checks,candidateDefinitionMd5:candidate,validatorDefinitionMd5:(await q("SELECT md5(pg_get_functiondef('rag_current_row_valid(knowledge_chunks,jsonb,text)'::regprocedure)) digest")).digest,fixture:'130 target rows across3batches +70 prioractive rows + untouched legacyUNKNOWN; synthetic vectors/seeded DONE state; actual init/activation/receipt/replay and UPDATEtrigger behavior',providerCalls:0,networkCalls:0,originalDatabaseCalls:0};
 assert.equal(result.result,'passed');assert.equal(result.cases,15);
}finally{await db.close();}
},120000);
