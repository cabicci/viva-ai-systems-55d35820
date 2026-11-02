// @vitest-environment node
import {it,expect} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {vector} from '@electric-sql/pglite-pgvector';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const root=new URL('../../../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root),'utf8');
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
it('retires only proven obsolete source, fences all seven writers, and preserves every UNKNOWN byte',async()=>{
 const db=new PGlite({extensions:{vector,pgcrypto}});
 const q=async(sql:string,args:unknown[]=[]) => (await db.query<any>(sql,args)).rows[0];
 try{
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA extensions;
   CREATE EXTENSION vector WITH SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
   SET timezone='UTC';SELECT set_config('request.jwt.claim.role','service_role',false);
   CREATE FUNCTION rag_require_service_role() RETURNS void LANGUAGE plpgsql AS $$BEGIN IF current_setting('request.jwt.claim.role',true)<>'service_role' THEN RAISE EXCEPTION 'SERVICE_REQUIRED';END IF;END$$;
   CREATE TABLE rag_index_versions(version_key text PRIMARY KEY,source_sha text,status text,package_count integer,chunk_count integer,chunk_manifest_checksum text,embedding_model text,activated_at timestamptz,superseded_at timestamptz);
   CREATE UNIQUE INDEX one_active ON rag_index_versions(status) WHERE status='active';
   CREATE TABLE knowledge_chunks(source_type text,source_id text,path_id text,module_id text,lesson_id text,title text,content text,metadata jsonb,embedding extensions.vector(1536),locale text,package_path text,source_sha text,package_checksum text,chunk_checksum text,content_version text,index_version text,index_state text,section_index integer,section_role text,chunk_position integer,content_type text,production_route text,indexing_failed boolean,UNIQUE(source_type,source_id,index_version));`);
  await db.exec(read('scripts/rag/current-release-candidate.sql'));
  const optimizer=readdirSync(new URL('supabase/migrations/',root)).find(x=>x.endsWith('_original_ai_bounded_validation.sql'))!;
  await db.exec(read('supabase/migrations/'+optimizer));
  const compactMigration=readdirSync(new URL('supabase/migrations/',root)).find(x=>x.endsWith('_original_ai_compact_activation.sql'))!;
  await db.exec(read('supabase/migrations/'+compactMigration));
  const approval=JSON.parse(read('artifacts/rag/current/approval-snapshot.json'));
  const sourceChunks=JSON.parse(read('artifacts/rag/current/chunks.json')).slice(0,128);
  const {releaseId:originalRelease,indexVersion:originalVersion,...body}=approval;
  body.chunks=Object.fromEntries(sourceChunks.map((c:any)=>[c.chunkId,approval.chunks[c.chunkId]]));
  body.packages=Object.fromEntries([...new Set(sourceChunks.map((c:any)=>approval.chunks[c.chunkId].packageKey))].map(key=>[key,approval.packages[key as string]]));
  const material=JSON.stringify(body),successor=hash(material),version='rag-current-v1-'+successor;
  const oldBody={...body,syntheticHistoricalFixture:true},oldMaterial=JSON.stringify(oldBody),legacy=hash(oldMaterial);
  const execution='cd259987-11c0-4f0d-941f-5011a54a55f8',unknown='2dd51551-39b9-4abb-a965-b03f91733192',lease=randomUUID();
  const ids=sourceChunks.slice(0,64).map((c:any)=>c.chunkId);
  await db.query('INSERT INTO rag_current_releases(release_id,execution_id,material,approval,provider_attempts) VALUES($1,$2,$3,$4,20)',[legacy,execution,oldMaterial,oldMaterial]);
  await db.query("INSERT INTO rag_current_batches VALUES($1,19,$2,'inflight',$3,now()-interval '1 day',$4,true)",[legacy,JSON.stringify(ids),lease,unknown]);
  await db.query("INSERT INTO rag_current_requests VALUES($1,$2,'batch',$3)",[unknown,legacy,JSON.stringify({leaseToken:lease,chunkIds:ids,ordinal:19})]);
  const initialized=(await q('SELECT rag_current_initialize($1,$2,$3) value',[successor,material,randomUUID()])).value;
  const request=randomUUID(),claimed=(await q('SELECT rag_current_claim($1,$2,$3) value',[successor,initialized.executionId,request])).value;
  const vectors=sourceChunks.map((c:any)=>({chunkId:c.chunkId,content:c.displayText,embedding:[1,...Array(1535).fill(0)]}));
  await q('SELECT rag_current_commit($1,$2,$3,$4,$5)',[successor,initialized.executionId,request,claimed.leaseToken,JSON.stringify(vectors.slice(0,64))]);
  const request2=randomUUID(),claimed2=(await q('SELECT rag_current_claim($1,$2,$3) value',[successor,initialized.executionId,request2])).value;
  await q('SELECT rag_current_commit($1,$2,$3,$4,$5)',[successor,initialized.executionId,request2,claimed2.leaseToken,JSON.stringify(vectors.slice(64))]);
  await q('SELECT rag_current_activate($1,$2,$3,$4)',[successor,initialized.executionId,randomUUID(),null]);
  const rawQuery=`SELECT jsonb_build_object('release',(SELECT to_jsonb(r) FROM rag_current_releases r WHERE release_id=$1),'batches',(SELECT jsonb_agg(to_jsonb(b) ORDER BY ordinal) FROM rag_current_batches b WHERE release_id=$1),'requests',(SELECT jsonb_agg(to_jsonb(q) ORDER BY request_id) FROM rag_current_requests q WHERE release_id=$1))`;
  const before=(await q('SELECT md5(('+rawQuery+')::text) digest',[legacy])).digest;
  const filename=readdirSync(new URL('supabase/migrations/',root)).find(x=>x.endsWith('_original_ai_verified_retirement.sql'))!;
  // Production cardinalities/identity pins are substituted ONLY in this isolated small fixture.
  // The owner preparation packet separately validates the full actual 3851-row/61-batch shape.
  let sql=read('supabase/migrations/'+filename).replaceAll('11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5',legacy)
   .replaceAll(originalRelease,successor).replaceAll('1cd729044620ec9c1fd475fb36271085',before)
   .replace(/\b3851\b/g,'128').replace(/\b400\b/g,String(Object.keys(body.packages).length)).replaceAll('<>61','<>2');
  // Derive the expected fixture-only catalog pin in a rolled-back transaction.
  const snapshotQuery=sql.match(/ SELECT \((SELECT jsonb_build_object[\s\S]+?)\) INTO snapshot;/)![1];
  const productionPost=sql.match(/IF md5\(snapshot::text\) IS DISTINCT FROM '([a-f0-9]{32})'/)![1];
  await db.exec('BEGIN');await db.exec(sql.match(/EXECUTE \$new_retirement_objects\$([\s\S]+?)\$new_retirement_objects\$;/)![1]);
  const localPost=(await q('SELECT md5(('+snapshotQuery+')::text) value')).value;await db.exec('ROLLBACK');
  sql=sql.replaceAll(productionPost,localPost);
  const oldCatalog=(await db.query<any>("SELECT oid::text,proname,proowner::text,proacl::text FROM pg_proc WHERE proname LIKE 'rag_current_%'")).rows;
  await db.exec(sql);
  const afterCatalog=(await db.query<any>("SELECT oid::text,proname,proowner::text,proacl::text FROM pg_proc WHERE proname LIKE 'rag_current_%'")).rows;
  for(const old of oldCatalog)expect(afterCatalog.find(x=>x.proname===old.proname)).toEqual(old);
  const audit=(await q('SELECT rag_current_legacy_audit($1) value',[legacy])).value;
  expect(audit.md5).toBe(before);
  const args=[legacy,execution,unknown,audit.sha256,initialized.executionId];
  const retire='SELECT rag_current_retire_verified($1,$2,$3,$4,$5) value';
  await expect(q(retire,[...args.slice(0,3),'0'.repeat(64),initialized.executionId])).rejects.toThrow('AUDIT_CHANGED');
  await db.exec('BEGIN');await db.query('UPDATE knowledge_chunks SET content=content||$1 WHERE source_id=$2',['outside64',sourceChunks[127].chunkId]);
  await expect(q(retire,args)).rejects.toThrow('COVERAGE_INVALID');await db.exec('ROLLBACK');
  const retired=(await q(retire,args)).value;expect(retired).toMatchObject({retired:true,providerOutcome:'UNKNOWN',legacyAuditUnchanged:true,coveredChunks:64});
  expect((await q('SELECT rag_current_prior_ai_clear($1) value',['e'.repeat(64)])).value).toBe(true);
  await db.exec('BEGIN');await db.query('UPDATE knowledge_chunks SET content=content||$1 WHERE source_id=$2',['outside64',sourceChunks[127].chunkId]);
  expect((await q('SELECT rag_current_retirement_valid($1) value',[legacy])).value).toBe(true);await db.exec('ROLLBACK');
  const calls:[string,unknown[]][]=[['rag_current_initialize',[legacy,oldMaterial,randomUUID()]],['rag_current_claim',[legacy,execution,randomUUID()]],['rag_current_reserve_provider',[legacy,execution,unknown,lease]],['rag_current_commit',[legacy,execution,unknown,lease,'[]']],['rag_current_fail',[legacy,execution,unknown,lease]],['rag_current_activate',[legacy,execution,randomUUID(),version]],['rag_current_rollback',[legacy,execution,randomUUID(),version]]];
  for(const [name,values] of calls)await expect(q('SELECT '+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+')',values)).rejects.toThrow('RETIRED_NO_REPLAY');
  expect((await q('SELECT rag_current_legacy_audit($1) value',[legacy])).value).toEqual(audit);
  await expect(q('DELETE FROM rag_current_retirements')).rejects.toThrow('IMMUTABLE');
  await expect(q('TRUNCATE rag_current_retirements')).rejects.toThrow('IMMUTABLE');
  expect((await q(retire,args)).value.replayed).toBe(true);
  await db.exec('BEGIN');await db.query('UPDATE knowledge_chunks SET embedding=$1::extensions.vector WHERE source_id=$2',[JSON.stringify([2,...Array(1535).fill(0)]),ids[0]]);
  expect((await q('SELECT rag_current_prior_ai_clear($1) value',['e'.repeat(64)])).value).toBe(false);await db.exec('ROLLBACK');
  const other='f'.repeat(64);await db.query("INSERT INTO rag_current_releases(release_id,material,approval) VALUES($1,'{}','{}')",[other]);await db.query("INSERT INTO rag_current_batches(release_id,ordinal,chunk_ids,state,provider_reserved) VALUES($1,0,'[]','inflight',true)",[other]);
  expect((await q('SELECT rag_current_prior_ai_clear($1) value',['e'.repeat(64)])).value).toBe(false);
  expect((await q("SELECT has_table_privilege('service_role','rag_current_retirements','INSERT,UPDATE,DELETE') value")).value).toBe(false);
  const installed=(await db.query<any>("SELECT oid::text,xmin::text,ctid::text,proname,proowner::text,proacl::text,md5(pg_get_functiondef(oid)) digest FROM pg_proc WHERE proname LIKE 'rag_current_%' ORDER BY proname")).rows;
  await db.exec(read('supabase/migrations/'+optimizer));
  await db.exec(read('supabase/migrations/'+compactMigration));
  await db.exec(sql);
  expect((await db.query<any>("SELECT oid::text,xmin::text,ctid::text,proname,proowner::text,proacl::text,md5(pg_get_functiondef(oid)) digest FROM pg_proc WHERE proname LIKE 'rag_current_%' ORDER BY proname")).rows).toEqual(installed);
  expect((await q('SELECT rag_current_legacy_audit($1) value',[legacy])).value).toEqual(audit);
 }finally{await db.close();}
},30000);
