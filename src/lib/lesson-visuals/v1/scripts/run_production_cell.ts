/**
 * Workflow cell entry — uses mock transport only when EXECUTION_MODE=dry-run.
 * Production mode requires a non-mock transport (not invoked in this candidate without paid calls).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Locale, Method } from "../types";
import { loadProductionConfig, type ProductionEnv } from "../production/config";
import { createMockProvider } from "../production/mockProvider";
import { runProductionCell } from "../production/cellRunner";
import type { ProductionCellReceipt } from "../production/types";

function env(): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: process.env.LESSON_VISUALS_EXECUTION_MODE,
    LESSON_VISUALS_PROVIDER_NAME: process.env.LESSON_VISUALS_PROVIDER_NAME,
    LESSON_VISUALS_PROVIDER_MODEL: process.env.LESSON_VISUALS_PROVIDER_MODEL,
    LESSON_VISUALS_PROVIDER_API_KEY: process.env.LESSON_VISUALS_PROVIDER_API_KEY,
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: process.env.LESSON_VISUALS_PROVIDER_ACCOUNT_ID,
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
    LESSON_VISUALS_QUOTA_CELLS: process.env.LESSON_VISUALS_QUOTA_CELLS,
    LESSON_VISUALS_MAX_RETRIES: process.env.LESSON_VISUALS_MAX_RETRIES,
    LESSON_VISUALS_OUTPUT_STORAGE_TARGET: process.env.LESSON_VISUALS_OUTPUT_STORAGE_TARGET,
    LOVABLE_DISPATCH_ACTORS: process.env.LOVABLE_DISPATCH_ACTORS,
  };
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
          "production provider transport is not enabled in this candidate — no paid network generation; use dry-run for mock validation or configure a future non-mock transport separately",
        ],
      }),
    );
    process.exit(1);
  }

  const transport = createMockProvider({
    providerName: config.providerName,
    model: config.providerModel,
    width: config.requiredWidth,
    height: config.requiredHeight,
    costMicros: "1000",
  });

  const artifactsRoot = resolve(process.cwd(), "artifacts");
  const priorPath = resolve(artifactsRoot, "receipts", `${process.env.CELL_ID}.receipt.json`);
  let prior: ProductionCellReceipt | null = null;
  if (process.env.MODE === "failed-only" && existsSync(priorPath)) {
    prior = JSON.parse(readFileSync(priorPath, "utf8")) as ProductionCellReceipt;
  }

  const result = await runProductionCell({
    artifactsRoot,
    config,
    transport,
    runId: process.env.RUN_ID ?? `run-${process.env.SOURCE_SHA ?? "unknown"}`,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID ?? "",
    sourceSha: process.env.SOURCE_SHA ?? "",
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    cellId: process.env.CELL_ID ?? "",
    lessonId: process.env.LESSON_ID ?? "",
    locale: (process.env.LOCALE ?? "en") as Locale,
    method: Number(process.env.METHOD) as Method,
    promptOrRenderingSpec: `lesson-visual:${process.env.LESSON_ID}:${process.env.LOCALE}`,
    attemptNumber: Number(process.env.ATTEMPT_NUMBER ?? "1"),
    remainingRunBudgetMicros: config.runCostCeilingMicros,
    seenProviderRequestIds: new Set(),
    priorAcceptedReceipt: prior,
  });

  console.log(
    JSON.stringify({
      ok: result.receipt.status === "ACCEPTED" || result.receipt.status === "SKIPPED",
      status: result.receipt.status,
      cellId: result.receipt.cellId,
      mapping: Boolean(result.mapping),
      costMicros: result.costMicros.toString(),
    }),
  );
  if (result.receipt.status === "RETRYABLE_FAILURE" || result.receipt.status === "NON_RETRYABLE_FAILURE" || result.receipt.status === "FAILED") {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
