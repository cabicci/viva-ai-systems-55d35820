import { createHash } from "node:crypto";
import type { ProductionCellReceipt, ProductionMapping, ProductionRunSummary } from "./types";
import { buildRunSummary } from "./runSummary";

export interface AggregateValidationReport {
  schemaVersion: "lesson-visual-aggregate-validation/v1";
  ok: boolean;
  errors: string[];
  runSummary: ProductionRunSummary;
  reportSha256: string;
}

export function validateArtifactRelationships(args: {
  runId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  mode: "full" | "failed-only";
  executionMode: "production" | "dry-run";
  expectedCells: number;
  receipts: ProductionCellReceipt[];
  mappings: ProductionMapping[];
  totalCostMicros: bigint;
  runCostCeilingMicros: bigint;
  quotaCeiling: number;
}): AggregateValidationReport {
  const runSummary = buildRunSummary(args);
  const errors = [...runSummary.errors];

  const checksums = new Map<string, string>();
  for (const r of args.receipts) {
    if (r.status === "ACCEPTED" && r.contentSha256) {
      const prev = checksums.get(r.contentSha256);
      // uniqueness required across accepted cells in a greenfield run
      if (prev && prev !== r.cellId) {
        errors.push(`duplicate content checksum ${r.contentSha256} for ${prev} and ${r.cellId}`);
      }
      checksums.set(r.contentSha256, r.cellId);
    }
  }

  const body = {
    schemaVersion: "lesson-visual-aggregate-validation/v1" as const,
    ok: errors.length === 0 && runSummary.finalRunStatus === "SUCCESS",
    errors,
    runSummary: { ...runSummary, errors },
  };
  const reportSha256 = createHash("sha256")
    .update(JSON.stringify(body), "utf8")
    .digest("hex");

  return {
    ...body,
    ok: errors.length === 0 && runSummary.finalRunStatus === "SUCCESS",
    reportSha256,
  };
}
