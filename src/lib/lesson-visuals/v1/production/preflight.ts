import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUTHORITATIVE_BASE_SOURCE_SHA,
  AUTHORIZED_MANIFEST_RELATIVE_PATH,
  EXPECTED_CELL_COUNT,
  EXPECTED_LESSON_COUNT,
  EXPECTED_PILOT_CELL_COUNT,
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
import {
  AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH,
  sha256Utf8,
  validatePilotManifest,
} from "./pilotManifest";
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
  /** Required when mode=pilot — sha256 of AUTHORIZED_PILOT_12.json bytes. */
  approvedPilotManifestSha256?: string | null;
}

export interface GlobalPreflightResult {
  ok: boolean;
  errors: string[];
  manifestSha256: string | null;
  pilotManifestSha256: string | null;
  cellCount: number;
  matrixCellIds: string[];
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

  if (input.mode !== "full" && input.mode !== "failed-only" && input.mode !== "pilot") {
    errors.push("unsupported mode");
  }
  errors.push(...validateMaxParallel(input.maxParallel));

  if (input.mode === "pilot") {
    const dig = (input.approvedPilotManifestSha256 ?? "").toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(dig)) {
      errors.push("approved_pilot_manifest_sha256 required for pilot mode");
    }
  } else if ((input.approvedPilotManifestSha256 ?? "").trim()) {
    errors.push("approved_pilot_manifest_sha256 only allowed for pilot mode");
  }

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
  let fullCellCount = 0;
  let fullCellIds: string[] = [];
  try {
    const bytes = readFileSync(manifestPath);
    manifestSha256 = createHash("sha256").update(bytes).digest("hex");
    const manifest = JSON.parse(bytes.toString("utf8")) as {
      cells: { cellId: string }[];
      lessonIds: unknown[];
      sourceSha: string;
    };
    fullCellCount = manifest.cells.length;
    fullCellIds = manifest.cells.map((c) => c.cellId);
    if (manifest.lessonIds.length !== EXPECTED_LESSON_COUNT) {
      errors.push(`lesson count ${manifest.lessonIds.length} != ${EXPECTED_LESSON_COUNT}`);
    }
    if (fullCellCount !== EXPECTED_CELL_COUNT) {
      errors.push(`cell count ${fullCellCount} != ${EXPECTED_CELL_COUNT}`);
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

  let pilotManifestSha256: string | null = null;
  let matrixCellIds = fullCellIds;
  let cellCount = fullCellCount || EXPECTED_CELL_COUNT;

  if (input.mode === "pilot" && manifestSha256) {
    try {
      const pilotPath = resolve(input.repoRoot, AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH);
      const pilotBytes = readFileSync(pilotPath);
      const pilotText = pilotBytes.toString("utf8");
      pilotManifestSha256 = sha256Utf8(pilotText);
      const approvedPilot = (input.approvedPilotManifestSha256 ?? "").toLowerCase();
      if (approvedPilot && approvedPilot !== pilotManifestSha256) {
        errors.push("approved_pilot_manifest_sha256 does not match AUTHORIZED_PILOT_12.json");
      }
      const parsed = JSON.parse(pilotText) as unknown;
      const v = validatePilotManifest(parsed, {
        sourceSha: input.dispatch.approvedSourceSha,
        fullManifestSha256: manifestSha256,
        fullCellIds,
      });
      if (!v.ok || !v.manifest) {
        errors.push(...v.errors.map((e) => `pilot: ${e}`));
      } else {
        matrixCellIds = v.manifest.cells.map((c) => c.cellId);
        cellCount = matrixCellIds.length;
        if (cellCount !== EXPECTED_PILOT_CELL_COUNT) {
          errors.push(`pilot matrix size ${cellCount} != ${EXPECTED_PILOT_CELL_COUNT}`);
        }
      }
    } catch (e) {
      errors.push(`pilot manifest read failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  let priorOk = true;
  let validSkippedCells = 0;
  let eligibleCells = cellCount;
  if (config.config && manifestSha256) {
    if (input.mode === "failed-only") {
      const prior = loadPriorAcceptedReceipts({
        mode: input.mode,
        priorReceiptBundlePath: input.priorReceiptBundlePath,
        expectedSourceSha: input.dispatch.approvedSourceSha,
        expectedManifestSha256: manifestSha256,
        expectedCellIds: fullCellIds,
        executionMode: config.config.executionMode,
      });
      priorOk = prior.ok;
      if (!prior.ok) errors.push(...prior.errors.map((e) => `prior-receipts: ${e}`));
      validSkippedCells = prior.skippedEligibleCount;
      eligibleCells = (fullCellCount || EXPECTED_CELL_COUNT) - validSkippedCells;
      cellCount = fullCellCount || EXPECTED_CELL_COUNT;
      matrixCellIds = fullCellIds;
    } else if (input.mode === "pilot") {
      // Pilot never loads prior receipts / failed-only skips.
      const prior = loadPriorAcceptedReceipts({
        mode: "full",
        priorReceiptBundlePath: null,
        expectedSourceSha: input.dispatch.approvedSourceSha,
        expectedManifestSha256: manifestSha256,
        expectedCellIds: matrixCellIds,
        executionMode: config.config.executionMode,
      });
      priorOk = prior.ok;
      validSkippedCells = 0;
      eligibleCells = cellCount;
    } else {
      const prior = loadPriorAcceptedReceipts({
        mode: input.mode,
        priorReceiptBundlePath: input.priorReceiptBundlePath,
        expectedSourceSha: input.dispatch.approvedSourceSha,
        expectedManifestSha256: manifestSha256,
        expectedCellIds: fullCellIds,
        executionMode: config.config.executionMode,
      });
      priorOk = prior.ok;
      if (!prior.ok) errors.push(...prior.errors.map((e) => `prior-receipts: ${e}`));
      validSkippedCells = 0;
      eligibleCells = cellCount;
    }
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
      authoritativeCells: cellCount,
      cellCostCeilingMicros: config.config.cellCostCeilingMicros,
      runCostCeilingMicros: config.config.runCostCeilingMicros,
      providerAttemptQuota: config.config.providerAttemptQuota,
      maxRetries: config.config.maxRetries,
    });
    budgetOk = budget.ok;
    maxProviderAttempts = budget.projectedMaxProviderAttempts;
    if (!budget.ok) errors.push(...budget.errors.map((e) => `budget: ${e}`));

    const envelope = computeAttemptQuotaEnvelope({
      authoritativeCells: cellCount,
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
    pilotManifestSha256,
    cellCount,
    matrixCellIds,
    eligibleCells,
    validSkippedCells,
    maxProviderAttempts,
    configOk: config.ok,
    budgetOk,
    dispatchOk: dispatch.ok,
    priorOk,
  };
}
