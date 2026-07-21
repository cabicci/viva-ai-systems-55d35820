/**
 * Workflow cell entry — method-aware production router.
 * Method 1/4: local master PNG (zero provider/HTTP).
 * Method 2: OpenAI Images API. Method 3: allowlisted screenshot.
 * dry-run: mock only. Never logs secret values.
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
import { runProductionCell } from "../production/cellRunner";
import { loadLessonMaster } from "../production/masterLoader";
import { selectMethodAwareTransport } from "../production/methodRouter";
import { loadPriorAcceptedReceipts } from "../production/priorReceipts";
import {
  validateRuntimeQuotaContext,
  type RuntimeQuotaContext,
} from "../production/quotaContext";
import {
  buildLocaleRenderingSpec,
  serializeRenderingSpec,
} from "../production/renderingSpec";
import {
  resolveContentShaFromEnv,
  resolveExecutionShaFromEnv,
} from "../production/shaEnv";
import type { ProductionCellReceipt, ProductionRunMode } from "../production/types";

function env(): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: process.env.LESSON_VISUALS_EXECUTION_MODE,
    LESSON_VISUALS_PROVIDER_NAME: process.env.LESSON_VISUALS_PROVIDER_NAME,
    LESSON_VISUALS_PROVIDER_MODEL: process.env.LESSON_VISUALS_PROVIDER_MODEL,
    LESSON_VISUALS_PROVIDER_API_KEY: process.env.LESSON_VISUALS_PROVIDER_API_KEY,
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: process.env.LESSON_VISUALS_PROVIDER_ACCOUNT_ID,
    LESSON_VISUALS_PROVIDER_PROJECT_ID: process.env.LESSON_VISUALS_PROVIDER_PROJECT_ID,
    LESSON_VISUALS_AI_AUTH_ID: process.env.LESSON_VISUALS_AI_AUTH_ID,
    LESSON_VISUALS_PROVIDER_ENDPOINT: process.env.LESSON_VISUALS_PROVIDER_ENDPOINT,
    LESSON_VISUALS_PROVIDER_TIMEOUT_MS: process.env.LESSON_VISUALS_PROVIDER_TIMEOUT_MS,
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
  const contentSha = resolveContentShaFromEnv(process.env);
  const executionSha = resolveExecutionShaFromEnv(process.env);
  const v = validateRuntimeQuotaContext(parsed, {
    runId: process.env.RUN_ID,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID,
    contentSha,
    executionSha,
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    mode: (process.env.MODE ?? "full") as ProductionRunMode,
  });
  if (!v.ok || !v.context) {
    throw new Error(`quota context invalid: ${v.errors.join("; ")}`);
  }
  return v.context;
}

async function main(): Promise<void> {
  const e = env();
  const contentSha = resolveContentShaFromEnv(process.env);
  const executionSha = resolveExecutionShaFromEnv(process.env);
  const loaded = loadProductionConfig(e);
  if (!loaded.ok || !loaded.config) {
    console.error(JSON.stringify({ ok: false, errors: loaded.errors }));
    process.exit(1);
  }
  const config = loaded.config;

  let cellId: string;
  try {
    cellId = assertSafeCellId(process.env.CELL_ID ?? "");
  } catch (err) {
    console.error(
      JSON.stringify({ ok: false, errors: [err instanceof Error ? err.message : String(err)] }),
    );
    process.exit(1);
  }

  const lessonId = process.env.LESSON_ID ?? "";
  const locale = (process.env.LOCALE ?? "en") as Locale;
  const method = Number(process.env.METHOD) as Method;

  let master;
  try {
    master = loadLessonMaster({
      lessonId,
      repoRoot: process.cwd(),
      masterRelativePath: process.env.MASTER_RELATIVE_PATH ?? null,
    });
  } catch (err) {
    console.error(
      JSON.stringify({ ok: false, errors: [err instanceof Error ? err.message : String(err)] }),
    );
    process.exit(1);
  }

  let promptOrRenderingSpec: string;
  try {
    promptOrRenderingSpec = serializeRenderingSpec(
      buildLocaleRenderingSpec(master, locale, method),
    );
  } catch (err) {
    console.error(
      JSON.stringify({ ok: false, errors: [err instanceof Error ? err.message : String(err)] }),
    );
    process.exit(1);
  }

  const selected = selectMethodAwareTransport({
    config,
    method,
    apiKey: e.LESSON_VISUALS_PROVIDER_API_KEY ?? "",
    master,
  });
  if (!selected.ok || !selected.transport) {
    console.error(JSON.stringify({ ok: false, errors: selected.errors }));
    process.exit(1);
  }
  const transport = selected.transport;

  const artifactsRoot = resolve(process.cwd(), "artifacts");
  mkdirSync(artifactsRoot, { recursive: true });

  const mode = (process.env.MODE ?? "full") as ProductionRunMode;
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
      expectedContentSha: contentSha,
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
  } catch (err) {
    console.error(
      JSON.stringify({ ok: false, errors: [err instanceof Error ? err.message : String(err)] }),
    );
    process.exit(1);
  }

  if (mode === "pilot") {
    if (quotaContext.mode !== "pilot" || quotaContext.totalAuthorizedCells !== 12) {
      console.error(JSON.stringify({ ok: false, errors: ["pilot quota context scope invalid"] }));
      process.exit(1);
    }
    if (!quotaContext.allCellIds.includes(cellId)) {
      console.error(JSON.stringify({ ok: false, errors: [`cell ${cellId} not in pilot scope`] }));
      process.exit(1);
    }
  }

  let attempts = 0;
  const attemptNumber = Number(process.env.ATTEMPT_NUMBER ?? "1");
  const result = await runProductionCell({
    artifactsRoot,
    config,
    transport,
    runId: process.env.RUN_ID ?? `run-${contentSha || "unknown"}`,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID ?? "",
    contentSha,
    executionSha,
    approvedManifestSha256: (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase(),
    cellId,
    lessonId,
    locale,
    method,
    promptOrRenderingSpec,
    attemptNumber,
    remainingRunBudgetMicros: config.runCostCeilingMicros,
    seenProviderRequestIds: new Set(),
    priorAcceptedReceipt: prior,
    quotaContext,
    countsAsExternalProviderAttempt: selected.countsAsExternalProviderAttempt,
    expectedProviderName: selected.expectedProviderName ?? undefined,
    expectedModel: selected.expectedModel ?? undefined,
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
  } catch (err) {
    console.error(
      JSON.stringify({
        ok: false,
        errors: [`attempt-meta write failed: ${err instanceof Error ? err.message : String(err)}`],
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
      transportKind: selected.kind,
      generateCallCount: transport.generateCallCount ?? null,
      httpCallCount: transport.httpCallCount ?? null,
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
  const msg = e instanceof Error ? e.message : String(e);
  // Never echo env secrets if somehow present in message.
  const key = process.env.LESSON_VISUALS_PROVIDER_API_KEY ?? "";
  console.error(key ? msg.split(key).join("[REDACTED]") : msg);
  process.exit(1);
});
