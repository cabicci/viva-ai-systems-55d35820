#!/usr/bin/env bun
import { printResult } from "./lib/localization-contract-rules.ts";
import { validateManifestCurriculumSync } from "./lib/validate-manifest-curriculum-sync-core.ts";

const result = await validateManifestCurriculumSync();
printResult(result);
process.exit(result.ok ? 0 : 1);
