/**
 * Shared cell attempt-meta writer (safe for import from tests).
 */
import { writeFileSync } from "node:fs";
import {
  assertSafeCellId,
  cellAttemptMetaPath,
  ensureCellArtifactDir,
} from "../production/cellPaths";

export function writeCellAttemptMeta(args: {
  artifactsRoot: string;
  cellId: string;
  providerAttempted: boolean;
  attempts: number;
  attemptNumber: number;
  attemptSlotKey: string | null;
  attemptSlotIndex: number | null;
  status: string;
}): void {
  const cellId = assertSafeCellId(args.cellId);
  ensureCellArtifactDir(args.artifactsRoot, cellId);
  const meta = {
    schemaVersion: "lesson-visual-attempt-meta/v1",
    cellId,
    status: args.status,
    providerAttempted: args.providerAttempted,
    attempts: args.attempts,
    attemptNumber: args.attemptNumber,
    attemptSlotKey: args.attemptSlotKey,
    attemptSlotIndex: args.attemptSlotIndex,
  };
  writeFileSync(cellAttemptMetaPath(args.artifactsRoot, cellId), `${JSON.stringify(meta, null, 2)}\n`);
}
