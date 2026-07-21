import { createHash } from "node:crypto";
import { buildRunSummary } from "./runSummary";
import {
  validateAggregateReportSchema,
  validateMappingSchema,
  validateReceiptSchema,
} from "./schemaValidator";
import type {
  AggregateValidationReportShape,
  ProductionCellReceipt,
  ProductionMapping,
} from "./types";

export type AggregateValidationReport = AggregateValidationReportShape;

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
  providerAttemptQuota: number;
  providerAttemptsUsed: number;
}): AggregateValidationReport {
  for (const r of args.receipts) {
    const s = validateReceiptSchema(r);
    if (!s.ok) {
      // continue collecting via summary errors
    }
  }
  for (const m of args.mappings) {
    validateMappingSchema(m);
  }

  const runSummary = buildRunSummary(args);
  const errors = [...runSummary.errors];

  for (const r of args.receipts) {
    const s = validateReceiptSchema(r);
    if (!s.ok) errors.push(`receipt ${r.cellId}: ${s.errors.join("; ")}`);
  }
  for (const m of args.mappings) {
    const s = validateMappingSchema(m);
    if (!s.ok) errors.push(`mapping ${m.cellId}: ${s.errors.join("; ")}`);
  }

  const checksums = new Map<string, string>();
  for (const r of args.receipts) {
    if (r.status === "ACCEPTED" && r.contentSha256) {
      const prev = checksums.get(r.contentSha256);
      if (prev && prev !== r.cellId) {
        errors.push(`duplicate content checksum ${r.contentSha256} for ${prev} and ${r.cellId}`);
      }
      checksums.set(r.contentSha256, r.cellId);
    }
  }

  const body: AggregateValidationReport = {
    schemaVersion: "lesson-visual-aggregate-validation/v1",
    ok: false,
    errors,
    runSummary: { ...runSummary, errors },
    reportSha256: "0".repeat(64),
  };
  const reportSha256 = createHash("sha256").update(JSON.stringify(body), "utf8").digest("hex");
  body.reportSha256 = reportSha256;
  body.ok = errors.length === 0 && runSummary.finalRunStatus === "SUCCESS";
  const schema = validateAggregateReportSchema(body);
  if (!schema.ok) {
    body.ok = false;
    body.errors.push(...schema.errors);
  }
  return body;
}
