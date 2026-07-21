/**
 * Workflow entry: global preflight before matrix expansion.
 * Fail-closed. Never logs secret values.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTHORITATIVE_BASE_SOURCE_SHA } from "../constants";
import { parseDispatchActorAllowlist } from "../dispatch/authorizationContract";
import { loadProductionConfig, redactConfigForLog, type ProductionEnv } from "../production/config";
import { runGlobalPreflight } from "../production/preflight";

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
  const mode = (process.env.MODE ?? "full") as "full" | "failed-only";
  const maxParallel = Number(process.env.MAX_PARALLEL ?? "20");
  const sourceSha = process.env.SOURCE_SHA ?? "";
  const approvedManifest = (process.env.APPROVED_MANIFEST_SHA256 ?? "").toLowerCase();
  const actualManifest = (process.env.ACTUAL_MANIFEST_SHA256 ?? "").toLowerCase();
  const actualSource = process.env.ACTUAL_SOURCE_SHA ?? "";
  const actors = parseDispatchActorAllowlist(e.LOVABLE_DISPATCH_ACTORS);
  const priorPath = process.env.PRIOR_RECEIPT_BUNDLE_PATH ?? null;

  const result = runGlobalPreflight({
    repoRoot: resolve(moduleDir(), "../../../../.."),
    env: e,
    mode,
    maxParallel,
    priorReceiptBundlePath: priorPath,
    requireSourceShaEqualsBase: true,
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
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        errors: result.errors,
        manifestSha256: result.manifestSha256,
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
  if (!result.ok) process.exit(1);
}

main();
