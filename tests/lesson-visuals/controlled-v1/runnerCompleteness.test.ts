import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
// Execute only the exact success-gating runner functions. No controlled route,
// screenshot, provider, classification, locale package or manifest is imported.
function runner(status: string = "ACCEPTED", mutate?: (r: any, i: number) => any) {
 const source=readFileSync("src/lib/lesson-visuals/controlled-v1/runner.ts","utf8");
 const ast=ts.createSourceFile("runner.ts",source,ts.ScriptTarget.Latest,true);
 const names=new Set(["controlledAcceptanceErrors","runPilot","runFull400"]);
 const extracted=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name&&names.has(s.name.text)).map(s=>s.getText(ast)).join("\n");
 const compiled=ts.transpileModule(extracted,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const cells=Array.from({length:400},(_,i)=>({cellId:`synthetic-${i}__en`}));
 const writeJson=vi.fn(), writeRunReport=vi.fn(), writeReceipt=vi.fn();let index=0;
 const mocks={FULL_400_CONFIRM_TOKEN:"synthetic-confirm",ARTIFACTS_RECEIPTS_DIR:"synthetic-fixture-only",resetControlledFailureState:vi.fn(),loadClassification100:()=>[],buildPilotManifest:()=>({cells:cells.slice(0,2)}),buildProductionManifest:()=>({cells}),validateProductionManifest:()=>({ok:true,errors:[]}),runCell:(cell:any)=>{const r={cellId:cell.cellId,status,reason:status==="ACCEPTED"?null:"synthetic blocked cause",controlledFailureInjected:false};return mutate?mutate(r,index++):r;},writeReceipt,writeJson,writeRunReport,getControlledFailureState:()=>({}),receiptCounts:(r:any[])=>r.reduce((a,x)=>({...a,[x.status]:(a[x.status]??0)+1}),{}),buildUnresolvedLedger:()=>({entries:[]})};
 const exports:any={};new Function("exports",...Object.keys(mocks),compiled)(exports,...Object.values(mocks));return {api:exports,cells,writeJson,writeRunReport,writeReceipt,mocks};
}
describe("R02 controlled runner truthful complete success",()=>{
 it.each(["FAILED","BLOCKED","PENDING","PENDING_HUMAN_REVIEW"])("full run rejects %s even without injected failure",status=>{const r=runner(status);const out=r.api.runFull400("synthetic-confirm");expect(out.ok).toBe(false);expect(out.errors).not.toHaveLength(0);expect(r.writeJson.mock.calls[0][1].ok).toBe(false);expect(r.writeRunReport.mock.calls[0][1].ok).toBe(false);});
 it("full run rejects a single failed mandatory cell among399 accepted",()=>{const r=runner("ACCEPTED",(x,i)=>i===287?{...x,status:"FAILED",reason:"single failure"}:x);const out=r.api.runFull400("synthetic-confirm");expect(out.ok).toBe(false);expect(out.errors.join(";")).toContain("single failure");});
 it("full run requires all400 uniquely identified accepted cells",()=>{const r=runner();const out=r.api.runFull400("synthetic-confirm");expect(out.ok).toBe(true);expect(out.receipts).toHaveLength(400);expect(out.errors).toEqual([]);expect(r.writeJson.mock.calls[0][1].ok).toBe(true);});
 it("rejects substituted/duplicated receipt identities",()=>{const r=runner("ACCEPTED",(x,i)=>i===399?{...x,cellId:"synthetic-0__en"}:x);const out=r.api.runFull400("synthetic-confirm");expect(out.ok).toBe(false);expect(out.errors.join(";")).toContain("duplicate receipt");expect(out.errors.join(";")).toContain("missing receipt");});
 it("does not lose controlled failure marker even on an ACCEPTED status",()=>{const r=runner("ACCEPTED",(x,i)=>i===0?{...x,controlledFailureInjected:true}:x);expect(r.api.runFull400("synthetic-confirm").ok).toBe(false);});
 it("confirmation and manifest validation still gate route invocation",()=>{const r=runner();expect(r.api.runFull400("wrong").ok).toBe(false);expect(r.writeReceipt).not.toHaveBeenCalled();});
 it.each(["FAILED","PENDING","BLOCKED"])("pilot cannot claim success for %s cells",status=>{const r=runner(status);const out=r.api.runPilot();expect(out.ok).toBe(false);expect(out.errors).not.toHaveLength(0);expect(r.writeRunReport.mock.calls[0][1].ok).toBe(false);});
 it("pilot accepts exact complete accepted receipts",()=>{const r=runner();expect(r.api.runPilot().ok).toBe(true);});
 it("completeness helper rejects empty/duplicate/missing/unexpected receipts",()=>{const r=runner();expect(r.api.controlledAcceptanceErrors([],[])).not.toHaveLength(0);expect(r.api.controlledAcceptanceErrors([{cellId:"a"},{cellId:"a"}],[]).join(";")).toContain("duplicate required");expect(r.api.controlledAcceptanceErrors([{cellId:"a"}],[{cellId:"b",status:"ACCEPTED"}]).join(";")).toContain("missing receipt");});
});
