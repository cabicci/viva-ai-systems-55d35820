import type { AdminAccessCoupon, AdminAccessGrant } from "../types";

/** Duration of an admin access grant window, in hours. Mirrors SQL. */
export const ADMIN_ACCESS_GRANT_HOURS = 72;

const HOUR_MS = 3_600_000;

/**
 * New grant expiry, mirroring the SQL:
 *   GREATEST(now, COALESCE(currentExpiry, now)) + 72h
 * Extending an already-active grant stacks onto its remaining window.
 */
export function extendAdminGrantExpiry(now: Date, currentExpiry: Date | null): Date {
  const base = Math.max(now.getTime(), currentExpiry ? currentExpiry.getTime() : now.getTime());
  return new Date(base + ADMIN_ACCESS_GRANT_HOURS * HOUR_MS);
}

/** A coupon may be redeemed only by its intended user while still active. */
export function canRedeemAdminCoupon(
  coupon: AdminAccessCoupon,
  callerUserId: string,
  now: Date = new Date(),
): boolean {
  if (coupon.status !== "active") return false;
  if (coupon.intendedUserId !== callerUserId) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) return false;
  return true;
}

/** A grant confers full entitlement while active and unexpired. */
export function isAdminGrantActive(
  grant: Pick<AdminAccessGrant, "status" | "expiresAt">,
  now: Date = new Date(),
): boolean {
  return grant.status === "active" && new Date(grant.expiresAt) > now;
}
