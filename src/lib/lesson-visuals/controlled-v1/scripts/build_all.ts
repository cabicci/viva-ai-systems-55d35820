#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { buildPilotManifest, buildProductionManifest, buildUnresolvedLedger, writeJson } from "../buildManifest";
import { loadClassification100, validateClassification100, verifyMediaMapCopyChecksum } from "../loadClassification";
import { allGoldenReferencesOk, loadGoldenReferences, verifyGoldenReferences } from "../goldenRefs";
import { CLASSIFICATION_SOURCE_SHA256 } from "../constants";
import {
  EXTERNAL_MEDIA_MAP_DIR,
  PILOT_MANIFEST_PATH,
  PRODUCTION_MANIFEST_PATH,
  UNRESOLVED_LEDGER_PATH,
} from "../paths";
import { validateProductionManifest } from "../validateManifest";

function main() {
  console.log("== controlled-v1 build_all ==");

  const externalAvailable = existsSync(EXTERNAL_MEDIA_MAP_DIR);
  console.log(
    externalAvailable
      ? `external classification source found at ${EXTERNAL_MEDIA_MAP_DIR} (local-only; re-derivation not performed automatically — classification-100.json is hand-authored/frozen and checked for drift only)`
      : `external classification source not found (expected in CI) — using committed docs/lesson-visuals/controlled-v1/classification-100.json only`,
  );

  const mediaMapCheck = verifyMediaMapCopyChecksum(CLASSIFICATION_SOURCE_SHA256);
  console.log(`media-map repo copy checksum ok=${mediaMapCheck.ok} sha256=${mediaMapCheck.actualSha256}`);
  if (!mediaMapCheck.ok) {
    console.error("media-map repo copy checksum MISMATCH — refusing to build manifest");
    process.exit(1);
  }

  const classification = loadClassification100();
  const classificationCheck = validateClassification100(classification);
  console.log(`classification-100.json valid=${classificationCheck.ok}`);
  if (!classificationCheck.ok) {
    for (const e of classificationCheck.errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  console.log(`PRODUCTION_MANIFEST.json valid=${manifestCheck.ok} cells=${manifest.cells.length}`);
  if (!manifestCheck.ok) {
    for (const e of manifestCheck.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  writeJson(PRODUCTION_MANIFEST_PATH, manifest);

  const pilotManifest = buildPilotManifest(classification);
  console.log(`PILOT_MANIFEST.json cells=${pilotManifest.cells.length}`);
  writeJson(PILOT_MANIFEST_PATH, pilotManifest);

  const unresolvedLedger = buildUnresolvedLedger(manifest);
  console.log(`UNRESOLVED_LEDGER.json entries=${unresolvedLedger.entries.length}`);
  writeJson(UNRESOLVED_LEDGER_PATH, unresolvedLedger);

  const goldenResults = verifyGoldenReferences(loadGoldenReferences());
  const goldenOk = allGoldenReferencesOk(goldenResults);
  console.log(`golden references ok=${goldenOk} (${goldenResults.length} entries)`);
  if (!goldenOk) {
    for (const r of goldenResults.filter((x) => !x.ok)) console.error(`  - ${r.id}: ${r.error}`);
    process.exit(1);
  }

  console.log("build_all OK");
}

main();
