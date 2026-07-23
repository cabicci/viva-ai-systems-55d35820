import { PLAN_ENTITLEMENT_DEFAULTS } from "../types";

/**
 * Contract-approved catalogue prices in minor units, tax exclusive. These
 * mirror the seeded billing.market_prices rows exactly.
 *   EG  -> EGP (piastres)
 *   INTL -> USD (cents)
 */
export const APPROVED_PRICES_MINOR = {
  EG: {
    currencyCode: "EGP",
    pro: { month: 16900, year: 169000 },
    pro_plus: { month: 30900, year: 309000 },
  },
  INTL: {
    currencyCode: "USD",
    pro: { month: 699, year: 6990 },
    pro_plus: { month: 1299, year: 12990 },
  },
} as const;

/**
 * Fail-closed guard asserting the abolition of the automatic 14-day trial:
 * the free plan must not seed an automatic AI trial window or quota.
 */
export function assertNoAutomaticTrialDefaults(): void {
  const free = PLAN_ENTITLEMENT_DEFAULTS.free;
  if (free.assistantRuntimePeriodDays !== null) {
    throw new Error("AUTOMATIC_TRIAL_FORBIDDEN:period_days");
  }
  if (free.assistantRuntimePeriodQuota) {
    throw new Error("AUTOMATIC_TRIAL_FORBIDDEN:period_quota");
  }
  if (free.assistantRuntimeGeneralMonthlyQuota) {
    throw new Error("AUTOMATIC_TRIAL_FORBIDDEN:general_quota");
  }
}
