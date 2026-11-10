import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
// Do not load a real lesson master, prompt, corpus or registry.
vi.mock("../../../src/lib/lesson-visuals/v1/production/renderingSpec", () => ({
  buildOpenAIImagesPrompt: () => "synthetic illustration fixture",
}));
import { mapOpenAIImagesResponseToInternal } from "../../../src/lib/lesson-visuals/v1/production/openaiImagesAdapter";
import { createMockProvider } from "../../../src/lib/lesson-visuals/v1/production/mockProvider";
import { runProductionCell, type RunCellArgs } from "../../../src/lib/lesson-visuals/v1/production/cellRunner";
import { encodeSolidPng } from "../../../src/lib/lesson-visuals/v1/production/pngCodec";
import { buildRuntimeQuotaContext } from "../../../src/lib/lesson-visuals/v1/production/quotaContext";
import { buildRunSummary } from "../../../src/lib/lesson-visuals/v1/production/runSummary";
import { validateRunSummarySchema } from "../../../src/lib/lesson-visuals/v1/production/schemaValidator";
import { loadPriorAcceptedReceipts } from "../../../src/lib/lesson-visuals/v1/production/priorReceipts";
import type { ProviderGenerationResponse, ProductionConfig, ProviderGenerationRequest } from "../../../src/lib/lesson-visuals/v1/production/types";
const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, {recursive:true,force:true}); });
const identity = {runId:"synthetic-cost-run",controlRoomAuthorizationId:"synthetic-cost-authority",contentSha:"a".repeat(40),executionSha:"b".repeat(40),approvedManifestSha256:"c".repeat(64)};
const config: ProductionConfig = {executionMode:"dry-run",providerName:"openai",providerModel:"synthetic-image",providerAccountId:"synthetic-account",providerProjectId:"synthetic-project",providerAuthId:"synthetic-auth",providerApiKeyPresent:true,providerAccountIdPresent:true,providerProjectIdPresent:true,providerAuthIdPresent:true,storageCredentialPresent:false,providerEndpoint:"https://provider.invalid",providerTimeoutMs:1000,runCostCeilingMicros:1000000n,cellCostCeilingMicros:100000n,maxOutputBytes:5000000,allowedMimeTypes:["image/png"],requiredWidth:64,requiredHeight:36,providerAttemptQuota:2,maxRetries:1,outputStorageTarget:"artifact://synthetic",lovableDispatchActorsRaw:"synthetic"};
function args(cost: string | null = null, failMode: "wrong-mime" | null = null) {
  const root=mkdtempSync(join(tmpdir(),"masaarat-cost-fixture-")); dirs.push(root);
  const mock=createMockProvider({providerName:config.providerName,model:config.providerModel,accountId:config.providerAccountId,projectId:config.providerProjectId,authId:config.providerAuthId,width:64,height:36,costMicros:"1234",failMode});
  const generate=vi.fn(async (request: ProviderGenerationRequest):Promise<ProviderGenerationResponse> => ({...await mock.generate(request),providerReportedCostMicros:cost}));
  const quota=buildRuntimeQuotaContext({...identity,mode:"full",allCellIds:["synthetic-lesson__en"],skippedCellIds:[],maxRetries:1,configuredProviderAttemptQuota:2});
  if (!quota.ok || !quota.context) throw new Error(quota.errors.join(";"));
  const a:RunCellArgs={...identity,artifactsRoot:root,config,transport:{generate,isMock:true},cellId:"synthetic-lesson__en",lessonId:"synthetic-lesson",locale:"en",method:2,promptOrRenderingSpec:"synthetic rendering fixture",attemptNumber:1,remainingRunBudgetMicros:1000000n,seenProviderRequestIds:new Set(),quotaContext:quota.context,countsAsExternalProviderAttempt:true};
  return {a,generate,root};
}
function summary(r:Awaited<ReturnType<typeof runProductionCell>>, overrides={}) {
 return buildRunSummary({...identity,mode:"full",executionMode:"dry-run",expectedCells:1,receipts:[r.receipt],mappings:r.mapping?[r.mapping]:[],totalCostMicros:r.costMicros??0n,runCostCeilingMicros:config.runCostCeilingMicros,providerAttemptQuota:2,providerAttemptsUsed:r.providerAttempted?1:0,...overrides});
}
describe("R06 truthful image cost and no automatic charge retry",()=>{
 it("maps valid OpenAI bytes to an unknown monetary charge, preserving actual request identity",async()=>{
  const {a,generate}=args(); const response=await generate({...identity,cellId:a.cellId,lessonId:a.lessonId,locale:"en",method:2,idempotencyKey:"synthetic",attemptNumber:1} as ProviderGenerationRequest);
  const request={...response,schemaVersion:"lesson-visual-provider-request/v1",promptOrRenderingSpec:"synthetic",expectedMimeTypes:["image/png"]} as unknown as ProviderGenerationRequest;
  const result=mapOpenAIImagesResponseToInternal({request,openaiBody:{created:1,data:[{b64_json:encodeSolidPng(64,36,[1,2,3]).toString("base64")}]},responseRequestId:"actual-synthetic-request",providerName:"openai",model:"synthetic-image",accountId:"synthetic-account",projectId:null,authId:"synthetic-auth",requiredWidth:64,requiredHeight:36,generatedAt:"2026-11-04T00:00:00Z"});
  expect(result.ok).toBe(true); expect(result.response?.providerReportedCostMicros).toBeNull(); expect(result.response?.providerMetadata.costStatus).toBe("unknown");expect(result.response?.providerRequestId).toBe("actual-synthetic-request");
 });
 it.each([null,"invalid", "-1", "1.5", ""]) ("holds unavailable or malformed charge %s as nonretryable with quarantined bytes",async cost=>{
  const {a,root,generate}=args(cost);const r=await runProductionCell(a);
  expect(generate).toHaveBeenCalledTimes(1); expect(r.receipt.status).toBe("NON_RETRYABLE_FAILURE");expect(r.receipt.failureCode).toBe("PROVIDER_COST_UNAVAILABLE");expect(r.receipt.retryable).toBe(false);expect(r.receipt.costMicros).toBeNull();expect(r.costMicros).toBeNull();expect(r.mapping).toBeNull();
  expect(readFileSync(r.receipt.outputPathOrStorageKey!)).toEqual(encodeSolidPng(64,36,Array.from(Buffer.from((await import("node:crypto")).createHash("sha256").update(a.cellId).digest()).subarray(0,3)) as [number,number,number]));
  expect(existsSync(join(root,"cells",a.cellId,"output.png"))).toBe(false); expect(existsSync(join(root,"mappings",`${a.cellId}.mapping.json`))).toBe(false);
 });
 it("does not spend again or overwrite evidence on same-operation retry or remount",async()=>{
  const {a,generate,root}=args();const first=await runProductionCell(a);const path=join(root,"receipts",`${a.cellId}.receipt.json`);const before=readFileSync(path,"utf8");const claim=readFileSync(join(root,"cells",a.cellId,"attempt-claim.json"),"utf8");
  const next=await runProductionCell({...a,attemptNumber:2,seenProviderRequestIds:new Set()});expect(generate).toHaveBeenCalledTimes(1);expect(next.receipt).toEqual(first.receipt);expect(next.providerAttempted).toBe(false);expect(next.costMicros).toBeNull();expect(readFileSync(path,"utf8")).toBe(before);expect(readFileSync(join(root,"cells",a.cellId,"attempt-claim.json"),"utf8")).toBe(claim);
 });
 it("refuses to overwrite an unresolved charge under a different run identity",async()=>{
  const {a,generate}=args();await runProductionCell(a);await expect(runProductionCell({...a,runId:"different-run"})).rejects.toThrow("different identity");expect(generate).toHaveBeenCalledTimes(1);
 });
 it("reports unknown aggregate total and fails, instead of accepting subtotal zero",async()=>{
  const {a}=args();const r=await runProductionCell(a);const s=summary(r);expect(s.totalCostMicros).toBeNull();expect(s.finalRunStatus).toBe("FAILED");expect(s.errors.join(";")).toContain("charge unresolved");expect(validateRunSummarySchema(s).ok).toBe(true);
 });
 it("retains a known charge when the image fails validation",async()=>{
  const {a}=args("1234","wrong-mime");const r=await runProductionCell(a);expect(r.receipt.status).toBe("RETRYABLE_FAILURE");expect(r.costMicros).toBe(1234n);expect(r.receipt.costMicros).toBe("1234");expect(summary(r).totalCostMicros).toBe("1234");
 });
 it("preserves a known positive valid response and its accepted mapping",async()=>{
  const {a}=args("1234");const r=await runProductionCell(a);expect(r.receipt.status).toBe("ACCEPTED");expect(r.costMicros).toBe(1234n);expect(r.mapping).not.toBeNull();expect(summary(r).totalCostMicros).toBe("1234");
 });
 it("keeps a pre-provider credential refusal at zero actual spend",async()=>{
  const {a,generate}=args();a.config={...a.config,executionMode:"production",providerApiKeyPresent:false};a.transport={generate};const r=await runProductionCell(a);expect(generate).not.toHaveBeenCalled();expect(r.costMicros).toBe(0n);expect(summary(r).totalCostMicros).toBe("0");
 });
 it("rejects an unexplained or successful unknown summary",async()=>{
  const {a}=args();const s=summary(await runProductionCell(a));expect(validateRunSummarySchema({...s,finalRunStatus:"SUCCESS"}).ok).toBe(false);expect(validateRunSummarySchema({...s,errors:[]}).ok).toBe(false);
 });
 it.each([null,undefined,"0","00","000","invalid","","-1","1.5"])("R06-F1 refuses unsupported accepted OpenAI charge %s in failed-only reuse",async cost=>{
  const {a,root}=args("1234");const r=await runProductionCell(a);const receipt={...r.receipt,costMicros:cost};writeFileSync(join(root,"receipts",`${a.cellId}.receipt.json`),JSON.stringify(receipt));
  const result=loadPriorAcceptedReceipts({mode:"failed-only",priorReceiptBundlePath:join(root,"receipts"),expectedContentSha:identity.contentSha,expectedManifestSha256:identity.approvedManifestSha256,expectedCellIds:[a.cellId],executionMode:"dry-run"});expect(result.ok).toBe(false);expect(result.errors.join(";")).toContain("authoritative OpenAI charge");
 });
 it.each(["0","00","000",undefined,"invalid"])("R06-F1 aggregate refuses unresolved numeric zero or malformed cost %s",async cost=>{
  const {a}=args("1234");const r=await runProductionCell(a);r.receipt.costMicros=cost as string;const s=summary(r,{totalCostMicros:0n});expect(s.totalCostMicros).toBeNull();expect(s.finalRunStatus).not.toBe("SUCCESS");
 });
 it("R06-F1 direct prior receipt reuse cannot bypass the same charge validator",async()=>{
  const {a,generate}=args("1234");const r=await runProductionCell(a);r.receipt.costMicros="00";await expect(runProductionCell({...a,priorAcceptedReceipt:r.receipt})).rejects.toThrow("unresolved charge");expect(generate).toHaveBeenCalledTimes(1);
 });
 it("R06-F1 retains validated positive-cost skipped reuse as zero current spend",async()=>{
  const {a,generate}=args("1234");const r=await runProductionCell(a);const skipped=await runProductionCell({...a,priorAcceptedReceipt:r.receipt});expect(skipped.receipt.status).toBe("SKIPPED");expect(skipped.costMicros).toBe(0n);expect(generate).toHaveBeenCalledTimes(1);expect(summary(skipped,{mode:"failed-only"}).totalCostMicros).toBe("0");
 });
});
