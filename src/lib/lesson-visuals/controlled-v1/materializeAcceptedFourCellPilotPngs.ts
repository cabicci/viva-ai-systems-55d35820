/**
 * Deterministic materialization of accepted Method B→C four-cell pilot PNGs.
 *
 * Copies byte-identical accepted evidence from the tracked acceptance bundle into
 * artifacts/controlled-v1/cells/<cellId>/final.png. Never regenerates visuals.
 * Fail-closed on missing evidence or SHA-256 mismatch.
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
} from "./constants";
import { ARTIFACTS_CELLS_DIR, DOCS_CONTROLLED_V1, cellFinalPngPath } from "./paths";

export const ACCEPTED_FOUR_CELL_PILOT_EVIDENCE_ROOT = resolve(
  DOCS_CONTROLLED_V1,
  "acceptance/method-b-to-c-four-cell-pilot/cells",
);

export const ACCEPTED_FOUR_CELL_PILOT_EVIDENCE_ROOTS = [
  ACCEPTED_FOUR_CELL_PILOT_EVIDENCE_ROOT,
  ARTIFACTS_CELLS_DIR,
  "E:/Temp/method-b-to-c-four-cell-pilot-1d4389721abaa1467a2461b7d294f0936c6c5e01/cells",
] as const;

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

export function acceptedFourCellPilotEvidencePngPath(cellId: string): string {
  return join(ACCEPTED_FOUR_CELL_PILOT_EVIDENCE_ROOT, cellId, "final.png");
}

export function resolveAcceptedFourCellPilotPngPath(cellId: string): string | null {
  for (const root of ACCEPTED_FOUR_CELL_PILOT_EVIDENCE_ROOTS) {
    const path = join(root, cellId, "final.png");
    if (existsSync(path)) return path;
  }
  return null;
}

export function materializeAcceptedFourCellPilotPngs(): {
  ok: boolean;
  errors: string[];
  materialized: string[];
} {
  const errors: string[] = [];
  const materialized: string[] = [];

  for (const cellId of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
    const expected =
      METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256[
        cellId as keyof typeof METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256
      ];
    const evidencePath = acceptedFourCellPilotEvidencePngPath(cellId);
    if (!existsSync(evidencePath)) {
      errors.push(`accepted PNG evidence missing: ${evidencePath}`);
      continue;
    }
    const evidenceSha = sha256File(evidencePath);
    if (evidenceSha !== expected) {
      errors.push(
        `accepted PNG evidence hash mismatch for ${cellId}: got ${evidenceSha}, expected ${expected}`,
      );
      continue;
    }

    const dest = cellFinalPngPath(cellId);
    mkdirSync(dirname(dest), { recursive: true });
    if (existsSync(dest) && sha256File(dest) === expected) {
      materialized.push(dest);
      continue;
    }
    // Evidence is the only authoritative source — replace any mismatched artifact bytes.
    copyFileSync(evidencePath, dest);
    const copiedSha = sha256File(dest);
    if (copiedSha !== expected) {
      errors.push(
        `materialized PNG hash mismatch for ${cellId}: got ${copiedSha}, expected ${expected}`,
      );
      continue;
    }
    materialized.push(dest);
  }

  return { ok: errors.length === 0, errors, materialized };
}
