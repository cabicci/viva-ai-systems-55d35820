import{createHash}from"node:crypto";
import approval from"../../../artifacts/rag/current/approval-snapshot.json";
import chunks from"../../../artifacts/rag/current/chunks.json";
import{validateCurrentRelease}from"../../../src/lib/rag/current-release/corpus";
export const SOURCE_PROJECT="0d675f0a-ecc5-4c62-9217-54973c927902";
export const TARGET_PROJECT="658adce0-747d-4c8e-90e3-d22225070b94";
export const SOURCE_ORIGIN="https://rifujqqlqtfmopaukghn.supabase.co";
export const TARGET_ORIGIN="https://abyqqeboyrkkwhjpwmtd.supabase.co";
export const RELEASE="0c0f31b61c596fd6b8687bb156911f8d28613581af0fcf5f7ac4063dce3c1b85";
export const VERSION=`rag-current-v1-${RELEASE}`;
export const LEGACY_RELEASE="11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5";
export const MODEL="text-embedding-3-small",DIMENSIONS=1536,COUNT=3851;
export const release=validateCurrentRelease(approval as never,chunks as never);
if(release.approval.releaseId!==RELEASE||release.chunks.length!==COUNT)throw new Error("READY_COMPILED_RELEASE_CHANGED");
export const expected=new Map(release.chunks.map(c=>[c.chunkId,c]));
export const sha=(value:string|Uint8Array)=>createHash("sha256").update(value).digest("hex");
export function canonical(value:unknown):string{
 if(Array.isArray(value))return"["+value.map(canonical).join(",")+"]";
 if(value&&typeof value==="object")return"{"+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+":"+canonical(v)).join(",")+"}";
 const text=JSON.stringify(value);if(text===undefined)throw new Error("READY_NON_JSON_DATA");return text;
}
export function backendOrigin(value:string|undefined,origin:string){
 if(!value)throw new Error("READY_BACKEND_REQUIRED");const u=new URL(value);
 if(u.origin!==origin||u.pathname!=="/"||u.username||u.password||u.search||u.hash)throw new Error("READY_BACKEND_TARGET_MISMATCH");return origin;
}
export type ReadyRow={chunkId:string;content:string;embedding:number[]};
export function vector(value:unknown):number[]{
 const v=typeof value==="string"?JSON.parse(value):value;
 if(!Array.isArray(v)||v.length!==DIMENSIONS||v.some(n=>typeof n!=="number"||!Number.isFinite(n)))throw new Error("READY_VECTOR_INVALID");
 const norm2=v.reduce((sum,n)=>sum+n*n,0);if(!(norm2>1e-40&&norm2<1e20))throw new Error("READY_VECTOR_INVALID");return v;
}
export function checkStoredRow(k:any,state:"active"|"staging"):ReadyRow{
 const c=expected.get(k.source_id),d=(release.approval.chunks as any)[k.source_id],p=d&&(release.approval.packages as any)[d.packageKey];
 if(!c||!p||k.source_type!=="locale_lesson"||k.index_version!==VERSION||k.source_sha!==RELEASE||k.index_state!==state||k.indexing_failed!==false||
  k.path_id!==p.trackId||k.module_id!==p.moduleId||k.lesson_id!==p.lessonId||k.locale!==p.locale||k.package_path!==p.packagePath||
  k.package_checksum!==p.packageChecksum||k.content_version!==p.canonicalVersion||k.production_route!==p.productionRoute||
  k.title!==d.sectionHeading||k.section_index!==d.sectionIndex||k.section_role!==d.sectionRole||k.chunk_position!==d.chunkIndex||k.content_type!==d.contentType||
  k.chunk_checksum!==d.textChecksum||k.content!==c.displayText||sha(k.content)!==d.textChecksum)throw new Error("READY_STORED_SOURCE_MISMATCH");
 return{chunkId:c.chunkId,content:c.displayText,embedding:vector(k.embedding)};
}
export function checkRows(rows:ReadyRow[]){
 if(!Array.isArray(rows)||rows.length!==COUNT||new Set(rows.map(r=>r.chunkId)).size!==COUNT)throw new Error("READY_INCOMPLETE_ROWS");
 for(const r of rows){const c=expected.get(r.chunkId);if(!c||r.content!==c.displayText||sha(r.content)!==c.textChecksum)throw new Error("READY_ROW_SOURCE_MISMATCH");vector(r.embedding);}
}
export function rowsDigest(rows:ReadyRow[]){const h=createHash("sha256");for(const r of rows.slice().sort((a,b)=>a.chunkId<b.chunkId?-1:a.chunkId>b.chunkId?1:0))h.update(JSON.stringify([r.chunkId,r.content,r.embedding])+"\n");return h.digest("hex");}
export function providerForbidden():never{throw new Error("READY_PROMOTION_PROVIDER_FORBIDDEN");}
export const STORED_COLUMNS="source_type,source_id,path_id,module_id,lesson_id,title,content,embedding,locale,package_path,source_sha,package_checksum,chunk_checksum,content_version,index_version,index_state,section_index,section_role,chunk_position,content_type,production_route,indexing_failed";
