export type PlanKey = "free" | "pro" | "pro_plus";

export type AccessState =
  | "free_pending_verification"
  | "free_active"
  | "free_expired"
  | "paid_scheduled"
  | "paid_active"
  | "past_due"
  | "canceled_at_period_end"
  | "expired"
  | "refund_pending"
  | "refunded"
  | "suspended";

export type DenialReasonCode =
  | "IDENTITY_NOT_VERIFIED"
  | "FREE_PERIOD_EXPIRED"
  | "FREE_ALREADY_CONSUMED"
  | "SUBSCRIPTION_NOT_ACTIVE"
  | "PAST_DUE"
  | "CANCELED_AT_PERIOD_END"
  | "PERIOD_ENDED"
  | "REFUNDED"
  | "SUSPENDED"
  | "LESSON_NOT_ENTITLED"
  | "BUILDER_NOT_ENTITLED"
  | "VIDEO_NOT_ENTITLED"
  | "RAG_NOT_ENTITLED"
  | "AI_QUOTA_EXCEEDED"
  | "AI_TOPUP_INSUFFICIENT"
  | "AI_ACCESS_DENIED"
  | "ADMIN_GRANT_REQUIRED"
  | "MISSION_EVALUATION_NOT_ENTITLED"
  | "REVEAL_ANSWER_NOT_ENTITLED"
  | "WOW_PATH_NOT_ENTITLED"
  | "ENTITLEMENT_UNAVAILABLE";

export type BillingErrorCode =
  | "SUBSCRIPTION_NOT_FOUND"
  | "INVALID_STATE_TRANSITION"
  | "DUPLICATE_EVENT"
  | "QUOTA_EXCEEDED"
  | "RESERVATION_NOT_FOUND"
  | "INSUFFICIENT_MONETARY_CREDIT"
  | "INSUFFICIENT_AI_CREDIT"
  | "COUPON_IDENTITY_ALREADY_ASSIGNED"
  | "COUPON_ALREADY_REDEEMED"
  | "COUPON_EXPIRED"
  | "ADMIN_COUPON_INVALID"
  | "REACTIVATION_NOT_ALLOWED"
  | "GATEWAY_NOT_SUPPORTED"
  | "OPERATION_NOT_SUPPORTED"
  | "ENTITLEMENT_UNAVAILABLE";

/** Canonical AI quota bucket. All AI-consuming categories map here. */
export type QuotaBucket = "ai_assistant";

/** Admin 72-hour access grant lifecycle (mirrors billing.admin_access_grants). */
export type AdminAccessGrantStatus = "active" | "expired" | "revoked";

/** Admin access coupon lifecycle (mirrors billing.admin_access_coupons). */
export type AdminAccessCouponStatus = "active" | "redeemed" | "revoked" | "expired";

export interface AdminAccessGrant {
  userId: string;
  status: AdminAccessGrantStatus;
  startsAt: string;
  expiresAt: string;
}

export interface AdminAccessCoupon {
  intendedUserId: string;
  status: AdminAccessCouponStatus;
  /** Optional coupon validity window; null means no window. */
  expiresAt: string | null;
}

/** Purchase-discount coupon reservation lifecycle. */
export type PurchaseCouponReservationStatus = "reserved" | "consumed" | "released";

export interface EntitlementPolicy {
  policyKey: string;
  versionNumber: number;
  lessonAllowlistMode: "explicit_list" | "curriculum_snapshot";
  lessonIds: string[];
  lessonCountCap: number | null;
  builderAccess: boolean;
  videoAccess: boolean;
  ragEnabled: boolean;
  assistantRuntimePerLessonQuota: number | null;
  assistantRuntimeGeneralMonthlyQuota: number | null;
  assistantRuntimePeriodQuota: number | null;
  assistantRuntimePeriodDays: number | null;
  missionEvaluationEnabled: boolean;
  revealAnswerEnabled: boolean;
  wowPathEnabled: boolean;
}

export interface EntitlementSnapshot {
  userId: string;
  planKey: PlanKey;
  planVersionId: string | null;
  entitlementPolicyVersionId: string | null;
  accessState: AccessState;
  effectivePeriod: { start: string; end: string | null };
  lessons: {
    entitledLessonIds: string[];
    entitledLessonCount: number;
    mode: "explicit_list" | "curriculum_snapshot";
  };
  builderAccess: boolean;
  videoAccess: boolean;
  ragAllowedLessonIds: string[];
  assistantRuntime: {
    perLessonQuota: number | null;
    generalMonthlyQuota: number | null;
    periodQuota: number | null;
    periodDays: number | null;
    usedGeneral: number;
    usedPeriod: number;
    remainingGeneral: number;
    remainingPeriod: number;
  };
  aiTopupBalanceUnits: number;
  missionEvaluationEligible: boolean;
  revealAnswerEligible: boolean;
  wowPathEligible: boolean;
  market: { marketCode: string; currencyCode: string; localeDisplay: string };
  paidContentEntitled: boolean;
  denialReasonCode: DenialReasonCode | null;
  snapshotVersion: number;
  generatedAt: string;
  expiresAt: string;
}

export const PLAN_ENTITLEMENT_DEFAULTS: Record<
  PlanKey,
  Pick<
    EntitlementPolicy,
    | "lessonCountCap"
    | "assistantRuntimeGeneralMonthlyQuota"
    | "assistantRuntimePeriodQuota"
    | "assistantRuntimePeriodDays"
  >
> = {
  // V3: no automatic 14-day trial. Free grants a limited public catalogue only
  // and NO automatic AI quota — period days/quota are null (fail closed).
  free: {
    lessonCountCap: 12,
    assistantRuntimeGeneralMonthlyQuota: null,
    assistantRuntimePeriodQuota: null,
    assistantRuntimePeriodDays: null,
  },
  pro: {
    lessonCountCap: 74,
    assistantRuntimeGeneralMonthlyQuota: 272,
    assistantRuntimePeriodQuota: null,
    assistantRuntimePeriodDays: null,
  },
  pro_plus: {
    lessonCountCap: 100,
    assistantRuntimeGeneralMonthlyQuota: 750,
    assistantRuntimePeriodQuota: null,
    assistantRuntimePeriodDays: null,
  },
};
