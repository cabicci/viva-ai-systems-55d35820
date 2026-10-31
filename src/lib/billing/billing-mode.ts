// Server-owned Stripe mode selection for the site. Browser code never decides
// the mode. Parsing is shared with the backend functions so both runtimes
// read STRIPE_BILLING_MODE identically.
//   unset / "test"  -> Test flow, exactly as before.
//   "live"          -> Live flow only. Never falls back to Test.
//   anything else   -> unavailable (fail closed; Test functions also lock).
// New Live checkout additionally needs STRIPE_LIVE_ENABLED=true AND the DB
// switch. The portal is lifecycle: in Live mode it opens even when checkout is OFF.
import {
  billingModeSelector,
  isTestStripeLocked,
} from "../../../supabase/functions/_shared/billing-mode";

export type BillingIntent = "checkout" | "portal";
export type BillingModeAnswer = "test" | "live" | "live_unavailable";

export async function decideBillingMode(
  intent: BillingIntent,
  getEnv: (name: string) => string | undefined,
  databaseLiveEnabled: () => Promise<boolean>,
): Promise<BillingModeAnswer> {
  if (!isTestStripeLocked(getEnv)) return "test";
  if (billingModeSelector(getEnv) !== "live") return "live_unavailable";
  if (intent === "portal") return "live";
  if (getEnv("STRIPE_LIVE_ENABLED") !== "true") return "live_unavailable";
  try {
    return (await databaseLiveEnabled()) === true ? "live" : "live_unavailable";
  } catch {
    return "live_unavailable";
  }
}
