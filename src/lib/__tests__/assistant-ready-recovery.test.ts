// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';import {vector} from '@electric-sql/pglite-pgvector';import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {readFileSync,readdirSync} from 'node:fs';import {createHash,randomUUID} from 'node:crypto';
const state=vi.hoisted(()=>({pins:{} as any}));
vi.mock('../../../scripts/assistant/ready-result/recovery-pins',()=>({RECOVERY_CASES:[state.pins]}));
import {recoverReady,checkpointSha,claimJsonbText} from '../../../scripts/assistant/ready-result/recovery';
import {readyImport,legacyDigest,type Checkpoint} from '../../../scripts/assistant/ready-result/import-core';
import {rpc,safeRpcDiagnostic} from '../../../scripts/assistant/ready-result/client';
import {RELEASE,VERSION,LEGACY_RELEASE,TARGET_PROJECT,release,rowsDigest,canonical,sha} from '../../../scripts/assistant/ready-result/core';
const read=(p:string)=>readFileSync(new URL('../../../'+p,import.meta.url),'utf8');
const md5=(s:string)=>createHash('md5').update(s).digest('hex');
it.each([4,5])('prepares and reconciles fixed batch %s recovery; unsafe states roll back and history survives',async(ordinal)=>{
 const db=new PGlite({extensions:{vector,pgcrypto}});const q=async(sql:string,args:any[]=[])=> (await db.query<any>(sql,args)).rows[0];
 try{
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA extensions;CREATE SCHEMA auth;
   CREATE EXTENSION vector WITH SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;SET timezone='UTC';
   CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claims',true)::jsonb->>'role' $$;
   CREATE FUNCTION rag_require_service_role() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','extensions','pg_temp' AS $$BEGIN IF COALESCE(auth.role(),current_setting('role',true)) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden: service_role required';END IF;END$$;
   GRANT USAGE ON SCHEMA auth,extensions TO service_role;
   CREATE TABLE rag_index_versions(version_key text PRIMARY KEY,source_sha text,status text,package_count integer,chunk_count integer,chunk_manifest_checksum text,embedding_model text,activated_at timestamptz,superseded_at timestamptz);
   CREATE TABLE knowledge_chunks(source_type text,source_id text,path_id text,module_id text,lesson_id text,title text,content text,metadata jsonb,embedding extensions.vector(1536),locale text,package_path text,source_sha text,package_checksum text,chunk_checksum text,content_version text,index_version text,index_state text,section_index integer,section_role text,chunk_position integer,content_type text,production_route text,indexing_failed boolean,UNIQUE(source_type,source_id,index_version));
   GRANT ALL ON knowledge_chunks,rag_index_versions TO service_role;`);
  await db.exec(read('scripts/rag/current-release-candidate.sql'));
  if(ordinal===5){const optimizer=readdirSync(new URL('../../../supabase/migrations/',import.meta.url)).find(x=>x.endsWith('_original_ai_bounded_validation.sql'))!;await db.exec(read('supabase/migrations/'+optimizer));}
  const calls:string[]=[];let lostCommitAck=false;
  async function service(name:string,args:Record<string,unknown>){calls.push(name);await db.exec('SET ROLE service_role');try{const kv=Object.entries(args);const data=(await q('SELECT '+name+'('+kv.map(([k],i)=>k+'=> $'+(i+1)).join(',')+') value',kv.map(([,v])=>typeof v==='object'&&v!==null?JSON.stringify(v):v))).value;if(lostCommitAck&&name==='rag_current_commit'){lostCommitAck=false;return{data:null,error:{code:'FETCH_ERROR',message:'synthetic ACK loss secret-token'},status:0};}return{data,error:null,status:200};}catch(error:any){return{error:{code:error.code,message:error.message},data:null,status:400};}finally{await db.exec('RESET ROLE');}}
  function from(table:string){let cols='*',clauses:string[]=[],params:any[]=[],single=false,head=false,order='',range='';const f:any={select(c:string,o:any={}){cols=c;head=!!o.head;return f;},eq(k:string,v:any){params.push(v);clauses.push(k+'=$'+params.length);return f;},in(k:string,vs:any[]){clauses.push(k+' IN('+vs.map(v=>{params.push(v);return'$'+params.length;}).join(',')+')');return f;},order(k:string){order=' ORDER BY '+k;return f;},range(a:number,b:number){range=' LIMIT '+(b-a+1)+' OFFSET '+a;return f;},maybeSingle(){single=true;return f;},async then(resolve:any,reject:any){try{const out=await db.query<any>('SELECT '+(head?'count(*)::int n':cols)+' FROM '+table+(clauses.length?' WHERE '+clauses.join(' AND '):'')+order+range,params);const rows=JSON.parse(JSON.stringify(out.rows));resolve({error:null,count:head?rows[0].n:undefined,data:head?null:single?rows[0]??null:rows});}catch(e){reject(e);}}};return f;}
  const client={rpc:service,from};
  const execution='6773665d-76b3-49cc-977b-26418f78cad3',priorId=ordinal===4?'723d4cab-d7fd-4164-8f6f-74dca6e06fee':'f6214b00-99f5-4cbf-a3b9-08354984ec4e',nextId=ordinal===4?'23b16873-4ad5-4c91-a22d-66e8ec94671b':'b9e60db6-0f0f-4cca-a445-275b6a551209',active='rag-index-v1-3e1ef5aa-930bc16ad0085e44';
  await service('rag_current_initialize',{p_release_id:RELEASE,p_material:release.material,p_request_id:randomUUID()});
  await db.query('UPDATE rag_current_releases SET execution_id=$1 WHERE release_id=$2',[execution,RELEASE]);
  await db.query("INSERT INTO rag_index_versions VALUES($1,'old','active',1,1,'old','text-embedding-3-small',now(),null)",[active]);
  await db.query("UPDATE rag_current_batches SET state='done',request_id=gen_random_uuid() WHERE release_id=$1 AND ordinal<$2",[RELEASE,ordinal]);
  await db.query("INSERT INTO rag_current_requests SELECT request_id,release_id,'batch',jsonb_build_object('committed',true,'done',true,'ordinal',ordinal,'acceptedRows',64) FROM rag_current_batches WHERE release_id=$1 AND ordinal<$2",[RELEASE,ordinal]);
  const vectors=release.chunks.map(c=>({chunkId:c.chunkId,content:c.displayText,embedding:[1,...Array(1535).fill(0)]}));
  const approval:any=release.approval;
  const stored=release.chunks.slice(0,ordinal*64).map(c=>{const d=approval.chunks[c.chunkId],p=approval.packages[d.packageKey];return{source_type:'locale_lesson',source_id:c.chunkId,path_id:p.trackId,module_id:p.moduleId,lesson_id:p.lessonId,title:d.sectionHeading,content:c.displayText,metadata:{currentReleaseId:RELEASE},embedding:JSON.stringify(vectors[0].embedding),locale:p.locale,package_path:p.packagePath,source_sha:RELEASE,package_checksum:p.packageChecksum,chunk_checksum:d.textChecksum,content_version:p.canonicalVersion,index_version:VERSION,index_state:'staging',section_index:d.sectionIndex,section_role:d.sectionRole,chunk_position:d.chunkIndex,content_type:d.contentType,production_route:p.productionRoute,indexing_failed:false};});
  await db.query('INSERT INTO knowledge_chunks SELECT * FROM jsonb_populate_recordset(NULL::knowledge_chunks,$1)',[JSON.stringify(stored)]);
  const claimed=(await service('rag_current_claim',{p_release_id:RELEASE,p_execution_id:execution,p_request_id:priorId})).data;
  await db.query("UPDATE rag_current_batches SET lease_until=now()-interval '1 day' WHERE release_id=$1 AND ordinal=$2",[RELEASE,ordinal]);
  await db.query("INSERT INTO rag_current_releases(release_id,material,approval,provider_attempts) VALUES($1,'legacy immutable','{}',20)",[LEGACY_RELEASE]);
  await db.query("INSERT INTO rag_current_batches(release_id,ordinal,chunk_ids,state,provider_reserved) SELECT $1,n,'[]',CASE WHEN n<19 THEN 'done' WHEN n=19 THEN 'inflight' ELSE 'pending' END,n<20 FROM generate_series(0,60)n",[LEGACY_RELEASE]);
  const prior=(await q('SELECT to_jsonb(q) value FROM rag_current_requests q WHERE request_id=$1',[priorId])).value;
  const priorMd5=(await q('SELECT md5(to_jsonb(q)::text) value FROM rag_current_requests q WHERE request_id=$1',[priorId])).value;expect(md5(claimJsonbText(prior))).toBe(priorMd5);
  const legacyQuery=`SELECT md5(jsonb_build_object('release',(SELECT to_jsonb(r) FROM rag_current_releases r WHERE release_id=$1),'batches',(SELECT jsonb_agg(to_jsonb(b) ORDER BY ordinal) FROM rag_current_batches b WHERE release_id=$1),'requests',(SELECT jsonb_agg(to_jsonb(q) ORDER BY request_id) FROM rag_current_requests q WHERE release_id=$1))::text) value`;
  const legacyMd5=(await q(legacyQuery,[LEGACY_RELEASE])).value;
  let cp:Checkpoint={schemaVersion:'masaarat-ready-import-checkpoint-v1',targetProject:TARGET_PROJECT,artifactSha256:'c468922fe7b26a331caae8999cb28777b769eda73a3471a337a7f6ddc021f7f8',rowsDigest:rowsDigest(vectors),legacyDigest:await legacyDigest(client),expectedActive:active,executionId:execution,pending:{operation:'commit',requestId:priorId,leaseToken:claimed.leaseToken,ordinal,chunkIds:claimed.chunkIds},confirmed:[{operation:'initialize',requestId:randomUUID()},...Array.from({length:ordinal},(_,ordinal)=>({operation:'commit',requestId:randomUUID(),ordinal}))]};
  if(ordinal===5)cp.recoveryHistory=[{schemaVersion:'ready-result-recovery-plan-v1',priorCheckpointSha256:'133492e6f2b54923190dd82f09af4c304af805afc8b5ee504eb50ed08fac0b0e',priorPending:{operation:'commit',requestId:'723d4cab-d7fd-4164-8f6f-74dca6e06fee',ordinal:4},priorRequestSha256:'a'.repeat(64),nextRequestId:'23b16873-4ad5-4c91-a22d-66e8ec94671b',preparedAt:'2026-11-01T23:09:00Z',proof:{fenced:true,ordinal:4},recoveredAt:'2026-11-01T23:10:00Z'}];
  const priorHistoryJson=JSON.stringify(cp.recoveryHistory??[]);
  Object.assign(state.pins,{executionId:execution,priorRequestId:priorId,nextRequestId:nextId,ordinal,priorHistoryLength:ordinal-4,priorLeaseMd5:md5(claimed.leaseToken),priorRequestMd5:priorMd5,priorCheckpointSha256:checkpointSha(cp),legacyAuditMd5:legacyMd5,artifactSha256:cp.artifactSha256});
  const logs:any[]=[];const run=async(mode:'prepare-recovery'|'readback-recovery')=>recoverReady({db:client,checkpoint:structuredClone(cp),mode,checkpointRawSha256:state.pins.priorCheckpointSha256,save(c){cp=structuredClone(c);},log(v){logs.push(v);}});
  const oldPending=structuredClone(cp.pending);await expect(recoverReady({db:client,checkpoint:structuredClone(cp),mode:'prepare-recovery',checkpointRawSha256:'0'.repeat(64),save(){throw Error('unexpected checkpoint write');},log(){}})).rejects.toThrow('EXACT_CHECKPOINT_REQUIRED');
  await run('prepare-recovery');expect(cp.pending).toEqual(oldPending);expect(cp.recoveryPending?.nextRequestId).toBe(nextId);expect(Object.keys(logs[0]).sort()).toEqual(['checkpointSha256','planId']);
  await expect(run('readback-recovery')).rejects.toThrow('NOT_RECORDED_NO_RETRY');
  const production=ordinal===4?{lease:'e6a13a5772360d0b69d7f12cd7743e3a',request:'b88ee208ccc2efdff1a18dd97f242448',checkpoint:'133492e6f2b54923190dd82f09af4c304af805afc8b5ee504eb50ed08fac0b0e'}:{lease:'edf29b03c6a18b4ee00d880799ac4973',request:'c2db3d4ccaa8524fb5bc5ead138cc0db',checkpoint:'491e6408326b2b56aff760b9f5fad5a03f9b66689eb56ef18ced4fd1a8d46daf'};
  const sql=read('scripts/assistant/ready-result/recover-original-batch'+ordinal+'.sql').replaceAll(production.lease,state.pins.priorLeaseMd5).replaceAll(production.request,priorMd5).replaceAll(production.checkpoint,state.pins.priorCheckpointSha256).replaceAll('1cd729044620ec9c1fd475fb36271085',legacyMd5);
  const failures=[
   ["UPDATE rag_current_batches SET provider_reserved=true WHERE release_id=$1 AND ordinal=$2",[RELEASE,ordinal]],
   ["UPDATE rag_current_releases SET provider_attempts=1 WHERE release_id=$1",[RELEASE]],
   ["UPDATE rag_current_batches SET lease_until=now()+interval '1 day' WHERE release_id=$1 AND ordinal=$2",[RELEASE,ordinal]],
   ["INSERT INTO knowledge_chunks(source_id,index_version) VALUES($1,$2)",[claimed.chunkIds[0],VERSION]],
   ["UPDATE rag_current_requests SET result=result||'{\"changed\":true}' WHERE request_id=$1",[priorId]],
   ["INSERT INTO rag_current_requests VALUES($1,$2,'batch','{}')",[nextId,RELEASE]],
  ] as [string,any[]][];
  for(const [change,values] of failures){await db.exec('BEGIN');await db.query(change,values);let error;try{await db.exec(sql);}catch(e){error=e;}await db.exec('ROLLBACK');expect((error as Error)?.message).toMatch(/READY_RECOVERY_/);expect((await q('SELECT count(*)::int n FROM rag_current_requests WHERE request_id=$1',[nextId])).n).toBe(0);expect((await q(legacyQuery,[LEGACY_RELEASE])).value).toBe(legacyMd5);}
  await db.exec(sql);
  const late=await service('rag_current_commit',{p_release_id:RELEASE,p_execution_id:execution,p_request_id:priorId,p_lease_token:claimed.leaseToken,p_rows:vectors.slice(ordinal*64,(ordinal+1)*64)});expect(late.error?.message).toBe('CURRENT_LEASE_INVALID');
  await db.exec('BEGIN');await db.query("UPDATE rag_current_requests SET result=jsonb_set(result,'{recovery,fenced}','false') WHERE request_id=$1",[nextId]);await expect(run('readback-recovery')).rejects.toThrow('FENCE_UNCONFIRMED');await db.exec('ROLLBACK');expect(cp.recoveryPending).toBeDefined();
  if(ordinal===5){const changed=structuredClone(cp);changed.recoveryHistory![0].proof.fenced=false;await expect(recoverReady({db:client,checkpoint:changed,mode:'readback-recovery',save(){throw Error('unexpected write');},log(){}})).rejects.toThrow('HISTORY_CHANGED');}
  await run('readback-recovery');expect(cp.pending?.operation).toBe('claimed');expect(cp.pending?.requestId).toBe(nextId);expect(cp.recoveryHistory?.[ordinal-4].priorPending).toEqual(oldPending);expect(cp.recoveryHistory?.[ordinal-4].proof.fenced).toBe(true);expect(cp.confirmed).toHaveLength(ordinal+1);
  const beforeClaim=calls.filter(n=>n==='rag_current_claim').length;
  const beforeCommit=calls.filter(n=>n==='rag_current_commit').length;lostCommitAck=true;
  await readyImport({db:client,rows:vectors,artifactSha256:cp.artifactSha256,mode:'import',maxBatches:1,checkpoint:cp,save(c){cp=structuredClone(c);},log(){}});
  expect(calls.filter(n=>n==='rag_current_claim')).toHaveLength(beforeClaim);expect(calls.filter(n=>n==='rag_current_commit')).toHaveLength(beforeCommit+1);expect(cp.pending).toBeUndefined();expect(cp.recoveryHistory?.[ordinal-4].proof.fenced).toBe(true);expect(cp.lastRpcFailure?.code).toBe('FETCH_ERROR');expect(JSON.stringify(cp.lastRpcFailure)).not.toContain('secret-token');
  expect((await q('SELECT result FROM rag_current_requests WHERE request_id=$1',[nextId])).result.recovery).toBeUndefined();
  expect(JSON.stringify((cp.recoveryHistory??[]).slice(0,ordinal-4))).toBe(priorHistoryJson);
  expect((await q('SELECT md5(to_jsonb(q)::text) value FROM rag_current_requests q WHERE request_id=$1',[priorId])).value).toBe(priorMd5);expect((await q(legacyQuery,[LEGACY_RELEASE])).value).toBe(legacyMd5);
 }finally{await db.close();}
},120000);

it('captures only sanitized RPC categories, SQLSTATE and HTTP status',async()=>{
 for(const [message,allowed] of [['CURRENT_LEASE_INVALID',true],['CURRENT_LEASE_INVALID\nsecret',false],['payload secret-token',false]] as const){let error;try{await rpc({rpc:async()=>({status:400,error:{code:'P0001',message,details:'secret-token',hint:'secret-token'}})},'rag_current_commit',{});}catch(e){error=e;}const d=safeRpcDiagnostic(error);expect(d.code).toBe('P0001');expect(d.httpStatus).toBe(400);expect(d.message).toBe(allowed?message:undefined);expect(JSON.stringify(d)).not.toContain('secret-token');}
});
