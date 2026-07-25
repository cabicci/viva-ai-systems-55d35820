import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  getControlledFailureState,
  markControlledFailureTriggered,
  shouldInjectControlledFailure,
} from "../../../src/lib/lesson-visuals/controlled-v1/controlledFailure";
import { CONTROLLED_FAILURE_TARGET_CELL_ID } from "../../../src/lib/lesson-visuals/controlled-v1/constants";

let dir: string;
function tempStatePath(): string {
  dir = mkdtempSync(resolve(tmpdir(), "controlled-v1-failure-state-"));
  return resolve(dir, "state.json");
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("controlled-v1 controlledFailure (pilot-only injection)", () => {
  it("is impossible in full-400 mode, unconditionally, regardless of state", () => {
    const path = tempStatePath();
    expect(shouldInjectControlledFailure("full-400", CONTROLLED_FAILURE_TARGET_CELL_ID, path)).toBe(
      false,
    );
  });

  it("never injects for full-400 even for a fresh (never-triggered) state", () => {
    const path = tempStatePath();
    expect(getControlledFailureState(path).triggered).toBe(false);
    expect(shouldInjectControlledFailure("full-400", CONTROLLED_FAILURE_TARGET_CELL_ID, path)).toBe(
      false,
    );
  });

  it("only injects for the exact named target cell, in pilot mode", () => {
    const path = tempStatePath();
    expect(shouldInjectControlledFailure("pilot", "some-other-lesson__en", path)).toBe(false);
    expect(shouldInjectControlledFailure("pilot", CONTROLLED_FAILURE_TARGET_CELL_ID, path)).toBe(
      true,
    );
  });

  it("does not inject outside pilot mode (preflight/failed-only/report-only)", () => {
    const path = tempStatePath();
    for (const mode of ["preflight", "failed-only", "report-only"] as const) {
      expect(shouldInjectControlledFailure(mode, CONTROLLED_FAILURE_TARGET_CELL_ID, path)).toBe(
        false,
      );
    }
  });

  it("only injects on the first pilot run for the target cell; subsequent runs succeed", () => {
    const path = tempStatePath();
    expect(shouldInjectControlledFailure("pilot", CONTROLLED_FAILURE_TARGET_CELL_ID, path)).toBe(
      true,
    );
    markControlledFailureTriggered(CONTROLLED_FAILURE_TARGET_CELL_ID, path);
    expect(shouldInjectControlledFailure("pilot", CONTROLLED_FAILURE_TARGET_CELL_ID, path)).toBe(
      false,
    );
  });
});
