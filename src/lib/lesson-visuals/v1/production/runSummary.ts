import { createHash } from "node:crypto";
import { assertAggregateCost } from "./budget";
import type { UsdMicros } from "./money";
import { validateRunSummarySchema } from "./schemaValidator";
import type {
  ExecutionMode,
  ProductionCellReceipt,
  ProductionMapping,
  ProductionRunMode,
  ProductionRunSummary,
} from "./types";

export function buildRunSummary(args: {
  runId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  mode: ProductionRunMode;
  executionMode: ExecutionMode;
  expectedCells: number;
  receipts: ProductionCellReceipt[];
  mappings: ProductionMapping[];
  totalCostMicros: UsdMicros;
  runCostCeilingMicros: UsdMicros;
  providerAttemptQuota: number;
  providerAttemptsUsed: number;
}): ProductionRunSummary {
  const receipts = args.receipts;
  const accepted = receipts.filter((r) => r.status === "ACCEPTED").length;
  const skipped = receipts.filter((r) => r.status === "SKIPPED").length;
  const retryable = receipts.filter((r) => r.status === "RETRYABLE_FAILURE").length;
  const nonRetryable = receipts.filter((r) => r.status === "NON_RETRYABLE_FAILURE").length;
  const failed = receipts.filter(
    (r) =>
      r.status === "FAILED" ||
      r.status === "RETRYABLE_FAILURE" ||
      r.status === "NON_RETRYABLE_FAILURE",
  ).length;
  const attempted = receipts.length - skipped;

  const errors: string[] = [];
  const agg = assertAggregateCost(args.totalCostMicros, args.runCostCeilingMicros);
  if (agg) errors.push(agg);
  if (args.providerAttemptsUsed > args.providerAttemptQuota) {
    errors.push(
      `providerAttemptsUsed ${args.providerAttemptsUsed} > quota ${args.providerAttemptQuota}`,
    );
  }

  if (args.mappings.length !== accepted) {
    errors.push(`mapping count ${args.mappings.length} != accepted receipts ${accepted}`);
  }
  for (const m of args.mappings) {
    const r = receipts.find((x) => x.cellId === m.cellId);
    if (!r || r.status !== "ACCEPTED") {
      errors.push(`mapping for non-accepted cell ${m.cellId}`);
    } else if (r.contentSha256 !== m.contentSha256) {
      errors.push(`mapping/receipt checksum mismatch for ${m.cellId}`);
    }
  }
  for (const r of receipts) {
    if (r.status === "ACCEPTED") {
      if (!r.contentSha256 || !r.byteLength) {
        errors.push(`accepted receipt ${r.cellId} missing bytes/checksum`);
      }
      if (!args.mappings.some((m) => m.cellId === r.cellId)) {
        errors.push(`accepted receipt ${r.cellId} missing mapping`);
      }
    } else if (args.mappings.some((m) => m.cellId === r.cellId)) {
      errors.push(`failed/skipped receipt ${r.cellId} has mapping`);
    }
  }

  if (args.mode === "full" && receipts.length !== args.expectedCells) {
    errors.push(`full mode receipt count ${receipts.length} != expected ${args.expectedCells}`);
  }
  if (receipts.length !== args.expectedCells) {
    errors.push(`receipt count ${receipts.length} != authoritative ${args.expectedCells}`);
  }

  const indexPayload = JSON.stringify({
    receipts: receipts.map((r) => ({
      cellId: r.cellId,
      status: r.status,
      sha: r.contentSha256,
    })),
    mappings: args.mappings.map((m) => ({ cellId: m.cellId, sha: m.contentSha256 })),
  });
  const artifactIndexSha256 = createHash("sha256").update(indexPayload, "utf8").digest("hex");

  let finalRunStatus: ProductionRunSummary["finalRunStatus"] = "SUCCESS";
  if (errors.length > 0 || failed > 0) finalRunStatus = accepted > 0 ? "PARTIAL" : "FAILED";
  if (args.mode === "full" && accepted !== args.expectedCells) {
    finalRunStatus = accepted > 0 ? "PARTIAL" : "FAILED";
    errors.push(`full mode accepted ${accepted} != expected ${args.expectedCells}`);
  }

  const summary: ProductionRunSummary = {
    schemaVersion: "lesson-visual-run-summary/v1",
    runId: args.runId,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
    mode: args.mode,
    executionMode: args.executionMode,
    expectedCells: args.expectedCells,
    attempted,
    accepted,
    skipped,
    failed,
    retryable,
    nonRetryable,
    totalCostMicros: args.totalCostMicros.toString(),
    quotaUsage: args.providerAttemptsUsed,
    quotaCeiling: args.providerAttemptQuota,
    providerAttemptQuota: args.providerAttemptQuota,
    providerAttemptsUsed: args.providerAttemptsUsed,
    receiptCount: receipts.length,
    mappingCount: args.mappings.length,
    artifactIndexSha256,
    finalRunStatus: errors.length > 0 && finalRunStatus === "SUCCESS" ? "FAILED" : finalRunStatus,
    errors,
  };
  const schema = validateRunSummarySchema(summary);
  if (!schema.ok) summary.errors.push(...schema.errors.map((e) => `summary-schema: ${e}`));
  return summary;
}
