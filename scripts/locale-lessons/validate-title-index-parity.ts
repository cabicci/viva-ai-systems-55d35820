#!/usr/bin/env bun
import { printResult } from "./lib/localization-contract-rules.ts";
import { validateTitleIndexParity } from "./lib/validate-title-index-parity-core.ts";

const result = await validateTitleIndexParity();
printResult(result);
process.exit(result.ok ? 0 : 1);
