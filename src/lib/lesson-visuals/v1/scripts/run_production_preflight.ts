/**
 * Workflow entry: global preflight before matrix expansion.
 * Fail-closed. Never logs secret values.
 * Writes immutable runtime-quota-context.json for cell jobs.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTHORITATIVE_BASE_SOURCE_SHA, AUTHORIZED_MANIFEST_RELATIVE_PATH } from "../constants";
import { parseDispatchActorAllowlist } from "../dispatch/authorizationContract";
import { loadProductionConfig, redactConfigForLog, type ProductionEnv } from "../production/config";
import { loadPriorAcceptedReceipts } from "../production/priorReceipts";
import { buildRuntimeQuotaContext } from "../production/quotaContext";
import { runGlobalPreflight } from "../production/preflight";
import type { ProductionRunMode } from "../production/types";

function moduleDir(): string {
  if (typeof import.meta.dirname === "string") return import.meta.dirname;
  const meta = import.meta as unknown as { dir?: string };
  if (typeof meta.dir === "string") return meta.dir;
  return fileURLToPath(new URL(".", import.meta.url));
}

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

function main(): void {
  const e = env();
  const mode = (process.env.MODE ?? "full") as ProductionRunMode;
  const maxParallel = Number(process.env.MAX_PARALLEL ?? "20");
  const sourceSha = process.env.SOURCE_SHA ?? "";
  const approvedManifest = (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase();
  const approvedPilot = (process.env.APPROVED_PILOT_MANIFEST_SHA256 ?? "").toLowerCase();
  const actualManifest = (process.env.ACTUAL_MANIFEST_SHA256 ?? "").toLowerCase();
  const actualSource = process.env.ACTUAL_SOURCE_SHA ?? "";
  const actors = parseDispatchActorAllowlist(e.LOVABLE_DISPATCH_ACTORS);
  const priorPath = process.env.PRIOR_RECEIPT_BUNDLE_PATH ?? null;
  const repoRoot = resolve(moduleDir(), "../../../../..");
  const runId = process.env.RUN_ID ?? `lv-${sourceSha}-local`;

  const result = runGlobalPreflight({
    repoRoot,
    env: e,
    mode,
    maxParallel,
    priorReceiptBundlePath: priorPath,
    requireSourceShaEqualsBase: true,
    approvedPilotManifestSha256: mode === "pilot" ? approvedPilot : null,
    dispatch: {
      controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID ?? "",
      approvedSourceSha: sourceSha,
      approvedManifestSha256: approvedManifest,
      runMode: mode,
      dispatchActor: process.env.DISPATCH_ACTOR ?? "",
      githubActor: process.env.GITHUB_ACTOR_NAME,
      actualManifestSha256: actualManifest || undefined,
      actualSourceSha: actualSource || undefined,
      allowedDispatchActors: actors,
      maxParallel,
      maxParallelMin: 1,
      maxParallelMax: 50,
    },
  });

  const cfg = loadProductionConfig(e);
  if (!result.ok || !cfg.config || !result.manifestSha256) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          errors: result.errors,
          manifestSha256: result.manifestSha256,
          pilotManifestSha256: result.pilotManifestSha256,
          cellCount: result.cellCount,
          eligibleCells: result.eligibleCells,
          validSkippedCells: result.validSkippedCells,
          maxProviderAttempts: result.maxProviderAttempts,
          authoritativeBaseSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
          config: cfg.config ? redactConfigForLog(cfg.config) : null,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const matrixCellIds = result.matrixCellIds;
  const priorMode = mode === "pilot" ? "full" : mode;
  const prior = loadPriorAcceptedReceipts({
    mode: priorMode,
    priorReceiptBundlePath: mode === "failed-only" ? priorPath : null,
    expectedSourceSha: sourceSha,
    expectedManifestSha256: result.manifestSha256,
    expectedCellIds: mode === "pilot" ? matrixCellIds : JSON.parse(
      readFileSync(resolve(repoRoot, AUTHORIZED_MANIFEST_RELATIVE_PATH), "utf8"),
    ).cells.map((c: { cellId: string }) => c.cellId),
    executionMode: cfg.config.executionMode,
  });
  if (!prior.ok) {
    console.log(JSON.stringify({ ok: false, errors: prior.errors }, null, 2));
    process.exit(1);
  }

  const quota = buildRuntimeQuotaContext({
    runId,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID ?? "",
    sourceSha,
    approvedManifestSha256: result.manifestSha256,
    mode,
    allCellIds: matrixCellIds,
    skippedCellIds: mode === "failed-only" ? [...prior.acceptedByCellId.keys()] : [],
    maxRetries: cfg.config.maxRetries,
    configuredProviderAttemptQuota: cfg.config.providerAttemptQuota,
    approvedPilotManifestSha256: mode === "pilot" ? result.pilotManifestSha256 : null,
  });
  if (!quota.ok || !quota.context) {
    console.log(JSON.stringify({ ok: false, errors: quota.errors }, null, 2));
    process.exit(1);
  }

  const qaDir = resolve(process.cwd(), "artifacts", "qa");
  mkdirSync(qaDir, { recursive: true });
  const quotaPath = join(qaDir, "runtime-quota-context.json");
  writeFileSync(quotaPath, `${JSON.stringify(quota.context, null, 2)}\n`, "utf8");

  const matrixPath = join(qaDir, "matrix-cells.json");
  writeFileSync(matrixPath, `${JSON.stringify(matrixCellIds, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        errors: [],
        mode,
        manifestSha256: result.manifestSha256,
        pilotManifestSha256: result.pilotManifestSha256,
        cellCount: result.cellCount,
        matrixCellCount: matrixCellIds.length,
        eligibleCells: quota.context.eligibleCells,
        validSkippedCells: quota.context.validSkippedCells,
        maxProviderAttempts: quota.context.maxProviderAttempts,
        quotaContextPath: quotaPath,
        quotaFingerprint: quota.context.fingerprint,
        authoritativeBaseSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        config: redactConfigForLog(cfg.config),
      },
      null,
      2,
    ),
  );
}

main();
