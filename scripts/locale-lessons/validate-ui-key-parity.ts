#!/usr/bin/env bun
import { printResult } from "./lib/localization-contract-rules.ts";
import { validateUiKeyParity } from "./lib/validate-ui-key-parity-core.ts";

const result = await validateUiKeyParity();
printResult(result);
process.exit(result.ok ? 0 : 1);
