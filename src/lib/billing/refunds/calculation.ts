export interface RefundPolicyVersion {
  policyKey: string;
  versionNumber: number;
  unusedMonetaryCreditAutoRefundDays: number;
  prorationMethod: "daily" | "none";
}

export function selectRefundPolicyVersion(
  policies: RefundPolicyVersion[],
  policyKey: string,
  asOf: Date = new Date(),
): RefundPolicyVersion | null {
  return (
    policies
      .filter((p) => p.policyKey === policyKey)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0] ?? null
  );
}

export function calculateAutoRefundEligibleAt(createdAt: Date, policy: RefundPolicyVersion): Date {
  const eligible = new Date(createdAt);
  eligible.setDate(eligible.getDate() + policy.unusedMonetaryCreditAutoRefundDays);
  return eligible;
}

/**
 * Maximum still-refundable amount (integer minor units). Equal to the captured
 * gross minus refunds already holding value (pending/processing/succeeded).
 * There is NO time proration. Never negative.
 */
export function maxRefundableMinor(
  capturedGrossMinor: number,
  priorConsumingRefundsMinor: number,
): number {
  const remaining = Math.trunc(capturedGrossMinor) - Math.trunc(priorConsumingRefundsMinor);
  return Math.max(0, remaining);
}

/**
 * Tax attributed to a single refund (integer minor units). Non-final refunds
 * get a proportional (floored) share of the original tax; the final refund
 * receives the remainder so the sum of allocations reconciles exactly.
 */
export function allocateRefundTaxMinor(args: {
  originalTaxMinor: number;
  originalGrossMinor: number;
  refundMinor: number;
  isFinalRefund: boolean;
  alreadyRefundedTaxMinor: number;
}): number {
  const {
    originalTaxMinor,
    originalGrossMinor,
    refundMinor,
    isFinalRefund,
    alreadyRefundedTaxMinor,
  } = args;

  if (isFinalRefund) {
    return Math.max(0, Math.trunc(originalTaxMinor) - Math.trunc(alreadyRefundedTaxMinor));
  }

  if (originalGrossMinor <= 0) return 0;

  const proportional = Math.trunc(
    (Math.trunc(originalTaxMinor) * Math.trunc(refundMinor)) / Math.trunc(originalGrossMinor),
  );
  return Math.max(0, proportional);
}
