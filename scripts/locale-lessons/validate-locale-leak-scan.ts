#!/usr/bin/env bun
import { printResult } from "./lib/localization-contract-rules.ts";
import { validateLocaleLeakScan } from "./lib/validate-locale-leak-scan-core.ts";

const result = validateLocaleLeakScan();
printResult(result);
process.exit(result.ok ? 0 : 1);
