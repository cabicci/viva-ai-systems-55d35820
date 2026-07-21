import type { BudgetPreflightInput, BudgetPreflightResult } from "./types";
import type { UsdMicros } from "./money";
import { computeAttemptQuotaEnvelope } from "./attemptQuota";

/**
 * Fail-closed budget + attempt-quota preflight using integer micro-USD.
 * Projected max cost = eligibleCells * (maxRetries + 1) * cellCeiling.
 */
export function preflightBudgetAndQuota(
  input: BudgetPreflightInput & { validSkippedCells?: number; authoritativeCells?: number },
): BudgetPreflightResult {
  const errors: string[] = [];
  const {
    eligibleCellCount,
    cellCostCeilingMicros,
    runCostCeilingMicros,
    providerAttemptQuota,
    maxRetries,
  } = input;

  if (runCostCeilingMicros <= 0n) errors.push("missing or non-positive run budget ceiling");
  if (cellCostCeilingMicros <= 0n) errors.push("missing or non-positive per-cell cost ceiling");
  if (cellCostCeilingMicros > runCostCeilingMicros) {
    errors.push("per-cell cost ceiling above run ceiling");
  }

  const authoritativeCells = input.authoritativeCells ?? eligibleCellCount + (input.validSkippedCells ?? 0);
  const validSkippedCells = input.validSkippedCells ?? 0;
  const quota = computeAttemptQuotaEnvelope({
    authoritativeCells,
    eligibleCells: eligibleCellCount,
    validSkippedCells,
    maxRetries,
    configuredProviderAttemptQuota: providerAttemptQuota,
  });
  if (!quota.ok) errors.push(...quota.errors.map((e) => `attempt-quota: ${e}`));

  const attemptsPerCell = BigInt(maxRetries + 1);
  const projectedMaxProviderAttempts = quota.maxProviderAttempts;
  const projectedMaxCostMicros =
    BigInt(eligibleCellCount) * attemptsPerCell * cellCostCeilingMicros;

  if (projectedMaxCostMicros > runCostCeilingMicros) {
    errors.push(
      `projected maximum cost ${projectedMaxCostMicros} exceeds run ceiling ${runCostCeilingMicros}`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    projectedMaxCostMicros,
    projectedMaxProviderAttempts,
  };
}

export function assertProviderCostWithinLimit(
  providerCostMicros: UsdMicros,
  cellCeiling: UsdMicros,
  remainingRunBudget: UsdMicros,
): string | null {
  if (providerCostMicros < 0n) return "provider cost negative";
  if (providerCostMicros > cellCeiling) {
    return `provider cost ${providerCostMicros} above cell ceiling ${cellCeiling}`;
  }
  if (providerCostMicros > remainingRunBudget) {
    return `provider cost ${providerCostMicros} exceeds remaining run budget ${remainingRunBudget}`;
  }
  return null;
}

export function assertAggregateCost(
  totalCostMicros: UsdMicros,
  runCeiling: UsdMicros,
): string | null {
  if (totalCostMicros > runCeiling) {
    return `aggregate recorded cost ${totalCostMicros} above run ceiling ${runCeiling}`;
  }
  return null;
}
