import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUTHORITATIVE_BASE_SOURCE_SHA,
  AUTHORIZED_MANIFEST_RELATIVE_PATH,
  EXPECTED_CELL_COUNT,
  EXPECTED_LESSON_COUNT,
  MAX_PARALLEL_CEILING,
  MIN_PARALLEL,
} from "../constants";
import {
  parseDispatchActorAllowlist,
  validateDispatchAuthorization,
  type DispatchAuthorizationInput,
} from "../dispatch/authorizationContract";
import { validateRepinState } from "../scripts/repin_source_sha";
import { computeAttemptQuotaEnvelope } from "./attemptQuota";
import { preflightBudgetAndQuota } from "./budget";
import { loadProductionConfig, type ProductionEnv } from "./config";
import { loadPriorAcceptedReceipts } from "./priorReceipts";
import type { ProductionRunMode } from "./types";

export interface GlobalPreflightInput {
  repoRoot: string;
  env: ProductionEnv;
  dispatch: DispatchAuthorizationInput;
  mode: ProductionRunMode;
  maxParallel: number;
  priorReceiptBundlePath?: string | null;
  requireSourceShaEqualsBase?: boolean;
}

export interface GlobalPreflightResult {
  ok: boolean;
  errors: string[];
  manifestSha256: string | null;
  cellCount: number;
  eligibleCells: number;
  validSkippedCells: number;
  maxProviderAttempts: number;
  configOk: boolean;
  budgetOk: boolean;
  dispatchOk: boolean;
  priorOk: boolean;
}

export function validateMaxParallel(maxParallel: number): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(maxParallel)) errors.push("max_parallel must be an integer");
  if (maxParallel < MIN_PARALLEL || maxParallel > MAX_PARALLEL_CEILING) {
    errors.push(
      `max_parallel ${maxParallel} out of bounds [${MIN_PARALLEL},${MAX_PARALLEL_CEILING}]`,
    );
  }
  return errors;
}

export function runGlobalPreflight(input: GlobalPreflightInput): GlobalPreflightResult {
  const errors: string[] = [];

  if (input.mode !== "full" && input.mode !== "failed-only") {
    errors.push("unsupported mode");
  }
  errors.push(...validateMaxParallel(input.maxParallel));

  const dispatch = validateDispatchAuthorization(input.dispatch);
  if (!dispatch.ok) errors.push(...dispatch.errors.map((e) => `dispatch: ${e}`));

  const config = loadProductionConfig(input.env);
  if (!config.ok || !config.config) {
    errors.push(...config.errors.map((e) => `config: ${e}`));
  }

  const repin = validateRepinState();
  if (!repin.ok) errors.push(...repin.errors.map((e) => `manifest: ${e}`));

  const manifestPath = resolve(input.repoRoot, AUTHORIZED_MANIFEST_RELATIVE_PATH);
  let manifestSha256: string | null = null;
  let cellCount = 0;
  let cellIds: string[] = [];
  try {
    const bytes = readFileSync(manifestPath);
    manifestSha256 = createHash("sha256").update(bytes).digest("hex");
    const manifest = JSON.parse(bytes.toString("utf8")) as {
      cells: { cellId: string }[];
      lessonIds: unknown[];
      sourceSha: string;
    };
    cellCount = manifest.cells.length;
    cellIds = manifest.cells.map((c) => c.cellId);
    if (manifest.lessonIds.length !== EXPECTED_LESSON_COUNT) {
      errors.push(`lesson count ${manifest.lessonIds.length} != ${EXPECTED_LESSON_COUNT}`);
    }
    if (cellCount !== EXPECTED_CELL_COUNT) {
      errors.push(`cell count ${cellCount} != ${EXPECTED_CELL_COUNT}`);
    }
    if (input.requireSourceShaEqualsBase !== false) {
      if (manifest.sourceSha !== AUTHORITATIVE_BASE_SOURCE_SHA) {
        errors.push(
          `manifest sourceSha ${manifest.sourceSha} != base ${AUTHORITATIVE_BASE_SOURCE_SHA}`,
        );
      }
      if (input.dispatch.approvedSourceSha !== AUTHORITATIVE_BASE_SOURCE_SHA) {
        errors.push(
          `approvedSourceSha ${input.dispatch.approvedSourceSha} != base ${AUTHORITATIVE_BASE_SOURCE_SHA}`,
        );
      }
    }
    if (
      input.dispatch.actualManifestSha256 &&
      input.dispatch.actualManifestSha256 !== manifestSha256
    ) {
      errors.push("manifest digest mismatch against checked-out file");
    }
    if (
      input.dispatch.approvedManifestSha256 &&
      input.dispatch.approvedManifestSha256 !== manifestSha256
    ) {
      errors.push("approved_manifest_sha256 does not match checked-out AUTHORIZED_MANIFEST.json");
    }
  } catch (e) {
    errors.push(`manifest read failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  let priorOk = true;
  let validSkippedCells = 0;
  let eligibleCells = cellCount || EXPECTED_CELL_COUNT;
  if (config.config && manifestSha256) {
    const prior = loadPriorAcceptedReceipts({
      mode: input.mode,
      priorReceiptBundlePath: input.priorReceiptBundlePath,
      expectedSourceSha: input.dispatch.approvedSourceSha,
      expectedManifestSha256: manifestSha256,
      expectedCellIds: cellIds,
      executionMode: config.config.executionMode,
    });
    priorOk = prior.ok;
    if (!prior.ok) errors.push(...prior.errors.map((e) => `prior-receipts: ${e}`));
    validSkippedCells = prior.skippedEligibleCount;
    eligibleCells = (cellCount || EXPECTED_CELL_COUNT) - validSkippedCells;
  } else if (input.mode === "failed-only") {
    priorOk = false;
    errors.push("prior-receipts: cannot validate without config/manifest");
  }

  let budgetOk = false;
  let maxProviderAttempts = 0;
  if (config.config) {
    const budget = preflightBudgetAndQuota({
      eligibleCellCount: eligibleCells,
      validSkippedCells,
      authoritativeCells: cellCount || EXPECTED_CELL_COUNT,
      cellCostCeilingMicros: config.config.cellCostCeilingMicros,
      runCostCeilingMicros: config.config.runCostCeilingMicros,
      providerAttemptQuota: config.config.providerAttemptQuota,
      maxRetries: config.config.maxRetries,
    });
    budgetOk = budget.ok;
    maxProviderAttempts = budget.projectedMaxProviderAttempts;
    if (!budget.ok) errors.push(...budget.errors.map((e) => `budget: ${e}`));

    const envelope = computeAttemptQuotaEnvelope({
      authoritativeCells: cellCount || EXPECTED_CELL_COUNT,
      eligibleCells,
      validSkippedCells,
      maxRetries: config.config.maxRetries,
      configuredProviderAttemptQuota: config.config.providerAttemptQuota,
    });
    if (!envelope.ok) errors.push(...envelope.errors.map((e) => `attempt-quota: ${e}`));
  }

  const actors = parseDispatchActorAllowlist(input.env.LOVABLE_DISPATCH_ACTORS);
  if (actors.length === 0) errors.push("dispatch actor allowlist empty");

  return {
    ok: errors.length === 0,
    errors,
    manifestSha256,
    cellCount,
    eligibleCells,
    validSkippedCells,
    maxProviderAttempts,
    configOk: config.ok,
    budgetOk,
    dispatchOk: dispatch.ok,
    priorOk,
  };
}
