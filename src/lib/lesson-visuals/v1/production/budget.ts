import type { BudgetPreflightInput, BudgetPreflightResult } from "./types";
import type { UsdMicros } from "./money";

/**
 * Fail-closed budget/quota preflight using integer micro-USD.
 * Projected max cost = cellCount * (maxRetries + 1) * cellCeiling.
 */
export function preflightBudgetAndQuota(input: BudgetPreflightInput): BudgetPreflightResult {
  const errors: string[] = [];
  const { cellCount, cellCostCeilingMicros, runCostCeilingMicros, quotaCells, maxRetries } = input;

  if (runCostCeilingMicros <= 0n) errors.push("missing or non-positive run budget ceiling");
  if (cellCostCeilingMicros <= 0n) errors.push("missing or non-positive per-cell cost ceiling");
  if (cellCostCeilingMicros > runCostCeilingMicros) {
    errors.push("per-cell cost ceiling above run ceiling");
  }
  if (!Number.isInteger(quotaCells) || quotaCells <= 0) {
    errors.push("missing or invalid quota configuration");
  }
  if (cellCount > quotaCells) {
    errors.push(`requested cells ${cellCount} above quota ${quotaCells}`);
  }
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    errors.push("invalid maxRetries");
  }

  const attemptsPerCell = BigInt(maxRetries + 1);
  const projectedMaxAttempts = cellCount * (maxRetries + 1);
  const projectedMaxCostMicros = BigInt(cellCount) * attemptsPerCell * cellCostCeilingMicros;

  if (projectedMaxCostMicros > runCostCeilingMicros) {
    errors.push(
      `projected maximum cost ${projectedMaxCostMicros} exceeds run ceiling ${runCostCeilingMicros}`,
    );
  }
  if (projectedMaxAttempts > quotaCells * (maxRetries + 1) && cellCount > quotaCells) {
    // already covered; keep for clarity on retry multiplication
    errors.push("retry multiplication causes projected quota overrun");
  }

  return {
    ok: errors.length === 0,
    errors,
    projectedMaxCostMicros,
    projectedMaxAttempts,
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
