/** Approved Kids catalogue. Quotes only: no payment or entitlement is created here. */
export const KIDS_FAMILY_POLICY = {
  maxProfiles: 3,
  adultPlanRequired: false,
  bundleDiscountPercent: 10,
  retentionDaysAfterExpiry: 90,
  deletionNoticeDays: 14,
  deletionNoticeChannel: "email",
  guardianApprovalMode: "automatic-after-verification-and-consent",
} as const;

export const KIDS_PRICES_MINOR = {
  EG: { currency: "EGP", month: 19900, year: 199000 },
  INTL: { currency: "USD", month: 799, year: 7990 },
} as const;

export function quoteKidsFamily(
  market: keyof typeof KIDS_PRICES_MINOR,
  interval: "month" | "year",
  adultPlan: "free" | "pro" | "pro_plus" | null = null,
) {
  const prices = KIDS_PRICES_MINOR[market];
  const baseMinor = prices[interval];
  const eligible = adultPlan === "pro" || adultPlan === "pro_plus";
  // Round the final Kids amount half-up to the currency's minor unit.
  const totalMinor = eligible ? Math.floor((baseMinor * 90 + 50) / 100) : baseMinor;
  return {
    currency: prices.currency,
    baseMinor,
    totalMinor,
    discountMinor: baseMinor - totalMinor,
    taxIncluded: false,
  };
}

type RetentionInput = {
  now: number;
  /** Expiry of the latest paid Kids entitlement; null means never subscribed. */
  latestPaidExpiry: number | null;
  /** A delivered notice must reference this exact expiry, not an earlier term. */
  deliveredNotice: { expiry: number; deliveredAt: number } | null;
};

/** Read-only policy evaluation. No deletion, scheduler or notification side effects. */
export function evaluateKidsRetention(input: RetentionInput) {
  const { now, latestPaidExpiry: expiry, deliveredNotice: notice } = input;
  if (!Number.isFinite(now) || (expiry !== null && !Number.isFinite(expiry))) {
    return { status: "invalid" as const, dueAt: null };
  }
  if (expiry === null) return { status: "not-applicable" as const, dueAt: null };
  const dueAt = expiry + KIDS_FAMILY_POLICY.retentionDaysAfterExpiry * 86400000;
  const noticeDueAt = dueAt - KIDS_FAMILY_POLICY.deletionNoticeDays * 86400000;
  if (!Number.isFinite(dueAt)) return { status: "invalid" as const, dueAt: null };
  if (now < expiry) return { status: "active" as const, dueAt, noticeDueAt };
  if (
    !notice ||
    notice.expiry !== expiry ||
    !Number.isFinite(notice.deliveredAt) ||
    notice.deliveredAt < expiry ||
    notice.deliveredAt > now
  ) {
    return {
      status: now < noticeDueAt ? ("retained" as const) : ("awaiting-notice" as const),
      dueAt,
      noticeDueAt,
    };
  }
  const deleteAfter = Math.max(
    dueAt,
    notice.deliveredAt + KIDS_FAMILY_POLICY.deletionNoticeDays * 86400000,
  );
  return {
    status: now < deleteAfter ? ("retained" as const) : ("eligible-for-deletion" as const),
    dueAt,
    noticeDueAt,
    deleteAfter,
  };
}
