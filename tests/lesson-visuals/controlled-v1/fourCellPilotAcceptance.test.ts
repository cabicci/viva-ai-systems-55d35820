import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  METHOD_C_B6L3_FOUR_PILOT_HUMAN_DECISION,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import {
  loadFourCellPilotAcceptance,
  validateFourCellPilotAcceptance,
  verifyAcceptedFourCellPilotPngHashes,
} from "../../../src/lib/lesson-visuals/controlled-v1/fourCellPilotAcceptance";

describe("four-cell pilot human acceptance metadata", () => {
  it("records ACCEPT ALL 4 with exact cell IDs and immutable PNG SHA-256 values", () => {
    const record = loadFourCellPilotAcceptance();
    expect(record.decision).toBe(METHOD_C_B6L3_FOUR_PILOT_HUMAN_DECISION);
    const check = validateFourCellPilotAcceptance(record);
    expect(check.errors).toEqual([]);
    expect(check.ok).toBe(true);
    expect(record.acceptedCells).toHaveLength(4);
    for (const cell of record.acceptedCells) {
      expect(cell.status).toBe("ACCEPTED");
      expect(METHOD_C_B6L3_FOUR_PILOT_CELL_IDS as readonly string[]).toContain(cell.cellId);
      expect(cell.pngSha256).toBe(
        METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256[
          cell.cellId as keyof typeof METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256
        ],
      );
    }
  });

  it("verifies on-disk accepted PNG hashes remain byte-identical", () => {
    const roots = [
      "E:/Temp/method-b-to-c-four-cell-pilot-1d4389721abaa1467a2461b7d294f0936c6c5e01/cells",
      "artifacts/controlled-v1/cells",
    ];
    const result = verifyAcceptedFourCellPilotPngHashes((cellId) => {
      for (const root of roots) {
        const path = join(root, cellId, "final.png");
        if (existsSync(path)) return path;
      }
      return null;
    });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    for (const cellId of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
      expect(result.hashes[cellId]).toBe(
        METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256[
          cellId as keyof typeof METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256
        ],
      );
    }
  });
});
