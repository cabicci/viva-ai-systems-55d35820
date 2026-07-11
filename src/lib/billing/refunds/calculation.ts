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

export function calculateAutoRefundEligibleAt(
  createdAt: Date,
  policy: RefundPolicyVersion,
): Date {
  const eligible = new Date(createdAt);
  eligible.setDate(eligible.getDate() + policy.unusedMonetaryCreditAutoRefundDays);
  return eligible;
}
