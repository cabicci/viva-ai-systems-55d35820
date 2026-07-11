#!/usr/bin/env bun
/** Plan matrix jobs for video-production-batch workflow. */
import { readFileSync, existsSync } from "node:fs";
import { buildVideoManifest } from "../lib/build-manifest.ts";
import { MANIFEST_PATH } from "../lib/paths.ts";
import { filterRetryOnlyFailed, getFailedCellIds } from "../lib/status-registry.ts";

function argValue(flag, fallback) {
  const args = process.argv.slice(2);
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.split("=")[1] ?? fallback;
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

const localeArg = argValue("--locale", "all");
const lessonIdsArg = argValue("--lesson-ids", "manifest");
const retryFailedOnly = process.argv.includes("--retry-failed-only");

let manifest;
if (existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
} else {
  manifest = buildVideoManifest();
}

let entries = manifest.entries;

if (localeArg !== "all") {
  entries = entries.filter((e) => e.locale === localeArg);
}

if (lessonIdsArg !== "manifest") {
  const ids = new Set(
    lessonIdsArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  entries = entries.filter((e) => ids.has(e.lessonId));
}

let cellIds = entries.map((e) => e.cellId);
if (retryFailedOnly) {
  cellIds = filterRetryOnlyFailed(cellIds, true);
  entries = entries.filter((e) => cellIds.includes(e.cellId));
}

const matrix = entries.map((e) => ({
  locale: e.locale,
  lessonId: e.lessonId,
  cellId: e.cellId,
  voiceProfileId: e.voiceProfileId,
}));

console.log(JSON.stringify({ count: matrix.length, matrix, failedAvailable: getFailedCellIds().length }));
