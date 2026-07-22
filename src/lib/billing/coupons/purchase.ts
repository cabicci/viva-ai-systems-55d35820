import type { PurchaseCouponReservationStatus } from "../types";

export type PurchaseCouponAction = "consume" | "release";

/** Only a fresh reservation may be consumed (payment success). */
export function canConsumePurchaseReservation(status: PurchaseCouponReservationStatus): boolean {
  return status === "reserved";
}

/**
 * Only a reserved (never-consumed) reservation may be released. A consumed
 * reservation cannot be released; refunds must not walk it back.
 */
export function canReleasePurchaseReservation(status: PurchaseCouponReservationStatus): boolean {
  return status === "reserved";
}

/** Resolve the next reservation status, or throw on an illegal transition. */
export function nextReservationStatus(
  current: PurchaseCouponReservationStatus,
  action: PurchaseCouponAction,
): PurchaseCouponReservationStatus {
  if (action === "consume") {
    if (current === "consumed") return "consumed";
    if (!canConsumePurchaseReservation(current)) {
      throw new Error(`PURCHASE_COUPON_CANNOT_CONSUME:${current}`);
    }
    return "consumed";
  }

  if (current === "released") return "released";
  if (!canReleasePurchaseReservation(current)) {
    throw new Error(`PURCHASE_COUPON_CANNOT_RELEASE:${current}`);
  }
  return "released";
}

/**
 * V3 contract: a refund never auto-reactivates a consumed purchase coupon.
 */
export function shouldReactivateAfterRefund(): boolean {
  return false;
}
