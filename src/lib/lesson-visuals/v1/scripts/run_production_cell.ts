/**
 * Workflow cell entry — mock transport only when EXECUTION_MODE=dry-run.
 * Production mode requires a non-mock transport (not enabled in this candidate).
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Locale, Method } from "../types";
import { writeCellAttemptMeta } from "../production/attemptMeta";
import { loadProductionConfig, type ProductionEnv } from "../production/config";
import {
  assertSafeCellId,
  cellPriorEvidencePath,
  cellReceiptPath,
} from "../production/cellPaths";
import { createMockProvider } from "../production/mockProvider";
import { runProductionCell } from "../production/cellRunner";
import { loadPriorAcceptedReceipts } from "../production/priorReceipts";
import {
  validateRuntimeQuotaContext,
  type RuntimeQuotaContext,
} from "../production/quotaContext";
import type { ProductionCellReceipt } from "../production/types";

function env(): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: process.env.LESSON_VISUALS_EXECUTION_MODE,
    LESSON_VISUALS_PROVIDER_NAME: process.env.LESSON_VISUALS_PROVIDER_NAME,
    LESSON_VISUALS_PROVIDER_MODEL: process.env.LESSON_VISUALS_PROVIDER_MODEL,
    LESSON_VISUALS_PROVIDER_API_KEY: process.env.LESSON_VISUALS_PROVIDER_API_KEY,
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: process.env.LESSON_VISUALS_PROVIDER_ACCOUNT_ID,
    LESSON_VISUALS_PROVIDER_PROJECT_ID: process.env.LESSON_VISUALS_PROVIDER_PROJECT_ID,
    LESSON_VISUALS_AI_AUTH_ID: process.env.LESSON_VISUALS_AI_AUTH_ID,
    LESSON_VISUALS_STORAGE_CREDENTIAL: process.env.LESSON_VISUALS_STORAGE_CREDENTIAL,
    LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS:
      process.env.LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS,
    LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS:
      process.env.LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS,
    LESSON_VISUALS_MAX_OUTPUT_BYTES: process.env.LESSON_VISUALS_MAX_OUTPUT_BYTES,
    LESSON_VISUALS_ALLOWED_MIME_TYPES: process.env.LESSON_VISUALS_ALLOWED_MIME_TYPES,
    LESSON_VISUALS_REQUIRED_WIDTH: process.env.LESSON_VISUALS_REQUIRED_WIDTH,
    LESSON_VISUALS_REQUIRED_HEIGHT: process.env.LESSON_VISUALS_REQUIRED_HEIGHT,
    LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: process.env.LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA,
    LESSON_VISUALS_MAX_RETRIES: process.env.LESSON_VISUALS_MAX_RETRIES,
    LESSON_VISUALS_OUTPUT_STORAGE_TARGET: process.env.LESSON_VISUALS_OUTPUT_STORAGE_TARGET,
    LOVABLE_DISPATCH_ACTORS: process.env.LOVABLE_DISPATCH_ACTORS,
  };
}

function loadQuotaContext(): RuntimeQuotaContext {
  const path = process.env.QUOTA_CONTEXT_PATH ?? "artifacts/qa/runtime-quota-context.json";
  const abs = resolve(process.cwd(), path);
  if (!existsSync(abs)) {
    throw new Error(`quota context missing: ${abs}`);
  }
  const parsed = JSON.parse(readFileSync(abs, "utf8"));
  const v = validateRuntimeQuotaContext(parsed, {
    runId: process.env.RUN_ID,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID,
    sourceSha: process.env.SOURCE_SHA,
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    mode: (process.env.MODE ?? "full") as "full" | "failed-only",
  });
  if (!v.ok || !v.context) {
    throw new Error(`quota context invalid: ${v.errors.join("; ")}`);
  }
  return v.context;
}

async function main(): Promise<void> {
  const loaded = loadProductionConfig(env());
  if (!loaded.ok || !loaded.config) {
    console.error(JSON.stringify({ ok: false, errors: loaded.errors }));
    process.exit(1);
  }
  const config = loaded.config;

  if (config.executionMode === "production") {
    console.error(
      JSON.stringify({
        ok: false,
        errors: [
          "production provider transport is not enabled in this candidate — no paid network generation",
        ],
      }),
    );
    process.exit(1);
  }

  let cellId: string;
  try {
    cellId = assertSafeCellId(process.env.CELL_ID ?? "");
  } catch (e) {
    console.error(JSON.stringify({ ok: false, errors: [e instanceof Error ? e.message : String(e)] }));
    process.exit(1);
  }

  const transport = createMockProvider({
    providerName: config.providerName,
    model: config.providerModel,
    accountId: config.providerAccountId,
    projectId: config.providerProjectId || null,
    authId: config.providerAuthId,
    width: config.requiredWidth,
    height: config.requiredHeight,
    costMicros: "1000",
  });

  const artifactsRoot = resolve(process.cwd(), "artifacts");
  mkdirSync(artifactsRoot, { recursive: true });

  const mode = (process.env.MODE ?? "full") as "full" | "failed-only";
  let prior: ProductionCellReceipt | null = null;

  if (mode === "failed-only") {
    const bundle = process.env.PRIOR_RECEIPT_BUNDLE_PATH ?? "";
    if (!bundle.trim() || !existsSync(resolve(bundle))) {
      console.error(JSON.stringify({ ok: false, errors: ["prior receipt bundle missing at cell"] }));
      process.exit(1);
    }
    const allCellIds = JSON.parse(
      process.env.ALL_CELL_IDS_JSON ?? JSON.stringify([cellId]),
    ) as string[];
    const one = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: bundle,
      expectedSourceSha: process.env.SOURCE_SHA ?? "",
      expectedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
      expectedCellIds: allCellIds,
      executionMode: config.executionMode,
    });
    if (!one.ok) {
      console.error(JSON.stringify({ ok: false, errors: one.errors }));
      process.exit(1);
    }
    prior = one.acceptedByCellId.get(cellId) ?? null;
  }

  let quotaContext: RuntimeQuotaContext;
  try {
    quotaContext = loadQuotaContext();
  } catch (e) {
    console.error(JSON.stringify({ ok: false, errors: [e instanceof Error ? e.message : String(e)] }));
    process.exit(1);
  }

  let attempts = 0;
  const attemptNumber = Number(process.env.ATTEMPT_NUMBER ?? "1");
  const result = await runProductionCell({
    artifactsRoot,
    config,
    transport,
    runId: process.env.RUN_ID ?? `run-${process.env.SOURCE_SHA ?? "unknown"}`,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID ?? "",
    sourceSha: process.env.SOURCE_SHA ?? "",
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    cellId,
    lessonId: process.env.LESSON_ID ?? "",
    locale: (process.env.LOCALE ?? "en") as Locale,
    method: Number(process.env.METHOD) as Method,
    promptOrRenderingSpec: `lesson-visual:${process.env.LESSON_ID}:${process.env.LOCALE}`,
    attemptNumber,
    remainingRunBudgetMicros: config.runCostCeilingMicros,
    seenProviderRequestIds: new Set(),
    priorAcceptedReceipt: prior,
    quotaContext,
    onProviderAttempt: () => {
      attempts += 1;
    },
  });

  try {
    writeCellAttemptMeta({
      artifactsRoot,
      cellId,
      providerAttempted: result.providerAttempted,
      attempts,
      attemptNumber,
      attemptSlotKey: result.attemptSlotKey,
      attemptSlotIndex: result.attemptSlotIndex,
      status: result.receipt.status,
    });
  } catch (e) {
    console.error(
      JSON.stringify({
        ok: false,
        errors: [`attempt-meta write failed: ${e instanceof Error ? e.message : String(e)}`],
      }),
    );
    process.exit(1);
  }

  if (result.receipt.status === "SKIPPED") {
    if (!existsSync(cellReceiptPath(artifactsRoot, cellId))) {
      console.error(JSON.stringify({ ok: false, errors: ["skipped receipt missing after write"] }));
      process.exit(1);
    }
    if (!existsSync(cellPriorEvidencePath(artifactsRoot, cellId))) {
      console.error(JSON.stringify({ ok: false, errors: ["prior-evidence missing after skip"] }));
      process.exit(1);
    }
    if (result.mapping) {
      console.error(JSON.stringify({ ok: false, errors: ["skipped cell must not produce mapping"] }));
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify({
      ok: result.receipt.status === "ACCEPTED" || result.receipt.status === "SKIPPED",
      status: result.receipt.status,
      cellId: result.receipt.cellId,
      mapping: Boolean(result.mapping),
      costMicros: result.costMicros.toString(),
      providerAttempted: result.providerAttempted,
      attemptSlotKey: result.attemptSlotKey,
      mockGenerateCalls: transport.generateCallCount,
    }),
  );
  if (
    result.receipt.status === "RETRYABLE_FAILURE" ||
    result.receipt.status === "NON_RETRYABLE_FAILURE" ||
    result.receipt.status === "FAILED"
  ) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
