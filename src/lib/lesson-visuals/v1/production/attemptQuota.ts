import { MAX_RETRIES_HARD_CEILING } from "../constants";

export interface AttemptQuotaInput {
  authoritativeCells: number;
  /** Cells that still require provider calls after prior-receipt validation. */
  eligibleCells: number;
  /** Fully validated accepted prior receipts (failed-only skips). */
  validSkippedCells: number;
  maxRetries: number;
  configuredProviderAttemptQuota: number;
}

export interface AttemptQuotaResult {
  ok: boolean;
  errors: string[];
  maxProviderAttempts: number;
  attemptsPerEligibleCell: number;
}

/**
 * eligible_cells × (1 + max_retries) must be ≤ configured provider-attempt quota.
 * Resumed/skipped + eligible must reconcile to the mode's authoritative cell count
 * (400 for full/failed-only; 12 for pilot).
 */
export function computeAttemptQuotaEnvelope(input: AttemptQuotaInput): AttemptQuotaResult {
  const errors: string[] = [];
  const {
    authoritativeCells,
    eligibleCells,
    validSkippedCells,
    maxRetries,
    configuredProviderAttemptQuota,
  } = input;

  if (!Number.isSafeInteger(authoritativeCells) || authoritativeCells < 0) {
    errors.push("authoritativeCells unsafe/negative");
  }
  if (!Number.isSafeInteger(eligibleCells) || eligibleCells < 0) {
    errors.push("eligibleCells unsafe/negative");
  }
  if (!Number.isSafeInteger(validSkippedCells) || validSkippedCells < 0) {
    errors.push("validSkippedCells unsafe/negative");
  }
  if (eligibleCells + validSkippedCells !== authoritativeCells) {
    errors.push(
      `skipped(${validSkippedCells})+eligible(${eligibleCells}) != authoritative(${authoritativeCells})`,
    );
  }
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0 || maxRetries > MAX_RETRIES_HARD_CEILING) {
    errors.push(`maxRetries out of bounds [0,${MAX_RETRIES_HARD_CEILING}]`);
  }
  if (
    !Number.isSafeInteger(configuredProviderAttemptQuota) ||
    configuredProviderAttemptQuota < 0
  ) {
    errors.push("configuredProviderAttemptQuota missing/malformed/unsafe");
  }
  if (eligibleCells > 0 && configuredProviderAttemptQuota <= 0) {
    errors.push("provider-attempt quota is zero/negative but eligible cells require calls");
  }

  const attemptsPerEligibleCell = maxRetries + 1;
  let maxProviderAttempts = 0;
  try {
    maxProviderAttempts = Math.imul(eligibleCells, attemptsPerEligibleCell);
    if (!Number.isSafeInteger(maxProviderAttempts) || maxProviderAttempts < 0) {
      errors.push("maxProviderAttempts overflow/unsafe");
    }
  } catch {
    errors.push("maxProviderAttempts arithmetic failed");
  }

  if (maxProviderAttempts > configuredProviderAttemptQuota) {
    errors.push(
      `max provider attempts ${maxProviderAttempts} exceeds quota ${configuredProviderAttemptQuota}`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    maxProviderAttempts,
    attemptsPerEligibleCell,
  };
}

export function assertRuntimeAttemptWithinQuota(
  attemptsUsed: number,
  maxProviderAttempts: number,
): string | null {
  if (!Number.isSafeInteger(attemptsUsed) || attemptsUsed < 0) {
    return "attemptsUsed unsafe";
  }
  if (attemptsUsed > maxProviderAttempts) {
    return `runtime provider attempts ${attemptsUsed} exceed envelope ${maxProviderAttempts}`;
  }
  return null;
}
