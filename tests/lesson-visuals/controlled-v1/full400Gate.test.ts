import { describe, expect, it } from "vitest";
import { runFull400 } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import { FULL_400_CONFIRM_TOKEN } from "../../../src/lib/lesson-visuals/controlled-v1/constants";

describe("controlled-v1 full-400 confirmation gate", () => {
  it("fails when confirm token is missing", () => {
    const result = runFull400(undefined);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("confirm_full_400");
  });

  it("fails when confirm token is present but not an exact match", () => {
    for (const bad of ["run_authorized_400", "RUN_AUTHORIZED_400 ", "RUN AUTHORIZED 400", "yes", "true", "RUN_AUTHORIZED_4000"]) {
      const result = runFull400(bad);
      expect(result.ok).toBe(false);
      expect(result.receipts).toEqual([]);
    }
  });

  it("does not touch the filesystem (no receipts written) when the token is wrong", () => {
    const before = runFull400("nope");
    expect(before.receipts.length).toBe(0);
  });

  it("the exact required token is recognized by the gate constant", () => {
    expect(FULL_400_CONFIRM_TOKEN).toBe("RUN_AUTHORIZED_400");
  });
});
