import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {RELEASE,VERSION,release,canonical,sha} from './core';
import {exactOne,rpc} from './client';
import {FIXED_RECOVERY as pin} from './recovery-pins';
import type {Checkpoint,Pending} from './import-core';
export type RecoveryPlan={schemaVersion:'ready-result-recovery-plan-v1';priorCheckpointSha256:string;priorPending:Pending;priorRequestSha256:string;nextRequestId:string;preparedAt:string};
export type RecoveryRecord=RecoveryPlan&{proof:Record<string,unknown>;recoveredAt:string};
const md5=(s:string)=>createHash('md5').update(s).digest('hex');
// PostgreSQL jsonb orders object keys by UTF8 length then bytes. This bounded
// record has ASCII keys/UUIDs/chunk IDs and integer ordinal, so no numeric ambiguity.
export function claimJsonbText(v:any):string{
 if(Array.isArray(v))return '['+v.map(claimJsonbText).join(', ')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).sort((a,b)=>Buffer.byteLength(a)-Buffer.byteLength(b)||Buffer.compare(Buffer.from(a),Buffer.from(b))).map(k=>JSON.stringify(k)+': '+claimJsonbText(v[k])).join(', ')+'}';
 const text=JSON.stringify(v);if(typeof text!=='string')throw Error('READY_RECOVERY_NON_JSON_RECORD');return text;
}
export const checkpointSha=(c:Checkpoint)=>sha(JSON.stringify(c,null,2)+'\n');
export async function recoverReady(options:{db:any;checkpoint:Checkpoint;mode:'prepare-recovery'|'readback-recovery';checkpointRawSha256?:string;save(c:Checkpoint):void;log(v:unknown):void}){
 const{db,checkpoint:cp}=options;
 if(cp.executionId!==pin.executionId||cp.artifactSha256!==pin.artifactSha256)throw Error('READY_RECOVERY_SCOPE_CHANGED');
 const status=await rpc(db,'rag_current_status',{p_release_id:RELEASE});
 if(status.executionId!==pin.executionId||status.state!=='staging'||status.currentActiveVersion!==cp.expectedActive||status.providerAttempts!==0||status.completedBatches!==4||status.totalBatches!==61)throw Error('READY_RECOVERY_TARGET_CHANGED');
 const ids=release.chunks.slice(pin.ordinal*64,(pin.ordinal+1)*64).map(c=>c.chunkId);
 const prior=await exactOne(db,'rag_current_requests','request_id,release_id,operation,result','request_id',pin.priorRequestId);
 if(!prior||prior.release_id!==RELEASE||prior.operation!=='batch'||md5(claimJsonbText(prior))!==pin.priorRequestMd5)throw Error('READY_RECOVERY_PRIOR_REQUEST_CHANGED');
 const batch=await db.from('rag_current_batches').select('ordinal,chunk_ids,state,request_id,lease_token,lease_until,provider_reserved').eq('release_id',RELEASE).eq('ordinal',pin.ordinal).maybeSingle();
 if(batch.error||!batch.data||batch.data.state!=='inflight'||batch.data.provider_reserved!==false||canonical(batch.data.chunk_ids)!==canonical(ids))throw Error('READY_RECOVERY_BATCH_CHANGED');
 const count=await db.from('knowledge_chunks').select('source_id',{count:'exact',head:true}).eq('index_version',VERSION).in('source_id',ids);
 if(count.error||count.count!==0)throw Error('READY_RECOVERY_ROWS_NOT_EMPTY');
 const next=await exactOne(db,'rag_current_requests','request_id,release_id,operation,result','request_id',pin.nextRequestId);
 if(options.mode==='prepare-recovery'){
  if(cp.recoveryPending||cp.recoveryHistory?.length||options.checkpointRawSha256!==pin.priorCheckpointSha256)throw Error('READY_RECOVERY_EXACT_CHECKPOINT_REQUIRED');
  const p=cp.pending;
  if(!p||p.operation!=='commit'||p.requestId!==pin.priorRequestId||p.ordinal!==pin.ordinal||!p.leaseToken||md5(p.leaseToken)!==pin.priorLeaseMd5||canonical(p.chunkIds)!==canonical(ids)
   ||batch.data.request_id!==p.requestId||batch.data.lease_token!==p.leaseToken||!Number.isFinite(Date.parse(batch.data.lease_until))||Date.parse(batch.data.lease_until)>=Date.now()||next)throw Error('READY_RECOVERY_PREIMAGE_NOT_PROVEN');
  if(canonical(prior.result)!==canonical({leaseToken:p.leaseToken,chunkIds:ids,ordinal:pin.ordinal}))throw Error('READY_RECOVERY_PRIOR_REQUEST_CHANGED');
  cp.recoveryPending={schemaVersion:'ready-result-recovery-plan-v1',priorCheckpointSha256:pin.priorCheckpointSha256,priorPending:structuredClone(p),priorRequestSha256:sha(canonical(prior)),nextRequestId:pin.nextRequestId,preparedAt:new Date().toISOString()};
  options.save(cp);const result={planId:pin.nextRequestId,checkpointSha256:checkpointSha(cp)};options.log(result);return result;
 }
 const plan=cp.recoveryPending;
 if(!plan||plan.schemaVersion!=='ready-result-recovery-plan-v1'||plan.priorCheckpointSha256!==pin.priorCheckpointSha256||plan.nextRequestId!==pin.nextRequestId||plan.priorPending.operation!=='commit'||plan.priorPending.requestId!==pin.priorRequestId||canonical(cp.pending)!==canonical(plan.priorPending)||sha(canonical(prior))!==plan.priorRequestSha256)throw Error('READY_RECOVERY_PLAN_REQUIRED');
 if(!next||next.release_id!==RELEASE||next.operation!=='batch')throw Error('READY_RECOVERY_NOT_RECORDED_NO_RETRY');
 const proof=next.result?.recovery;
 const expected={schemaVersion:'ready-result-expired-nonprovider-recovery-v1',priorRequestId:pin.priorRequestId,nextRequestId:pin.nextRequestId,executionId:pin.executionId,ordinal:pin.ordinal,priorLeaseMd5:pin.priorLeaseMd5,priorRequestMd5:pin.priorRequestMd5,priorCheckpointSha256:pin.priorCheckpointSha256,priorStoredRows:0,providerAttempts:0,providerReserved:false,legacyAuditMd5:pin.legacyAuditMd5,fenced:true};
 if(!proof||Object.entries(expected).some(([k,v])=>proof[k]!==v)||!Number.isFinite(Date.parse(proof.observedAt))||next.result.ordinal!==pin.ordinal||canonical(next.result.chunkIds)!==canonical(ids)||typeof next.result.leaseToken!=='string'||next.result.leaseToken===plan.priorPending.leaseToken||batch.data.request_id!==pin.nextRequestId||batch.data.lease_token!==next.result.leaseToken||!Number.isFinite(Date.parse(batch.data.lease_until))||Date.parse(batch.data.lease_until)<=Date.now())throw Error('READY_RECOVERY_FENCE_UNCONFIRMED');
 cp.recoveryHistory=[...(cp.recoveryHistory??[]),{...structuredClone(plan),proof:structuredClone(proof),recoveredAt:new Date().toISOString()}];
 cp.pending={operation:'claimed',requestId:pin.nextRequestId,leaseToken:next.result.leaseToken,ordinal:pin.ordinal,chunkIds:ids};delete cp.recoveryPending;
 options.save(cp);const result={planId:pin.nextRequestId,checkpointSha256:checkpointSha(cp)};options.log(result);return result;
}
