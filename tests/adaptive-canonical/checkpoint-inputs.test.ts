// @vitest-environment node
import { normalizeApiResult } from "../../scripts/adaptive-canonical/types.ts";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Hoisted allocation and mock protect ordinary Vitest runs, not just the
// offline runner. Never derive cleanup authority from production constants.
const ownedReports = await vi.hoisted(async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const os = await import("node:os");
  const parent = path.resolve(os.tmpdir());
  const root = await fs.mkdtemp(path.join(parent, "r09-checkpoint-owned-"));
  return { parent, root, reports: path.join(root, "reports") };
});
vi.mock("../../scripts/adaptive-canonical/lib/corpus.ts", () => ({ REPORTS_DIR: ownedReports.reports }));
import { CHECKPOINT_JSON, loadCheckpoint, loadPreviousEntries, buildRunPlan, writeCheckpoint, writePreservingFile } from "../../scripts/adaptive-canonical/lib/checkpoint.ts";
import { inputFingerprint, CheckpointReviewRequired } from "../../scripts/adaptive-canonical/lib/input-identity.ts";
import { ReviewUncertainError, ReviewRejectedError, isRetryableError, reviewTimeoutMs, withRetry, withTimeout } from "../../scripts/adaptive-canonical/lib/retry.ts";
const dir = ownedReports.reports;
async function assertOwnedReports() {
  if (path.dirname(ownedReports.root) !== ownedReports.parent ||
      !path.basename(ownedReports.root).startsWith("r09-checkpoint-owned-") ||
      dir !== path.join(ownedReports.root, "reports") ||
      CHECKPOINT_JSON !== path.join(dir, "API_AUDIT_checkpoint.json")) {
    throw new Error("Refusing foreign checkpoint fixture cleanup");
  }
  const rootInfo = await fs.lstat(ownedReports.root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("Invalid fixture owner");
  try {
    const reportInfo = await fs.lstat(dir);
    if (!reportInfo.isDirectory() || reportInfo.isSymbolicLink()) throw new Error("Linked or invalid fixture reports refused");
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
beforeEach(async () => {
  vi.stubEnv("AI_REVIEW_TIMEOUT_MS", "250");
  vi.stubEnv("AI_REVIEW_RETRY_BACKOFF_MS", "1");
  vi.stubEnv("AI_REVIEW_MAX_ATTEMPTS", "3");
  await assertOwnedReports();
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir);
});
afterEach(() => vi.unstubAllEnvs());
afterAll(async () => {
  await assertOwnedReports();
  await fs.rm(ownedReports.root, { recursive: true, force: true });
});
const fields={objectivePreservation:"pass",oneAhaPreservation:"pass",missionRubricPreservation:"pass",quizKeyPreservation:"pass",noHallucinatedConcepts:"pass",msaClarity:"pass",englishTermGlossIssues:"pass",metadataSlugIssues:"pass",assistantBoundaryIssues:"pass",videoScriptSuitability:"pass"};
const entry=(identity="a".repeat(64)):any=>({lessonId:"synthetic-one",inputIdentity:identity,requestState:"settled",result:"PASS",preflightPassed:true,preflightErrors:[],apiReviewed:true,...fields,hardBlockers:[],softNotes:[],fixRecommendations:[],summary:"synthetic review",productionFile:"synthetic-production",canonicalFile:"synthetic-canonical"});
const meta={provider:"synthetic",model:"synthetic-model",dryRun:false,generatedAt:"2026-11-04",renderReport:()=>"synthetic report"};
async function snapshot(){const out:Record<string,string>={};for(const name of (await fs.readdir(dir)).sort())out[name]=(await fs.readFile(path.join(dir,name))).toString("base64");return out;}
function mainFixture(options:{source?:()=>string;prompt?:()=>string;model?:string;dryRun?:boolean;review?:(input:any,signal:AbortSignal)=>Promise<any>}={}){
 const file="scripts/adaptive-canonical/audit-canonical.ts";const src=readFileSync(file,"utf8"),ast=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true);const body=ast.statements.filter(n=>ts.isFunctionDeclaration(n)).map(n=>n.getText(ast)).join("\n");const js=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const review=vi.fn(options.review??(async()=>({result:"PASS",...fields,hardBlockers:[],softNotes:[],fixRecommendations:[],summary:"synthetic review"})));
 const reviewer={name:"synthetic",model:options.model??"synthetic-model",requestIdentity:(input:any)=>inputFingerprint({input,prompt:options.prompt?.()??"synthetic-prompt"}),reviewLesson:review};
 const releaseLock=vi.fn(async()=>{}),acquireLock=vi.fn(async()=>{});
 const globals:any={fs:{...fs,readFile:async(p:string,...rest:any[])=>p==="synthetic-production"?options.source?.()??"synthetic production source":p==="synthetic-canonical"?"synthetic canonical source":(fs.readFile as any)(p,...rest)},path,REPORTS_DIR:dir,CANONICAL_DIR:"synthetic",inputFingerprint,CheckpointReviewRequired,normalizeApiResult,ReviewUncertainError,ReviewRejectedError,isRetryableError,reviewTimeoutMs,withRetry,withTimeout,buildRunPlan,loadCheckpoint,loadPreviousEntries,writeCheckpoint,writePreservingFile,mergeEntries:(prior:Map<string,any>,updated:any[])=>[...new Map([...prior,...updated.map(e=>[e.lessonId,e] as [string,any])]).values()],resolveReviewer:()=>reviewer,acquireLock,releaseLock,forceUnlock:vi.fn(),listCanonicalLessonIds:async()=>["synthetic-one","synthetic-two"],loadPathsLessonIds:async()=>new Set(["synthetic-one","synthetic-two"]),preflightLesson:async()=>({ok:true,errors:[],canonicalFile:"synthetic-canonical",productionFile:"synthetic-production"}),localCanonicalHeuristics:()=>({hardBlockers:[],softNotes:[]}),extractProductionText:(text:string)=>({summary:text,quizMission:"synthetic mission"}),extractCanonicalSections:(text:string)=>({summary:text,quizMission:"synthetic canonical mission",metadata:"synthetic metadata"}),console:{log:vi.fn(),warn:vi.fn(),error:vi.fn()},process:{argv:["node","audit","--all","--resume","--allow-background",...(options.dryRun?["--dry-run"]:[])],stdin:{isTTY:true},env:{AI_REVIEW_DELAY_MS:"0"},exit:(n:number)=>{throw Error(`exit ${n}`);}}};
 const api=new Function("exports",...Object.keys(globals),js+";return {main,auditLesson,prepareAuditLesson:typeof prepareAuditLesson===\"function\"?prepareAuditLesson:undefined};")({},...Object.values(globals));return {api,review,globals,releaseLock};
}
describe("R09 verified checkpoint identity and actual audit caller",()=>{
 it("ordinary Vitest imports checkpoint only with the owned corpus mock", async () => {
  expect(path.dirname(CHECKPOINT_JSON)).toBe(ownedReports.reports);
  expect(path.dirname(dir)).toBe(ownedReports.root);
  await assertOwnedReports();
  await writeCheckpoint([entry()], meta);
  expect((await loadCheckpoint())!.entries).toHaveLength(1);
 });
 it("distinguishes absent from corrupt/unverified checkpoint and preserves bytes",async()=>{
  expect(await loadCheckpoint()).toBeNull();for(const raw of ["{broken",JSON.stringify({entries:[{lessonId:"synthetic-one",result:"PASS"}]})]){await fs.writeFile(CHECKPOINT_JSON,raw);await expect(loadCheckpoint()).rejects.toThrow();await expect(writeCheckpoint([entry()],meta)).rejects.toThrow();expect(await fs.readFile(CHECKPOINT_JSON,"utf8")).toBe(raw);}
 });
 it("corrupt dated report never becomes a missing checkpoint",async()=>{
  const file=path.join(dir,"API_AUDIT_2026-11-04.json");await fs.writeFile(file,"invalid");await expect(loadPreviousEntries()).rejects.toThrow();expect(await fs.readFile(file,"utf8")).toBe("invalid");
 });
 it("valid checkpoint replacement preserves exact prior bytes and stores only opaque identity",async()=>{
  await writeCheckpoint([entry()],meta);const before=await fs.readFile(CHECKPOINT_JSON);await writeCheckpoint([entry("b".repeat(64))],meta);const files=await fs.readdir(dir);expect(files.some(x=>x.startsWith("API_AUDIT_checkpoint.json.preserved-"))).toBe(true);expect((await fs.readFile(path.join(dir,files.find(x=>x.startsWith("API_AUDIT_checkpoint.json.preserved-"))!))).equals(before)).toBe(true);expect(await fs.readFile(CHECKPOINT_JSON,"utf8")).not.toContain("actual raw request");
 });
 it("replacing a dated output preserves unverified preexisting bytes",async()=>{
  const file=path.join(dir,"synthetic-dated.json"),raw="unverified original bytes";await fs.writeFile(file,raw);await writePreservingFile(file,"replacement");const history=(await fs.readdir(dir)).find(name=>name.startsWith("synthetic-dated.json.preserved-"));expect(history).toBeTruthy();expect(await fs.readFile(path.join(dir,history!),"utf8")).toBe(raw);
 });
 it("failed atomic checkpoint replacement leaves previous public bytes intact",async()=>{
  await writeCheckpoint([entry()],meta);const before=await fs.readFile(CHECKPOINT_JSON);const rename=vi.spyOn(fs,"rename").mockRejectedValueOnce(new Error("synthetic write failure"));
  try { await expect(writeCheckpoint([entry("b".repeat(64))],meta)).rejects.toThrow("synthetic write failure");expect(await fs.readFile(CHECKPOINT_JSON)).toEqual(before); }
  finally { rename.mockRestore(); }
 });
 it.each(["source","model","provider","dryRun","request","prompt"])("changed %s identity blocks reuse and automatic regeneration",field=>{
  const base={source:"synthetic",model:"m",provider:"p",dryRun:false,request:"r",prompt:"s"};const before=inputFingerprint(base),after=inputFingerprint({...base,[field]:field==="dryRun"?true:"changed"});for(const flags of [{resume:true,retryErrors:false,retryContentFails:false},{resume:false,retryErrors:false,retryContentFails:false}])expect(()=>buildRunPlan(["synthetic-one"],new Map([["synthetic-one",entry(before)]]),{...flags,identities:new Map([["synthetic-one",after]])})).toThrow("inputs changed");
 });
 it("exact actual audit inputs resume with zero additional provider calls",async()=>{
  const f=mainFixture();await f.api.main();expect(f.review).toHaveBeenCalledTimes(2);const before=await snapshot();await f.api.main();expect(f.review).toHaveBeenCalledTimes(2);expect(await snapshot()).toEqual(before);expect(f.releaseLock).toHaveBeenCalledTimes(2);
 });
 it.each(["model","prompt","dryRun"])("actual main %s change cannot reuse checkpoint or start paid work",async mode=>{
  const initial=mainFixture(mode==="dryRun"?{dryRun:true}:{});await initial.api.main();const before=await snapshot();
  const next=mainFixture(mode==="model"?{model:"changed-model"}:mode==="prompt"?{prompt:()=>"changed-prompt"}:{});
  await expect(next.api.main()).rejects.toThrow("inputs changed");expect(next.review).not.toHaveBeenCalled();expect(await snapshot()).toEqual(before);
 });
 it("actual source change blocks main before any new paid request or checkpoint writes",async()=>{
  let source="synthetic source A";const f=mainFixture({source:()=>source});await f.api.main();const before=await snapshot();source="synthetic source B";await expect(f.api.main()).rejects.toThrow("inputs changed");expect(f.review).toHaveBeenCalledTimes(2);expect(await snapshot()).toEqual(before);
 });
 it("actual API FAIL result is normalized using existing result contract",async()=>{
  const f=mainFixture({review:async()=>({result:"FAIL",...fields,hardBlockers:[],softNotes:[],fixRecommendations:[],summary:"synthetic fail"})});
  const result=await f.api.auditLesson("synthetic-one",new Set(),false,f.globals.resolveReviewer());expect(result.result).toBe("CONTENT FAIL");expect(result.requestState).toBe("settled");
 });
 it("actual audit call boundary never overlaps timed-out paid work",async()=>{
  const late: Array<(v:any)=>void>=[];let observed:AbortSignal|undefined;
  const f=mainFixture({review:(_input,signal)=>{observed=signal;return new Promise(resolve=>late.push(resolve));}});
  const result=await f.api.auditLesson("synthetic-one",new Set(["synthetic-one"]),false,f.globals.resolveReviewer());
  expect(f.review).toHaveBeenCalledTimes(1);expect(observed?.aborted).toBe(true);expect(result.requestState).toBe("uncertain");
  for(const resolve of late)resolve({result:"PASS",...fields,hardBlockers:[],softNotes:[],fixRecommendations:[],summary:"late"});
 });
 it("actual main records uncertain dispatch before provider, stops batch, and blocks later work",async()=>{
  let resolve!:(v:any)=>void;let sawPending=false;const f=mainFixture({review:async()=>{const data=await loadCheckpoint();sawPending=data!.entries[0].requestState==="uncertain";return new Promise(r=>{resolve=r;});}});
  await expect(f.api.main()).rejects.toBeInstanceOf(ReviewUncertainError);expect(sawPending).toBe(true);expect(f.review).toHaveBeenCalledTimes(1);expect((await loadCheckpoint())!.entries[0].requestState).toBe("uncertain");const before=await snapshot();resolve({result:"PASS",...fields,hardBlockers:[],softNotes:[],fixRecommendations:[],summary:"late"});await Promise.resolve();expect(await snapshot()).toEqual(before);await expect(f.api.main()).rejects.toThrow("prior request");expect(f.review).toHaveBeenCalledTimes(1);
 });
 it("malformed prior data blocks a normal main run without resume too",async()=>{
  const f=mainFixture();f.globals.process.argv=f.globals.process.argv.filter((x:string)=>x!=="--resume");await fs.writeFile(CHECKPOINT_JSON,"bad checkpoint");await expect(f.api.main()).rejects.toThrow("Malformed");expect(f.review).not.toHaveBeenCalled();expect(await fs.readFile(CHECKPOINT_JSON,"utf8")).toBe("bad checkpoint");
 });
 it("uncertain prior request cannot be retried with retry-errors or a different lesson selection",()=>{
  for(const selected of [["synthetic-one"],["synthetic-two"]])expect(()=>buildRunPlan(selected,new Map([["synthetic-one",{...entry(),result:"ERROR_RETRY_REQUIRED",requestState:"uncertain"}]]),{resume:false,retryErrors:true,retryContentFails:false,identities:new Map([["synthetic-one","a".repeat(64)]])})).toThrow("prior request");
 });
});
