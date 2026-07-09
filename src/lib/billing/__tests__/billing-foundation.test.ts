import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import {
  PLAN_ENTITLEMENT_DEFAULTS,
  assertValidAccessTransition,
  buildEntitlementSnapshot,
  canTransitionAccessState,
  evaluateAccess,
  assertCouponIdentityUnique,
  applyReactivation,
  canRedeemCoupon,
  reserveAiQuota,
  commitAiQuota,
  releaseAiQuota,
  _resetQuotaStoreForTests,
  assertGatewayCapability,
  PAYMOB_EG_CAPABILITIES,
  selectRefundPolicyVersion,
  calculateAutoRefundEligibleAt,
  isDuplicateIdempotencyKey,
} from "@/lib/billing";

const basePolicy = {
  policyKey: "pro_v1",
  versionNumber: 1,
  lessonAllowlistMode: "explicit_list" as const,
  lessonIds: ["lesson-1"],
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

describe("subscription state machine", () => {
  it("allows valid transitions and rejects invalid ones", () => {
    expect(canTransitionAccessState("free_active", "paid_scheduled")).toBe(true);
    expect(canTransitionAccessState("free_active", "paid_active")).toBe(false);
    expect(() => assertValidAccessTransition("past_due", "paid_scheduled")).toThrow(
      /INVALID_STATE_TRANSITION/,
    );
  });
});

describe("entitlement evaluation", () => {
  it("denies paid content for past_due", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "past_due",
        policy: basePolicy,
        entitledLessonIds: ["lesson-1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-02-01T00:00:00.000Z",
        paidActivationAt: "2026-01-01T00:00:00.000Z",
        entitlementActiveAt: "2026-01-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        now: new Date("2026-01-15T00:00:00.000Z"),
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(snapshot.paidContentEntitled).toBe(false);
    expect(snapshot.denialReasonCode).toBe("PAST_DUE");
  });

  it("preserves access for canceled_at_period_end until period end", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "canceled_at_period_end",
        policy: basePolicy,
        entitledLessonIds: ["lesson-1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-02-01T00:00:00.000Z",
        paidActivationAt: "2026-01-01T00:00:00.000Z",
        entitlementActiveAt: "2026-01-01T00:00:00.000Z",
        cancelAtPeriodEnd: true,
        now: new Date("2026-01-15T00:00:00.000Z"),
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(snapshot.paidContentEntitled).toBe(true);
  });

  it("does not activate paid_scheduled before entitlement_active_at", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "paid_scheduled",
        policy: basePolicy,
        entitledLessonIds: ["lesson-1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-02-01T00:00:00.000Z",
        paidActivationAt: "2026-01-01T00:00:00.000Z",
        entitlementActiveAt: "2026-02-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        now: new Date("2026-01-15T00:00:00.000Z"),
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(snapshot.paidContentEntitled).toBe(false);
  });

  it("models Free, Pro, and Pro+ quota shapes", () => {
    expect(PLAN_ENTITLEMENT_DEFAULTS.free.assistantRuntimePeriodQuota).toBe(24);
    expect(PLAN_ENTITLEMENT_DEFAULTS.pro.assistantRuntimeGeneralMonthlyQuota).toBe(272);
    expect(PLAN_ENTITLEMENT_DEFAULTS.pro_plus.lessonCountCap).toBe(100);
  });

  it("fails closed when entitlement unavailable", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "suspended",
        policy: basePolicy,
        entitledLessonIds: [],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: null,
        paidActivationAt: null,
        entitlementActiveAt: null,
        cancelAtPeriodEnd: false,
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    const decision = evaluateAccess(snapshot, "lesson", "lesson-1");
    expect(decision.allowed).toBe(false);
    expect(decision.denialReasonCode).toBe("SUSPENDED");
  });
});

describe("coupon lifecycle", () => {
  it("enforces identity uniqueness and one-time reactivation", () => {
    const existing = [
      {
        id: "1",
        verifiedEmailHash: "email-hash",
        verifiedPhoneHash: null,
        status: "assigned" as const,
        reactivationApprovedAt: null,
      },
    ];
    expect(() =>
      assertCouponIdentityUnique(existing, "email-hash", null),
    ).toThrow(/COUPON_IDENTITY_ALREADY_ASSIGNED/);

    const expired = {
      id: "2",
      verifiedEmailHash: "other",
      verifiedPhoneHash: null,
      status: "expired_unused" as const,
      reactivationApprovedAt: null,
    };
    const reactivated = applyReactivation(expired);
    expect(reactivated.status).toBe("reactivated");
    expect(canRedeemCoupon(reactivated)).toBe(true);
    expect(() => applyReactivation(reactivated)).toThrow(/REACTIVATION_NOT_ALLOWED/);
  });
});

describe("credit separation and quota", () => {
  beforeEach(() => _resetQuotaStoreForTests());

  it("tracks AI quota reserve, commit, and release separately from monetary credits", () => {
    const reservation = reserveAiQuota({
      userId: "u1",
      units: 1,
      remaining: 5,
      idempotencyKey: "req:1",
    });
    expect(reservation.status).toBe("reserved");
    expect(commitAiQuota(reservation.reservationId).status).toBe("committed");

    const reservation2 = reserveAiQuota({
      userId: "u1",
      units: 1,
      remaining: 1,
      idempotencyKey: "req:2",
    });
    releaseAiQuota(reservation2.reservationId);
    expect(() => commitAiQuota(reservation2.reservationId)).toThrow(
      /RESERVATION_NOT_FOUND/,
    );
  });

  it("is idempotent for duplicate keys", () => {
    const first = reserveAiQuota({
      userId: "u1",
      units: 1,
      remaining: 3,
      idempotencyKey: "dup",
    });
    const second = reserveAiQuota({
      userId: "u1",
      units: 1,
      remaining: 3,
      idempotencyKey: "dup",
    });
    expect(second.reservationId).toBe(first.reservationId);
    expect(
      isDuplicateIdempotencyKey([{ idempotencyKey: "x" }], "x"),
    ).toBe(true);
  });
});

describe("refund policy and gateway capabilities", () => {
  it("selects latest refund policy version and computes 45-day eligibility", () => {
    const policy = selectRefundPolicyVersion(
      [
        { policyKey: "default", versionNumber: 1, unusedMonetaryCreditAutoRefundDays: 45, prorationMethod: "daily" },
        { policyKey: "default", versionNumber: 2, unusedMonetaryCreditAutoRefundDays: 45, prorationMethod: "daily" },
      ],
      "default",
    );
    expect(policy?.versionNumber).toBe(2);
    const created = new Date("2026-01-01T00:00:00.000Z");
    const eligible = calculateAutoRefundEligibleAt(created, policy!);
    expect(eligible.toISOString()).toBe("2026-02-15T00:00:00.000Z");
  });

  it("marks unsupported Paymob operations", () => {
    expect(() =>
      assertGatewayCapability(
        { gatewayCode: "paymob_eg", capabilities: PAYMOB_EG_CAPABILITIES },
        "issueRefund",
      ),
    ).toThrow(/OPERATION_NOT_SUPPORTED/);
  });
});

describe("RLS migration static assertions", () => {
  const root = resolve(process.cwd(), "supabase/migrations");
  const rlsSql = readFileSync(
    resolve(root, "20260709190100_billing_rls_policies.sql"),
    "utf8",
  );
  const schemaSql = readFileSync(
    resolve(root, "20260709190000_billing_schema_phase1.sql"),
    "utf8",
  );

  const requiredTables = [
    "billing.subscriptions",
    "billing.subscription_events",
    "billing.payment_transactions",
    "billing.refunds",
    "billing.monetary_credit_ledger",
    "billing.ai_credit_ledger",
    "billing.webhook_events",
    "billing.billing_audit_log",
    "billing.outbox_events",
  ];

  it("enables RLS on required billing tables", () => {
    for (const table of requiredTables) {
      expect(rlsSql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  it("revokes broad client table access", () => {
    expect(rlsSql).toContain(
      "REVOKE ALL ON ALL TABLES IN SCHEMA billing FROM anon, authenticated",
    );
  });

  it("does not grant authenticated write policies on sensitive tables", () => {
    expect(rlsSql).not.toMatch(
      /CREATE POLICY[\s\S]*billing\.subscriptions[\s\S]*FOR INSERT TO authenticated/,
    );
    expect(rlsSql).not.toMatch(
      /CREATE POLICY[\s\S]*billing\.payment_transactions[\s\S]*FOR INSERT TO authenticated/,
    );
  });

  it("drafts coupon identity partial unique indexes", () => {
    expect(schemaSql).toContain("coupon_assignments_email_identity_unique");
    expect(schemaSql).toContain("coupon_assignments_phone_identity_unique");
  });
});
