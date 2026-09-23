#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reviewed Phase A inventory on PR #52: 173 existing tests + five Live isolation tests.
export const billingInventory = new Map([
  ["automatic-trial-absence.test.ts", 4],
  ["billing-concurrency.integration.test.ts", 3],
  ["billing-contracts-v3.test.ts", 36],
  ["billing-corrective-v3.integration.test.ts", 20],
  ["billing-foundation.test.ts", 15],
  ["billing-paid-quota-alignment.integration.test.ts", 14],
  ["billing-plan-lesson-contract.integration.test.ts", 4],
  ["billing-public-rpc-bridge.test.ts", 15],
  ["billing-service-role-auth.test.ts", 9],
  ["native-rehearsal-contract.test.ts", 5],
  ["stripe-environment.test.ts", 2],
  ["stripe-generation-decisions.test.ts", 13],
  ["stripe-handlers.test.ts", 3],
  ["stripe-live-catalog-isolation.integration.test.ts", 3],
  ["stripe-refunds.integration.test.ts", 8],
  ["stripe-refunds.test.ts", 14],
  ["stripe-resubscription-generation.integration.test.ts", 10],
]);

export const quizInventory = new Map([["quiz-attempt-db-acl.integration.test.ts", 1]]);

function assertSameNames(actual, expected, label) {
  const missing = [...expected].filter((name) => !actual.has(name));
  const unexpected = [...actual].filter((name) => !expected.has(name));
  if (missing.length || unexpected.length) {
    throw new Error(`${label}: missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}]`);
  }
}

export function verifyInventory(log, phase, repositorySuiteNames) {
  const inventory = phase === "A" ? billingInventory : phase === "C" ? quizInventory : null;
  if (!inventory) throw new Error(`Unknown phase: ${phase}`);
  if (phase === "A" && repositorySuiteNames) {
    assertSameNames(new Set(repositorySuiteNames), new Set(inventory.keys()), "Repository suites");
  }

  const lines = log.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").split(/\r?\n/);
  const directory = phase === "A" ? "src/lib/billing/__tests__" : "src/lib/__tests__";
  const suites = new Map();
  for (const line of lines) {
    const match = line.match(new RegExp(`^\\s*✓\\s+${directory}/([^\\s]+)\\s+\\((\\d+) tests?\\)`));
    if (!match) continue;
    if (suites.has(match[1])) throw new Error(`Duplicate suite: ${match[1]}`);
    suites.set(match[1], Number(match[2]));
  }
  assertSameNames(new Set(suites.keys()), new Set(inventory.keys()), "Passing suites");
  for (const [name, expected] of inventory) {
    if (suites.get(name) !== expected) {
      throw new Error(`${name}: expected ${expected} tests, got ${suites.get(name)}`);
    }
  }

  const total = [...inventory.values()].reduce((sum, count) => sum + count, 0);
  if (!lines.some((line) => new RegExp(`^\\s*Test Files\\s+${inventory.size} passed \\(${inventory.size}\\)\\s*$`).test(line))) {
    throw new Error(`Expected exactly ${inventory.size} passing test files, with none failed, skipped or todo`);
  }
  if (!lines.some((line) => new RegExp(`^\\s*Tests\\s+${total} passed \\(${total}\\)\\s*$`).test(line))) {
    throw new Error(`Expected exactly ${total} passing tests, with none failed, skipped or todo`);
  }
  if (lines.some((line) => /\b[1-9][0-9]*\s+(?:failed|skipped|todo)\b/i.test(line))) {
    throw new Error("A failed, skipped or todo test was reported");
  }
  return `${inventory.size} named suites, ${total} passing tests, 0 failed/skipped/todo`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [phase, logPath] = process.argv.slice(2);
  try {
    if (!phase || !logPath) throw new Error("Usage: verify-inventory.mjs A|C path/to/vitest.log");
    const repositorySuiteNames = phase === "A"
      ? readdirSync("src/lib/billing/__tests__").filter((name) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(name))
      : undefined;
    console.log(verifyInventory(readFileSync(logPath, "utf8"), phase, repositorySuiteNames));
  } catch (error) {
    console.error(`[billing-v3-inventory] ${error.message}`);
    process.exitCode = 1;
  }
}
