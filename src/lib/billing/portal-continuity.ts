export function portalModeForExistingSubscription(
  environment: unknown,
  testLocked: boolean,
): "test" | "live" | "unavailable" {
  if (environment === "live") return "live";
  // Do not reopen a Test portal capable of resuming or buying a Test plan.
  // Historical Test users require reviewed cancellation/support continuity.
  if (environment === "test" && !testLocked) return "test";
  return "unavailable";
}
