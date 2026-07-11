#!/usr/bin/env bun
import { resolveRepoRoot, runReindexPlan } from "../../src/lib/rag/indexing";

const retryOnlyFailed = process.argv.includes("--retry-only-failed");
const failedArg = process.argv.find((a) => a.startsWith("--failed="));
const failedUnits = failedArg
  ? failedArg.replace("--failed=", "").split(",").filter(Boolean)
  : undefined;

const plan = runReindexPlan(resolveRepoRoot(), { retryOnlyFailed, failedUnits });
console.log(JSON.stringify(plan, null, 2));
