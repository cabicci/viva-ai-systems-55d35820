import{randomUUID}from"node:crypto";
import{RELEASE,VERSION,LEGACY_RELEASE,SOURCE_PROJECT,SOURCE_ORIGIN,TARGET_PROJECT,MODEL,DIMENSIONS,COUNT,release,canonical,sha,checkRows,rowsDigest,checkStoredRow,STORED_COLUMNS,type ReadyRow}from"./core";
import{rpc,exactOne,safeRpcDiagnostic}from"./client";
import{recoverReady,type RecoveryPlan,type RecoveryRecord}from"./recovery";
export type Pending={operation:"initialize"|"claim"|"claimed"|"commit"|"activate";requestId:string;leaseToken?:string;ordinal?:number;chunkIds?:string[]};
export type Checkpoint={schemaVersion:"masaarat-ready-import-checkpoint-v1";targetProject:string;artifactSha256:string;rowsDigest:string;legacyDigest:string;expectedActive:string;executionId?:string;pending?:Pending;confirmed:{requestId:string;operation:string;ordinal?:number}[];recoveryPending?:RecoveryPlan;recoveryHistory?:RecoveryRecord[];lastRpcFailure?:Record<string,unknown>};
export function validateEnvelope(e:any){
 if(!e||e.schemaVersion!=="masaarat-ready-result-transfer-v1"||e.sourceProject!==SOURCE_PROJECT||e.sourceOrigin!==SOURCE_ORIGIN||e.releaseId!==RELEASE||e.indexVersion!==VERSION||e.embeddingModel!==MODEL||e.embeddingDimensions!==DIMENSIONS||e.rowsCount!==COUNT||e.material!==release.material||e.materialSha256!==sha(release.material)||e.sourceStatus?.currentActiveVersion!==VERSION||e.sourceStatus?.state!=="active"||e.sourceStatus?.completedBatches!==61||e.sourceStatus?.totalBatches!==61||typeof e.sourceExecutionId!=="string"||!uuid(e.sourceExecutionId))throw new Error("READY_ARTIFACT_PROVENANCE_INVALID");
 checkRows(e.rows);if(rowsDigest(e.rows)!==e.rowSetDigest)throw new Error("READY_ARTIFACT_ROWS_DIGEST_MISMATCH");return e.rows as ReadyRow[];
}
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
async function pages(db:any,table:string,columns:string,field:string,value:string,order:string){const size=table==="knowledge_chunks"?64:500;const out:any[]=[];for(let offset=0;offset<100000;offset+=size){const r=await db.from(table).select(columns).eq(field,value).order(order).range(offset,offset+size-1);if(r.error||!Array.isArray(r.data))throw new Error("READY_READ_UNAVAILABLE");out.push(...r.data);if(r.data.length<size)return out;}throw new Error("READY_SCOPE_LIMIT");}
export async function legacyDigest(db:any){const r=await exactOne(db,"rag_current_releases","*","release_id",LEGACY_RELEASE),b=await pages(db,"rag_current_batches","*","release_id",LEGACY_RELEASE,"ordinal"),q=await pages(db,"rag_current_requests","*","release_id",LEGACY_RELEASE,"request_id");
 if(!r||b.length!==61||!b.some(x=>x.ordinal===19&&x.state==="inflight"&&x.provider_reserved===true))throw new Error("READY_LEGACY_AUDIT_CHANGED");return sha(canonical({release:r,batches:b,requests:q}));}
export async function targetRows(db:any,state:"staging"|"active",ids?:string[]){
 let rows:any[]=[];
 if(ids){const r=await db.from("knowledge_chunks").select(STORED_COLUMNS).eq("index_version",VERSION).in("source_id",ids).order("source_id");if(r.error||!Array.isArray(r.data))throw new Error("READY_READ_UNAVAILABLE");rows=r.data;}
 else rows=await pages(db,"knowledge_chunks",STORED_COLUMNS,"index_version",VERSION,"source_id");
 return rows.map(k=>checkStoredRow(k,state));
}
export async function proveComplete(db:any,rows:ReadyRow[],state:"staging"|"active",executionId?:string){
 const status=await rpc(db,"rag_current_status",{p_release_id:RELEASE});
 if(status.state!==state||status.totalBatches!==61||status.completedBatches!==61||status.providerAttempts!==0||(executionId&&status.executionId!==executionId)||(state==="active"&&status.currentActiveVersion!==VERSION))throw new Error("READY_TARGET_NOT_COMPLETE");
 const batches=await pages(db,"rag_current_batches","ordinal,chunk_ids,state,request_id,provider_reserved","release_id",RELEASE,"ordinal");
 if(batches.length!==61||batches.some((b,i)=>b.ordinal!==i||b.state!=="done"||b.provider_reserved!==false||canonical(b.chunk_ids)!==canonical(release.chunks.slice(i*64,i*64+64).map(c=>c.chunkId))))throw new Error("READY_TARGET_BATCH_PROOF_INVALID");
 const actual=await targetRows(db,state);checkRows(actual);if(rowsDigest(actual)!==rowsDigest(rows))throw new Error("READY_TARGET_VECTOR_READBACK_MISMATCH");return status;
}
export async function readyImport(options:{db:any;rows:ReadyRow[];artifactSha256:string;mode:"preflight"|"import"|"validate"|"activate"|"reconcile"|"prepare-recovery"|"readback-recovery";maxBatches:number;expectedActive?:string;checkpoint?:Checkpoint;checkpointRawSha256?:string;save(c:Checkpoint):void;log(v:unknown):void}){
 const{db,rows}=options;checkRows(rows);const digest=rowsDigest(rows),oldDigest=await legacyDigest(db);
 let cp=options.checkpoint;
 const status=await rpc(db,"rag_current_status",{p_release_id:RELEASE});
 const existing=await exactOne(db,"rag_current_releases","release_id,execution_id,material,approval,provider_attempts","release_id",RELEASE);
 if(cp){if(cp.schemaVersion!=="masaarat-ready-import-checkpoint-v1"||cp.targetProject!==TARGET_PROJECT||cp.artifactSha256!==options.artifactSha256||cp.rowsDigest!==digest||cp.legacyDigest!==oldDigest||!Array.isArray(cp.confirmed))throw new Error("READY_CHECKPOINT_OR_LEGACY_CHANGED");}
 if(existing&&(existing.material!==release.material||canonical(existing.approval)!==canonical(JSON.parse(release.material))||existing.provider_attempts!==0))throw new Error("READY_TARGET_COLLISION");
 if(cp?.executionId&&existing?.execution_id!==cp.executionId)throw new Error("READY_TARGET_EXECUTION_CHANGED");
 if(!cp&&existing&&options.mode!=="preflight")throw new Error("READY_EXISTING_TARGET_REQUIRES_OWN_CHECKPOINT");
 if(options.mode==="preflight"){
  const targetRowsCount=(await db.from("knowledge_chunks").select("source_id",{count:"exact",head:true}).eq("index_version",VERSION));
  const version=await exactOne(db,"rag_index_versions","version_key,source_sha,status,chunk_count,embedding_model","version_key",VERSION);
  if(targetRowsCount.error)throw new Error("READY_READ_UNAVAILABLE");
  if(!existing&&(version||targetRowsCount.count!==0))throw new Error("READY_TARGET_COLLISION");
  const report={preflight:true,releaseId:RELEASE,sourceRows:rows.length,targetExists:!!existing,targetState:status.state??null,targetRows:targetRowsCount.count,activeVersion:status.currentActiveVersion,legacyDigest:oldDigest,providerCalls:0};options.log(report);return report;
 }
 if(!cp){if(options.mode!=="import"||typeof status.currentActiveVersion!=="string"||!status.currentActiveVersion)throw new Error("READY_IMPORT_INITIAL_STATE_REQUIRED");
  const collision=await db.from("knowledge_chunks").select("source_id",{count:"exact",head:true}).eq("index_version",VERSION);const version=await exactOne(db,"rag_index_versions","version_key","version_key",VERSION);
  if(collision.error||collision.count!==0||version)throw new Error("READY_TARGET_COLLISION");
  cp={schemaVersion:"masaarat-ready-import-checkpoint-v1",targetProject:TARGET_PROJECT,artifactSha256:options.artifactSha256,rowsDigest:digest,legacyDigest:oldDigest,expectedActive:status.currentActiveVersion,confirmed:[]};options.save(cp);
 }
 const checkpoint=cp;
 if(options.mode==='prepare-recovery'||options.mode==='readback-recovery')return recoverReady({db,checkpoint,mode:options.mode,checkpointRawSha256:options.checkpointRawSha256,save:options.save,log:options.log});
 if(checkpoint.recoveryPending)throw Error('READY_RECOVERY_REQUIRES_EXPLICIT_READBACK');
 function diagnostic(error:unknown){checkpoint.lastRpcFailure=safeRpcDiagnostic(error);options.save(checkpoint);options.log({rpcFailure:checkpoint.lastRpcFailure,willRetry:false});}
 const byId=new Map(rows.map(r=>[r.chunkId,r]));
 async function audit(){if(await legacyDigest(db)!==checkpoint.legacyDigest)throw new Error("READY_LEGACY_AUDIT_CHANGED");}
 async function requestRecord(id:string){return exactOne(db,"rag_current_requests","request_id,release_id,operation,result","request_id",id);}
 async function batchProof(p:NonNullable<Checkpoint["pending"]>){
  const b=await db.from("rag_current_batches").select("ordinal,chunk_ids,state,request_id,lease_token,provider_reserved").eq("release_id",RELEASE).eq("request_id",p.requestId).maybeSingle();
  if(b.error||!b.data||b.data.state!=="done"||b.data.provider_reserved!==false||b.data.ordinal!==p.ordinal||b.data.lease_token!==p.leaseToken||canonical(b.data.chunk_ids)!==canonical(p.chunkIds))throw new Error("READY_COMMIT_UNCONFIRMED");
  const actual=await targetRows(db,"staging",p.chunkIds);if(actual.length!==p.chunkIds!.length||rowsDigest(actual)!==rowsDigest(p.chunkIds!.map(id=>byId.get(id)!)))throw new Error("READY_COMMIT_READBACK_MISMATCH");
 }
 async function reconcile(){const pending=checkpoint.pending;if(!pending)return;const record=await requestRecord(pending.requestId);
  const op=["claim","claimed","commit"].includes(pending.operation)?"batch":pending.operation;
  if(!record||record.release_id!==RELEASE||record.operation!==op)throw new Error("READY_MUTATION_UNKNOWN_NO_RETRY");
  if(pending.operation==="initialize"){
   const current=await exactOne(db,"rag_current_releases","release_id,execution_id,material,provider_attempts","release_id",RELEASE);
   if(!current||current.material!==release.material||current.provider_attempts!==0||!uuid(current.execution_id)||record.result.executionId!==current.execution_id)throw new Error("READY_INITIALIZE_UNCONFIRMED");
   checkpoint.executionId=current.execution_id;
  }else if(pending.operation==="claim"||pending.operation==="claimed"){
   const claim=record.result;
   if(claim.committed===true)throw new Error("READY_CLAIM_CHECKPOINT_RECONCILIATION_REQUIRED");
   if(!uuid(claim.leaseToken)||!Array.isArray(claim.chunkIds)||!Number.isInteger(claim.ordinal)||claim.ordinal<0||claim.ordinal>60||canonical(claim.chunkIds)!==canonical(release.chunks.slice(claim.ordinal*64,claim.ordinal*64+64).map(c=>c.chunkId)))throw new Error("READY_CLAIM_UNCONFIRMED");
   const live=await db.from("rag_current_batches").select("state,request_id,lease_token,lease_until,provider_reserved").eq("release_id",RELEASE).eq("request_id",pending.requestId).maybeSingle();
   if(live.error||live.data?.state!=="inflight"||live.data.provider_reserved!==false||live.data.lease_token!==claim.leaseToken||!Number.isFinite(Date.parse(live.data.lease_until))||Date.parse(live.data.lease_until)<=Date.now())throw new Error("READY_CLAIM_LEASE_INVALID");
   checkpoint.pending={operation:"claimed",requestId:pending.requestId,leaseToken:claim.leaseToken,ordinal:claim.ordinal,chunkIds:claim.chunkIds};options.save(checkpoint);return;
  }else if(pending.operation==="commit"){
   if(record.result.committed!==true||record.result.done!==true||record.result.ordinal!==pending.ordinal||record.result.acceptedRows!==pending.chunkIds?.length)throw new Error("READY_MUTATION_UNKNOWN_NO_RETRY");await batchProof(pending);
  }else{
   if(record.result.activated!==true||record.result.version!==VERSION||record.result.previousVersion!==checkpoint.expectedActive)throw new Error("READY_ACTIVATION_UNCONFIRMED");await proveComplete(db,rows,"active",checkpoint.executionId);
  }
  checkpoint.confirmed.push({operation:pending.operation,requestId:pending.requestId,...(pending.ordinal!==undefined?{ordinal:pending.ordinal}:{})});delete checkpoint.pending;await audit();options.save(checkpoint);
 }
 if(checkpoint.pending){await reconcile();if(options.mode==="reconcile"){const r={reconciled:true,pending:checkpoint.pending?.operation??null,providerCalls:0};options.log(r);return r;}}
 if(options.mode==="reconcile"){const r={reconciled:true,pending:null,providerCalls:0};options.log(r);return r;}
 if(options.mode==="activate"&&checkpoint.confirmed.some(r=>r.operation==="activate")){
  await proveComplete(db,rows,"active",checkpoint.executionId);await audit();const r={activated:true,alreadyConfirmed:true,indexVersion:VERSION,rows:COUNT,providerCalls:0,legacyAuditUnchanged:true};options.log(r);return r;
 }
 if(!checkpoint.executionId){
  if(options.mode!=="import")throw new Error("READY_TARGET_EXECUTION_REQUIRED");
  checkpoint.pending={operation:"initialize",requestId:randomUUID()};options.save(checkpoint);
  try{await rpc(db,"rag_current_initialize",{p_release_id:RELEASE,p_material:release.material,p_request_id:checkpoint.pending.requestId});}catch(error){diagnostic(error);/* Readback decides; never repeat initialize. */}
  await reconcile();
 }
 if(options.mode==="import"){
  let committed=0;
  while(committed<options.maxBatches){
   const current=await rpc(db,"rag_current_status",{p_release_id:RELEASE});
   if(current.state!=="staging"||current.executionId!==checkpoint.executionId||current.providerAttempts!==0)throw new Error("READY_TARGET_STATE_CHANGED");
   if(current.completedBatches===61)break;
   if(!checkpoint.pending){checkpoint.pending={operation:"claim",requestId:randomUUID()};options.save(checkpoint);
    try{await rpc(db,"rag_current_claim",{p_release_id:RELEASE,p_execution_id:checkpoint.executionId,p_request_id:checkpoint.pending.requestId});}catch(error){diagnostic(error);/* Readback only; no second claim. */}await reconcile();}
   const p=checkpoint.pending;if(!p||p.operation!=="claimed"||!p.chunkIds||!p.leaseToken)throw new Error("READY_CLAIM_PROOF_REQUIRED");
   const selected=p.chunkIds.map(id=>{const value=byId.get(id);if(!value)throw new Error("READY_UNEXPORTED_CHUNK");return value;});
   checkpoint.pending={...p,operation:"commit"};options.save(checkpoint);
   // Existing validator commits existing vectors. There is deliberately no reserve/embed/AI dependency.
   try{await rpc(db,"rag_current_commit",{p_release_id:RELEASE,p_execution_id:checkpoint.executionId,p_request_id:p.requestId,p_lease_token:p.leaseToken,p_rows:selected});}catch(error){diagnostic(error);/* Exact committed receipt + stored vectors decide; no second commit. */}
   await reconcile();committed++;options.log({committedBatchesThisRun:committed,ordinal:p.ordinal,providerCalls:0});
  }
  await audit();const current=await rpc(db,"rag_current_status",{p_release_id:RELEASE});if(current.completedBatches===61)await proveComplete(db,rows,"staging",checkpoint.executionId);
  const r={imported:true,completedBatches:current.completedBatches,totalBatches:61,inactive:true,providerCalls:0};options.log(r);return r;
 }
 if(options.mode==="validate"){const current=await rpc(db,"rag_current_status",{p_release_id:RELEASE});await proveComplete(db,rows,current.state==="active"?"active":"staging",checkpoint.executionId);await audit();const r={validated:true,rows:COUNT,providerCalls:0,legacyAuditUnchanged:true};options.log(r);return r;}
 if(options.mode!=="activate"||options.expectedActive!==checkpoint.expectedActive)throw new Error("READY_EXACT_EXPECTED_ACTIVE_REQUIRED");
 await proveComplete(db,rows,"staging",checkpoint.executionId);await audit();
 checkpoint.pending={operation:"activate",requestId:randomUUID()};options.save(checkpoint);
 try{await rpc(db,"rag_current_activate",{p_release_id:RELEASE,p_execution_id:checkpoint.executionId,p_request_id:checkpoint.pending.requestId,p_expected_active:checkpoint.expectedActive});}catch(error){diagnostic(error);/* Exact activation receipt/readback only; no second active switch. */}
 await reconcile();const r={activated:true,indexVersion:VERSION,rows:COUNT,providerCalls:0,legacyAuditUnchanged:true};options.log(r);return r;
}
