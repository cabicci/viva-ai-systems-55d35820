import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { selectFailedCellIdsFromReceipts } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import type { CellReceipt } from "../../../src/lib/lesson-visuals/controlled-v1/types";

function receipt(
  partial: Pick<CellReceipt, "cellId" | "status" | "producedAt"> & Partial<CellReceipt>,
): CellReceipt {
  return {
    receiptVersion: "controlled-v1-receipt/1",
    lessonId: partial.cellId.split("__")[0]!,
    locale: partial.cellId.split("__")[1] as CellReceipt["locale"],
    route: "INSTRUCTIONAL_COMPOSITION",
    mode: "pilot",
    reason: null,
    artifactPath: null,
    artifactSha256: null,
    bytesWritten: null,
    controlledFailureInjected: false,
    ...partial,
  };
}

describe("failed-only recovery selection", () => {
  it("selects only latest FAILED cells and never ACCEPTED cells", () => {
    const ids = selectFailedCellIdsFromReceipts([
      receipt({
        cellId: "intro-m1-l4-ai-can-cannot__en",
        status: "FAILED",
        producedAt: "2026-07-26T10:00:00.000Z",
        controlledFailureInjected: true,
      }),
      receipt({
        cellId: "intro-m1-l4-ai-can-cannot__ar-EG",
        status: "ACCEPTED",
        producedAt: "2026-07-26T10:00:01.000Z",
        artifactPath: "artifacts/controlled-v1/cells/intro-m1-l4-ai-can-cannot__ar-EG/final.png",
        artifactSha256: "AA",
        bytesWritten: 1,
      }),
      receipt({
        cellId: "builder-m7-l1-tables-columns__en",
        status: "ACCEPTED",
        producedAt: "2026-07-26T10:00:02.000Z",
        artifactPath: "artifacts/controlled-v1/cells/builder-m7-l1-tables-columns__en/final.png",
        artifactSha256: "BB",
        bytesWritten: 1,
      }),
    ]);
    expect(ids).toEqual(["intro-m1-l4-ai-can-cannot__en"]);
  });

  it("uses the latest receipt per cellId when older FAILED is superseded by ACCEPTED", () => {
    const ids = selectFailedCellIdsFromReceipts([
      receipt({
        cellId: "intro-m1-l4-ai-can-cannot__en",
        status: "FAILED",
        producedAt: "2026-07-26T10:00:00.000Z",
      }),
      receipt({
        cellId: "intro-m1-l4-ai-can-cannot__en",
        status: "ACCEPTED",
        producedAt: "2026-07-26T11:00:00.000Z",
        artifactSha256: "CC",
        bytesWritten: 2,
      }),
    ]);
    expect(ids).toEqual([]);
  });
});

describe("controlled-400 workflow failed-only recovery contract", () => {
  const yml = readFileSync(
    resolve(process.cwd(), ".github/workflows/controlled-400-visual-pipeline.yml"),
    "utf8",
  );

  it("requires prior_artifact_run_id for failed-only and restores artifacts before rerun", () => {
    expect(yml).toContain("prior_artifact_run_id:");
    expect(yml).toContain("mode=failed-only requires prior_artifact_run_id");
    expect(yml).toContain("actions/download-artifact@v4");
    expect(yml).toContain("Restore prior controlled-v1 artifacts for failed-only recovery");
    expect(yml).toContain("Verify restored FAILED receipts exist before failed-only");
    expect(yml).toMatch(/actions:\s*read/);
  });

  it("uploads cell PNG artifacts for Control Room audit", () => {
    expect(yml).toContain("artifacts/controlled-v1/cells/**");
  });
});
