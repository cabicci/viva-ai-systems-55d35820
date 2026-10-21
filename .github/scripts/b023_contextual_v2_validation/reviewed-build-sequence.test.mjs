import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REVIEWED_BUILD, runReviewedBuildGuards } from "./reviewed-build-sequence.mjs";

test("the exact product build runs every guard before instrumented Vite", () => {
  const product = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  assert.equal(product.scripts.build, REVIEWED_BUILD);
  const calls = [];
  runReviewedBuildGuards(product.scripts.build, (script) => calls.push(script));
  assert.deepEqual(calls, ["assistant:verify", "roadmap:guard", "contextual-visuals:verify"]);
});

for (const [name, script] of [
  ["missing assistant verification", "bun run roadmap:guard && bun run contextual-visuals:verify && vite build"],
  ["missing roadmap verification", "bun run assistant:verify && bun run contextual-visuals:verify && vite build"],
  ["missing contextual verification", "bun run assistant:verify && bun run roadmap:guard && vite build"],
  ["reordered guards", "bun run roadmap:guard && bun run assistant:verify && bun run contextual-visuals:verify && vite build"],
  ["extra command", REVIEWED_BUILD + " && echo unreviewed"],
  ["changed Vite mode", REVIEWED_BUILD + " --mode development"],
  ["absent build", undefined],
]) {
  test(`rejects ${name} before running any command`, () => {
    const calls = [];
    assert.throws(() => runReviewedBuildGuards(script, (command) => calls.push(command)), /differs from the reviewed/);
    assert.deepEqual(calls, []);
  });
}
test("a failed guard prevents every later guard and Vite entry", () => {
  const calls = [];
  assert.throws(() => {
    runReviewedBuildGuards(REVIEWED_BUILD, (script) => {
      calls.push(script);
      if (script === "assistant:verify") throw new Error("invalid course");
    });
    calls.push("vite build");
  }, /invalid course/);
  assert.deepEqual(calls, ["assistant:verify"]);
});

