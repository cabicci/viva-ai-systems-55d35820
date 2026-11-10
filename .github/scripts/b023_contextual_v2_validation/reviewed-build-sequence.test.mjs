import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REVIEWED_BUILD, runReviewedBuildGuards } from "./reviewed-build-sequence.mjs";

test("hosted builds compile source and Git checkout builds also verify roadmap binding", () => {
  const product = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  assert.equal(product.scripts.build, REVIEWED_BUILD);
  assert.equal(product.scripts["build:dev"], REVIEWED_BUILD + " --mode development");
  assert.equal(product.scripts["build:checked"], "bun run roadmap:guard && bun run build");
  const calls = [];
  runReviewedBuildGuards(product.scripts.build, (...args) => calls.push(args));
  assert.deepEqual(calls, [
    ["roadmap:guard"],
    ["assistant:verify"],
    ["contextual-visuals:verify"],
  ]);
});

for (const [name, script] of [
  ["missing assistant verification", "bun run contextual-visuals:verify && vite build"],
  ["missing contextual verification", "bun run assistant:verify && vite build"],
  ["reordered guards", "bun run contextual-visuals:verify && bun run assistant:verify && vite build"],
  ["Git guard inside hosted build", "bun run roadmap:guard && " + REVIEWED_BUILD],
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
  assert.deepEqual(calls, ["roadmap:guard", "assistant:verify"]);
});

test("a failed roadmap guard still prevents contextual verification and Vite", () => {
  const calls = [];
  assert.throws(() => {
    runReviewedBuildGuards(REVIEWED_BUILD, (...args) => {
      calls.push(args);
      if (args[0] === "roadmap:guard") throw new Error("unbound source");
    });
    calls.push(["vite build"]);
  }, /unbound source/);
  assert.deepEqual(calls, [["roadmap:guard"]]);
});

