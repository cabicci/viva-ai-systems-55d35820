// Server-owned Stripe mode selection. Browser code never decides the mode.
//
// STRIPE_BILLING_MODE (server setting) is the explicit selector:
//   unset / "test"  -> Test flow, exactly as before.
//   "live"          -> Live flow only. Never falls back to Test.
// New Live checkout additionally needs STRIPE_LIVE_ENABLED=true AND the DB
// switch; if either is OFF the answer is "live_unavailable" (fail closed).
// The portal is lifecycle: in Live mode it opens even when checkout is OFF.
export type BillingIntent = "checkout" | "portal";
export type BillingModeAnswer = "test" | "live" | "live_unavailable";

export async function decideBillingMode(
  intent: BillingIntent,
  getEnv: (name: string) => string | undefined,
  databaseLiveEnabled: () => Promise<boolean>,
): Promise<BillingModeAnswer> {
  const selector = (getEnv("STRIPE_BILLING_MODE") ?? "test").trim().toLowerCase();
  if (selector === "" || selector === "test") return "test";
  if (selector !== "live") return "live_unavailable"; // unknown value: fail closed, never Test
  if (intent === "portal") return "live";
  if (getEnv("STRIPE_LIVE_ENABLED") !== "true") return "live_unavailable";
  try {
    return (await databaseLiveEnabled()) === true ? "live" : "live_unavailable";
  } catch {
    return "live_unavailable";
  }
}
