#!/usr/bin/env bun
/** Process serialized one-video-per-commit queue (local branch only). */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { processCommitQueue, getCommitOrder } from "../lib/commit-queue.ts";
import { OUTPUT_ROOT } from "../lib/paths.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const maxArg = args.find((a) => a.startsWith("--max="));
const maxItems = maxArg ? Number(maxArg.split("=")[1]) : undefined;

const result = processCommitQueue({ dryRun, maxItems });

mkdirSync(path.join(OUTPUT_ROOT, "_reports"), { recursive: true });
const report = { ...result, order: getCommitOrder() };
writeFileSync(
  path.join(OUTPUT_ROOT, "_reports", "commit-queue.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
