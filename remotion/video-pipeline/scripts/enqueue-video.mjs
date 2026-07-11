#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { outputDirFor } from "../lib/paths.ts";
import { enqueueCompletedVideo } from "../lib/commit-queue.ts";

function argValue(flag) {
  const args = process.argv.slice(2);
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.split("=")[1];
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return undefined;
}

const locale = argValue("--locale");
const lessonId = argValue("--lesson-id");
const cellId = `${locale}::${lessonId}`;
const outDir = outputDirFor(locale, lessonId);
const statusPath = path.join(outDir, "status.json");

if (!existsSync(statusPath)) {
  console.error(`Missing validated status at ${statusPath}`);
  process.exit(1);
}

const statusRecord = JSON.parse(readFileSync(statusPath, "utf8"));
enqueueCompletedVideo({
  cellId,
  lessonId,
  locale,
  artifactsDir: outDir,
  statusRecord,
});
console.log(JSON.stringify({ enqueued: cellId }, null, 2));
