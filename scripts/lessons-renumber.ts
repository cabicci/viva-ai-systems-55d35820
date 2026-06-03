/**
 * Lessons renumber tool
 * ---------------------
 * يعيد ترقيم الـ lesson IDs بحيث يلتزم كل درس بصيغة:
 *   {pathId}-m{moduleOrder}-l{lessonOrderInModule}-{slug}
 *
 * الاستخدام:
 *   bun run scripts/lessons-renumber.ts            # dry-run (تقرير فقط)
 *   bun run scripts/lessons-renumber.ts --apply    # ينفّذ التغييرات
 *   bun run scripts/lessons-renumber.ts --path creator --apply
 *
 * ما يفعله مع --apply:
 *   1) يعيد تسمية ملفات src/components/intro/lessons/*.ts
 *   2) يعدّل المسارات في src/components/intro/lessons/index.ts
 *   3) يستبدل الـ IDs والـ routes في src/lib/curriculum-data.ts
 *   4) يضيف alias في src/lib/bunny-videos.ts بنفس الـ GUID (الفيديو القديم
 *      على Bunny يفضل يشتغل بدون re-render — صفر تكلفة Gemini)
 *   5) يصدر ملف هجرة SQL في supabase/migrations/ يعمل UPDATE على lesson_id
 *      في الـ 8 جداول اللي بتخزن lesson_id.
 *
 * المهم: لو تم تشغيل --apply أكتر من مرة، عمليات الـ rename تكون idempotent
 * (لو الاسم الجديد = القديم، نتخطّى).
 */

import { existsSync, readFileSync, renameSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

// Import curriculum data (source of truth for desired structure)
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { PATHS, type CurriculumPath } from "../src/lib/curriculum-data";

const ROOT = join(import.meta.dir ?? process.cwd(), "..");
const LESSONS_DIR = join(ROOT, "src/components/intro/lessons");
const LESSONS_INDEX = join(LESSONS_DIR, "index.ts");
const CURRICULUM_FILE = join(ROOT, "src/lib/curriculum-data.ts");
const BUNNY_FILE = join(ROOT, "src/lib/bunny-videos.ts");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

const LESSON_TABLES = [
  "lesson_progress",
  "lesson_feedback",
  "lesson_notes",
  "lesson_quiz_attempts",
  "lesson_review_schedule",
  "user_lesson_status",
  "user_mission_state",
  "mission_submissions",
  "learner_events",
];

type Args = { apply: boolean; pathFilter?: string };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const pIdx = argv.indexOf("--path");
  const pathFilter = pIdx >= 0 ? argv[pIdx + 1] : undefined;
  return { apply, pathFilter };
}

/** Strip the {path}-m\d+(-l\d+[a-z]?)? prefix from an id to get the bare slug. */
function extractSlug(pathId: string, lessonId: string): string {
  const re = new RegExp(`^${pathId}-m\\d+(?:-l\\d+[a-z]?)?-`);
  return lessonId.replace(re, "");
}

function canonicalId(pathId: string, moduleOrder: number, lessonOrder: number, slug: string): string {
  return `${pathId}-m${moduleOrder}-l${lessonOrder}-${slug}`;
}

interface Rename {
  pathId: string;
  moduleOrder: number;
  lessonOrder: number;
  oldId: string;
  newId: string;
}

function computeRenames(filter?: string): Rename[] {
  const out: Rename[] = [];
  for (const p of PATHS as CurriculumPath[]) {
    if (filter && p.id !== filter) continue;
    for (const m of p.modules) {
      for (const l of m.lessons) {
        const slug = extractSlug(p.id, l.id);
        const newId = canonicalId(p.id, m.order, l.order, slug);
        if (newId !== l.id) {
          out.push({ pathId: p.id, moduleOrder: m.order, lessonOrder: l.order, oldId: l.id, newId });
        }
      }
    }
  }
  return out;
}

function renameLessonFile(oldId: string, newId: string) {
  const oldPath = join(LESSONS_DIR, `${oldId}.ts`);
  const newPath = join(LESSONS_DIR, `${newId}.ts`);
  if (!existsSync(oldPath)) {
    console.warn(`  ⚠️  file not found: ${oldId}.ts (skipping rename)`);
    return false;
  }
  if (oldPath === newPath) return true;
  if (existsSync(newPath)) {
    console.warn(`  ⚠️  target exists: ${newId}.ts (skipping)`);
    return false;
  }
  renameSync(oldPath, newPath);
  return true;
}

function patchFile(filePath: string, renames: Rename[]) {
  if (!existsSync(filePath)) return 0;
  let content = readFileSync(filePath, "utf8");
  let count = 0;
  for (const { oldId, newId } of renames) {
    // Escape for regex (ids are safe but just in case)
    const re = new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const before = content;
    content = content.replace(re, newId);
    if (content !== before) count++;
  }
  writeFileSync(filePath, content);
  return count;
}

function patchBunnyAliases(renames: Rename[]) {
  if (!existsSync(BUNNY_FILE)) return;
  let content = readFileSync(BUNNY_FILE, "utf8");
  // For each rename, find the line `"oldId": "guid",` and if newId not present,
  // duplicate with new key (alias). This keeps old Bunny video name working
  // without re-render.
  for (const { oldId, newId } of renames) {
    const aliasExists = new RegExp(`"${newId}"\\s*:`).test(content);
    if (aliasExists) continue;
    const re = new RegExp(`(\\s*)"${oldId}":\\s*"([^"]+)",`);
    const m = content.match(re);
    if (!m) continue;
    const indent = m[1];
    const guid = m[2];
    const insertion = `${indent}"${newId}": "${guid}",`;
    content = content.replace(re, `$&${insertion}`);
  }
  writeFileSync(BUNNY_FILE, content);
}

function emitMigration(renames: Rename[]): string {
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const filename = `${ts}_renumber_lessons.sql`;
  const filepath = join(MIGRATIONS_DIR, filename);
  const lines: string[] = [];
  lines.push("-- Auto-generated by scripts/lessons-renumber.ts");
  lines.push("-- Renames lesson_id values across all learner-data tables.");
  lines.push("BEGIN;");
  for (const t of LESSON_TABLES) {
    lines.push(`-- Table: ${t}`);
    for (const { oldId, newId } of renames) {
      lines.push(
        `UPDATE public.${t} SET lesson_id = '${newId}' WHERE lesson_id = '${oldId}';`,
      );
    }
  }
  lines.push("COMMIT;");
  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, lines.join("\n") + "\n");
  return filepath;
}

function main() {
  const { apply, pathFilter } = parseArgs();
  const renames = computeRenames(pathFilter);

  console.log(`\n📋 Lessons renumber — ${apply ? "APPLY" : "dry-run"}${pathFilter ? ` (path=${pathFilter})` : ""}`);
  console.log(`   Found ${renames.length} lesson(s) needing rename.\n`);

  if (renames.length === 0) {
    console.log("✅ Everything is already canonical. Nothing to do.");
    return;
  }

  // Group by path for nicer output
  const byPath: Record<string, Rename[]> = {};
  for (const r of renames) (byPath[r.pathId] ||= []).push(r);
  for (const [pid, list] of Object.entries(byPath)) {
    console.log(`── ${pid} (${list.length})`);
    for (const r of list) {
      console.log(`   m${r.moduleOrder} l${r.lessonOrder}  ${r.oldId}\n              → ${r.newId}`);
    }
    console.log("");
  }

  if (!apply) {
    console.log("ℹ️  Dry-run only. Re-run with --apply to perform changes.");
    return;
  }

  console.log("🔧 Applying renames…\n");

  // 1) Rename lesson files
  let renamed = 0;
  for (const r of renames) if (renameLessonFile(r.oldId, r.newId)) renamed++;
  console.log(`   ✅ Renamed ${renamed} lesson file(s).`);

  // 2) Patch lessons/index.ts (paths inside import "./...")
  const idxCount = patchFile(LESSONS_INDEX, renames);
  console.log(`   ✅ Patched lessons/index.ts (${idxCount} replacements).`);

  // 3) Patch curriculum-data.ts (ids + routes)
  const curCount = patchFile(CURRICULUM_FILE, renames);
  console.log(`   ✅ Patched curriculum-data.ts (${curCount} replacements).`);

  // 4) Bunny aliases — keep old GUID under new key (no re-render needed)
  patchBunnyAliases(renames);
  console.log(`   ✅ Added Bunny aliases (old videos remain valid, zero re-render cost).`);

  // 5) Emit DB migration
  const mpath = emitMigration(renames);
  console.log(`   ✅ Wrote migration: ${mpath.replace(ROOT + "/", "")}`);

  console.log(`\n📌 Next steps:`);
  console.log(`   • Review the diff (git status)`);
  console.log(`   • Apply the migration via the migration tool`);
  console.log(`   • Run: bun run roadmap:log`);
  console.log(`\n💰 Gemini cost: 0 (Bunny videos aliased, no re-render).`);
}

main();
