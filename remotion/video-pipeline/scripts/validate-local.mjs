#!/usr/bin/env bun
/** Full local/mock validation harness for Agent 3 readiness proof. */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildVideoManifest, assertManifestInvariants } from "../lib/build-manifest.ts";
import { extractAllScripts } from "../lib/script-extract.ts";
import { detectCrossLocaleContamination } from "../lib/script-validate.ts";
import { assertVoiceMappingComplete } from "../lib/voice-map.ts";
import { PIPELINE_ROOT, OUTPUT_ROOT } from "../lib/paths.ts";
import { resetCommitQueueForTest } from "../lib/commit-queue.ts";
import { REQUIRED_LOCALE_TOTALS, REQUIRED_TOTAL_VIDEOS } from "../lib/types.ts";

const scriptsDir = path.join(PIPELINE_ROOT, "scripts");

function run(script, extraArgs = []) {
  const r = spawnSync("bun", [path.join(scriptsDir, script), ...extraArgs], {
    cwd: path.join(PIPELINE_ROOT, "../.."),
    encoding: "utf8",
    stdio: "pipe",
  });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    return false;
  }
  return true;
}

const manifest = buildVideoManifest();
assertManifestInvariants(manifest);

const totalsOk =
  manifest.totalVideos === REQUIRED_TOTAL_VIDEOS &&
  manifest.localeTotals["ar-MSA"] === REQUIRED_LOCALE_TOTALS["ar-MSA"] &&
  manifest.localeTotals["ar-Gulf"] === REQUIRED_LOCALE_TOTALS["ar-Gulf"] &&
  manifest.localeTotals.en === REQUIRED_LOCALE_TOTALS.en;

const sampleEntries = [
  ...manifest.entries.filter((e) => e.locale === "ar-MSA").slice(0, 1),
  ...manifest.entries.filter((e) => e.locale === "ar-Gulf").slice(0, 1),
  ...manifest.entries.filter((e) => e.locale === "en").slice(0, 1),
];
const scripts = extractAllScripts(sampleEntries);
const contamination = detectCrossLocaleContamination(scripts);
const voiceProfiles = assertVoiceMappingComplete(["ar-MSA", "ar-Gulf", "en"]);

resetCommitQueueForTest();
run("generate-fixtures.mjs");
run("build-manifest.mjs");
run("run-mock-batch.mjs", ["--sample"]);
run("run-mock-batch.mjs", [`--fail=${manifest.entries[3].cellId}`, "--limit=1"]);
run("run-mock-batch.mjs", ["--retry-failed-only", "--limit=5"]);
run("process-commit-queue.mjs", ["--dry-run", "--max=3"]);

const report = {
  agent: "Agent 3 — Video Production Pipeline",
  manifestTotals: {
    total: manifest.totalVideos,
    localeTotals: manifest.localeTotals,
    totalsOk,
  },
  scriptMapping: {
    sampleExtracted: scripts.length,
    crossLocaleClean: contamination.ok,
  },
  voiceMapping: {
    profiles: Object.fromEntries(
      Object.entries(voiceProfiles).map(([k, v]) => [k, v.profileId]),
    ),
    allLocalesMapped: Object.keys(voiceProfiles).length === 3,
  },
  fixturesGenerated: run("generate-fixtures.mjs"),
  validationTimestamp: new Date().toISOString(),
};

mkdirSync(path.join(OUTPUT_ROOT, "_reports"), { recursive: true });
writeFileSync(
  path.join(OUTPUT_ROOT, "_reports", "readiness-validation.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
process.exit(totalsOk && contamination.ok ? 0 : 1);
