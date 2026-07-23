import type {
  AccessState,
  DenialReasonCode,
  EntitlementPolicy,
  EntitlementSnapshot,
  PlanKey,
} from "../types";
import { PLAN_ENTITLEMENT_DEFAULTS } from "../types";

export interface SubscriptionContext {
  userId: string;
  planKey: PlanKey;
  accessState: AccessState;
  policy: EntitlementPolicy;
  entitledLessonIds: string[];
  periodStart: string;
  periodEnd: string | null;
  paidActivationAt: string | null;
  entitlementActiveAt: string | null;
  cancelAtPeriodEnd: boolean;
  /**
   * Expiry of an active admin 72h access grant, if any. When the grant is
   * active (expiresAt > now) the user receives full learner entitlement for
   * paid-content evaluation WITHOUT mutating the subscription access state.
   */
  adminGrantExpiresAt?: string | null;
  now?: Date;
}

export function hasActiveAdminGrant(
  adminGrantExpiresAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!adminGrantExpiresAt) return false;
  return new Date(adminGrantExpiresAt) > now;
}

const NO_PAID_ACCESS_STATES: ReadonlySet<AccessState> = new Set([
  "free_pending_verification",
  "free_expired",
  "past_due",
  "refund_pending",
  "refunded",
  "expired",
  "suspended",
]);

export function resolvePaidContentEntitled(ctx: SubscriptionContext): {
  entitled: boolean;
  denial: DenialReasonCode | null;
} {
  const now = ctx.now ?? new Date();

  // An active admin grant confers full learner entitlement regardless of the
  // subscription access state (state itself is left untouched).
  if (hasActiveAdminGrant(ctx.adminGrantExpiresAt, now)) {
    return { entitled: true, denial: null };
  }

  // V3: free_active is NOT full paid access. Public lessons are gated by the
  // separate public allowlist (see buildEntitlementSnapshot); paid content is
  // denied here without a hard error code.
  if (ctx.accessState === "free_active") {
    return { entitled: false, denial: null };
  }

  if (ctx.accessState === "paid_scheduled") {
    const activationAt = ctx.entitlementActiveAt ?? ctx.paidActivationAt;
    if (activationAt && new Date(activationAt) > now) {
      return { entitled: false, denial: "SUBSCRIPTION_NOT_ACTIVE" };
    }
  }

  if (ctx.accessState === "past_due") {
    return { entitled: false, denial: "PAST_DUE" };
  }

  if (ctx.accessState === "canceled_at_period_end") {
    if (ctx.periodEnd && new Date(ctx.periodEnd) >= now) {
      return { entitled: true, denial: null };
    }
    return { entitled: false, denial: "PERIOD_ENDED" };
  }

  if (NO_PAID_ACCESS_STATES.has(ctx.accessState)) {
    const denial: DenialReasonCode =
      ctx.accessState === "free_pending_verification"
        ? "IDENTITY_NOT_VERIFIED"
        : ctx.accessState === "refunded"
          ? "REFUNDED"
          : ctx.accessState === "suspended"
            ? "SUSPENDED"
            : "SUBSCRIPTION_NOT_ACTIVE";
    return { entitled: false, denial };
  }

  if (ctx.accessState === "paid_active") {
    return { entitled: true, denial: null };
  }

  return { entitled: false, denial: "ENTITLEMENT_UNAVAILABLE" };
}

export function buildEntitlementSnapshot(
  ctx: SubscriptionContext,
  usage: { usedGeneral: number; usedPeriod: number; aiTopupBalance: number },
): EntitlementSnapshot {
  const now = ctx.now ?? new Date();
  const paid = resolvePaidContentEntitled(ctx);
  const defaults = PLAN_ENTITLEMENT_DEFAULTS[ctx.planKey];
  // Paid/admin-grant users get the full entitled set; free_active users get the
  // limited public catalogue capped by the free lesson_count_cap.
  const exposeLessons = paid.entitled || ctx.accessState === "free_active";
  const lessonIds = exposeLessons
    ? ctx.entitledLessonIds.slice(0, defaults.lessonCountCap ?? undefined)
    : [];

  const generalQuota = defaults.assistantRuntimeGeneralMonthlyQuota;
  const periodQuota = defaults.assistantRuntimePeriodQuota;

  return {
    userId: ctx.userId,
    planKey: ctx.planKey,
    planVersionId: null,
    entitlementPolicyVersionId: null,
    accessState: ctx.accessState,
    effectivePeriod: { start: ctx.periodStart, end: ctx.periodEnd },
    lessons: {
      entitledLessonIds: lessonIds,
      entitledLessonCount: lessonIds.length,
      mode: ctx.policy.lessonAllowlistMode,
    },
    builderAccess: paid.entitled && ctx.policy.builderAccess,
    videoAccess: paid.entitled && ctx.policy.videoAccess,
    ragAllowedLessonIds: paid.entitled && ctx.policy.ragEnabled ? lessonIds : [],
    assistantRuntime: {
      perLessonQuota: ctx.policy.assistantRuntimePerLessonQuota,
      generalMonthlyQuota: generalQuota,
      periodQuota,
      periodDays: defaults.assistantRuntimePeriodDays,
      usedGeneral: usage.usedGeneral,
      usedPeriod: usage.usedPeriod,
      remainingGeneral: Math.max(0, (generalQuota ?? 0) - usage.usedGeneral),
      remainingPeriod: Math.max(0, (periodQuota ?? 0) - usage.usedPeriod),
    },
    aiTopupBalanceUnits: usage.aiTopupBalance,
    missionEvaluationEligible: paid.entitled && ctx.policy.missionEvaluationEnabled,
    revealAnswerEligible: paid.entitled && ctx.policy.revealAnswerEnabled,
    wowPathEligible: paid.entitled && ctx.policy.wowPathEnabled,
    market: { marketCode: "INTL", currencyCode: "USD", localeDisplay: "en-US" },
    paidContentEntitled: paid.entitled,
    denialReasonCode: paid.denial,
    snapshotVersion: 1,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60_000).toISOString(),
  };
}

export function evaluateAccess(
  snapshot: EntitlementSnapshot,
  resourceType: "lesson" | "video" | "builder" | "rag" | "assistant_runtime",
  resourceId?: string,
): { allowed: boolean; denialReasonCode: DenialReasonCode | null } {
  // Lessons may be reachable via the public free catalogue even without full
  // paid entitlement, so consult the entitled/public id set first.
  if (resourceType === "lesson" && resourceId) {
    const allowed = snapshot.lessons.entitledLessonIds.includes(resourceId);
    return {
      allowed,
      denialReasonCode: allowed ? null : (snapshot.denialReasonCode ?? "LESSON_NOT_ENTITLED"),
    };
  }

  // Every other resource requires full paid-content entitlement (paid OR an
  // active admin grant). free_active is not full access.
  if (!snapshot.paidContentEntitled) {
    return {
      allowed: false,
      denialReasonCode: snapshot.denialReasonCode ?? "ENTITLEMENT_UNAVAILABLE",
    };
  }

  if (resourceType === "video") {
    const allowed =
      snapshot.videoAccess && (!resourceId || snapshot.ragAllowedLessonIds.includes(resourceId));
    return {
      allowed,
      denialReasonCode: allowed ? null : "VIDEO_NOT_ENTITLED",
    };
  }

  if (resourceType === "rag" && resourceId) {
    const allowed = snapshot.ragAllowedLessonIds.includes(resourceId);
    return {
      allowed,
      denialReasonCode: allowed ? null : "RAG_NOT_ENTITLED",
    };
  }

  if (resourceType === "builder") {
    return {
      allowed: snapshot.builderAccess,
      denialReasonCode: snapshot.builderAccess ? null : "BUILDER_NOT_ENTITLED",
    };
  }

  if (resourceType === "assistant_runtime") {
    const remaining =
      snapshot.assistantRuntime.remainingGeneral +
      snapshot.assistantRuntime.remainingPeriod +
      snapshot.aiTopupBalanceUnits;
    return {
      allowed: remaining > 0,
      denialReasonCode: remaining > 0 ? null : "AI_QUOTA_EXCEEDED",
    };
  }

  return { allowed: false, denialReasonCode: "ENTITLEMENT_UNAVAILABLE" };
}
