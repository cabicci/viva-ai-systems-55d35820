#!/usr/bin/env bun
import { resolveRepoRoot, runMockIndexingFlow } from "../../src/lib/rag/indexing";

const report = runMockIndexingFlow(resolveRepoRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.activationOk && report.rollbackOk ? 0 : 1);
