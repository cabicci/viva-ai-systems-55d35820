#!/usr/bin/env bun
/**
 * apply-v9-decisions.ts
 *
 * Reads approved/edited decisions from v9_apply_decisions table,
 * reorders the SCENES array in each lesson file,
 * prints trigger-lesson.sh batches (≤400 chars each) for video re-render.
 *
 * Usage:
 *   bun scripts/apply-v9-decisions.ts          # dry run
 *   bun scripts/apply-v9-decisions.ts --write  # actually write files
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const WRITE = process.argv.includes("--write");
const LESSONS_DIR = "src/components/intro/lessons";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

type Decision = {
  lesson_id: string;
  decision: "approve" | "edit" | "reject";
  new_order: number[] | null;
  notes: string | null;
};

async function main() {
  const { data, error } = await sb
    .from("v9_apply_decisions")
    .select("lesson_id, decision, new_order, notes")
    .in("decision", ["approve", "edit"]);

  if (error) {
    console.error("Failed to fetch decisions:", error.message);
    process.exit(1);
  }

  const decisions = (data ?? []) as Decision[];
  console.log(`📋 Found ${decisions.length} decisions to apply`);

  const applied: string[] = [];
  const failed: string[] = [];

  for (const d of decisions) {
    if (!d.new_order) {
      console.warn(`⏭  ${d.lesson_id}: no new_order, skipping`);
      continue;
    }
    const filePath = join(LESSONS_DIR, `${d.lesson_id}.ts`);
    try {
      const src = readFileSync(filePath, "utf8");
      const reordered = reorderScenesInSource(src, d.new_order);
      if (reordered === src) {
        console.warn(`⏭  ${d.lesson_id}: no change after reorder`);
        continue;
      }
      if (WRITE) {
        writeFileSync(filePath, reordered);
        console.log(`✅ ${d.lesson_id}: written`);
      } else {
        console.log(`🟡 ${d.lesson_id}: would reorder (dry run)`);
      }
      applied.push(d.lesson_id);
    } catch (e) {
      console.error(`❌ ${d.lesson_id}:`, e instanceof Error ? e.message : e);
      failed.push(d.lesson_id);
    }
  }

  console.log(`\n📊 Summary: ${applied.length} applied, ${failed.length} failed`);

  // Print trigger batches (≤400 chars each)
  if (applied.length && WRITE) {
    console.log("\n🎬 Video re-render batches:");
    const batches: string[][] = [];
    let cur: string[] = [];
    let curLen = 0;
    for (const id of applied) {
      const add = (cur.length ? 1 : 0) + id.length; // comma + id
      if (curLen + add > 380) {
        batches.push(cur);
        cur = [id];
        curLen = id.length;
      } else {
        cur.push(id);
        curLen += add;
      }
    }
    if (cur.length) batches.push(cur);
    for (const b of batches) {
      console.log(`bash scripts/trigger-lesson.sh "${b.join(",")}" --force-script`);
    }
  }
}

/**
 * Parses the SCENES array literal in a lesson file and reorders it.
 * Assumes shape: `const SCENES = [ {...}, {...}, ... ];` or `export const SCENES = [...]`.
 */
function reorderScenesInSource(src: string, order: number[]): string {
  const match = src.match(/(const SCENES\s*[:=][\s\S]*?=\s*\[)([\s\S]*?)(\];)/);
  if (!match) {
    throw new Error("Could not find SCENES array in lesson file");
  }
  const [full, prefix, body, suffix] = match;
  const items = splitTopLevelObjects(body);
  if (items.length !== order.length) {
    throw new Error(
      `Scene count mismatch: file has ${items.length}, decision has ${order.length}`,
    );
  }
  const reordered = order.map((i) => items[i]);
  const newBody = "\n  " + reordered.join(",\n  ") + ",\n";
  return src.replace(full, prefix + newBody + suffix);
}

function splitTopLevelObjects(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(body.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
