import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "../../..");

describe("validate_local gates", () => {
  it("runs validate_local script when masters exist", async () => {
    const mastersDir = resolve(REPO, "docs/lesson-visuals/v1/masters");
    const script = resolve(
      REPO,
      "src/lib/lesson-visuals/v1/scripts/validate_local.ts",
    );
    expect(existsSync(script)).toBe(true);

    if (!existsSync(mastersDir)) {
      // Authoring may still be in progress in some environments
      expect(existsSync(script)).toBe(true);
      return;
    }

    const { runAllValidators } = await import(
      "../../../src/lib/lesson-visuals/v1/validators/index"
    );
    const report = runAllValidators();
    if (!report.ok) {
      console.error(report.issues.slice(0, 20));
    }
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
