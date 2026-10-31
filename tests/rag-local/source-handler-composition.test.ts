import { expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { handleAssistantRuntimeRequest, type AssistantRuntimeDeps, type SemanticChunk } from "../../supabase/functions/assistant-runtime/handler.ts";
import { generateChunksForPackage } from "../../src/lib/rag/chunking";
import { sha256CanonicalHex, normalizeCanonicalText } from "../../src/lib/rag/canonical-checksum";
import type { CurrentAiApproval } from "../../src/lib/rag/current-source-release";
import type { RagChunkRecord, ApprovedPackageRecord } from "../../src/lib/rag/types";

const approval = JSON.parse(readFileSync("artifacts/rag/current/approval-snapshot.json","utf8")) as CurrentAiApproval;
const records = JSON.parse(readFileSync("artifacts/rag/current/chunks.json","utf8")) as RagChunkRecord[];
const key="en/analyst-m1-l1-from-automation-to-insight/s0/c0";
const selected=records.find(x=>x.chunkId===key)!;
const pkg=approval.packages[`en|${selected.lessonId}`];
const sourceBytes=readFileSync(pkg.packagePath,"utf8");
const payload=JSON.parse(sourceBytes);
const record:ApprovedPackageRecord={lessonId:pkg.lessonId,locale:"en",moduleId:pkg.moduleId,trackId:pkg.trackId,
 packagePath:pkg.packagePath,productionRoute:pkg.productionRoute,sourceSha:approval.releaseId,packageChecksum:pkg.packageChecksum,
 canonicalVersion:pkg.canonicalVersion,title:payload.title};
const sample:SemanticChunk={id:"local-source-row",sourceId:selected.chunkId,locale:"en",lessonId:selected.lessonId,moduleId:selected.moduleId,
 pathId:selected.trackId,title:payload.title,content:selected.displayText,similarity:.9,packagePath:selected.packagePath,
 sourceSha:approval.releaseId,packageChecksum:pkg.packageChecksum,chunkChecksum:selected.textChecksum,contentVersion:pkg.canonicalVersion,
 indexVersion:approval.indexVersion,indexState:"active",sectionIndex:selected.sectionIndex,sectionRole:selected.sectionRole,
 chunkPosition:selected.chunkIndex,contentType:selected.contentType,productionRoute:pkg.productionRoute};
const request=(locale="en")=>new Request("http://localhost/assistant-runtime",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer explicit-local-fixture"},
 body:JSON.stringify({query:"Explain this approved lesson passage.",learnerContext:{product:"adult",locale,currentPath:pkg.trackId,
 currentModule:pkg.moduleId,currentLesson:pkg.lessonId,contentVersion:pkg.canonicalVersion}})});

function fixture(options:{corrupt?:boolean;withdraw?:boolean;throwModel?:boolean;empty?:boolean}={}) {
 let allowed=true,calls=0;
 const deps:AssistantRuntimeDeps={
  // Explicit TEST identities/billing/provider boundaries. No real JWT/model or
  // deployed RLS is certified. The full real corpus admission prefix executes.
  verifyJwt:async()=>({ok:true,userId:"11111111-1111-4111-8111-111111111111"}),
  consumeRateLimit:async()=>({allowed:true,resetAt:new Date().toISOString()}),
  env:{OPENAI_API_KEY:"fixture-only",OPENROUTER_API_KEY:"fixture-only",SUPABASE_URL:"https://fixture.invalid",SUPABASE_SERVICE_ROLE_KEY:"fixture-only"},
  billingRpc:async name=>({ok:true,data:name==="assistant_card_content_access"?{card_id:pkg.trackId,admin_review:false,lessons:{entitled_lesson_ids:allowed?[pkg.lessonId]:[]}}:
   name==="reserve_learner_ai_access"?{reservation_id:"22222222-2222-4222-8222-222222222222"}:{attempt_index:1}}),
  embedQuery:async()=>Array.from({length:1536},(_,i)=>i===0?1:0),
  localeSemanticRetrieve:async()=>{
   if(options.withdraw)allowed=false;
   return {ok:true,chunks:options.empty?[]:[options.corrupt?{...sample,content:sample.content+" unauthorized edit"}:sample]};
  },
  callLlm:async(_system,user)=>{calls++;expect(user).toContain(selected.displayText.slice(0,60));
   if(options.throwModel)throw new Error("PRIVATE_PROVIDER_DIAGNOSTIC_MUST_NOT_ESCAPE");
   return {ok:true,answer:"Explicit local model fixture, not a real provider response."};},
 };
 return {deps,calls:()=>calls};
}

it("derives the selected passage from actual committed lesson bytes and current approval without inventing source approval",()=>{
 expect(sha256CanonicalHex(sourceBytes)).toBe(pkg.packageChecksum);
 const generated=generateChunksForPackage(payload,record).find(x=>x.chunkId===key)!;
 expect(normalizeCanonicalText(generated.displayText)).toBe(sample.content);
 expect(sha256CanonicalHex(sample.content)).toBe(approval.chunks[key].textChecksum);
 writeFileSync("../evidence/actual-source-proof.json",JSON.stringify({source:pkg.packagePath,packageChecksum:pkg.packageChecksum,
  sourceId:key,contentChecksum:selected.textChecksum,releaseId:approval.releaseId,indexVersion:approval.indexVersion,
  sourceBytesMatched:true,realChunker:true,approvalClass:"existing committed snapshot; no current deployed or legal rights authority inferred",
  vectorIndexExecuted:false,realModelExecuted:false},null,2));
});

it("joins that REAL admitted source to the FULL handler/citations while keeping test provider and identity boundaries explicit",async()=>{
 const f=fixture();const res=await handleAssistantRuntimeRequest(request(),f.deps);const body=await res.json();
 expect(res.status).toBe(200);expect(f.calls()).toBe(1);expect(body.citations).toHaveLength(1);
 expect(body.citations[0].sourceSha).toBe(approval.releaseId);expect(body.citations[0].chunkId).toBe(key);
 expect(body.citations[0].packageChecksum).toBe(pkg.packageChecksum);
});

it.each([{corrupt:true},{empty:true},{withdraw:true}])("blocks unapproved/empty/withdrawn source without generation: %j",async options=>{
 const f=fixture(options);const response=await handleAssistantRuntimeRequest(request(),f.deps);
 expect([403,422]).toContain(response.status);expect(f.calls()).toBe(0);
 const body=await response.json();expect(body.ok).toBe(false);expect(body.citations??[]).toHaveLength(0);
});

it("contains raw provider exceptions with truthful attempted-call flags and no diagnostic disclosure",async()=>{
 const f=fixture({throwModel:true});const response=await handleAssistantRuntimeRequest(request(),f.deps);
 const body=await response.json();expect(response.status).toBe(500);expect(f.calls()).toBe(1);
 expect(JSON.stringify(body)).not.toContain("PRIVATE_PROVIDER");expect(body.providersCalled.llm).toBe(true);
});

it("fails closed without configured nonproduction provider capabilities",async()=>{
 const f=fixture();f.deps.env={};const response=await handleAssistantRuntimeRequest(request(),f.deps);
 expect(response.status).toBe(500);expect(f.calls()).toBe(0);
});
