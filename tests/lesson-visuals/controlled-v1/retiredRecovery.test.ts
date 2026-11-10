import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
function extract(file:string,names:string[],globals:Record<string,unknown>={}) {
 const source=readFileSync(file,"utf8"),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 const declarations=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name&&names.includes(s.name.text)).map(s=>s.getText(ast)).join("\n");
 const compiled=ts.transpileModule(declarations,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports:any={};return new Function("exports",...Object.keys(globals),compiled+";return {"+names.join(",")+"};")(exports,...Object.values(globals));
}
const runner="src/lib/lesson-visuals/controlled-v1/runner.ts",cli="src/lib/lesson-visuals/controlled-v1/scripts/cli.ts";
describe("R03 retired unbound recovery preserves all work",()=>{
 it("direct entry fails before default manifest/read/generation/reconciliation/report work",()=>{
  const forbidden=vi.fn(()=>{throw new Error("forbidden side effect");});const api=extract(runner,["runFailedOnly"],{buildProductionManifest:forbidden,collectAllReceipts:forbidden,runCell:forbidden,writeReceipt:forbidden,writeJson:forbidden,reconcileFailedOnlyIntoPilot:forbidden});
  const out=api.runFailedOnly();expect(out.ok).toBe(false);expect(out.receipts).toEqual([]);expect(out.errors.join(";")).toContain("source manifest");forbidden.mockClear();expect(api.runFailedOnly({cells:[{cellId:"synthetic__en",status:"FAILED"}]}).ok).toBe(false);expect(forbidden).not.toHaveBeenCalled();
 });
 it("does not consume or modify supplied manifest evidence",()=>{
  const manifest={cells:[{cellId:"synthetic__en",status:"FAILED"}],immutable:"synthetic"};Object.freeze(manifest.cells);Object.freeze(manifest);const before=JSON.stringify(manifest);const out=extract(runner,["runFailedOnly"]).runFailedOnly(manifest);expect(out.ok).toBe(false);expect(JSON.stringify(manifest)).toBe(before);
 });
 it("manual CLI refuses the retired mode before environment lookup or contact-sheet creation",()=>{
  const envRead=vi.fn(()=>{throw Error("environment must not be read");});const api=extract(cli,["parseArgs"],{process:{get env(){return envRead();}},console:{error:vi.fn()}});expect(()=>api.parseArgs(["failed-only"])).toThrow("retired");expect(envRead).not.toHaveBeenCalled();
 });
 it("manual CLI help omits the retired mode while supported modes keep their contract",()=>{
  const error=vi.fn(),exit=vi.fn(()=>{throw Error("synthetic exit");});const api=extract(cli,["parseArgs"],{process:{env:{},exit},console:{error}});expect(()=>api.parseArgs(["unsupported"])).toThrow("synthetic exit");expect(error.mock.calls[0][0]).not.toContain("failed-only");expect(api.parseArgs(["preflight"]).mode).toBe("preflight");expect(api.parseArgs(["full-400","--confirm_full_400=synthetic"]).confirm).toBe("synthetic");
 });
 it("CLI no longer contains a recovery dispatch or contact-sheet write for that mode",()=>{
  const ast=ts.createSourceFile(cli,readFileSync(cli,"utf8"),ts.ScriptTarget.Latest,true);const cases:string[]=[];const walk=(n:ts.Node)=>{if(ts.isCaseClause(n))cases.push(n.expression.getText(ast));ts.forEachChild(n,walk);};walk(ast);expect(cases).not.toContain('"failed-only"');expect(cases).toContain('"full-400"');
 });
 it("actual retired CLI main rejects before any runtime module loading",async()=>{
  const require_=vi.fn(()=>{throw Error("runtime module must not load");});const api=extract(cli,["parseArgs","main"],{process:{argv:["node","cli","failed-only"],env:{}},console:{error:vi.fn(),log:vi.fn()},require:require_});await expect(api.main()).rejects.toThrow("retired");expect(require_).not.toHaveBeenCalled();
  const ast=ts.createSourceFile(cli,readFileSync(cli,"utf8"),ts.ScriptTarget.Latest,true);expect(ast.statements.filter(n=>ts.isImportDeclaration(n)&&!n.importClause?.isTypeOnly)).toHaveLength(0);
 });

});
