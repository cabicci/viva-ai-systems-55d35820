import type { AccessState } from "../types";

const VALID_TRANSITIONS: Record<AccessState, readonly AccessState[]> = {
  free_pending_verification: ["free_active"],
  free_active: ["free_expired", "paid_scheduled"],
  free_expired: ["paid_scheduled"],
  paid_scheduled: ["paid_active"],
  paid_active: ["past_due", "canceled_at_period_end", "refund_pending", "suspended", "expired"],
  past_due: ["paid_active", "expired", "suspended"],
  canceled_at_period_end: ["expired"],
  expired: ["paid_scheduled"],
  refund_pending: ["refunded"],
  refunded: ["paid_scheduled"],
  suspended: ["paid_active", "expired"],
};

export function canTransitionAccessState(from: AccessState, to: AccessState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidAccessTransition(from: AccessState, to: AccessState): void {
  if (!canTransitionAccessState(from, to)) {
    throw new Error(`INVALID_STATE_TRANSITION:${from}->${to}`);
  }
}
