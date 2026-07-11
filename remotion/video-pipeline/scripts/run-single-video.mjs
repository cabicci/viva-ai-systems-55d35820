#!/usr/bin/env bun
/** Produce one locale/lesson video cell (mock or live). */
import { readFileSync } from "node:fs";
import { MANIFEST_PATH } from "../lib/paths.ts";
import { runMockVideoPipeline } from "../lib/mock-pipeline.ts";

function argValue(flag) {
  const args = process.argv.slice(2);
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.split("=")[1];
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return undefined;
}

function argsIncludes(flag) {
  return process.argv.slice(2).includes(flag);
}

const locale = argValue("--locale");
const lessonId = argValue("--lesson-id");
const mock = argsIncludes("--mock") || process.env.MOCK_MODE === "true";

if (!locale || !lessonId) {
  console.error("Usage: run-single-video.mjs --locale=... --lesson-id=... [--mock]");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const entry = manifest.entries.find((e) => e.locale === locale && e.lessonId === lessonId);
if (!entry) {
  console.error(`No manifest entry for ${locale}::${lessonId}`);
  process.exit(1);
}

if (mock) {
  const result = runMockVideoPipeline(entry);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

console.error(
  "Live production requires locale-aware TTS/render integration (Phase: paid bulk execution). " +
    "Use --mock for local validation.",
);
process.exit(2);
