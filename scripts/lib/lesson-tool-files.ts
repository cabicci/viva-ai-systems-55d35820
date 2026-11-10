import * as fs from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".mjs", ".cjs", ".md", ".sh"]);
const SEARCH_DIRS = ["src", "scripts"];
export const normalizeRelative = (value: string) => value.replace(/\\/g, "/");
function safeRelative(value: string): string {
  const normalized = normalizeRelative(value);
  if (!normalized || isAbsolute(value) || normalized.startsWith("/") || /[:\0]/.test(normalized) ||
      normalized.split("/").some(part => !part || part === "." || part === "..")) throw Error(`Unsafe relative path: ${value}`);
  return normalized;
}
const pathKey = (path: string) => normalizeRelative(path).toLowerCase();
function rootPath(root: string): string {
  const absolute = resolve(root);
  if (fs.lstatSync(absolute).isSymbolicLink() || pathKey(fs.realpathSync(absolute)) !== pathKey(absolute)) throw Error("Linked fixture/project root refused");
  return absolute;
}
/** Refuse symlinks/junctions, including links in a path's existing parents. */
function checkedPath(root: string, rel: string): string {
  const parts = safeRelative(rel).split("/"); let current = root;
  for (const part of parts) {
    current = join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw Error(`Linked path refused: ${rel}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return current;
}
function regularFile(root: string, rel: string): string {
  const full = checkedPath(root, rel), stat = fs.lstatSync(full);
  if (!stat.isFile() || stat.nlink !== 1) throw Error(`Expected unlinked regular file: ${rel}`);
  return full;
}
export function walkLessonFiles(rootInput: string, directory: string): string[] {
  const root = rootPath(rootInput), files: string[] = [];
  const walk = (rel: string) => {
    const full = checkedPath(root, rel);
    if (!fs.existsSync(full)) return;
    if (!fs.lstatSync(full).isDirectory()) throw Error(`Expected directory: ${rel}`);
    for (const entry of fs.readdirSync(full)) {
      if (["node_modules", ".git", "dist"].includes(entry)) continue;
      const next = `${normalizeRelative(rel)}/${entry}`, path = checkedPath(root, next);
      const stat = fs.lstatSync(path);
      if (stat.isDirectory()) walk(next);
      else { regularFile(root, next); files.push(next); }
    }
  };
  walk(safeRelative(directory)); return files;
}
export function isLessonSource(path: string): boolean {
  const normalized = normalizeRelative(path);
  return normalized.includes("/lessons/") && extname(normalized) === ".ts";
}
export function doctorLessons(rootInput: string, strictNames = false) {
  const root = rootPath(rootInput), missingAssets: string[] = [], idsWithoutLessonOrder: string[] = [];
  for (const file of walkLessonFiles(root, "src/components").filter(isLessonSource)) {
    const id = file.split("/").at(-1)!.replace(/\.ts$/, "");
    if (strictNames && /^[a-z]+-m\d+-/.test(id) && !/^[a-z]+-m\d+-l\d+-/.test(id)) idsWithoutLessonOrder.push(file);
    const content = fs.readFileSync(regularFile(root,file), "utf8");
    for (const match of content.matchAll(/from\s+["']@\/assets\/([^"']+)["']/g)) {
      const asset = safeRelative(`src/assets/${match[1]}`), full = checkedPath(root, asset);
      if (!fs.existsSync(full)) missingAssets.push(`${file} -> ${asset}`);
      else regularFile(root,asset);
    }
  }
  return { missingAssets, idsWithoutLessonOrder };
}
export type LessonFileChange = { from: string; to: string; before: Buffer; after: Buffer };
export type LessonRenamePlan = { root: string; from: string; to: string; changes: LessonFileChange[] };
function validateId(value: string, legacy = false) {
  const pattern = legacy ? /^[a-z]+-m\d+-(?:l\d+-)?[a-z0-9]+(?:-[a-z0-9]+)*$/ : /^[a-z]+-m\d+-l\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!pattern.test(value)) throw Error(`Bad lesson id: ${value}`);
}
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function replaceToken(text: string, from: string, to: string): string {
  return text.replace(new RegExp(`(?<![A-Za-z0-9_-])${escapeRegex(from)}(?![A-Za-z0-9_-])`, "g"), () => to);
}
/** Read and validate every source, destination and reference before mutating. */
export function planLessonRename(rootInput: string, from: string, to: string, explicitPath?: string): LessonRenamePlan {
  const root = rootPath(rootInput); validateId(from,true); validateId(to);
  if (from === to) throw Error("Source and destination lesson IDs must differ");
  if (explicitPath !== undefined && !/^[a-z][a-z0-9-]*$/.test(explicitPath)) throw Error("--path must be one safe component directory name");
  const oldArea = explicitPath ?? from.split("-m")[0], newArea = explicitPath ?? to.split("-m")[0];
  const candidates = [...new Set(explicitPath ? [explicitPath] : ["intro",oldArea])].map(area => `src/components/${area}/lessons/${from}.ts`);
  const sources = candidates.filter(path => fs.existsSync(checkedPath(root,path)));
  if (sources.length !== 1) throw Error(sources.length ? "Ambiguous lesson source; use --path" : `Missing lesson source: ${from}`);
  regularFile(root,sources[0]);
  const sourceDir = normalizeRelative(dirname(sources[0]));
  const destination = `${sourceDir}/${to}.ts`;
  for (const area of new Set(["intro",oldArea,newArea,...(explicitPath?[explicitPath]:[])])) {
    const path = `src/components/${area}/lessons/${to}.ts`;
    if (fs.existsSync(checkedPath(root,path))) throw Error(`Target already exists: ${path}`);
  }
  const moves = new Map<string,string>();
  const addMove = (fromPath:string,toPath:string,required=false) => {
    const a=checkedPath(root,fromPath),b=checkedPath(root,toPath);
    if(fs.existsSync(b)) throw Error(`Target already exists: ${toPath}`);
    if(!fs.existsSync(a)) { if(required) throw Error(`Missing source: ${fromPath}`); return; }
    regularFile(root,fromPath); moves.set(fromPath,toPath);
  };
  addMove(sources[0],destination,true);
  addMove(`public/lessons/${oldArea}/${from}.mp4`,`public/lessons/${newArea}/${to}.mp4`);
  for(const dir of ["src/assets/lessons","src/assets/lessons/unique"]) {
    const full=checkedPath(root,dir);if(!fs.existsSync(full))continue;
    if(!fs.lstatSync(full).isDirectory())throw Error(`Expected directory: ${dir}`);
    for(const entry of fs.readdirSync(full)) {
      if(entry!==from&&!entry.startsWith(from+".")&&!entry.startsWith(from+"-"))continue;
      // Matching directories are deliberately refused before mutation. This CLI
      // renames lesson files/sidecars, not arbitrary subtree layouts.
      addMove(`${dir}/${entry}`,`${dir}/${to+entry.slice(from.length)}`);
    }
  }
  const destinationKeys=new Set<string>();
  for(const toPath of moves.values()) {
    const key=pathKey(toPath);if(destinationKeys.has(key))throw Error(`Duplicate destination: ${toPath}`);destinationKeys.add(key);
    // Portable case-insensitive collision check, even when planning on POSIX.
    const parent=checkedPath(root,normalizeRelative(dirname(toPath)));
    if(fs.existsSync(parent)&&fs.readdirSync(parent).some(entry=>entry.toLowerCase()===toPath.split("/").at(-1)!.toLowerCase()))throw Error(`Target already exists: ${toPath}`);
  }
  const files=new Set([...moves.keys(),...SEARCH_DIRS.flatMap(dir=>walkLessonFiles(root,dir)).filter(file=>TEXT_EXTENSIONS.has(extname(file)))]);
  const changes:LessonFileChange[]=[];
  for(const file of files) {
    const before=fs.readFileSync(regularFile(root,file));let after=before;
    if(TEXT_EXTENSIONS.has(extname(file))) {
      let text=before.toString("utf8");if(!Buffer.from(text,"utf8").equals(before))throw Error(`Non-UTF8 reference file refused: ${file}`);
      for(const [a,b] of moves) {
        text=replaceToken(text,a,b);
        if(a.startsWith("src/"))text=replaceToken(text,"@/"+a.slice(4),"@/"+b.slice(4));
        if(a.startsWith("public/"))text=replaceToken(text,"/"+a.slice(7),"/"+b.slice(7));
        const oldName=a.split("/").at(-1)!,newName=b.split("/").at(-1)!;
        text=replaceToken(text,oldName,newName);
      }
      text=replaceToken(text,from,to);after=Buffer.from(text,"utf8");
    }
    if(moves.has(file)||!after.equals(before))changes.push({from:file,to:moves.get(file)??file,before,after});
  }
  return {root,from,to,changes};
}
type WriteOps = Pick<typeof fs,"linkSync"|"unlinkSync"|"writeFileSync">;
/** Best-effort rollback for synchronous operation failures; NOT crash-atomic or
 * a concurrent-writer transaction. Run with exclusive ownership of this tree. */
export function applyLessonRename(plan:LessonRenamePlan,ops:WriteOps=fs):string[] {
  const root=rootPath(plan.root),created:string[]=[],linked:LessonFileChange[]=[],written:LessonFileChange[]=[];
  const checkOriginal=(change:LessonFileChange,rel=change.from)=>{
    if(!fs.readFileSync(regularFile(root,rel)).equals(change.before))throw Error(`Source changed after preflight: ${rel}`);
  };
  for(const change of plan.changes) {
    checkOriginal(change);checkedPath(root,change.to);
    if(change.from!==change.to&&fs.existsSync(join(root,change.to)))throw Error(`Target already exists: ${change.to}`);
  }
  const ensureParent=(rel:string)=>{
    const parts=normalizeRelative(dirname(rel)).split("/");let current="";
    for(const part of parts) {
      current=current?current+"/"+part:part;const full=checkedPath(root,current);
      if(!fs.existsSync(full)){fs.mkdirSync(full);created.push(full);}
      else if(!fs.lstatSync(full).isDirectory())throw Error(`Expected directory: ${current}`);
    }
  };
  try {
    for(const change of plan.changes.filter(x=>x.from!==x.to)) {
      checkOriginal(change);ensureParent(change.to);checkedPath(root,change.to);
      // Hard-link creation is exclusive: unlike rename on POSIX, it cannot
      // overwrite a destination appearing after preflight. Same filesystem only.
      ops.linkSync(join(root,change.from),join(root,change.to));linked.push(change);
      ops.unlinkSync(join(root,change.from));
    }
    for(const change of plan.changes.filter(x=>!x.before.equals(x.after))) {
      checkOriginal(change,change.to);written.push(change);
      ops.writeFileSync(join(root,change.to),change.after);
    }
    return plan.changes.map(x=>x.from===x.to?x.from:`${x.from} -> ${x.to}`);
  } catch(error) {
    const rollbackErrors:string[]=[];
    for(const change of [...written].reverse()) {
      try {regularFile(root,change.to);fs.writeFileSync(join(root,change.to),change.before);}
      catch(e){rollbackErrors.push(`restore ${change.to}: ${String(e)}`);}
    }
    for(const change of [...linked].reverse()) {
      try {
        const src=checkedPath(root,change.from),dst=checkedPath(root,change.to);
        if(!fs.existsSync(src))fs.linkSync(dst,src);
        else if(fs.lstatSync(src).ino!==fs.lstatSync(dst).ino)throw Error("Source occupied during rollback; refusing overwrite");
        fs.unlinkSync(dst);
      }catch(e){rollbackErrors.push(`move ${change.from}: ${String(e)}`);}
    }
    for(const full of created.reverse())try{fs.rmdirSync(full);}catch(e){rollbackErrors.push(`directory ${relative(root,full)}: ${String(e)}`);}
    throw Error(`${error instanceof Error?error.message:String(error)}; ${rollbackErrors.length?"ROLLBACK INCOMPLETE: "+rollbackErrors.join(" | "):"rollback completed; original bytes preserved"}`);
  }
}
