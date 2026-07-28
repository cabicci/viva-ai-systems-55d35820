import { describe, expect, it } from "vitest";
import {
  PLAN_ENTITLEMENT_DEFAULTS,
  buildEntitlementSnapshot,
  evaluateAccess,
  hasActiveAdminGrant,
  ADMIN_ACCESS_GRANT_HOURS,
  extendAdminGrantExpiry,
  canRedeemAdminCoupon,
  isAdminGrantActive,
  shouldReactivateAfterRefund,
  nextReservationStatus,
  canConsumePurchaseReservation,
  canReleasePurchaseReservation,
  maxRefundableMinor,
  allocateRefundTaxMinor,
  APPROVED_PRICES_MINOR,
  assertNoAutomaticTrialDefaults,
  mapLedgerCategoryToQuotaBucket,
  canReleaseReservation,
  FIRST_ATTEMPT_INDEX,
  CHAT4_RPC,
  CHAT4_SEQUENCE,
  type EntitlementPolicy,
  type SubscriptionContext,
} from "@/lib/billing";

const freePolicy: EntitlementPolicy = {
  policyKey: "free_v1",
  versionNumber: 1,
  lessonAllowlistMode: "curriculum_snapshot",
  lessonIds: [],
  lessonCountCap: 12,
  builderAccess: false,
  videoAccess: false,
  ragEnabled: false,
  assistantRuntimePerLessonQuota: null,
  assistantRuntimeGeneralMonthlyQuota: null,
  assistantRuntimePeriodQuota: null,
  assistantRuntimePeriodDays: null,
  missionEvaluationEnabled: false,
  revealAnswerEnabled: false,
  wowPathEnabled: false,
};

const paidPolicy: EntitlementPolicy = {
  policyKey: "pro_v1",
  versionNumber: 1,
  lessonAllowlistMode: "curriculum_snapshot",
  lessonIds: [],
  lessonCountCap: 74,
  builderAccess: true,
  videoAccess: true,
  ragEnabled: true,
  assistantRuntimePerLessonQuota: null,
  assistantRuntimeGeneralMonthlyQuota: 272,
  assistantRuntimePeriodQuota: null,
  assistantRuntimePeriodDays: null,
  missionEvaluationEnabled: true,
  revealAnswerEnabled: true,
  wowPathEnabled: true,
};

function ctx(overrides: Partial<SubscriptionContext>): SubscriptionContext {
  return {
    userId: "u1",
    planKey: "free",
    accessState: "free_active",
    policy: freePolicy,
    entitledLessonIds: [],
    periodStart: "2026-01-01T00:00:00.000Z",
    periodEnd: null,
    paidActivationAt: null,
    entitlementActiveAt: null,
    cancelAtPeriodEnd: false,
    now: new Date("2026-01-15T00:00:00.000Z"),
    ...overrides,
  };
}

describe("V3 — no automatic 14-day trial", () => {
  it("free plan defaults grant no automatic AI trial window", () => {
    expect(PLAN_ENTITLEMENT_DEFAULTS.free.assistantRuntimePeriodDays).toBeNull();
    expect(PLAN_ENTITLEMENT_DEFAULTS.free.assistantRuntimePeriodQuota).toBeNull();
    expect(PLAN_ENTITLEMENT_DEFAULTS.free.assistantRuntimeGeneralMonthlyQuota).toBeNull();
  });

  it("keeps paid plan quotas intact", () => {
    expect(PLAN_ENTITLEMENT_DEFAULTS.pro.assistantRuntimeGeneralMonthlyQuota).toBe(272);
    expect(PLAN_ENTITLEMENT_DEFAULTS.pro_plus.assistantRuntimeGeneralMonthlyQuota).toBe(750);
  });

  it("assertNoAutomaticTrialDefaults does not throw", () => {
    expect(() => assertNoAutomaticTrialDefaults()).not.toThrow();
  });
});

describe("V3 — evaluateAccess: free_active is not full access", () => {
  const snapshot = buildEntitlementSnapshot(ctx({ entitledLessonIds: ["pub-1", "pub-2"] }), {
    usedGeneral: 0,
    usedPeriod: 0,
    aiTopupBalance: 0,
  });

  it("does not confer paid content entitlement", () => {
    expect(snapshot.paidContentEntitled).toBe(false);
  });

  it("still allows explicitly public lessons", () => {
    expect(evaluateAccess(snapshot, "lesson", "pub-1").allowed).toBe(true);
    expect(evaluateAccess(snapshot, "lesson", "not-public").allowed).toBe(false);
  });

  it("denies builder / assistant / rag for free_active", () => {
    expect(evaluateAccess(snapshot, "builder").allowed).toBe(false);
    expect(evaluateAccess(snapshot, "assistant_runtime").allowed).toBe(false);
    expect(evaluateAccess(snapshot, "rag", "pub-1").allowed).toBe(false);
  });
});

describe("V3 — admin grant confers full learner entitlement", () => {
  it("treats an active admin grant as full access without changing state", () => {
    const snapshot = buildEntitlementSnapshot(
      ctx({
        policy: paidPolicy,
        entitledLessonIds: ["l-1"],
        adminGrantExpiresAt: "2026-02-01T00:00:00.000Z",
      }),
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(snapshot.accessState).toBe("free_active");
    expect(snapshot.paidContentEntitled).toBe(true);
    expect(evaluateAccess(snapshot, "builder").allowed).toBe(true);
    expect(evaluateAccess(snapshot, "lesson", "l-1").allowed).toBe(true);
  });

  it("assistant_runtime still requires remaining quota under an admin grant", () => {
    // The AI quota axis derives from the plan defaults in this snapshot model
    // (the admin-grant AI limit is resolved server-side); a plan with quota
    // allows assistant_runtime, a plan without quota fails closed.
    const withQuota = buildEntitlementSnapshot(
      ctx({
        planKey: "pro",
        policy: paidPolicy,
        adminGrantExpiresAt: "2026-02-01T00:00:00.000Z",
      }),
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(evaluateAccess(withQuota, "assistant_runtime").allowed).toBe(true);

    const noQuota = buildEntitlementSnapshot(
      ctx({
        planKey: "free",
        policy: paidPolicy,
        adminGrantExpiresAt: "2026-02-01T00:00:00.000Z",
      }),
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(evaluateAccess(noQuota, "assistant_runtime").allowed).toBe(false);
  });

  it("ignores an expired admin grant", () => {
    const snapshot = buildEntitlementSnapshot(
      ctx({
        policy: paidPolicy,
        adminGrantExpiresAt: "2026-01-01T00:00:00.000Z",
      }),
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(snapshot.paidContentEntitled).toBe(false);
  });

  it("hasActiveAdminGrant compares against now", () => {
    const now = new Date("2026-01-15T00:00:00.000Z");
    expect(hasActiveAdminGrant("2026-01-16T00:00:00.000Z", now)).toBe(true);
    expect(hasActiveAdminGrant("2026-01-14T00:00:00.000Z", now)).toBe(false);
    expect(hasActiveAdminGrant(null, now)).toBe(false);
  });
});

describe("V3 — admin access grant extension formula", () => {
  it("adds 72h to now when there is no current grant", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(extendAdminGrantExpiry(now, null).toISOString()).toBe("2026-01-04T00:00:00.000Z");
    expect(ADMIN_ACCESS_GRANT_HOURS).toBe(72);
  });

  it("stacks onto a still-active grant", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const current = new Date("2026-01-03T00:00:00.000Z");
    expect(extendAdminGrantExpiry(now, current).toISOString()).toBe("2026-01-06T00:00:00.000Z");
  });

  it("uses now when the current grant already expired", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const current = new Date("2026-01-01T00:00:00.000Z");
    expect(extendAdminGrantExpiry(now, current).toISOString()).toBe("2026-01-13T00:00:00.000Z");
  });

  it("gates redemption to the intended, active coupon", () => {
    const now = new Date("2026-01-15T00:00:00.000Z");
    expect(
      canRedeemAdminCoupon({ intendedUserId: "u1", status: "active", expiresAt: null }, "u1", now),
    ).toBe(true);
    expect(
      canRedeemAdminCoupon({ intendedUserId: "u1", status: "active", expiresAt: null }, "u2", now),
    ).toBe(false);
    expect(
      canRedeemAdminCoupon(
        { intendedUserId: "u1", status: "redeemed", expiresAt: null },
        "u1",
        now,
      ),
    ).toBe(false);
    expect(
      canRedeemAdminCoupon(
        {
          intendedUserId: "u1",
          status: "active",
          expiresAt: "2026-01-01T00:00:00.000Z",
        },
        "u1",
        now,
      ),
    ).toBe(false);
  });

  it("isAdminGrantActive honors status and expiry", () => {
    const now = new Date("2026-01-15T00:00:00.000Z");
    expect(
      isAdminGrantActive({ status: "active", expiresAt: "2026-01-16T00:00:00.000Z" }, now),
    ).toBe(true);
    expect(
      isAdminGrantActive({ status: "revoked", expiresAt: "2026-01-16T00:00:00.000Z" }, now),
    ).toBe(false);
  });
});

describe("V3 — purchase coupon state machine (no reactivation)", () => {
  it("never reactivates after a refund", () => {
    expect(shouldReactivateAfterRefund()).toBe(false);
  });

  it("only consumes/releases a reserved reservation", () => {
    expect(canConsumePurchaseReservation("reserved")).toBe(true);
    expect(canConsumePurchaseReservation("released")).toBe(false);
    expect(canReleasePurchaseReservation("reserved")).toBe(true);
    expect(canReleasePurchaseReservation("consumed")).toBe(false);
  });

  it("transitions deterministically and blocks consumed release", () => {
    expect(nextReservationStatus("reserved", "consume")).toBe("consumed");
    expect(nextReservationStatus("reserved", "release")).toBe("released");
    expect(nextReservationStatus("consumed", "consume")).toBe("consumed");
    expect(nextReservationStatus("released", "release")).toBe("released");
    expect(() => nextReservationStatus("consumed", "release")).toThrow(/CANNOT_RELEASE/);
    expect(() => nextReservationStatus("released", "consume")).toThrow(/CANNOT_CONSUME/);
  });
});

describe("V3 — refund math (integer minor units, proportional tax)", () => {
  it("computes max refundable as gross minus prior consuming refunds", () => {
    expect(maxRefundableMinor(10000, 3000)).toBe(7000);
    expect(maxRefundableMinor(10000, 10000)).toBe(0);
    expect(maxRefundableMinor(10000, 12000)).toBe(0);
  });

  it("allocates proportional tax and hands the remainder to the final refund", () => {
    const first = allocateRefundTaxMinor({
      originalTaxMinor: 1400,
      originalGrossMinor: 10000,
      refundMinor: 3000,
      isFinalRefund: false,
      alreadyRefundedTaxMinor: 0,
    });
    expect(first).toBe(420);

    const final = allocateRefundTaxMinor({
      originalTaxMinor: 1400,
      originalGrossMinor: 10000,
      refundMinor: 7000,
      isFinalRefund: true,
      alreadyRefundedTaxMinor: 420,
    });
    expect(final).toBe(980);
    expect(first + final).toBe(1400);
  });

  it("floors proportional tax and never returns negative", () => {
    expect(
      allocateRefundTaxMinor({
        originalTaxMinor: 1400,
        originalGrossMinor: 3,
        refundMinor: 1,
        isFinalRefund: false,
        alreadyRefundedTaxMinor: 0,
      }),
    ).toBe(466);
    expect(
      allocateRefundTaxMinor({
        originalTaxMinor: 100,
        originalGrossMinor: 0,
        refundMinor: 1,
        isFinalRefund: false,
        alreadyRefundedTaxMinor: 0,
      }),
    ).toBe(0);
  });
});

describe("V3 — catalogue prices", () => {
  it("exposes the contract-approved EG (EGP) prices", () => {
    expect(APPROVED_PRICES_MINOR.EG.currencyCode).toBe("EGP");
    expect(APPROVED_PRICES_MINOR.EG.pro.month).toBe(16900);
    expect(APPROVED_PRICES_MINOR.EG.pro.year).toBe(169000);
    expect(APPROVED_PRICES_MINOR.EG.pro_plus.month).toBe(30900);
    expect(APPROVED_PRICES_MINOR.EG.pro_plus.year).toBe(309000);
  });

  it("exposes the contract-approved INTL (USD) prices", () => {
    expect(APPROVED_PRICES_MINOR.INTL.currencyCode).toBe("USD");
    expect(APPROVED_PRICES_MINOR.INTL.pro.month).toBe(699);
    expect(APPROVED_PRICES_MINOR.INTL.pro.year).toBe(6990);
    expect(APPROVED_PRICES_MINOR.INTL.pro_plus.month).toBe(1299);
    expect(APPROVED_PRICES_MINOR.INTL.pro_plus.year).toBe(12990);
  });
});

describe("V3 — AI quota bucket mapping and release rules", () => {
  it("maps AI-consuming categories to ai_assistant", () => {
    expect(mapLedgerCategoryToQuotaBucket("assistant_runtime")).toBe("ai_assistant");
    expect(mapLedgerCategoryToQuotaBucket("mission_evaluation")).toBe("ai_assistant");
    expect(mapLedgerCategoryToQuotaBucket("reveal_answer")).toBe("ai_assistant");
    expect(mapLedgerCategoryToQuotaBucket("wow_path")).toBe("ai_assistant");
  });

  it("rejects unsupported categories", () => {
    expect(() => mapLedgerCategoryToQuotaBucket("embeddings")).toThrow(
      /QUOTA_CATEGORY_UNSUPPORTED/,
    );
  });

  it("releases only when reserved and provider never began", () => {
    expect(canReleaseReservation({ status: "reserved", providerStartedAt: null })).toBe(true);
    expect(
      canReleaseReservation({
        status: "reserved",
        providerStartedAt: "2026-01-15T00:00:00.000Z",
      }),
    ).toBe(false);
    expect(canReleaseReservation({ status: "committed", providerStartedAt: null })).toBe(false);
  });

  it("starts provider attempts at index 1", () => {
    expect(FIRST_ATTEMPT_INDEX).toBe(1);
  });
});

describe("V3 — Chat 4 connection contract shape", () => {
  it("exposes the canonical service-role public-wrapper RPC names", () => {
    expect(CHAT4_RPC.reserve).toBe("public.reserve_learner_ai_access");
    expect(CHAT4_RPC.registerProviderAttempt).toBe("public.register_provider_attempt");
    expect(CHAT4_RPC.finalizeProviderAttempt).toBe("public.finalize_provider_attempt");
    expect(CHAT4_RPC.commit).toBe("public.commit_ai_quota");
    expect(CHAT4_RPC.release).toBe("public.release_ai_quota");
  });

  it("documents the reserve -> commit -> release sequence", () => {
    expect(CHAT4_SEQUENCE[0]).toBe("reserve");
    expect(CHAT4_SEQUENCE).toContain("register_provider_attempt_1");
    expect(CHAT4_SEQUENCE).toContain("commit_once");
    expect(CHAT4_SEQUENCE).toContain("release_only_if_provider_never_began");
  });
});
