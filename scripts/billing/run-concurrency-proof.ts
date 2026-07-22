#!/usr/bin/env bun
/**
 * CI entrypoint for billing concurrency proofs against a disposable database.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { disposableDbReady } from "./disposable-db";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const TEST = "src/lib/billing/__tests__/billing-concurrency.integration.test.ts";

if (!disposableDbReady()) {
  console.error("[billing-concurrency] disposable database not available — cannot run proofs.");
  process.exit(2);
}

const result = spawnSync("bunx", ["vitest", "run", TEST], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: { ...process.env, BILLING_DISPOSABLE_DB: "1" },
});

if (result.status !== 0) {
  console.error(`[billing-concurrency] proofs FAILED (exit ${result.status}).`);
  process.exit(result.status ?? 1);
}

console.log("[billing-concurrency] proofs PASSED.");
