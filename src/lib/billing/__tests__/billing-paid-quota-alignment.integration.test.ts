import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  disposableDbReady,
  psql,
  psqlAllowFail,
  psqlConcurrent,
} from "../../../../scripts/billing/disposable-db";

const ENABLED = process.env.BILLING_DISPOSABLE_DB === "1" && disposableDbReady();
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const MIGRATION = "supabase/migrations/20260915070000_billing_paid_ai_quota_alignment.sql";
const SERVICE = `SET LOCAL request.jwt.claims = '{"role":"service_role"}';`;
const USERS = {
  pro: "71000000-0000-0000-0000-000000000001",
  plus: "71000000-0000-0000-0000-000000000002",
  general: "71000000-0000-0000-0000-000000000003",
  release: "71000000-0000-0000-0000-000000000004",
  lifecycle: "71000000-0000-0000-0000-000000000005",
  stale: "71000000-0000-0000-0000-000000000006",
  concurrent: "71000000-0000-0000-0000-000000000007",
  lessonRace: "71000000-0000-0000-0000-000000000008",
  replayRace: "71000000-0000-0000-0000-000000000009",
  generalOnly: "71000000-0000-0000-0000-000000000010",
  free: "71000000-0000-0000-0000-000000000011",
  admin: "71000000-0000-0000-0000-000000000012",
  legacy: "71000000-0000-0000-0000-000000000013",
  staleStarted: "71000000-0000-0000-0000-000000000014",
} as const;

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function lastValue(output: string): string {
  return (
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !["BEGIN", "SET", "COMMIT", "ROLLBACK"].includes(line))
      .at(-1) ?? ""
  );
}

function tx(sql: string): string {
  return lastValue(psql(`BEGIN; ${SERVICE} ${sql}; COMMIT;`));
}

function txAllowFail(sql: string): { ok: boolean; out: string } {
  return psqlAllowFail(`BEGIN; ${SERVICE} ${sql}; COMMIT;`);
}

function seedCanonicalPaid(userId: string, planKey: "pro" | "pro_plus"): void {
  psql(`DELETE FROM billing.ai_usage_ledger WHERE user_id='${userId}'`);
  psql(`DELETE FROM billing.entitlement_usage WHERE user_id='${userId}'`);
  psql(`DELETE FROM billing.subscriptions WHERE user_id='${userId}'`);
  psql(`INSERT INTO billing.subscriptions (
      user_id, plan_version_id, access_state, billing_state,
      market_code, currency_code, billing_interval, idempotency_key,
      current_period_start, current_period_end
    )
    SELECT
      '${userId}', pv.id, 'paid_active', 'active',
      'INTL', 'USD', 'month', 'quota-align-${userId}',
      now(), now() + interval '30 days'
    FROM billing.plan_versions pv
    JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
    WHERE pc.plan_key='${planKey}'
      AND pv.billing_interval='month'
    ORDER BY pv.version_number
    LIMIT 1`);
}

let requestSequence = 0;
function nextUuid(): string {
  requestSequence += 1;
  return `72000000-0000-0000-0000-${requestSequence.toString().padStart(12, "0")}`;
}

function reserve(userId: string, lessonId: string | null, idem: string): Record<string, unknown> {
  const lesson = lessonId === null ? "NULL" : `'${lessonId}'`;
  const raw = tx(
    `SELECT billing.reserve_ai_quota(
      '${userId}', 'assistant_runtime', ${lesson},
      '${nextUuid()}', 1, '${idem}'
    )`,
  );
  return JSON.parse(raw) as Record<string, unknown>;
}

function counters(userId: string): string {
  return psql(`SELECT usage_category || ':' || COALESCE(lesson_id, '-') || ':' ||
      used_count || ':' || reserved_count || ':' || quota_limit
    FROM billing.entitlement_usage
    WHERE user_id='${userId}'
    ORDER BY usage_category, lesson_id NULLS FIRST`).trim();
}

describe("paid AI quota alignment — static contract", () => {
  const sql = readRepoFile(MIGRATION);

  it("publishes the approved 3/50 and 6/150 policy and resolves both scopes", () => {
    expect(sql).toContain("('pro'::text, 3::integer, 50::integer)");
    expect(sql).toContain("('pro_plus'::text, 6::integer, 150::integer)");
    expect(sql).toContain("FUNCTION billing.resolve_ai_assistant_limits");
    expect(sql).toContain("'remaining_general'");
    expect(sql).toContain("'remaining_lesson'");
    expect(sql).not.toContain("UPDATE billing.plan_versions");
    expect(sql).not.toContain("UPDATE billing.market_prices");
  });

  it("keeps public RPC signatures and mirrors lifecycle transitions to lesson counters", () => {
    const billingMigrations = readdirSync(path.join(REPO_ROOT, "supabase/migrations"))
      .filter((name) => name.endsWith(".sql") && name.includes("billing"))
      .sort();
    expect(billingMigrations.at(-1)).toBe("20260916183000_billing_pro_71_lesson_contract.sql");
    expect(sql).toContain("attempt_index = 0");
    expect(sql).toContain("lesson_quota_reserved");
    expect(sql).toContain("usage_category = 'assistant_runtime_per_lesson'");
    expect(sql).toContain("FUNCTION billing.reconcile_stale_ai_reservation");
    expect(sql).not.toContain("FUNCTION public.");
    const bridge = readRepoFile(
      "supabase/migrations/20260728140000_public_billing_rpc_bridge.sql",
    ).replace(/\r\n/g, "\n");
    expect(bridge).toContain("FUNCTION public.reserve_learner_ai_access(\n  p_user_id uuid,");
    expect(bridge).toContain(
      "FUNCTION public.register_provider_attempt(\n  p_reservation_id uuid,",
    );
  });
});

describe.skipIf(!ENABLED)("paid AI quota alignment — disposable DB", () => {
  beforeAll(() => {
    expect(psql("SELECT to_regnamespace('billing') IS NOT NULL").trim()).toBe("t");
  });

  it("resolves current canonical policies through old pinned plan versions", () => {
    seedCanonicalPaid(USERS.pro, "pro");
    seedCanonicalPaid(USERS.plus, "pro_plus");
    expect(
      tx(
        `SELECT general_monthly_limit || ':' || per_lesson_limit
         FROM billing.resolve_ai_assistant_limits('${USERS.pro}')`,
      ),
    ).toBe("50:3");
    expect(
      tx(
        `SELECT general_monthly_limit || ':' || per_lesson_limit
         FROM billing.resolve_ai_assistant_limits('${USERS.plus}')`,
      ),
    ).toBe("150:6");
    expect(
      psql(
        `SELECT count(*) FROM billing.entitlement_policy_versions
         WHERE policy_key IN ('pro','pro_plus') AND status='published'`,
      ).trim(),
    ).toBe("2");
    expect(
      psql(
        `SELECT count(*) FROM billing.entitlement_policy_versions
         WHERE policy_key IN ('pro','pro_plus') AND status='deprecated'
           AND effective_to IS NOT NULL`,
      ).trim(),
    ).toBe("4");
    expect(
      psql(`SELECT bool_and(
        (to_jsonb(current_policy) - ARRAY[
          'id','version_number','status','effective_from','effective_to',
          'created_at','published_at','published_by','policy_json',
          'lesson_count_cap','builder_access',
          'assistant_runtime_per_lesson_quota',
          'assistant_runtime_general_monthly_quota',
          'assistant_runtime_period_quota','assistant_runtime_period_days']) =
        (to_jsonb(previous_policy) - ARRAY[
          'id','version_number','status','effective_from','effective_to',
          'created_at','published_at','published_by','policy_json',
          'lesson_count_cap','builder_access',
          'assistant_runtime_per_lesson_quota',
          'assistant_runtime_general_monthly_quota',
          'assistant_runtime_period_quota','assistant_runtime_period_days']))
      FROM billing.entitlement_policy_versions current_policy
      JOIN billing.entitlement_policy_versions previous_policy
        ON previous_policy.policy_key=current_policy.policy_key
       AND previous_policy.version_number=1
      WHERE current_policy.policy_key IN ('pro','pro_plus')
        AND current_policy.status='published'`).trim(),
    ).toBe("t");
    const policyPublication = readRepoFile(MIGRATION).split(
      "CREATE OR REPLACE FUNCTION billing.resolve_ai_assistant_limits",
    )[0];
    const scheduled = psqlAllowFail(`BEGIN;
      INSERT INTO billing.entitlement_policy_versions
      SELECT (jsonb_populate_record(NULL::billing.entitlement_policy_versions,
        to_jsonb(epv) || jsonb_build_object('id',gen_random_uuid(),
          'version_number',900,'effective_from',now()+interval '1 day'))).*
      FROM billing.entitlement_policy_versions epv
      WHERE policy_key='pro' AND status='published';
      ${policyPublication} COMMIT;`);
    expect(scheduled.ok).toBe(false);
    expect(scheduled.out).toContain("PAID_QUOTA_POLICY_SCHEDULED");
    expect(
      psql(`SELECT count(*) FROM billing.entitlement_policy_versions
      WHERE policy_key='pro' AND version_number=900`).trim(),
    ).toBe("0");
  });

  it("enforces Pro 3 and Pro Plus 6 per lesson while preserving other lessons", () => {
    seedCanonicalPaid(USERS.pro, "pro");
    for (let index = 0; index < 3; index += 1) {
      reserve(USERS.pro, "lesson-a", `pro-a-${index}`);
    }
    const fourth = txAllowFail(
      `SELECT billing.reserve_ai_quota(
        '${USERS.pro}', 'assistant_runtime', 'lesson-a',
        '${nextUuid()}', 1, 'pro-a-4'
      )`,
    );
    expect(fourth.ok).toBe(false);
    expect(fourth.out).toContain("QUOTA_EXCEEDED_LESSON");
    reserve(USERS.pro, "lesson-b", "pro-b-1");
    expect(counters(USERS.pro)).toContain("assistant_runtime_per_lesson:lesson-a:0:3:3");
    expect(counters(USERS.pro)).toContain("assistant_runtime_per_lesson:lesson-b:0:1:3");
    expect(counters(USERS.pro)).toContain("ai_assistant:-:0:4:50");

    seedCanonicalPaid(USERS.plus, "pro_plus");
    for (let index = 0; index < 6; index += 1) {
      reserve(USERS.plus, "plus-lesson", `plus-${index}`);
    }
    const seventh = txAllowFail(
      `SELECT billing.reserve_ai_quota(
        '${USERS.plus}', 'assistant_runtime', 'plus-lesson',
        '${nextUuid()}', 1, 'plus-7'
      )`,
    );
    expect(seventh.ok).toBe(false);
    expect(seventh.out).toContain("QUOTA_EXCEEDED_LESSON");
  });

  it("rejects at the general cap without leaving a lesson-side increment", () => {
    seedCanonicalPaid(USERS.general, "pro");
    psql(`INSERT INTO billing.entitlement_usage (
        user_id, usage_category, period_key, lesson_id,
        used_count, reserved_count, quota_limit, period_start, period_end
      ) VALUES (
        '${USERS.general}', 'ai_assistant',
        to_char(now() AT TIME ZONE 'UTC','YYYY-MM'), NULL,
        49, 0, 50, date_trunc('month', now()),
        date_trunc('month', now()) + interval '1 month'
      )`);
    reserve(USERS.general, "general-a", "general-last");
    const rejected = txAllowFail(
      `SELECT billing.reserve_ai_quota(
        '${USERS.general}', 'assistant_runtime', 'general-b',
        '${nextUuid()}', 1, 'general-over'
      )`,
    );
    expect(rejected.ok).toBe(false);
    expect(rejected.out).toContain("QUOTA_EXCEEDED_GENERAL");
    expect(counters(USERS.general)).toContain("ai_assistant:-:49:1:50");
    expect(counters(USERS.general)).toContain("assistant_runtime_per_lesson:general-a:0:1:3");
    expect(counters(USERS.general)).not.toContain("general-b");
  });

  it("keeps idempotent reserve and release synchronized across both counters", () => {
    seedCanonicalPaid(USERS.release, "pro");
    const first = reserve(USERS.release, "release-lesson", "release-reserve");
    const replay = reserve(USERS.release, "release-lesson", "release-reserve");
    expect(replay.reservation_id).toBe(first.reservation_id);
    expect(replay.idempotent_replay).toBe(true);
    expect(counters(USERS.release)).toContain("ai_assistant:-:0:1:50");
    expect(counters(USERS.release)).toContain("assistant_runtime_per_lesson:release-lesson:0:1:3");

    expect(
      tx(
        `SELECT (billing.release_ai_quota(
          '${first.reservation_id}', 'release-once'
        )->>'released')`,
      ),
    ).toBe("true");
    expect(
      tx(
        `SELECT (billing.release_ai_quota(
          '${first.reservation_id}', 'release-replay'
        )->>'idempotent_replay')`,
      ),
    ).toBe("true");
    expect(counters(USERS.release)).toContain("ai_assistant:-:0:0:50");
    expect(counters(USERS.release)).toContain("assistant_runtime_per_lesson:release-lesson:0:0:3");
  });

  it("commits, reconciles stale roots, and serializes the last general unit", async () => {
    seedCanonicalPaid(USERS.lifecycle, "pro");
    const lifecycle = reserve(USERS.lifecycle, "life-lesson", "life-reserve");
    tx(
      `SELECT billing.register_provider_attempt(
        '${lifecycle.reservation_id}', 'openai', 'life-provider-1', NULL
      )`,
    );
    tx(
      `SELECT billing.register_provider_attempt(
        '${lifecycle.reservation_id}', 'openai', 'life-provider-2', NULL
      )`,
    );
    tx(
      `SELECT billing.commit_ai_quota(
        '${lifecycle.reservation_id}', 10, 20, 'life-commit'
      )`,
    );
    expect(counters(USERS.lifecycle)).toContain("ai_assistant:-:1:0:50");
    expect(counters(USERS.lifecycle)).toContain("assistant_runtime_per_lesson:life-lesson:1:0:3");
    const releaseStarted = txAllowFail(`SELECT billing.release_ai_quota(
      '${lifecycle.reservation_id}', 'life-release-started')`);
    expect(releaseStarted.ok).toBe(false);
    expect(releaseStarted.out).toContain("CANNOT_RELEASE_STARTED");
    expect(counters(USERS.lifecycle)).toContain("ai_assistant:-:1:0:50");
    expect(counters(USERS.lifecycle)).toContain("assistant_runtime_per_lesson:life-lesson:1:0:3");

    seedCanonicalPaid(USERS.stale, "pro");
    const stale = reserve(USERS.stale, "stale-lesson", "stale-reserve");
    psql(
      `UPDATE billing.ai_usage_ledger
       SET reservation_expires_at = now() - interval '1 minute'
       WHERE reservation_id='${stale.reservation_id}' AND attempt_index=0`,
    );
    expect(
      tx(
        `SELECT (billing.reconcile_stale_ai_reservation(
          '${stale.reservation_id}'
        )->>'action')`,
      ),
    ).toBe("stale_reconciled");
    expect(counters(USERS.stale)).toContain("ai_assistant:-:0:0:50");
    expect(counters(USERS.stale)).toContain("assistant_runtime_per_lesson:stale-lesson:0:0:3");

    seedCanonicalPaid(USERS.concurrent, "pro");
    psql(`INSERT INTO billing.entitlement_usage (
        user_id, usage_category, period_key, lesson_id,
        used_count, reserved_count, quota_limit, period_start, period_end
      ) VALUES (
        '${USERS.concurrent}', 'ai_assistant',
        to_char(now() AT TIME ZONE 'UTC','YYYY-MM'), NULL,
        49, 0, 50, date_trunc('month', now()),
        date_trunc('month', now()) + interval '1 month'
      )`);
    const concurrent = await psqlConcurrent([
      `BEGIN; ${SERVICE} SELECT billing.reserve_ai_quota(
        '${USERS.concurrent}', 'assistant_runtime', 'conc-a',
        '${nextUuid()}', 1, 'conc-a'
      ); COMMIT;`,
      `BEGIN; ${SERVICE} SELECT billing.reserve_ai_quota(
        '${USERS.concurrent}', 'assistant_runtime', 'conc-b',
        '${nextUuid()}', 1, 'conc-b'
      ); COMMIT;`,
    ]);
    expect(concurrent.filter((result) => result.ok)).toHaveLength(1);
    expect(counters(USERS.concurrent)).toContain("ai_assistant:-:49:1:50");
    expect(
      psql(
        `SELECT COALESCE(sum(reserved_count),0)
         FROM billing.entitlement_usage
         WHERE user_id='${USERS.concurrent}'
           AND usage_category='assistant_runtime_per_lesson'`,
      ).trim(),
    ).toBe("1");
  }, 120000);

  it("serializes two requests for the final lesson unit", async () => {
    seedCanonicalPaid(USERS.lessonRace, "pro");
    reserve(USERS.lessonRace, "race-lesson", "lesson-race-1");
    reserve(USERS.lessonRace, "race-lesson", "lesson-race-2");
    const requests = ["a", "b"].map(
      (suffix) => `BEGIN; ${SERVICE}
      SELECT billing.reserve_ai_quota('${USERS.lessonRace}',
        'assistant_runtime','race-lesson','${nextUuid()}',1,'lesson-race-${suffix}');
      COMMIT;`,
    );
    const results = await psqlConcurrent(requests);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)?.out).toContain("QUOTA_EXCEEDED_LESSON");
    expect(counters(USERS.lessonRace)).toBe(
      "ai_assistant:-:0:3:50\nassistant_runtime_per_lesson:race-lesson:0:3:3",
    );
  }, 120000);

  it("replays concurrent identical reservations at the final lesson unit", async () => {
    seedCanonicalPaid(USERS.replayRace, "pro");
    reserve(USERS.replayRace, "idem-lesson", "idem-before-1");
    reserve(USERS.replayRace, "idem-lesson", "idem-before-2");
    const request = `BEGIN; ${SERVICE} SELECT billing.reserve_ai_quota(
      '${USERS.replayRace}','assistant_runtime','idem-lesson',
      '${nextUuid()}',1,'idem-concurrent'); COMMIT;`;
    const results = await psqlConcurrent([request, request]);
    expect(results.every((result) => result.ok)).toBe(true);
    const replies = results.map((result) => JSON.parse(lastValue(result.out)));
    expect(new Set(replies.map((reply) => reply.reservation_id)).size).toBe(1);
    expect(replies.filter((reply) => reply.idempotent_replay)).toHaveLength(1);
    expect(counters(USERS.replayRace)).toBe(
      "ai_assistant:-:0:3:50\nassistant_runtime_per_lesson:idem-lesson:0:3:3",
    );
  }, 120000);

  it("keeps general-only requests out of the lesson counters and enforces Plus 150", () => {
    seedCanonicalPaid(USERS.generalOnly, "pro_plus");
    const first = reserve(USERS.generalOnly, null, "general-only-first");
    expect(first.remaining_general).toBe(149);
    expect(first.remaining_lesson).toBeNull();
    expect(counters(USERS.generalOnly)).toBe("ai_assistant:-:0:1:150");
    tx(`SELECT billing.release_ai_quota('${first.reservation_id}', 'general-only-release')`);
    psql(`UPDATE billing.entitlement_usage SET used_count=149
      WHERE user_id='${USERS.generalOnly}'`);
    reserve(USERS.generalOnly, null, "general-only-last");
    const rejected = txAllowFail(`SELECT billing.reserve_ai_quota(
      '${USERS.generalOnly}','assistant_runtime',NULL,'${nextUuid()}',1,'plus-over')`);
    expect(rejected.ok).toBe(false);
    expect(rejected.out).toContain("QUOTA_EXCEEDED_GENERAL");
    expect(counters(USERS.generalOnly)).toBe("ai_assistant:-:149:1:150");
  });

  it("denies Free users without counters and retains an active 72-hour admin grant", () => {
    const denied = txAllowFail(`SELECT billing.reserve_ai_quota(
      '${USERS.free}','assistant_runtime','free-lesson','${nextUuid()}',1,'free-denied')`);
    expect(denied.ok).toBe(false);
    expect(denied.out).toContain("QUOTA_EXCEEDED_GENERAL");
    expect(counters(USERS.free)).toBe("");
    psql(`INSERT INTO billing.admin_grant_policy_versions
      (policy_key,version_number,status,effective_from,ai_assistant_quota_limit,
       grant_duration_hours,published_at)
      VALUES ('quota_align_admin',1,'published',now(),500,72,now())
      ON CONFLICT (policy_key,version_number) DO NOTHING;
      DELETE FROM billing.admin_user_grant_state WHERE user_id='${USERS.admin}';
      DELETE FROM billing.ai_usage_ledger WHERE user_id='${USERS.admin}';
      DELETE FROM billing.entitlement_usage WHERE user_id='${USERS.admin}';
      INSERT INTO billing.admin_user_grant_state(user_id,expires_at,policy_version_id)
      SELECT '${USERS.admin}',now()+interval '72 hours',id
      FROM billing.admin_grant_policy_versions WHERE policy_key='quota_align_admin'`);
    try {
      const admin = reserve(USERS.admin, "admin-lesson", "admin-quota-reserve");
      expect(admin.remaining_general).toBe(499);
      expect(admin.remaining_lesson).toBeNull();
      expect(counters(USERS.admin)).toBe("ai_assistant:-:0:1:500");
      expect(
        psql(`SELECT grant_duration_hours FROM billing.admin_grant_policy_versions
        WHERE policy_key='quota_align_admin'`).trim(),
      ).toBe("72");
    } finally {
      psql(`DELETE FROM billing.admin_user_grant_state WHERE user_id='${USERS.admin}';
        DELETE FROM billing.admin_grant_policy_versions WHERE policy_key='quota_align_admin'`);
    }
  });

  it("retains a deliberately versioned non-canonical legacy quota policy", () => {
    psql(`INSERT INTO billing.entitlement_policy_versions
      (policy_key,version_number,status,effective_from,lesson_allowlist_mode,
       lesson_count_cap,builder_access,video_access,rag_enabled,
       assistant_runtime_per_lesson_quota,assistant_runtime_general_monthly_quota,
       mission_evaluation_enabled,reveal_answer_enabled,wow_path_enabled,policy_json,published_at)
      VALUES ('quota_align_legacy',1,'published',now(),'curriculum_snapshot',
        71,false,true,true,NULL,272,true,true,true,'{}'::jsonb,now())
      ON CONFLICT (policy_key,version_number) DO NOTHING;
      INSERT INTO billing.plan_versions
        (plan_id,entitlement_policy_version_id,version_number,billing_interval,
         status,effective_from,published_at)
      SELECT pc.id,epv.id,915,'month','published',now(),now()
      FROM billing.plan_catalog pc,billing.entitlement_policy_versions epv
      WHERE pc.plan_key='pro' AND epv.policy_key='quota_align_legacy'
      ON CONFLICT (plan_id,version_number) DO NOTHING`);
    seedCanonicalPaid(USERS.legacy, "pro");
    psql(`UPDATE billing.subscriptions SET plan_version_id=(
      SELECT pv.id FROM billing.plan_versions pv JOIN billing.entitlement_policy_versions epv
        ON epv.id=pv.entitlement_policy_version_id WHERE epv.policy_key='quota_align_legacy')
      WHERE user_id='${USERS.legacy}'`);
    expect(tx(`SELECT billing.resolve_ai_assistant_limit('${USERS.legacy}')`)).toBe("272");
    const result = reserve(USERS.legacy, "legacy-lesson", "legacy-pinned-reserve");
    expect(result.remaining_general).toBe(271);
    expect(result.remaining_lesson).toBeNull();
    expect(counters(USERS.legacy)).toBe("ai_assistant:-:0:1:272");
    // Preserve baseline fallback when a legacy paid policy itself grants no AI.
    expect(
      lastValue(
        psql(`BEGIN; ${SERVICE}
      UPDATE billing.entitlement_policy_versions
        SET assistant_runtime_general_monthly_quota=0
        WHERE policy_key='quota_align_legacy';
      INSERT INTO billing.admin_grant_policy_versions
        (policy_key,version_number,status,effective_from,ai_assistant_quota_limit,
         grant_duration_hours,published_at)
        VALUES ('quota_align_legacy_admin',1,'published',now(),500,72,now());
      INSERT INTO billing.admin_user_grant_state(user_id,expires_at,policy_version_id)
      SELECT '${USERS.legacy}',now()+interval '72 hours',id
      FROM billing.admin_grant_policy_versions WHERE policy_key='quota_align_legacy_admin';
      SELECT billing.resolve_ai_assistant_limit('${USERS.legacy}');
      ROLLBACK;`),
      ),
    ).toBe("500");
  });

  it("releases a pre-migration reservation that never reserved a lesson counter", () => {
    seedCanonicalPaid(USERS.legacy, "pro");
    const old = reserve(USERS.legacy, null, "old-reservation");
    psql(`UPDATE billing.ai_usage_ledger SET lesson_id='historical-lesson',metadata='{}'
      WHERE reservation_id='${old.reservation_id}' AND attempt_index=0`);
    tx(`SELECT billing.release_ai_quota('${old.reservation_id}', 'old-release')`);
    expect(counters(USERS.legacy)).toBe("ai_assistant:-:0:0:50");
  });

  it("commits both counters once when stale recovery finds provider-start evidence", () => {
    seedCanonicalPaid(USERS.staleStarted, "pro");
    const first = reserve(USERS.staleStarted, "stale-started", "stale-started-reserve");
    psql(`UPDATE billing.ai_usage_ledger
      SET provider_started_at=now(),reservation_expires_at=now()-interval '1 minute'
      WHERE reservation_id='${first.reservation_id}' AND attempt_index=0`);
    expect(
      tx(`SELECT billing.reconcile_stale_ai_reservation(
      '${first.reservation_id}')->>'action'`),
    ).toBe("committed");
    expect(
      tx(`SELECT billing.reconcile_stale_ai_reservation(
      '${first.reservation_id}')->>'action'`),
    ).toBe("noop");
    expect(counters(USERS.staleStarted)).toBe(
      "ai_assistant:-:1:0:50\nassistant_runtime_per_lesson:stale-started:1:0:3",
    );
  });
});
