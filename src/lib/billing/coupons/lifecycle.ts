export type CouponAssignmentStatus =
  | "assigned"
  | "redeemed"
  | "expired_unused"
  | "reactivated"
  | "revoked";

export interface CouponAssignment {
  id: string;
  verifiedEmailHash: string | null;
  verifiedPhoneHash: string | null;
  status: CouponAssignmentStatus;
  reactivationApprovedAt: string | null;
}

export function assertCouponIdentityUnique(
  existing: CouponAssignment[],
  emailHash: string | null,
  phoneHash: string | null,
): void {
  for (const row of existing) {
    if (row.status === "revoked") continue;
    if (emailHash && row.verifiedEmailHash === emailHash) {
      throw new Error("COUPON_IDENTITY_ALREADY_ASSIGNED:email");
    }
    if (phoneHash && row.verifiedPhoneHash === phoneHash) {
      throw new Error("COUPON_IDENTITY_ALREADY_ASSIGNED:phone");
    }
  }
}

export function canRedeemCoupon(assignment: CouponAssignment): boolean {
  return assignment.status === "assigned" || assignment.status === "reactivated";
}

export function canApproveReactivation(assignment: CouponAssignment): boolean {
  return assignment.status === "expired_unused" && !assignment.reactivationApprovedAt;
}

export function applyReactivation(assignment: CouponAssignment): CouponAssignment {
  if (!canApproveReactivation(assignment)) {
    throw new Error("REACTIVATION_NOT_ALLOWED");
  }
  return {
    ...assignment,
    status: "reactivated",
    reactivationApprovedAt: new Date().toISOString(),
  };
}
