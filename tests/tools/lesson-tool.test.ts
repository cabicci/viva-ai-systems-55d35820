import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, expect, it } from "vitest";
import { applyLessonRename, doctorLessons, isLessonSource, normalizeRelative, planLessonRename, walkLessonFiles } from "../../scripts/lib/lesson-tool-files";
let root:string;
const from="work-m1-l1-synthetic",to="advanced-m2-l2-fixture";
const lesson=(id=from,area="intro")=>`src/components/${area}/lessons/${id}.ts`;
function put(path:string,value:string|Buffer="synthetic"){const p=join(root,path);fs.mkdirSync(dirname(p),{recursive:true});fs.writeFileSync(p,value);}
function snapshot(dir=root):Record<string,string>{const data:Record<string,string>={};function visit(p:string,rel:string){for(const name of fs.readdirSync(p)){const full=join(p,name),key=rel?rel+"/"+name:name,stat=fs.lstatSync(full);if(stat.isSymbolicLink())data[key]="LINK:"+fs.readlinkSync(full);else if(stat.isDirectory()){data[key+"/"]="DIR";visit(full,key);}else data[key]=fs.readFileSync(full).toString("hex");}}visit(dir,"");return data;}
function fixture(){
 put(lesson(),`\uFEFFexport const lesson={id:"${from}"};\r\nimport image from "@/assets/lessons/${from}-hero.svg";\r\n`);
 put(`public/lessons/work/${from}.mp4`,Buffer.from([0,255,128,42]));
 put(`src/assets/lessons/${from}-hero.svg`,`<svg id="${from}"/>`);
 put(`src/assets/lessons/unique/${from}.png`,Buffer.from([0,1,200]));
 put('src/synthetic-references.ts',`import item from "./components/intro/lessons/${from}";\r\nconst video="/lessons/work/${from}.mp4"; const id="${from}"; const neighbor="${from}-neighbor";`);
 put('scripts/lesson-audit/output/synthetic.md',`lesson ${from}\n`);
 put(`src/assets/lessons/${from}other.png`,'untouched');
}
beforeEach(()=>{root=fs.mkdtempSync(join(tmpdir(),'masaarat-o05-synthetic-'));});
afterEach(()=>{fs.rmSync(root,{recursive:true,force:true});});
it('renames non-intro canonical file, all sidecars and exact references while retaining bytes',()=>{
 fixture();const binary=fs.readFileSync(join(root,`public/lessons/work/${from}.mp4`));const plan=planLessonRename(root,from,to);expect(new Set(plan.changes.map(c=>c.from)).size).toBe(plan.changes.length);applyLessonRename(plan);
 expect(fs.existsSync(join(root,lesson()))).toBe(false);expect(fs.readFileSync(join(root,lesson(to)),'utf8')).toContain(`id:"${to}"`);
 expect(fs.readFileSync(join(root,lesson(to)))[0]).toBe(0xef);expect(fs.readFileSync(join(root,lesson(to)),'utf8')).toContain('\r\n');
 expect(fs.readFileSync(join(root,`public/lessons/advanced/${to}.mp4`))).toEqual(binary);
 expect(fs.existsSync(join(root,`src/assets/lessons/${to}-hero.svg`))).toBe(true);expect(fs.existsSync(join(root,`src/assets/lessons/unique/${to}.png`))).toBe(true);
 const refs=fs.readFileSync(join(root,'src/synthetic-references.ts'),'utf8');expect(refs).toContain(`/lessons/advanced/${to}.mp4`);expect(refs).toContain(`intro/lessons/${to}`);expect(refs).toContain(`${from}-neighbor`);expect(fs.readFileSync(join(root,`src/assets/lessons/${from}other.png`),'utf8')).toBe('untouched');expect(doctorLessons(root,true).missingAssets).toEqual([]);
});
it('uses actual legacy tree when canonical source is absent',()=>{put(lesson(from,'work'));applyLessonRename(planLessonRename(root,from,to));expect(fs.existsSync(join(root,lesson(to,'work')))).toBe(true);});
it('ambiguous sources fail before mutation and explicit directory disambiguates',()=>{put(lesson());put(lesson(from,'work'));const old=snapshot();expect(()=>planLessonRename(root,from,to)).toThrow(/Ambiguous/);expect(snapshot()).toEqual(old);applyLessonRename(planLessonRename(root,from,to,'work'));expect(fs.existsSync(join(root,lesson()))).toBe(true);expect(fs.existsSync(join(root,lesson(to,'work')))).toBe(true);});
it('accepts a legacy source ID lacking lesson order and validates the new strict ID',()=>{const legacy='work-m1-synthetic';put(lesson(legacy));applyLessonRename(planLessonRename(root,legacy,to));expect(fs.existsSync(join(root,lesson(to)))).toBe(true);});
it('missing source cannot update any references',()=>{put('src/ref.ts',from);const old=snapshot();expect(()=>planLessonRename(root,from,to)).toThrow(/Missing lesson source/);expect(snapshot()).toEqual(old);});
it.each(['lesson','video','asset','case-insensitive'])('preflights %s destination collision and preserves sentinels',kind=>{fixture();const dest=kind==='lesson'?lesson(to):kind==='video'?`public/lessons/advanced/${to}.mp4`:kind==='asset'?`src/assets/lessons/${to}-hero.svg`:`src/assets/lessons/${to.toUpperCase()}-HERO.SVG`;put(dest,'DO NOT OVERWRITE');const old=snapshot();expect(()=>planLessonRename(root,from,to)).toThrow(/Target already exists/);expect(snapshot()).toEqual(old);});
it.each(['../outside','work/../../outside','C:\\outside','/outside','work\\other'])('rejects explicit path %s without mutation',path=>{fixture();const old=snapshot();expect(()=>planLessonRename(root,from,to,path)).toThrow(/safe component/);expect(snapshot()).toEqual(old);});
it('validates both identifiers before reading or moving source data',()=>{fixture();const old=snapshot();for(const bad of ['../x','work-m1-l1-x/../../escape','work-m1-l1-x\\escape','work-m1-l1-x:alt'])expect(()=>planLessonRename(root,bad,to)).toThrow(/Bad lesson id/);expect(()=>planLessonRename(root,from,'work-m1-missing')).toThrow(/Bad lesson id/);expect(snapshot()).toEqual(old);});
it('normalizes Windows walker paths and applies identical doctor file selection',()=>{put('src/components/intro/lessons/work-m1-legacy.ts','import x from "@/assets/missing.png";');expect(normalizeRelative('src\\components\\intro\\lessons\\x.ts')).toBe('src/components/intro/lessons/x.ts');expect(isLessonSource('src\\components\\intro\\lessons\\x.ts')).toBe(true);expect(walkLessonFiles(root,'src\\components')).toEqual(['src/components/intro/lessons/work-m1-legacy.ts']);const r=doctorLessons(root,true);expect(r.missingAssets).toEqual(['src/components/intro/lessons/work-m1-legacy.ts -> src/assets/missing.png']);expect(r.idsWithoutLessonOrder).toHaveLength(1);expect(doctorLessons(root,false).idsWithoutLessonOrder).toEqual([]);});
it('doctor cannot traverse outside the asset root through import paths',()=>{put(lesson(),'import x from "@/assets/../../outside";');expect(()=>doctorLessons(root)).toThrow(/Unsafe relative path/);});
it("refuses a linked asset tree before modifying any files", () => {
  const outside = fs.mkdtempSync(join(tmpdir(), "masaarat-o05-external-"));
  try {
    fs.writeFileSync(join(outside, "sentinel"), "untouched");
    put(lesson());
    fs.mkdirSync(join(root, "src/assets"), { recursive: true });
    fs.symlinkSync(outside, join(root, "src/assets/lessons"), process.platform === "win32" ? "junction" : "dir");
    const old = snapshot();
    expect(() => planLessonRename(root, from, to)).toThrow(/Linked path/);
    expect(snapshot()).toEqual(old);
    expect(fs.readFileSync(join(outside, "sentinel"), "utf8")).toBe("untouched");
  } finally {
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

// Windows file symlinks require privileges the checkout may not have. Linux CI runs this case.
it.skipIf(process.platform === "win32")("refuses a symbolic link in place of the lesson source", () => {
  put("outside.ts", "private");
  fs.mkdirSync(dirname(join(root, lesson())), { recursive: true });
  fs.symlinkSync(join(root, "outside.ts"), join(root, lesson()));
  expect(() => planLessonRename(root, from, to)).toThrow(/Linked path/);
  expect(fs.readFileSync(join(root, "outside.ts"), "utf8")).toBe("private");
});

it("refuses a hard-linked reference without modifying its other name", () => {
  put("outside.ts", "private");
  put(lesson());
  fs.linkSync(join(root, "outside.ts"), join(root, "src/shared.ts"));
  expect(() => planLessonRename(root, from, to)).toThrow(/unlinked regular file/);
  expect(fs.readFileSync(join(root, "outside.ts"), "utf8")).toBe("private");
});

it('non-UTF8 reference preflight failure cannot leave partially moved files',()=>{fixture();put('scripts/bad.ts',Buffer.from([0xff,0xfe]));const old=snapshot();expect(()=>planLessonRename(root,from,to)).toThrow(/Non-UTF8/);expect(snapshot()).toEqual(old);});
it('matching asset directories are explicitly refused before mutation',()=>{fixture();put(`src/assets/lessons/${from}-folder/file.svg`,'untouched');const old=snapshot();expect(()=>planLessonRename(root,from,to)).toThrow(/regular file/);expect(snapshot()).toEqual(old);});
it('source change after planning fails complete revalidation before mutation',()=>{fixture();const plan=planLessonRename(root,from,to);put('src/synthetic-references.ts','new user edit');const old=snapshot();expect(()=>applyLessonRename(plan)).toThrow(/changed after preflight/);expect(snapshot()).toEqual(old);});
it('rolls back a move failure after earlier moves with exact original bytes/directories',()=>{fixture();const old=snapshot(),plan=planLessonRename(root,from,to);let count=0;expect(()=>applyLessonRename(plan,{...fs,linkSync:(a,b)=>{if(++count===3)throw Error('synthetic move fault');fs.linkSync(a,b);}})).toThrow(/rollback completed/);expect(snapshot()).toEqual(old);});
it('rolls back a partial reference write and all completed moves',()=>{fixture();const old=snapshot(),plan=planLessonRename(root,from,to);let count=0;expect(()=>applyLessonRename(plan,{...fs,writeFileSync:(file,data,options)=>{if(++count===2){fs.writeFileSync(file,'PARTIAL');throw Error('synthetic partial write');}fs.writeFileSync(file,data,options);}})).toThrow(/rollback completed/);expect(snapshot()).toEqual(old);});
it('failure unlinking an original removes only the just-created link',()=>{fixture();const old=snapshot();expect(()=>applyLessonRename(planLessonRename(root,from,to),{...fs,unlinkSync:()=>{throw Error('synthetic unlink failure');}})).toThrow(/rollback completed/);expect(snapshot()).toEqual(old);});
it('exclusive destination creation preserves a late collision and restores prior moves',()=>{fixture();const plan=planLessonRename(root,from,to),old=snapshot();let count=0;const collision=`src/assets/lessons/${to}-hero.svg`;expect(()=>applyLessonRename(plan,{...fs,linkSync:(a,b)=>{if(++count===3)fs.writeFileSync(b,'late sentinel');fs.linkSync(a,b);}})).toThrow(/rollback completed/);expect(fs.readFileSync(join(root,collision),'utf8')).toBe('late sentinel');const after=snapshot();delete after[collision];expect(after).toEqual(old);});
it('actual CLI renames canonical non-intro content and doctor reports synthetic missing assets',()=>{fixture();const cli=resolve('scripts/lesson-tool.ts');const renamed=spawnSync("bun",[cli,'rename','--from',from,'--to',to],{cwd:root,encoding:'utf8'});expect(renamed.status,renamed.stderr).toBe(0);expect(fs.existsSync(join(root,lesson(to)))).toBe(true);put('src/components/intro/lessons/work-m3-legacy.ts','import x from "@/assets/absent.png";');const checked=spawnSync("bun",[cli,'doctor','--strict-names'],{cwd:root,encoding:'utf8'});expect(checked.status).toBe(1);expect(checked.stdout).toContain('absent.png');expect(checked.stdout).toContain('missing l{lesson}');});
