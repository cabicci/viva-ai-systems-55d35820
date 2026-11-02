// Read-only export of an already active, complete result. Contains no provider implementation.
import{writeFileSync,existsSync}from"node:fs";import{gzipSync}from"node:zlib";
import{SOURCE_PROJECT,SOURCE_ORIGIN,RELEASE,VERSION,MODEL,DIMENSIONS,COUNT,release,canonical,sha,checkRows,rowsDigest,checkStoredRow,STORED_COLUMNS,type ReadyRow}from"./core";
import{serverClient,rpc,exactOne}from"./client";
const args=new Map(process.argv.slice(2).map(arg=>{const m=/^--(project|output)=(.+)$/.exec(arg);if(!m)throw new Error("READY_EXPORT_ARGUMENT_INVALID");return[m[1],m[2]];}));
if(args.size!==2||args.get("project")!==SOURCE_PROJECT||!args.get("output"))throw new Error("READY_EXPORT_EXACT_PROJECT_REQUIRED");
const output=args.get("output")!;if(existsSync(output)||existsSync(output+".receipt.json"))throw new Error("READY_EXPORT_PATH_EXISTS");
try{
 const db=serverClient(SOURCE_ORIGIN),before=await rpc(db,"rag_current_status",{p_release_id:RELEASE});
 if(before.currentActiveVersion!==VERSION||before.state!=="active"||before.completedBatches!==61||before.totalBatches!==61)throw new Error("READY_SOURCE_NOT_COMPLETE_ACTIVE");
 const catalog=await exactOne(db,"rag_index_versions","version_key,source_sha,status,package_count,chunk_count,chunk_manifest_checksum,embedding_model","version_key",VERSION);
 if(!catalog||catalog.status!=="active"||catalog.source_sha!==RELEASE||catalog.chunk_manifest_checksum!==RELEASE||catalog.embedding_model!==MODEL||catalog.package_count!==400||catalog.chunk_count!==COUNT)throw new Error("READY_SOURCE_CATALOG_MISMATCH");
 const sourceRelease=await exactOne(db,"rag_current_releases","release_id,execution_id,material,approval,provider_attempts","release_id",RELEASE);
 if(!sourceRelease||sourceRelease.material!==release.material||canonical(sourceRelease.approval)!==canonical(JSON.parse(release.material)))throw new Error("READY_SOURCE_APPROVAL_MISMATCH");
 const batches=await db.from("rag_current_batches").select("ordinal,chunk_ids,state,provider_reserved,request_id").eq("release_id",RELEASE).order("ordinal");
 if(batches.error||batches.data?.length!==61||batches.data.some((b:any,i:number)=>b.ordinal!==i||b.state!=="done"||canonical(b.chunk_ids)!==canonical(release.chunks.slice(i*64,i*64+64).map(c=>c.chunkId))))throw new Error("READY_SOURCE_BATCHES_INCOMPLETE");
 const rows:ReadyRow[]=[];
 for(let offset=0;offset<COUNT;offset+=64){const r=await db.from("knowledge_chunks").select(STORED_COLUMNS).eq("index_version",VERSION).eq("source_type","locale_lesson").order("source_id").range(offset,offset+63);if(r.error||!Array.isArray(r.data))throw new Error("READY_SOURCE_ROWS_UNAVAILABLE");rows.push(...r.data.map((k:any)=>checkStoredRow(k,"active")));}
 checkRows(rows);const after=await rpc(db,"rag_current_status",{p_release_id:RELEASE});if(canonical(before)!==canonical(after))throw new Error("READY_SOURCE_CHANGED_DURING_EXPORT");
 const envelope={schemaVersion:"masaarat-ready-result-transfer-v1",sourceProject:SOURCE_PROJECT,sourceOrigin:SOURCE_ORIGIN,releaseId:RELEASE,indexVersion:VERSION,embeddingModel:MODEL,embeddingDimensions:DIMENSIONS,rowsCount:COUNT,material:release.material,materialSha256:sha(release.material),sourceStatus:after,sourceCatalog:catalog,sourceExecutionId:sourceRelease.execution_id,sourceBatchesDigest:sha(canonical(batches.data)),rowSetDigest:rowsDigest(rows),rows};
 const raw=Buffer.from(JSON.stringify(envelope)),compressed=gzipSync(raw,{level:9}),receipt={sourceProject:SOURCE_PROJECT,sourceOrigin:SOURCE_ORIGIN,releaseId:RELEASE,indexVersion:VERSION,rows:COUNT,model:MODEL,dimensions:DIMENSIONS,compressedSha256:sha(compressed),uncompressedSha256:sha(raw),rowSetDigest:envelope.rowSetDigest,sourceExecutionId:sourceRelease.execution_id,bytes:compressed.length,providerCalls:0,mutations:0};
 writeFileSync(output,compressed,{flag:"wx"});writeFileSync(output+".receipt.json",JSON.stringify(receipt,null,2)+"\n",{flag:"wx"});console.log(JSON.stringify(receipt));
}catch{console.error("Ready-result export stopped: source or provenance could not be verified. No writes to the backend or provider calls were made.");process.exitCode=1;}
