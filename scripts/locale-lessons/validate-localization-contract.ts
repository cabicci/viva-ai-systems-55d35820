#!/usr/bin/env bun
import {
  mergeResults,
  printResult,
} from "./lib/localization-contract-rules.ts";
import { validateTitleIndexParity } from "./lib/validate-title-index-parity-core.ts";
import { validateManifestCurriculumSync } from "./lib/validate-manifest-curriculum-sync-core.ts";
import { validateUiKeyParity } from "./lib/validate-ui-key-parity-core.ts";
import { validateLocaleLeakScan } from "./lib/validate-locale-leak-scan-core.ts";

const results = await Promise.all([
  validateTitleIndexParity(),
  validateManifestCurriculumSync(),
  validateUiKeyParity(),
  Promise.resolve(validateLocaleLeakScan()),
]);

for (const result of results) {
  printResult(result);
}

const merged = mergeResults(results);
console.log("");
console.log(`localization-contract: ${merged.ok ? "OK" : "FAIL"}`);
if (merged.warnings.length) {
  console.log(`Warnings: ${merged.warnings.length}`);
}
if (merged.errors.length) {
  console.log(`Errors: ${merged.errors.length}`);
}

process.exit(merged.ok ? 0 : 1);
