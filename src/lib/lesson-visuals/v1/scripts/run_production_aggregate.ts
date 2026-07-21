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
  validateAggregateReportSchema,
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
  let providerAttemptsUsed = 0;

  for (const abs of walkFiles(collected)) {
    if (abs.endsWith(".receipt.json")) {
      receipts.push(JSON.parse(readFileSync(abs, "utf8")) as ProductionCellReceipt);
    }
    if (abs.endsWith(".mapping.json")) {
      mappings.push(JSON.parse(readFileSync(abs, "utf8")) as ProductionMapping);
    }
    if (abs.endsWith("attempt-meta.json")) {
      const meta = JSON.parse(readFileSync(abs, "utf8")) as { attempts?: number };
      providerAttemptsUsed += Number(meta.attempts ?? 0);
    }
  }

  let totalCost = 0n;
  for (const r of receipts) {
    if (r.costMicros && /^\d+$/.test(r.costMicros)) totalCost += BigInt(r.costMicros);
  }

  const runCostCeiling = BigInt(process.env.LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS ?? "0");
  const attemptQuota = Number(process.env.LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA ?? "0");
  const mode = (process.env.MODE ?? "full") as "full" | "failed-only";
  const executionMode = (process.env.LESSON_VISUALS_EXECUTION_MODE ?? "dry-run") as
    | "production"
    | "dry-run";

  const report = validateArtifactRelationships({
    runId: process.env.RUN_ID ?? "unknown",
    sourceSha: process.env.SOURCE_SHA ?? "",
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    mode,
    executionMode,
    expectedCells: EXPECTED_CELL_COUNT,
    receipts,
    mappings,
    totalCostMicros: totalCost,
    runCostCeilingMicros: runCostCeiling,
    providerAttemptQuota: attemptQuota,
    providerAttemptsUsed,
  });

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
