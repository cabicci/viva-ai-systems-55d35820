import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildEntitlementSnapshot,
  evaluateAccess,
} from "@/lib/billing";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const CLOSURE_MIGRATION =
  "supabase/migrations/20260714173000_billing_launch_closure_rpc_hardening.sql";

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

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

describe("billing launch closure SQL hardening", () => {
  const closureSql = readRepoFile(CLOSURE_MIGRATION);

  it("aligns evaluate_access with video, builder, rag, and quota contracts", () => {
    expect(closureSql).toContain("p_resource_type = 'video'");
    expect(closureSql).toContain("video_access");
    expect(closureSql).toContain("rag_allowed_lesson_ids");
    expect(closureSql).toContain("builder_access");
    expect(closureSql).toContain("AI_QUOTA_EXCEEDED");
    expect(closureSql).toContain("free_active");
    expect(closureSql).not.toMatch(/assistant_runtime[\s\S]{0,120}v_allowed := true;/);
  });

  it("enforces quota before reserve_ai_quota insert", () => {
    expect(closureSql).toMatch(
      /reserve_ai_quota[\s\S]*QUOTA_EXCEEDED[\s\S]*INSERT INTO billing\.ai_usage_ledger/,
    );
    expect(closureSql).toMatch(
      /reserve_ai_quota[\s\S]*p_units > v_remaining/,
    );
  });

  it("supports commit_ai_quota idempotent replay", () => {
    expect(closureSql).toMatch(
      /commit_ai_quota[\s\S]*idempotent_replay[\s\S]*status = 'committed'/,
    );
  });

  it("preserves service-role-only grants and hardened search_path", () => {
    expect(closureSql).toContain("IF NOT billing.is_service_role_caller() THEN");
    expect(closureSql).toContain("SET search_path = billing, public, pg_temp");
    expect(closureSql).toMatch(
      /GRANT EXECUTE ON FUNCTION billing\.evaluate_access\(uuid, text, text\) TO service_role/,
    );
    expect(closureSql).not.toMatch(
      /GRANT EXECUTE ON FUNCTION billing\.evaluate_access\(uuid, text, text\) TO authenticated/,
    );
  });
});

describe("billing launch closure entitlement parity", () => {
  it("denies video access when videoAccess is false", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "paid_active",
        policy: { ...basePolicy, videoAccess: false },
        entitledLessonIds: ["lesson-1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-02-01T00:00:00.000Z",
        paidActivationAt: "2026-01-01T00:00:00.000Z",
        entitlementActiveAt: "2026-01-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );

    expect(evaluateAccess(snapshot, "video", "lesson-1").allowed).toBe(false);
    expect(evaluateAccess(snapshot, "video", "lesson-1").denialReasonCode).toBe(
      "VIDEO_NOT_ENTITLED",
    );
  });

  it("denies assistant_runtime when remaining quota is zero", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "paid_active",
        policy: basePolicy,
        entitledLessonIds: ["lesson-1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-02-01T00:00:00.000Z",
        paidActivationAt: "2026-01-01T00:00:00.000Z",
        entitlementActiveAt: "2026-01-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
      },
      { usedGeneral: 272, usedPeriod: 0, aiTopupBalance: 0 },
    );

    expect(evaluateAccess(snapshot, "assistant_runtime").allowed).toBe(false);
    expect(evaluateAccess(snapshot, "assistant_runtime").denialReasonCode).toBe(
      "AI_QUOTA_EXCEEDED",
    );
  });

  it("allows free_active lesson access when paid_content_entitled is false in stored snapshot shape", () => {
    const snapshot = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "free",
        accessState: "free_active",
        policy: { ...basePolicy, lessonCountCap: 12 },
        entitledLessonIds: ["lesson-1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-02-01T00:00:00.000Z",
        paidActivationAt: null,
        entitlementActiveAt: null,
        cancelAtPeriodEnd: false,
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    snapshot.paidContentEntitled = false;

    expect(evaluateAccess(snapshot, "lesson", "lesson-1").allowed).toBe(true);
  });
});
