/**
 * Public billing RPC bridge — static + disposable-DB proofs.
 * Authorization: CR-RAG-BILLING-PUBLIC-RPC-BRIDGE-CANDIDATE-20260728-01
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  disposableDbReady,
  psql,
  psqlAllowFail,
  resetLocalDatabase,
  startLocalSupabase,
} from "../../../../scripts/billing/disposable-db";
import { CHAT4_PRIVATE_RPC, CHAT4_RPC } from "@/lib/billing";

const ENABLED = process.env.BILLING_DISPOSABLE_DB === "1" && disposableDbReady();
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const BRIDGE_MIGRATION = "supabase/migrations/20260728140000_public_billing_rpc_bridge.sql";

const PUBLIC_WRAPPERS = [
  {
    publicName: "public.reserve_learner_ai_access",
    privateName: "billing.reserve_learner_ai_access",
    args: "uuid, text, text, uuid, integer, text",
    createSig: `FUNCTION public.reserve_learner_ai_access(
  p_user_id uuid,
  p_category text,
  p_lesson_id text,
  p_request_id uuid,
  p_units integer,
  p_idempotency_key text
)`,
  },
  {
    publicName: "public.register_provider_attempt",
    privateName: "billing.register_provider_attempt",
    args: "uuid, text, text, text",
    createSig: `FUNCTION public.register_provider_attempt(
  p_reservation_id uuid,
  p_provider text,
  p_provider_request_id text,
  p_attempt_idempotency_key text DEFAULT NULL
)`,
  },
  {
    publicName: "public.finalize_provider_attempt",
    privateName: "billing.finalize_provider_attempt",
    args: "uuid, integer, text, integer, integer, bigint",
    createSig: `FUNCTION public.finalize_provider_attempt(
  p_reservation_id uuid,
  p_attempt_index integer,
  p_attempt_status text,
  p_input_tokens integer DEFAULT 0,
  p_output_tokens integer DEFAULT 0,
  p_provider_cost_micro bigint DEFAULT 0
)`,
  },
  {
    publicName: "public.commit_ai_quota",
    privateName: "billing.commit_ai_quota",
    args: "uuid, integer, integer, text",
    createSig: `FUNCTION public.commit_ai_quota(
  p_reservation_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
  p_idempotency_key text
)`,
  },
  {
    publicName: "public.release_ai_quota",
    privateName: "billing.release_ai_quota",
    args: "uuid, text",
    createSig: `FUNCTION public.release_ai_quota(
  p_reservation_id uuid,
  p_idempotency_key text
)`,
  },
  {
    publicName: "public.get_entitlement_snapshot",
    privateName: "billing.get_entitlement_snapshot",
    args: "uuid",
    createSig: "FUNCTION public.get_entitlement_snapshot(p_user_id uuid)",
  },
  {
    publicName: "public.evaluate_access",
    privateName: "billing.evaluate_access",
    args: "uuid, text, text",
    createSig: `FUNCTION public.evaluate_access(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id text
)`,
  },
] as const;

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function extractFunctionBody(sql: string, fnName: string): string {
  const marker = `FUNCTION ${fnName}`;
  const start = sql.indexOf(marker);
  if (start < 0) return "";
  const end = sql.indexOf("$$;", start);
  return end < 0 ? sql.slice(start) : sql.slice(start, end + 3);
}

function lastValue(out: string): string {
  const lines = out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !["BEGIN", "SET", "COMMIT", "ROLLBACK"].includes(s));
  return lines[lines.length - 1] ?? "";
}

const SERVICE = `SET LOCAL ROLE service_role; SET LOCAL request.jwt.claims = '{"role":"service_role"}';`;
const AUTH = `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"role":"authenticated","sub":"eeee1111-1111-1111-1111-111111111111"}';`;
const ANON = `SET LOCAL ROLE anon; SET LOCAL request.jwt.claims = '{"role":"anon"}';`;

describe("public billing RPC bridge — static", () => {
  const bridgeSql = readRepoFile(BRIDGE_MIGRATION);
  const assistantIndex = readRepoFile("supabase/functions/assistant-runtime/index.ts");
  const entitlementIndex = readRepoFile("supabase/functions/billing-entitlement/index.ts");
  const handler = readRepoFile("supabase/functions/assistant-runtime/handler.ts");

  it("defines exactly seven public wrappers and remains the terminal Billing bridge before additive compat", () => {
    const migrations = readdirSync(path.join(REPO_ROOT, "supabase/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const bridgeIdx = migrations.indexOf("20260728140000_public_billing_rpc_bridge.sql");
    expect(bridgeIdx).toBeGreaterThanOrEqual(0);
    const afterBridge = migrations.slice(bridgeIdx + 1);
    // Only the additive legacy-compat migration may follow the public bridge.
    expect(afterBridge).toEqual(["20260801120000_billing_legacy_user_subscriptions_compat.sql"]);
    expect(PUBLIC_WRAPPERS).toHaveLength(7);
    for (const w of PUBLIC_WRAPPERS) {
      expect(bridgeSql).toContain(w.createSig);
    }
  });

  it("marks every wrapper SECURITY DEFINER with safe search_path", () => {
    for (const w of PUBLIC_WRAPPERS) {
      const body = extractFunctionBody(bridgeSql, w.publicName);
      expect(body).toContain("SECURITY DEFINER");
      expect(body).toContain("SET search_path = public, billing, pg_temp");
    }
  });

  it("revokes PUBLIC/anon/authenticated and grants service_role only", () => {
    for (const w of PUBLIC_WRAPPERS) {
      const bare = w.publicName.replace(/^public\./, "public.");
      expect(bridgeSql).toContain(`REVOKE ALL ON FUNCTION ${bare}(${w.args}) FROM PUBLIC`);
      expect(bridgeSql).toContain(`REVOKE ALL ON FUNCTION ${bare}(${w.args}) FROM anon`);
      expect(bridgeSql).toContain(`REVOKE ALL ON FUNCTION ${bare}(${w.args}) FROM authenticated`);
      expect(bridgeSql).toContain(`GRANT EXECUTE ON FUNCTION ${bare}(${w.args}) TO service_role`);
    }
  });

  it("delegates only to the matching billing.* function", () => {
    for (const w of PUBLIC_WRAPPERS) {
      const body = extractFunctionBody(bridgeSql, w.publicName);
      expect(body).toContain(`RETURN ${w.privateName}(`);
      for (const other of PUBLIC_WRAPPERS) {
        if (other.privateName === w.privateName) continue;
        expect(body).not.toContain(`RETURN ${other.privateName}(`);
      }
    }
  });

  it("does not expose billing tables or broaden private grants", () => {
    expect(bridgeSql).not.toMatch(
      /GRANT\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\b[\s\S]*\bON\s+TABLE\s+billing\./i,
    );
    expect(bridgeSql).not.toMatch(/GRANT EXECUTE ON FUNCTION billing\./);
    expect(bridgeSql).not.toContain("CREATE TABLE");
    expect(bridgeSql).not.toContain("CREATE VIEW");
  });

  it("assistant-runtime uses service-role auth without billing schema profiles", () => {
    expect(assistantIndex).toContain("apikey: SERVICE_ROLE");
    expect(assistantIndex).toContain("Authorization: `Bearer ${SERVICE_ROLE}`");
    expect(assistantIndex).not.toContain('"Accept-Profile": "billing"');
    expect(assistantIndex).not.toContain('"Content-Profile": "billing"');
    expect(assistantIndex).toContain("/rest/v1/rpc/${fnName}");
  });

  it("billing-entitlement uses service-role auth without billing schema profiles", () => {
    expect(entitlementIndex).toContain("apikey: SERVICE_KEY");
    expect(entitlementIndex).toContain("Authorization: `Bearer ${SERVICE_KEY}`");
    expect(entitlementIndex).not.toContain('"Accept-Profile": "billing"');
    expect(entitlementIndex).not.toContain('"Content-Profile": "billing"');
  });

  it("handler still reserves before providers and fails closed on reserve failure", () => {
    const reserveIdx = handler.indexOf('billingRpc("reserve_learner_ai_access"');
    const embedIdx = handler.indexOf("deps.embedQuery(");
    const retrieveIdx = handler.indexOf("deps.localeSemanticRetrieve(");
    const llmIdx = handler.indexOf("deps.callLlm(");
    expect(reserveIdx).toBeGreaterThan(0);
    expect(embedIdx).toBeGreaterThan(reserveIdx);
    expect(retrieveIdx).toBeGreaterThan(reserveIdx);
    expect(llmIdx).toBeGreaterThan(reserveIdx);
    expect(handler).toContain('runtime: "disconnected"');
    expect(handler).toContain(
      "providersCalled: { embedding: false, retrievalRpc: false, llm: false }",
    );
  });

  it("documents public wrappers in the Chat-4 connection contract", () => {
    expect(CHAT4_RPC.reserve).toBe("public.reserve_learner_ai_access");
    expect(CHAT4_PRIVATE_RPC.reserve).toBe("billing.reserve_learner_ai_access");
    expect(CHAT4_RPC.registerProviderAttempt).toBe("public.register_provider_attempt");
    expect(CHAT4_PRIVATE_RPC.registerProviderAttempt).toBe("billing.register_provider_attempt");
  });
});

describe.skipIf(!ENABLED)("public billing RPC bridge — disposable DB", () => {
  const USER = "ffff1111-1111-1111-1111-111111111111";

  beforeAll(() => {
    // Local `supabase db reset` fails on realtime.messages ownership in this
    // environment. Prefer a pre-applied disposable migration chain
    // (MIGRATIONS_PREAPPLIED=1). Otherwise attempt the standard reset path.
    if (process.env.MIGRATIONS_PREAPPLIED === "1") {
      psql("SELECT 1");
      return;
    }
    startLocalSupabase();
    const reset = resetLocalDatabase();
    if (!reset.ok) {
      throw new Error(`disposable db reset failed:\n${reset.output.slice(-800)}`);
    }
  }, 180_000);

  function seedPaid(quota: number) {
    psql(`INSERT INTO billing.entitlement_policy_versions
      (policy_key, version_number, status, effective_from, lesson_allowlist_mode,
       lesson_count_cap, builder_access, video_access, rag_enabled,
       assistant_runtime_per_lesson_quota, assistant_runtime_general_monthly_quota,
       assistant_runtime_period_quota, assistant_runtime_period_days,
       mission_evaluation_enabled, reveal_answer_enabled, wow_path_enabled, policy_json, published_at)
      VALUES ('bridge_public_v1', 1, 'published', now(), 'curriculum_snapshot',
        74, true, true, true, NULL, ${quota}, NULL, NULL, true, true, true, '{}'::jsonb, now())
      ON CONFLICT (policy_key, version_number)
      DO UPDATE SET assistant_runtime_general_monthly_quota = ${quota}`);

    psql(`INSERT INTO billing.plan_versions
      (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
      SELECT pc.id, epv.id, 9101, 'month', 'published', now(), now()
      FROM billing.plan_catalog pc, billing.entitlement_policy_versions epv
      WHERE pc.plan_key='pro' AND epv.policy_key='bridge_public_v1' AND epv.version_number=1
      ON CONFLICT (plan_id, version_number)
      DO UPDATE SET entitlement_policy_version_id = EXCLUDED.entitlement_policy_version_id,
                    status = 'published', published_at = now()`);

    psql(`DELETE FROM billing.ai_usage_ledger WHERE user_id='${USER}'`);
    psql(`DELETE FROM billing.entitlement_usage WHERE user_id='${USER}'`);
    psql(`DELETE FROM billing.subscriptions WHERE user_id='${USER}'`);
    psql(`INSERT INTO billing.subscriptions
      (user_id, plan_version_id, access_state, billing_state, market_code, currency_code, billing_interval, idempotency_key, current_period_end)
      SELECT '${USER}', pv.id, 'paid_active', 'active', 'INTL', 'USD', 'month', 'bridge-sub-${USER}', now() + interval '30 days'
      FROM billing.plan_versions pv
      JOIN billing.entitlement_policy_versions epv ON epv.id = pv.entitlement_policy_version_id
      WHERE epv.policy_key='bridge_public_v1' AND pv.version_number=9101`);
  }

  it("creates billing schema, private functions, and seven public wrappers", () => {
    const row = lastValue(
      psql(`SELECT
          (SELECT COUNT(*)::text FROM information_schema.schemata WHERE schema_name='billing')
          || ',' ||
          (SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname='public' AND p.proname IN (
              'reserve_learner_ai_access','register_provider_attempt','finalize_provider_attempt',
              'commit_ai_quota','release_ai_quota','get_entitlement_snapshot','evaluate_access'))
          || ',' ||
          (SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname='billing' AND p.proname IN (
              'reserve_learner_ai_access','register_provider_attempt','finalize_provider_attempt',
              'commit_ai_quota','release_ai_quota','get_entitlement_snapshot','evaluate_access'))`),
    );
    expect(row).toBe("1,7,7");
  }, 60_000);

  it("catalog: SECURITY DEFINER, search_path, and role grants", () => {
    const report = lastValue(
      psql(`WITH fns(name, args) AS (
          VALUES
            ('reserve_learner_ai_access','uuid, text, text, uuid, integer, text'),
            ('register_provider_attempt','uuid, text, text, text'),
            ('finalize_provider_attempt','uuid, integer, text, integer, integer, bigint'),
            ('commit_ai_quota','uuid, integer, integer, text'),
            ('release_ai_quota','uuid, text'),
            ('get_entitlement_snapshot','uuid'),
            ('evaluate_access','uuid, text, text')
        )
        SELECT string_agg(
          name || ':' ||
          CASE WHEN p.prosecdef THEN 'D' ELSE 'i' END || ':' ||
          CASE WHEN array_to_string(p.proconfig,',') LIKE '%search_path=public, billing, pg_temp%' THEN 'S' ELSE 'x' END || ':' ||
          CASE WHEN has_function_privilege('service_role', format('public.%I(%s)', name, args), 'EXECUTE') THEN '1' ELSE '0' END ||
          CASE WHEN has_function_privilege('anon', format('public.%I(%s)', name, args), 'EXECUTE') THEN '1' ELSE '0' END ||
          CASE WHEN has_function_privilege('authenticated', format('public.%I(%s)', name, args), 'EXECUTE') THEN '1' ELSE '0' END ||
          CASE WHEN has_function_privilege('public', format('public.%I(%s)', name, args), 'EXECUTE') THEN '1' ELSE '0' END
        , '|')
        FROM fns
        JOIN pg_proc p ON p.proname = fns.name
        JOIN pg_namespace n ON n.oid=p.pronamespace AND n.nspname='public'`),
    );
    for (const name of [
      "reserve_learner_ai_access",
      "register_provider_attempt",
      "finalize_provider_attempt",
      "commit_ai_quota",
      "release_ai_quota",
      "get_entitlement_snapshot",
      "evaluate_access",
    ]) {
      expect(report).toContain(`${name}:D:S:1000`);
    }
  }, 60_000);

  it("role denial: anon and authenticated cannot call reserve wrapper", () => {
    seedPaid(5);
    const req = "11111111-1111-1111-1111-111111111101";
    const anonFail = psqlAllowFail(
      `BEGIN; ${ANON} SELECT public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req}',1,'idem-anon'); COMMIT;`,
    );
    expect(anonFail.ok).toBe(false);
    const authFail = psqlAllowFail(
      `BEGIN; ${AUTH} SELECT public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req}',1,'idem-auth'); COMMIT;`,
    );
    expect(authFail.ok).toBe(false);
  }, 60_000);

  it("service_role reserve lifecycle: idempotency, commit path, release path", () => {
    seedPaid(5);
    const req1 = "11111111-1111-1111-1111-111111111111";
    const idem = "bridge-idem-1";
    const r1 = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req1}',1,'${idem}')->>'reservation_id'); COMMIT;`,
      ),
    );
    expect(r1).toMatch(/^[0-9a-f-]{36}$/i);
    const r2 = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req1}',1,'${idem}')->>'reservation_id'); COMMIT;`,
      ),
    );
    expect(r2).toBe(r1);
    const replay = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req1}',1,'${idem}')->>'idempotent_replay'); COMMIT;`,
      ),
    );
    expect(replay).toBe("true");

    const req2 = "11111111-1111-1111-1111-111111111112";
    const rid2 = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req2}',1,'bridge-idem-release')->>'reservation_id'); COMMIT;`,
      ),
    );
    const released = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.release_ai_quota('${rid2}','bridge-release-1')->>'released'); COMMIT;`,
      ),
    );
    expect(released).toBe("true");

    const req3 = "11111111-1111-1111-1111-111111111113";
    const rid3 = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${req3}',1,'bridge-idem-commit')->>'reservation_id'); COMMIT;`,
      ),
    );
    const attempt = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.register_provider_attempt('${rid3}','openai_embedding','prov-1','att-1')->>'attempt_index'); COMMIT;`,
      ),
    );
    expect(Number(attempt)).toBeGreaterThanOrEqual(1);
    const fin = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.finalize_provider_attempt('${rid3}',${attempt},'succeeded',1,1,0)->>'attempt_status'); COMMIT;`,
      ),
    );
    expect(fin).toBe("succeeded");
    const committed = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.commit_ai_quota('${rid3}',10,20,'bridge-commit-1')->>'committed'); COMMIT;`,
      ),
    );
    expect(committed).toBe("true");
  }, 90_000);

  it("fail-closed AI_ACCESS_DENIED and QUOTA_EXCEEDED via public wrappers", () => {
    const deniedUser = "ffff2222-2222-2222-2222-222222222222";
    psql(`DELETE FROM billing.subscriptions WHERE user_id='${deniedUser}'`);
    psql(`DELETE FROM billing.admin_access_grants WHERE user_id='${deniedUser}'`);
    psql(`DELETE FROM billing.admin_user_grant_state WHERE user_id='${deniedUser}'`);
    const denied = psqlAllowFail(
      `BEGIN; ${SERVICE} SELECT public.reserve_learner_ai_access('${deniedUser}','assistant_runtime',NULL,'22222222-2222-2222-2222-222222222221',1,'deny-1'); COMMIT;`,
    );
    expect(denied.ok).toBe(false);
    expect(denied.out).toMatch(/AI_ACCESS_DENIED/);

    seedPaid(1);
    const reqA = "33333333-3333-3333-3333-333333333331";
    const reqB = "33333333-3333-3333-3333-333333333332";
    lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${reqA}',1,'q-a')->>'reservation_id'); COMMIT;`,
      ),
    );
    const exceeded = psqlAllowFail(
      `BEGIN; ${SERVICE} SELECT public.reserve_learner_ai_access('${USER}','assistant_runtime',NULL,'${reqB}',1,'q-b'); COMMIT;`,
    );
    expect(exceeded.ok).toBe(false);
    expect(exceeded.out).toMatch(/QUOTA_EXCEEDED/);
  }, 90_000);

  it("entitlement wrappers respond under service_role", () => {
    seedPaid(5);
    const snap = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT jsonb_typeof(public.get_entitlement_snapshot('${USER}')); COMMIT;`,
      ),
    );
    expect(snap).toBe("object");
    const evalOut = lastValue(
      psql(
        `BEGIN; ${SERVICE} SELECT (public.evaluate_access('${USER}','assistant_runtime',NULL)->>'allowed'); COMMIT;`,
      ),
    );
    expect(["true", "false"]).toContain(evalOut);
  }, 60_000);
});
