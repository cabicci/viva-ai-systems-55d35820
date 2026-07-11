#!/usr/bin/env bun
/**
 * Paid pilot runner — exactly 6 videos (2 lessonIds × 3 locales).
 * Authorized paid TTS + local render. Does not push video-results.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { MANIFEST_PATH, OUTPUT_ROOT, REPO_ROOT } from "../lib/paths.ts";
import { runLiveVideoPipeline } from "../lib/live-pipeline.ts";
import { processCommitQueue } from "../lib/commit-queue.ts";
import { filterRetryOnlyFailed } from "../lib/status-registry.ts";
import { PILOT_LESSON_IDS, PILOT_SELECTION_REASONS } from "../lib/pilot-lessons.ts";

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile(path.join(REPO_ROOT, ".env"));

const args = process.argv.slice(2);
const retryFailedOnly = args.includes("--retry-failed-only");
const simulateFailCell = args.find((a) => a.startsWith("--fail="))?.split("=")[1];
const dryRun = args.includes("--dry-run");
const fixtureTts = args.includes("--fixture-tts");

if (!dryRun && !fixtureTts && !process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY required for paid pilot. Set in E:\\Masaarat\\Worktrees\\viva-video-production\\.env or use --fixture-tts for render-path validation only.");
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const locales = ["ar-MSA", "ar-Gulf", "en"];

let cells = [];
for (const lessonId of PILOT_LESSON_IDS) {
  for (const locale of locales) {
    const entry = manifest.entries.find((e) => e.locale === locale && e.lessonId === lessonId);
    if (entry) cells.push(entry);
  }
}

let cellIds = cells.map((c) => c.cellId);
if (retryFailedOnly) {
  cellIds = filterRetryOnlyFailed(cellIds, true);
  cells = cells.filter((c) => cellIds.includes(c.cellId));
}

if (simulateFailCell && !retryFailedOnly) {
  const failEntry = cells.find((c) => c.cellId === simulateFailCell);
  if (failEntry) {
    await runLiveVideoPipeline(failEntry, { simulateFailure: true });
    cellIds = cellIds.filter((id) => id !== simulateFailCell);
    cells = cells.filter((c) => c.cellId !== simulateFailCell);
  }
}

const results = [];
for (const entry of cells) {
  if (dryRun) {
    results.push({ cellId: entry.cellId, ok: true, dryRun: true });
    continue;
  }
  const r = await runLiveVideoPipeline(entry, { force: retryFailedOnly, fixtureTts });
  results.push({
    cellId: entry.cellId,
    ok: r.ok,
    skipped: r.skipped,
    errors: r.errors,
    renderDurationMs: r.renderDurationMs,
    ttsCostNote: r.ttsCostNote,
  });
}

if (!dryRun && results.some((r) => r.ok && !r.skipped)) {
  processCommitQueue({ maxItems: results.filter((r) => r.ok && !r.skipped).length });
}

const log = spawnSync("git", ["log", "--oneline", "-20", "video-results"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

const report = {
  pilotLessonIds: PILOT_LESSON_IDS,
  selectionReasons: PILOT_SELECTION_REASONS,
  retryFailedOnly,
  processed: results.length,
  succeeded: results.filter((r) => r.ok && !r.skipped).length,
  skipped: results.filter((r) => r.skipped).length,
  failed: results.filter((r) => !r.ok).length,
  results,
  videoResultsLog: log.stdout?.trim().split("\n").filter(Boolean),
};

mkdirSync(path.join(OUTPUT_ROOT, "_reports"), { recursive: true });
writeFileSync(
  path.join(OUTPUT_ROOT, "_reports", "paid-pilot.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
