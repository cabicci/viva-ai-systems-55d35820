/**
 * Fail-closed production configuration for Lesson Images.
 * Secret values are never logged — only presence flags.
 */
import {
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_MAX_OUTPUT_BYTES,
  DEFAULT_MAX_RETRIES,
  DEFAULT_REQUIRED_HEIGHT,
  DEFAULT_REQUIRED_WIDTH,
  EXPECTED_CELL_COUNT,
} from "../constants";
import { parseUsdMicros, requirePositiveUsdMicros } from "./money";
import type { ExecutionMode, ProductionConfig } from "./types";

export interface ProductionEnv {
  LESSON_VISUALS_EXECUTION_MODE?: string;
  LESSON_VISUALS_PROVIDER_NAME?: string;
  LESSON_VISUALS_PROVIDER_MODEL?: string;
  LESSON_VISUALS_PROVIDER_API_KEY?: string;
  LESSON_VISUALS_PROVIDER_ACCOUNT_ID?: string;
  LESSON_VISUALS_AI_AUTH_ID?: string;
  LESSON_VISUALS_STORAGE_CREDENTIAL?: string;
  LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS?: string;
  LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS?: string;
  LESSON_VISUALS_MAX_OUTPUT_BYTES?: string;
  LESSON_VISUALS_ALLOWED_MIME_TYPES?: string;
  LESSON_VISUALS_REQUIRED_WIDTH?: string;
  LESSON_VISUALS_REQUIRED_HEIGHT?: string;
  LESSON_VISUALS_QUOTA_CELLS?: string;
  LESSON_VISUALS_MAX_RETRIES?: string;
  LESSON_VISUALS_OUTPUT_STORAGE_TARGET?: string;
  LOVABLE_DISPATCH_ACTORS?: string;
}

export interface ConfigLoadResult {
  ok: boolean;
  errors: string[];
  config: ProductionConfig | null;
}

function parsePositiveInt(raw: string | undefined, field: string, fallback?: number): number {
  if (raw === undefined || raw.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} missing`);
  }
  if (!/^\d+$/.test(raw.trim())) throw new Error(`${field} must be a non-negative integer`);
  const n = Number(raw.trim());
  if (!Number.isSafeInteger(n)) throw new Error(`${field} not a safe integer`);
  return n;
}

export function loadProductionConfig(env: ProductionEnv): ConfigLoadResult {
  const errors: string[] = [];

  const modeRaw = (env.LESSON_VISUALS_EXECUTION_MODE ?? "").trim().toLowerCase();
  if (modeRaw !== "production" && modeRaw !== "dry-run") {
    errors.push(
      "LESSON_VISUALS_EXECUTION_MODE must be 'production' or 'dry-run' (fail-closed; no implicit default in workflow)",
    );
  }
  const executionMode = modeRaw as ExecutionMode;

  const providerName = (env.LESSON_VISUALS_PROVIDER_NAME ?? "").trim();
  const providerModel = (env.LESSON_VISUALS_PROVIDER_MODEL ?? "").trim();
  if (!providerName) errors.push("LESSON_VISUALS_PROVIDER_NAME missing");
  if (!providerModel) errors.push("LESSON_VISUALS_PROVIDER_MODEL missing");

  const apiKey = env.LESSON_VISUALS_PROVIDER_API_KEY ?? "";
  const accountId = env.LESSON_VISUALS_PROVIDER_ACCOUNT_ID ?? "";
  const authId = env.LESSON_VISUALS_AI_AUTH_ID ?? "";
  const storageCred = env.LESSON_VISUALS_STORAGE_CREDENTIAL ?? "";

  const providerApiKeyPresent = apiKey.trim().length > 0;
  const providerAccountIdPresent = accountId.trim().length > 0;
  const providerAuthIdPresent = authId.trim().length > 0;
  const storageCredentialPresent = storageCred.trim().length > 0;

  if (executionMode === "production") {
    if (!providerApiKeyPresent) errors.push("LESSON_VISUALS_PROVIDER_API_KEY missing (production)");
    if (!providerAccountIdPresent) {
      errors.push("LESSON_VISUALS_PROVIDER_ACCOUNT_ID missing (production)");
    }
    if (!providerAuthIdPresent) errors.push("LESSON_VISUALS_AI_AUTH_ID missing (production)");
  }

  const storageTarget = (env.LESSON_VISUALS_OUTPUT_STORAGE_TARGET ?? "").trim();
  if (!storageTarget) errors.push("LESSON_VISUALS_OUTPUT_STORAGE_TARGET missing");
  if (storageTarget.startsWith("external:") && !storageCredentialPresent) {
    errors.push("LESSON_VISUALS_STORAGE_CREDENTIAL required for external storage target");
  }

  let runCeiling = 0n;
  let cellCeiling = 0n;
  try {
    runCeiling = requirePositiveUsdMicros(
      parseUsdMicros(env.LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS, "LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS"),
      "LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS",
    );
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  try {
    cellCeiling = requirePositiveUsdMicros(
      parseUsdMicros(env.LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS, "LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS"),
      "LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS",
    );
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  if (runCeiling > 0n && cellCeiling > 0n && cellCeiling > runCeiling) {
    errors.push("per-cell cost ceiling exceeds run cost ceiling");
  }

  let maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES;
  let requiredWidth = DEFAULT_REQUIRED_WIDTH;
  let requiredHeight = DEFAULT_REQUIRED_HEIGHT;
  let quotaCells = EXPECTED_CELL_COUNT;
  let maxRetries = DEFAULT_MAX_RETRIES;
  try {
    maxOutputBytes = parsePositiveInt(
      env.LESSON_VISUALS_MAX_OUTPUT_BYTES,
      "LESSON_VISUALS_MAX_OUTPUT_BYTES",
    );
    if (maxOutputBytes <= 0) errors.push("LESSON_VISUALS_MAX_OUTPUT_BYTES must be > 0");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  try {
    requiredWidth = parsePositiveInt(env.LESSON_VISUALS_REQUIRED_WIDTH, "LESSON_VISUALS_REQUIRED_WIDTH");
    if (requiredWidth <= 0) errors.push("LESSON_VISUALS_REQUIRED_WIDTH must be > 0");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  try {
    requiredHeight = parsePositiveInt(env.LESSON_VISUALS_REQUIRED_HEIGHT, "LESSON_VISUALS_REQUIRED_HEIGHT");
    if (requiredHeight <= 0) errors.push("LESSON_VISUALS_REQUIRED_HEIGHT must be > 0");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  try {
    quotaCells = parsePositiveInt(env.LESSON_VISUALS_QUOTA_CELLS, "LESSON_VISUALS_QUOTA_CELLS");
    if (quotaCells <= 0) errors.push("LESSON_VISUALS_QUOTA_CELLS must be > 0");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  try {
    maxRetries = parsePositiveInt(env.LESSON_VISUALS_MAX_RETRIES, "LESSON_VISUALS_MAX_RETRIES");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  const mimeRaw = (env.LESSON_VISUALS_ALLOWED_MIME_TYPES ?? "").trim();
  const allowedMimeTypes = mimeRaw
    ? mimeRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [...DEFAULT_ALLOWED_MIME_TYPES];
  if (allowedMimeTypes.length === 0) errors.push("LESSON_VISUALS_ALLOWED_MIME_TYPES empty");

  const lovableDispatchActorsRaw = env.LOVABLE_DISPATCH_ACTORS ?? "";
  if (!lovableDispatchActorsRaw.trim()) {
    errors.push("LOVABLE_DISPATCH_ACTORS allowlist empty — fail closed");
  }

  if (errors.length > 0) {
    return { ok: false, errors, config: null };
  }

  return {
    ok: true,
    errors: [],
    config: {
      executionMode,
      providerName,
      providerModel,
      providerApiKeyPresent,
      providerAccountIdPresent,
      providerAuthIdPresent,
      storageCredentialPresent,
      runCostCeilingMicros: runCeiling,
      cellCostCeilingMicros: cellCeiling,
      maxOutputBytes,
      allowedMimeTypes,
      requiredWidth,
      requiredHeight,
      quotaCells,
      maxRetries,
      outputStorageTarget: storageTarget,
      lovableDispatchActorsRaw,
    },
  };
}

/** Safe diagnostic — never includes secret values. */
export function redactConfigForLog(config: ProductionConfig): Record<string, unknown> {
  return {
    executionMode: config.executionMode,
    providerName: config.providerName,
    providerModel: config.providerModel,
    providerApiKeyPresent: config.providerApiKeyPresent,
    providerAccountIdPresent: config.providerAccountIdPresent,
    providerAuthIdPresent: config.providerAuthIdPresent,
    storageCredentialPresent: config.storageCredentialPresent,
    runCostCeilingMicros: config.runCostCeilingMicros.toString(),
    cellCostCeilingMicros: config.cellCostCeilingMicros.toString(),
    maxOutputBytes: config.maxOutputBytes,
    allowedMimeTypes: config.allowedMimeTypes,
    requiredWidth: config.requiredWidth,
    requiredHeight: config.requiredHeight,
    quotaCells: config.quotaCells,
    maxRetries: config.maxRetries,
    outputStorageTarget: config.outputStorageTarget,
    lovableDispatchActorsConfigured: config.lovableDispatchActorsRaw.trim().length > 0,
  };
}
