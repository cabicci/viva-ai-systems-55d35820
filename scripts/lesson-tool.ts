import { existsSync, mkdirSync, readFileSync, renameSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

const ROOT = process.cwd();
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".mjs", ".cjs", ".md", ".sh"]);
const SEARCH_DIRS = ["src", "remotion", "scripts", "public/lesson-audit"];

const args = process.argv.slice(2);
const command = args[0];

function readArg(name: string): string | null {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1] ?? null;
}

function walk(dir: string, files: string[] = []): string[] {
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) return files;
  for (const entry of readdirSync(fullDir)) {
    const fullPath = join(fullDir, entry);
    const relPath = relative(ROOT, fullPath);
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    if (statSync(fullPath).isDirectory()) walk(relPath, files);
    else files.push(relPath);
  }
  return files;
}

function textFiles(): string[] {
  return SEARCH_DIRS.flatMap((dir) => walk(dir)).filter((file) => TEXT_EXTENSIONS.has(extname(file)));
}

function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function renameIfExists(from: string, to: string, changed: string[]): void {
  const fullFrom = join(ROOT, from);
  const fullTo = join(ROOT, to);
  if (!existsSync(fullFrom) || from === to) return;
  if (existsSync(fullTo)) throw new Error(`Target already exists: ${to}`);
  ensureParent(fullTo);
  renameSync(fullFrom, fullTo);
  changed.push(`${from} -> ${to}`);
}

function replaceInFiles(from: string, to: string, changed: string[]): void {
  for (const file of textFiles()) {
    const fullPath = join(ROOT, file);
    const before = readFileSync(fullPath, "utf8");
    if (!before.includes(from)) continue;
    const after = before.split(from).join(to);
    writeFileSync(fullPath, after);
    changed.push(file);
  }
}

function validateLessonId(id: string): void {
  if (!/^[a-z]+-m\d+-l\d+-[a-z0-9-]+$/.test(id)) {
    throw new Error(`Bad lesson id: ${id}. Expected {path}-m{module}-l{lesson}-{slug}, e.g. intro-m1-l4-ai-can-cannot`);
  }
}

function lessonPathFromId(id: string): string {
  return id.split("-m")[0];
}

function renameLesson(): void {
  const from = readArg("from");
  const to = readArg("to");
  const explicitPath = readArg("path");
  if (!from || !to) throw new Error("Usage: bun run lesson:rename -- --from old-id --to new-id [--path intro]");
  validateLessonId(to);

  const oldPath = explicitPath ?? lessonPathFromId(from);
  const newPath = explicitPath ?? lessonPathFromId(to);
  const changed: string[] = [];

  renameIfExists(`src/components/${oldPath}/lessons/${from}.ts`, `src/components/${newPath}/lessons/${to}.ts`, changed);
  renameIfExists(`remotion/src/lessons-generated/${from}.gen.ts`, `remotion/src/lessons-generated/${to}.gen.ts`, changed);
  renameIfExists(`public/lessons/${oldPath}/${from}.mp4`, `public/lessons/${newPath}/${to}.mp4`, changed);

  for (const dir of ["src/assets/lessons", "src/assets/lessons/unique"]) {
    const fullDir = join(ROOT, dir);
    if (!existsSync(fullDir)) continue;
    for (const entry of readdirSync(fullDir)) {
      if (!entry.startsWith(from)) continue;
      renameIfExists(`${dir}/${entry}`, `${dir}/${entry.replace(from, to)}`, changed);
    }
  }

  replaceInFiles(from, to, changed);

  console.log(`Lesson rename complete: ${from} -> ${to}`);
  console.log(`Changed ${changed.length} paths/references.`);
  for (const item of changed.slice(0, 80)) console.log(`- ${item}`);
  if (changed.length > 80) console.log(`...and ${changed.length - 80} more`);
  console.log("Next: refresh the related roadmap item, then regenerate/upload video only if content changed.");
}

function doctor(): void {
  const missingAssets: string[] = [];
  const idsWithoutLessonOrder: string[] = [];
  const strictNames = args.includes("--strict-names");

  for (const file of walk("src/components")) {
    if (!file.includes("/lessons/") || extname(file) !== ".ts") continue;
    const id = file.split("/").pop()?.replace(/\.ts$/, "") ?? "";
    if (strictNames && /^[a-z]+-m\d+-/.test(id) && !/^[a-z]+-m\d+-l\d+-/.test(id)) idsWithoutLessonOrder.push(file);

    const content = readFileSync(join(ROOT, file), "utf8");
    const imports = content.matchAll(/from\s+["']@\/assets\/([^"']+)["']/g);
    for (const match of imports) {
      const assetPath = `src/assets/${match[1]}`;
      if (!existsSync(join(ROOT, assetPath))) missingAssets.push(`${file} -> ${assetPath}`);
    }
  }

  if (missingAssets.length === 0 && idsWithoutLessonOrder.length === 0) {
    console.log("Lesson doctor passed.");
    if (!strictNames) console.log("Tip: add --strict-names to audit old lesson ids that still miss l{lesson}.");
    return;
  }

  if (missingAssets.length > 0) {
    console.log("Missing lesson assets:");
    for (const issue of missingAssets) console.log(`- ${issue}`);
  }
  if (idsWithoutLessonOrder.length > 0) {
    console.log("Lesson files missing l{lesson} in id:");
    for (const issue of idsWithoutLessonOrder) console.log(`- ${issue}`);
  }
  process.exit(1);
}

try {
  if (command === "rename") renameLesson();
  else if (command === "doctor") doctor();
  else throw new Error("Usage: bun run lesson:doctor OR bun run lesson:rename -- --from old-id --to new-id");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}