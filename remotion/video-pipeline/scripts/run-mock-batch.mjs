#!/usr/bin/env bun
/** Run mock pipeline for manifest cells (local validation only — no paid APIs). */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { MANIFEST_PATH, OUTPUT_ROOT } from "../lib/paths.ts";
import { runMockVideoPipeline } from "../lib/mock-pipeline.ts";
import { filterRetryOnlyFailed } from "../lib/status-registry.ts";

const args = process.argv.slice(2);
const retryFailedOnly = args.includes("--retry-failed-only");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
const failCell = args.find((a) => a.startsWith("--fail="))?.split("=")[1];

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
let cellIds = manifest.entries.map((e) => e.cellId);

if (args.includes("--sample")) {
  cellIds = cellIds.slice(0, 6);
}

cellIds = filterRetryOnlyFailed(cellIds, retryFailedOnly);
if (limit) cellIds = cellIds.slice(0, limit);

const results = [];
for (const id of cellIds) {
  const entry = manifest.entries.find((e) => e.cellId === id);
  if (!entry) continue;
  const r = runMockVideoPipeline(entry, {
    simulateFailure: failCell === id,
  });
  results.push({ cellId: id, ok: r.ok, errors: r.errors });
}

mkdirSync(path.join(OUTPUT_ROOT, "_reports"), { recursive: true });
const report = {
  mode: "mock",
  retryFailedOnly,
  processed: results.length,
  succeeded: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).length,
  results,
};
writeFileSync(
  path.join(OUTPUT_ROOT, "_reports", "mock-run.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
