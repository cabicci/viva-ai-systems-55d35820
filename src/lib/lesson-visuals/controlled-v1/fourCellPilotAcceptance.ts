import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  METHOD_C_B6L3_FOUR_PILOT_HUMAN_DECISION,
} from "./constants";
import { DOCS_CONTROLLED_V1 } from "./paths";
import { resolve } from "node:path";

export const FOUR_CELL_PILOT_ACCEPTANCE_PATH = resolve(
  DOCS_CONTROLLED_V1,
  "acceptance/method-b-to-c-four-cell-pilot-acceptance.json",
);

export interface FourCellPilotAcceptanceRecord {
  schemaVersion: string;
  decision: string;
  acceptedCells: Array<{
    cellId: string;
    locale: string;
    status: string;
    pngSha256: string;
  }>;
}

export function loadFourCellPilotAcceptance(
  path: string = FOUR_CELL_PILOT_ACCEPTANCE_PATH,
): FourCellPilotAcceptanceRecord {
  return JSON.parse(readFileSync(path, "utf8")) as FourCellPilotAcceptanceRecord;
}

export function validateFourCellPilotAcceptance(
  record: FourCellPilotAcceptanceRecord = loadFourCellPilotAcceptance(),
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (record.decision !== METHOD_C_B6L3_FOUR_PILOT_HUMAN_DECISION) {
    errors.push(
      `decision must be "${METHOD_C_B6L3_FOUR_PILOT_HUMAN_DECISION}", got ${JSON.stringify(record.decision)}`,
    );
  }
  if (record.acceptedCells.length !== METHOD_C_B6L3_FOUR_PILOT_CELL_IDS.length) {
    errors.push(
      `expected ${METHOD_C_B6L3_FOUR_PILOT_CELL_IDS.length} accepted cells, got ${record.acceptedCells.length}`,
    );
  }
  const byId = new Map(record.acceptedCells.map((c) => [c.cellId, c]));
  for (const cellId of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
    const entry = byId.get(cellId);
    if (!entry) {
      errors.push(`missing accepted cell: ${cellId}`);
      continue;
    }
    if (entry.status !== "ACCEPTED") {
      errors.push(`${cellId} status must be ACCEPTED, got ${entry.status}`);
    }
    const expectedSha =
      METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256[
        cellId as keyof typeof METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256
      ];
    if (entry.pngSha256.toUpperCase() !== expectedSha) {
      errors.push(`${cellId} acceptance pngSha256 mismatch`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Verify on-disk PNG bytes match the immutable accepted SHA-256 values. */
export function verifyAcceptedFourCellPilotPngHashes(
  resolvePngPath: (cellId: string) => string | null,
): { ok: boolean; errors: string[]; hashes: Record<string, string> } {
  const errors: string[] = [];
  const hashes: Record<string, string> = {};
  for (const cellId of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
    const path = resolvePngPath(cellId);
    const expected =
      METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256[
        cellId as keyof typeof METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256
      ];
    if (!path) {
      errors.push(`PNG missing for accepted cell ${cellId}`);
      continue;
    }
    const actual = createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
    hashes[cellId] = actual;
    if (actual !== expected) {
      errors.push(`PNG hash changed for ${cellId}: got ${actual}, expected ${expected}`);
    }
  }
  return { ok: errors.length === 0, errors, hashes };
}
