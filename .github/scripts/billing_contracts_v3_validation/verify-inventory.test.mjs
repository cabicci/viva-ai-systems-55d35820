import assert from "node:assert/strict";
import test from "node:test";
import { billingInventory, quizInventory, verifyInventory } from "./verify-inventory.mjs";

const names = [...billingInventory.keys()];
const total = [...billingInventory.values()].reduce((sum, count) => sum + count, 0);
const suiteLines = [...billingInventory].map(([name, count]) =>
  ` ✓ src/lib/billing/__tests__/${name} (${count} tests) 10ms`
);
const validLog = [...suiteLines, ` Test Files  ${names.length} passed (${names.length})`,
  ` Tests  ${total} passed (${total})`].join("\n");

test("accepts the reviewed 17-suite, 178-test inventory and the separate quiz ACL proof", () => {
  assert.equal(total, 178);
  assert.match(verifyInventory(validLog, "A", names), /17 named suites, 178 passing tests/);
  const quiz = ` ✓ src/lib/__tests__/quiz-attempt-db-acl.integration.test.ts (1 test)\n Test Files  1 passed (1)\n Tests  1 passed (1)`;
  assert.match(verifyInventory(quiz, "C"), /1 named suites, 1 passing tests/);
  assert.equal(quizInventory.size, 1);
});

test("fails when a mandatory suite is missing even if summary counts are unchanged", () => {
  const missing = validLog.replace(suiteLines[0], "");
  assert.throws(() => verifyInventory(missing, "A", names), /Passing suites: missing/);
  assert.throws(() => verifyInventory(validLog, "A", names.slice(1)), /Repository suites: missing/);
});

test("fails skipped and todo tests even when passing suite lines are present", () => {
  assert.throws(() => verifyInventory(`${validLog}\n Tests  1 skipped`, "A", names), /skipped/);
  assert.throws(() => verifyInventory(validLog.replace(`Tests  ${total} passed (${total})`,
    `Tests  ${total} passed (${total}) | 1 todo`), "A", names), /todo/);
});

test("fails an unexpected suite or a changed per-suite count", () => {
  assert.throws(() => verifyInventory(validLog.replace(suiteLines[0],
    " ✓ src/lib/billing/__tests__/unexpected.test.ts (4 tests)"), "A", names), /unexpected/);
  assert.throws(() => verifyInventory(validLog.replace(suiteLines[0],
    suiteLines[0].replace("(4 tests)", "(3 tests)")), "A", names), /expected 4 tests/);
});
