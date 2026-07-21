import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { EXPECTED_CELL_COUNT } from "../constants";
import { validateArtifactRelationships } from "../production/artifactIntegrity";
import {
  reconcileAttemptRecords,
  validateRuntimeQuotaContext,
} from "../production/quotaContext";
import {
  validateAggregateReportSchema,
  validateMappingSchema,
  validateOutputValidationSchema,
  validateReceiptSchema,
  validateRunSummarySchema,
} from "../production/schemaValidator";
import type { ProductionCellReceipt, ProductionMapping } from "../production/types";

function walkFiles(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) stack.push(abs);
      else out.push(abs);
    }
  }
  return out;
}

function main(): void {
  const collected = resolve(process.cwd(), "collected");
  const artifactsRoot = resolve(process.cwd(), "artifacts");
  mkdirSync(join(artifactsRoot, "qa"), { recursive: true });

  const receipts: ProductionCellReceipt[] = [];
  const mappings: ProductionMapping[] = [];
  const attemptRecords: Array<{
    cellId: string;
    attemptNumber: number;
    slotKey?: string;
    providerAttempted: boolean;
  }> = [];
  let providerAttemptsUsed = 0;

  for (const abs of walkFiles(collected)) {
    if (abs.endsWith(".receipt.json")) {
      const r = JSON.parse(readFileSync(abs, "utf8")) as ProductionCellReceipt;
      const schema = validateReceiptSchema(r);
      if (!schema.ok) {
        // still collect; integrity report will fail
      }
      receipts.push(r);
    }
    if (abs.endsWith(".mapping.json")) {
      const m = JSON.parse(readFileSync(abs, "utf8")) as ProductionMapping;
      validateMappingSchema(m);
      mappings.push(m);
    }
    if (abs.endsWith(".validation.json")) {
      const v = JSON.parse(readFileSync(abs, "utf8"));
      const schema = validateOutputValidationSchema(v);
      if (!schema.ok) {
        // collected for report errors via relationships
      }
    }
    if (abs.endsWith("attempt-meta.json")) {
      const meta = JSON.parse(readFileSync(abs, "utf8")) as {
        cellId?: string;
        attempts?: number;
        providerAttempted?: boolean;
        attemptSlotKey?: string | null;
        attemptNumber?: number;
      };
      const attempts = Number(meta.attempts ?? 0);
      providerAttemptsUsed += attempts;
      attemptRecords.push({
        cellId: meta.cellId ?? "",
        attemptNumber: Number(meta.attemptNumber ?? attempts > 0 ? 1 : 0) || (attempts > 0 ? 1 : 0),
        slotKey: meta.attemptSlotKey ?? undefined,
        providerAttempted: Boolean(meta.providerAttempted) || attempts > 0,
      });
    }
  }

  // Prefer attempt-claim for slot identity when present
  for (const abs of walkFiles(collected)) {
    if (!abs.endsWith("attempt-claim.json")) continue;
    const claim = JSON.parse(readFileSync(abs, "utf8")) as {
      cellId: string;
      attemptNumber: number;
      slotKey: string;
      providerInvoked?: boolean;
    };
    const existing = attemptRecords.find(
      (r) => r.cellId === claim.cellId && r.attemptNumber === claim.attemptNumber,
    );
    if (existing) {
      existing.slotKey = claim.slotKey;
      existing.providerAttempted = Boolean(claim.providerInvoked);
    } else {
      attemptRecords.push({
        cellId: claim.cellId,
        attemptNumber: claim.attemptNumber,
        slotKey: claim.slotKey,
        providerAttempted: Boolean(claim.providerInvoked),
      });
    }
  }

  let totalCost = 0n;
  for (const r of receipts) {
    if (r.costMicros && /^\d+$/.test(r.costMicros)) totalCost += BigInt(r.costMicros);
  }

  const runCostCeiling = BigInt(process.env.LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS ?? "0");
  const attemptQuota = Number(process.env.LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA ?? "0");
  const mode = (process.env.MODE ?? "full") as "full" | "failed-only" | "pilot";
  const executionMode = (process.env.LESSON_VISUALS_EXECUTION_MODE ?? "dry-run") as
    | "production"
    | "dry-run";

  let expectedCells = EXPECTED_CELL_COUNT;
  if (mode === "pilot") {
    expectedCells = 12;
  }

  const report = validateArtifactRelationships({
    runId: process.env.RUN_ID ?? "unknown",
    sourceSha: process.env.SOURCE_SHA ?? "",
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    mode,
    executionMode,
    expectedCells,
    receipts,
    mappings,
    totalCostMicros: totalCost,
    runCostCeilingMicros: runCostCeiling,
    providerAttemptQuota: attemptQuota,
    providerAttemptsUsed,
  });

  if (mode === "pilot") {
    const approvedPilot = (process.env.APPROVED_PILOT_MANIFEST_SHA256 ?? "").toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(approvedPilot)) {
      report.ok = false;
      report.errors.push("aggregate pilot requires approved_pilot_manifest_sha256");
    }
    if (receipts.length > 12) {
      report.ok = false;
      report.errors.push(`pilot receipt count ${receipts.length} exceeds 12`);
    }
    if (mappings.length > 12) {
      report.ok = false;
      report.errors.push(`pilot mapping count ${mappings.length} exceeds 12`);
    }
  }

  const quotaPath =
    process.env.QUOTA_CONTEXT_PATH ??
    resolve(process.cwd(), "artifacts/qa/runtime-quota-context.json");
  if (existsSync(quotaPath)) {
    const q = validateRuntimeQuotaContext(JSON.parse(readFileSync(quotaPath, "utf8")), {
      runId: process.env.RUN_ID,
      sourceSha: process.env.SOURCE_SHA,
      approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
      mode,
    });
    if (!q.ok || !q.context) {
      report.ok = false;
      report.errors.push(...q.errors.map((e) => `quota-context: ${e}`));
    } else {
      const recon = reconcileAttemptRecords(
        q.context,
        attemptRecords.filter((r) => r.cellId),
      );
      if (!recon.ok) {
        report.ok = false;
        report.errors.push(...recon.errors.map((e) => `attempt-reconcile: ${e}`));
      }
    }
  } else {
    report.ok = false;
    report.errors.push("runtime quota context missing for aggregate reconciliation");
  }

  const rs = validateRunSummarySchema(report.runSummary);
  const ag = validateAggregateReportSchema(report);
  if (!rs.ok || !ag.ok) {
    report.ok = false;
    report.errors.push(...rs.errors, ...ag.errors);
  }

  const reportPath = join(artifactsRoot, "qa", "aggregate-validation.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const digest = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
  writeFileSync(
    join(artifactsRoot, "qa", "aggregate-validation.json.sha256"),
    `${digest}  aggregate-validation.json\n`,
    "utf8",
  );
  writeFileSync(
    join(artifactsRoot, "qa", "run-summary.json"),
    `${JSON.stringify(report.runSummary, null, 2)}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        errors: report.errors,
        reportSha256: digest,
        accepted: report.runSummary.accepted,
        mappingCount: report.runSummary.mappingCount,
        providerAttemptsUsed,
        finalRunStatus: report.runSummary.finalRunStatus,
      },
      null,
      2,
    ),
  );

  if (!report.ok) process.exit(1);
}

main();
