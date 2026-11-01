// Single source of truth for the server-owned Stripe mode.
//
// STRIPE_BILLING_MODE is a project secret. Lovable project secrets are read
// at request time both by backend functions (Deno.env) and by the site server
// (process.env), so every runtime sees the same value. No request field,
// header or query parameter is ever consulted.
//
//   unset / "" / "test"  -> Test mode, existing behaviour unchanged.
//   anything else        -> Test Stripe is LOCKED (fail closed). Only "live"
//                           enables Live; unknown values lock Test and keep
//                           Live unavailable.
export type GetEnv = (name: string) => string | undefined;

export function billingModeSelector(getEnv: GetEnv): string {
  return (getEnv("STRIPE_BILLING_MODE") ?? "").trim().toLowerCase();
}

export function isTestStripeLocked(getEnv: GetEnv): boolean {
  const value = billingModeSelector(getEnv);
  return !(value === "" || value === "test");
}

// While Test is locked, signed Test events may only REMOVE access.
// Everything that could grant, extend or restore access is acknowledged and
// dropped: checkout.session.completed, invoice.paid, invoice.payment_failed
// (renewal attempts advance the period) and customer.subscription.updated
// (reactivation / period change).
const REVOKE_ONLY_EVENTS = new Set([
  "refund.created",
  "refund.updated",
  "refund.failed",
  "customer.subscription.deleted",
]);

export function testEventAllowedWhileLocked(eventType: string): boolean {
  return REVOKE_ONLY_EVENTS.has(eventType);
}

export const TEST_STRIPE_LOCKED = "TEST_STRIPE_LOCKED";
