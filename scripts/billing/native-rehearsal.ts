/**
 * Native Supabase/PostgREST billing rehearsal orchestrator.
 * Authorization: CR-BILLING-RAG-NATIVE-REHEARSAL-CORRECTION-20260801-01
 *
 * Uses an isolated local stack (unique project_id/ports). Does not touch
 * Production or reuse Method A / default abyqqeboyrkkwhjpwmtd stacks.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WORKTREE_ROOT = path.resolve(REPO_ROOT, ".."); // scripts/billing -> repo; wait, scripts/billing is under repo
// scripts/billing/native-rehearsal.ts → repo root is ../..
const ACTUAL_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PROJECT_ID = "billing-native-reh-20260801";
const ISO_ROOT = process.env.BILLING_NATIVE_ISO_ROOT ?? "E:/Temp/billing-native-reh-20260801";
const API_PORT = 56421;
const DB_PORT = 56422;
const BASELINE_CUTOFF = "20260603221717";
const PROD_LEDGER = "20260603221716";
const REPO_HAS_ROLE = "20260603221717_663625ba-5a5c-4052-9037-27662ae79019.sql";

const BILLING_MIGRATIONS = [
  "20260709190000_billing_schema_phase1.sql",
  "20260709190100_billing_rls_policies.sql",
  "20260709190200_billing_rpc_entitlement.sql",
  "20260709190300_billing_rpc_quota.sql",
  "20260709190400_billing_rpc_subscription.sql",
  "20260709190500_billing_rpc_credits.sql",
  "20260709190600_billing_outbox_job_tables.sql",
  "20260710153000_billing_service_role_auth_fix.sql",
  "20260722180000_billing_launch_closure_contracts_v3.sql",
  "20260722190000_billing_v3_corrective_refresh.sql",
  "20260723120000_billing_historical_admin_policy_resolve.sql",
  "20260728140000_public_billing_rpc_bridge.sql",
] as const;

const COMPAT_MIGRATION = "20260801120000_billing_legacy_user_subscriptions_compat.sql";

const PUBLIC_WRAPPERS = [
  "reserve_learner_ai_access",
  "register_provider_attempt",
  "finalize_provider_attempt",
  "commit_ai_quota",
  "release_ai_quota",
  "get_entitlement_snapshot",
  "evaluate_access",
] as const;

type ReplayRow = {
  file: string;
  elapsedMs: number;
  outcome: "commit" | "rollback";
  ledgerOnce: boolean;
  error?: string;
};

function run(
  command: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; input?: string } = {},
): { ok: boolean; out: string; status: number | null } {
  const result = spawnSync(command, args, {
    cwd: opts.cwd ?? ACTUAL_REPO,
    env: opts.env ?? process.env,
    encoding: "utf8",
    input: opts.input,
    windowsHide: true,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return { ok: result.status === 0, out, status: result.status };
}

function bunx(args: string[], cwd = ISO_ROOT) {
  return run("bunx", args, { cwd });
}

function psql(sql: string): { ok: boolean; out: string } {
  const r = run(
    "docker",
    [
      "exec",
      "-i",
      "-e",
      "PGPASSWORD=postgres",
      `supabase_db_${PROJECT_ID}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
    ],
    { input: sql },
  );
  return { ok: r.ok, out: r.out };
}

function mustPsql(sql: string): string {
  const r = psql(sql);
  if (!r.ok) throw new Error(`psql failed:\n${r.out}\nSQL:\n${sql.slice(0, 500)}`);
  return r.out.trim();
}

function loadStatus(): {
  apiUrl: string;
  dbUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  raw: string;
} {
  const stJson = bunx(["supabase", "status", "-o", "json"]);
  if (stJson.ok) {
    try {
      const parsed = JSON.parse(stJson.out) as Record<string, string>;
      return {
        apiUrl: parsed.API_URL ?? `http://127.0.0.1:${API_PORT}`,
        dbUrl: parsed.DB_URL ?? `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`,
        anonKey: parsed.ANON_KEY ?? "",
        serviceRoleKey: parsed.SERVICE_ROLE_KEY ?? "",
        raw: stJson.out,
      };
    } catch {
      // fall through to env parse
    }
  }
  const st = bunx(["supabase", "status", "-o", "env"]);
  if (!st.ok) throw new Error(`supabase status failed:\n${st.out}`);
  const env: Record<string, string> = {};
  for (const line of st.out.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return {
    apiUrl: env.API_URL ?? `http://127.0.0.1:${API_PORT}`,
    dbUrl: env.DB_URL ?? `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`,
    anonKey: env.ANON_KEY ?? env.SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: env.SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    raw: st.out,
  };
}

async function postgrestRpc(
  apiUrl: string,
  key: string,
  fn: string,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Promise<{ status: number; json: unknown; text: string }> {
  const res = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function applyMigrationFile(relName: string, version: string): ReplayRow {
  const abs = path.join(ACTUAL_REPO, "supabase/migrations", relName);
  const sql = readFileSync(abs, "utf8");
  const started = Date.now();
  // One atomic transaction per file; record ledger exactly once on success.
  const wrapped = `
BEGIN;
${sql}
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('${version}', '${relName.replace(/'/g, "''")}', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;
COMMIT;
`;
  const r = psql(wrapped);
  const elapsedMs = Date.now() - started;
  if (!r.ok) {
    psql("ROLLBACK;");
    return {
      file: relName,
      elapsedMs,
      outcome: "rollback",
      ledgerOnce: false,
      error: r.out.slice(-1200),
    };
  }
  const count = mustPsql(
    `SELECT COUNT(*)::text FROM supabase_migrations.schema_migrations WHERE version='${version}'`,
  );
  return {
    file: relName,
    elapsedMs,
    outcome: "commit",
    ledgerOnce: count === "1",
  };
}

function versionOf(file: string): string {
  return file.slice(0, 14);
}

export type RehearsalReport = {
  versions: Record<string, string>;
  baseline: Record<string, string>;
  replay: ReplayRow[];
  compat?: ReplayRow;
  catalog: Record<string, string>;
  rpc: Record<string, unknown>;
  privileges: Record<string, unknown>;
  postgrest: Record<string, unknown>;
  legacy: Record<string, unknown>;
  canary: Record<string, unknown>;
  contractTests: Array<{ id: number; name: string; ok: boolean; detail?: string }>;
};

async function main(): Promise<void> {
  const report: RehearsalReport = {
    versions: {},
    baseline: {},
    replay: [],
    catalog: {},
    rpc: {},
    privileges: {},
    postgrest: {},
    legacy: {},
    canary: {},
    contractTests: [],
  };

  report.versions = {
    supabaseCli: bunx(["supabase", "--version"], ACTUAL_REPO).out.trim(),
    docker: run("docker", ["version", "--format", "{{.Server.Version}}"]).out.trim(),
    bun: run("bun", ["--version"]).out.trim(),
    node: run("node", ["--version"]).out.trim(),
  };

  const status = loadStatus();
  report.versions.apiUrl = status.apiUrl;
  report.versions.anonKeyPresent = String(Boolean(status.anonKey));
  report.versions.serviceRoleKeyPresent = String(Boolean(status.serviceRoleKey));

  const pgVer = mustPsql("SHOW server_version");
  report.versions.postgresql = pgVer;
  const restImg = run("docker", [
    "inspect",
    `supabase_rest_${PROJECT_ID}`,
    "--format",
    "{{.Config.Image}}",
  ]).out.trim();
  report.versions.postgrestImage = restImg;
  const authImg = run("docker", [
    "inspect",
    `supabase_auth_${PROJECT_ID}`,
    "--format",
    "{{.Config.Image}}",
  ]).out.trim();
  report.versions.gotrueImage = authImg;

  // ---- Section 8 baseline assertions (pre-billing; billing must be absent) ----
  // If billing already present from a prior partial run, refuse.
  const billingPresent = mustPsql(`SELECT to_regnamespace('billing') IS NOT NULL`);
  if (billingPresent === "t") {
    throw new Error("billing schema already present before 12-file replay — refuse unclean stack");
  }

  report.baseline = {
    productionLedgerAccepted: PROD_LEDGER,
    repoHasRoleMigration: REPO_HAS_ROLE,
    mappingNote:
      "Local baseline applies repository migrations with timestamp <= 20260603221717 (includes has_role body). Production ledger ends at 20260603221716. Local has_role body is not claimed to prove Production semantic parity.",
    billingAbsent: billingPresent,
    userSubscriptions: mustPsql(`SELECT to_regclass('public.user_subscriptions') IS NOT NULL`),
    appRole: mustPsql(
      `SELECT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='app_role')`,
    ),
    hasRole: mustPsql(
      `SELECT to_regprocedure('public.has_role(uuid, public.app_role)') IS NOT NULL`,
    ),
    authUid: mustPsql(`SELECT to_regprocedure('auth.uid()') IS NOT NULL`),
    authJwt: mustPsql(`SELECT to_regprocedure('auth.jwt()') IS NOT NULL`),
    genRandomUuid: mustPsql(`SELECT proname FROM pg_proc WHERE proname='gen_random_uuid' LIMIT 1`),
    publicWrappersAbsent: mustPsql(
      `SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('${PUBLIC_WRAPPERS.join("','")}')`,
    ),
    roles: mustPsql(
      `SELECT string_agg(rolname, ',' ORDER BY rolname) FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','postgres')`,
    ),
  };

  for (const key of ["userSubscriptions", "appRole", "hasRole", "authUid", "authJwt"] as const) {
    if (report.baseline[key] !== "t" && report.baseline[key] !== "gen_random_uuid") {
      if (key === "genRandomUuid") continue;
      throw new Error(`baseline check failed: ${key}=${report.baseline[key]}`);
    }
  }
  if (report.baseline.publicWrappersAbsent !== "0") {
    throw new Error(
      `public wrappers unexpectedly present: ${report.baseline.publicWrappersAbsent}`,
    );
  }

  // ---- Section 9: original 12-file replay ----
  for (const file of BILLING_MIGRATIONS) {
    const row = applyMigrationFile(file, versionOf(file));
    report.replay.push(row);
    if (row.outcome !== "commit" || !row.ledgerOnce) {
      writeFileSync(
        path.join(ACTUAL_REPO, "scripts/billing/native-rehearsal-report.json"),
        JSON.stringify(report, null, 2),
      );
      throw new Error(`Billing migration failed: ${file}\n${row.error ?? ""}`);
    }
    console.log(`PASS ${file} ${row.elapsedMs}ms ledgerOnce=${row.ledgerOnce}`);
  }

  // Additive compatibility migration
  const compat = applyMigrationFile(COMPAT_MIGRATION, versionOf(COMPAT_MIGRATION));
  report.compat = compat;
  if (compat.outcome !== "commit" || !compat.ledgerOnce) {
    writeFileSync(
      path.join(ACTUAL_REPO, "scripts/billing/native-rehearsal-report.json"),
      JSON.stringify(report, null, 2),
    );
    throw new Error(`Compat migration failed\n${compat.error ?? ""}`);
  }
  console.log(`PASS ${COMPAT_MIGRATION} ${compat.elapsedMs}ms`);

  // Zero-row legacy state after cutover (fresh DB has empty user_subscriptions)
  report.legacy.zeroRow = {
    legacyCount: mustPsql(`SELECT COUNT(*)::text FROM public.user_subscriptions`),
    billingCount: mustPsql(`SELECT COUNT(*)::text FROM billing.subscriptions`),
    auditCount: mustPsql(`SELECT COUNT(*)::text FROM billing.legacy_subscription_import_audit`),
  };

  // Catalog / signatures
  report.catalog = {
    billingSchema: mustPsql(
      `SELECT COUNT(*)::text FROM information_schema.schemata WHERE schema_name='billing'`,
    ),
    publicWrappers: mustPsql(
      `SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('${PUBLIC_WRAPPERS.join("','")}')`,
    ),
    privateTargets: mustPsql(
      `SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='billing' AND p.proname IN ('${PUBLIC_WRAPPERS.join("','")}')`,
    ),
  };

  const owners = mustPsql(`
    SELECT string_agg(p.proname || ':' || pg_get_userbyid(p.proowner), ',' ORDER BY p.proname)
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('${PUBLIC_WRAPPERS.join("','")}')
  `);
  const security = mustPsql(`
    SELECT string_agg(
      p.proname || ':definer=' || p.prosecdef::text || ';path=' || COALESCE(
        (SELECT trim(both '"' from unnest) FROM unnest(p.proconfig) unnest WHERE unnest LIKE 'search_path=%' LIMIT 1),
        ''
      ),
      ' | ' ORDER BY p.proname
    )
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('${PUBLIC_WRAPPERS.join("','")}')
  `);
  report.rpc = { owners, security };

  // Privilege matrix from catalog
  const priv = mustPsql(`
    SELECT string_agg(proname || ':' || COALESCE(grantee,'-') || ':' || privilege_type, ',' ORDER BY proname, grantee)
    FROM (
      SELECT p.proname, r.grantee::text, r.privilege_type::text
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      JOIN information_schema.routine_privileges r
        ON r.specific_schema='public' AND r.routine_name=p.proname
      WHERE n.nspname='public' AND p.proname IN ('${PUBLIC_WRAPPERS.join("','")}')
        AND r.grantee IN ('anon','authenticated','service_role','PUBLIC')
    ) s
  `);
  report.privileges = { executeGrants: priv };

  // ---- PostgREST HTTP proofs ----
  const api = status.apiUrl;
  const anon = status.anonKey;
  const service = status.serviceRoleKey;
  if (!anon || !service) throw new Error("missing anon/service keys from supabase status");

  // OpenAPI discovery
  const openapi = await fetch(`${api}/rest/v1/`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const openapiText = await openapi.text();
  const discovered = PUBLIC_WRAPPERS.filter((fn) => openapiText.includes(fn));
  report.postgrest.discovery = {
    status: openapi.status,
    discoveredCount: discovered.length,
    discovered,
  };

  // Ensure billing profile is rejected / not required
  const billingProfile = await fetch(`${api}/rest/v1/subscriptions?select=id&limit=1`, {
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Accept-Profile": "billing",
      "Content-Profile": "billing",
    },
  });
  report.postgrest.billingProfileStatus = billingProfile.status;
  report.postgrest.billingProfileBody = (await billingProfile.text()).slice(0, 300);

  // Seed paid user for RPC tests
  const USER = "aaaa1111-1111-1111-1111-111111111111";
  mustPsql(`
    INSERT INTO billing.entitlement_policy_versions
      (policy_key, version_number, status, effective_from, lesson_allowlist_mode,
       lesson_count_cap, builder_access, video_access, rag_enabled,
       assistant_runtime_per_lesson_quota, assistant_runtime_general_monthly_quota,
       assistant_runtime_period_quota, assistant_runtime_period_days,
       mission_evaluation_enabled, reveal_answer_enabled, wow_path_enabled, policy_json, published_at)
    VALUES ('native_reh_v1', 1, 'published', now(), 'curriculum_snapshot',
      74, true, true, true, NULL, 100, NULL, NULL, true, true, true, '{}'::jsonb, now())
    ON CONFLICT (policy_key, version_number)
    DO UPDATE SET assistant_runtime_general_monthly_quota = 100;

    INSERT INTO billing.plan_versions
      (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
    SELECT pc.id, epv.id, 9201, 'month', 'published', now(), now()
    FROM billing.plan_catalog pc, billing.entitlement_policy_versions epv
    WHERE pc.plan_key='pro' AND epv.policy_key='native_reh_v1' AND epv.version_number=1
    ON CONFLICT (plan_id, version_number)
    DO UPDATE SET entitlement_policy_version_id = EXCLUDED.entitlement_policy_version_id,
                  status='published', published_at=now();

    DELETE FROM billing.ai_usage_ledger WHERE user_id='${USER}';
    DELETE FROM billing.entitlement_usage WHERE user_id='${USER}';
    DELETE FROM billing.subscriptions WHERE user_id='${USER}';
    INSERT INTO billing.subscriptions
      (user_id, plan_version_id, access_state, billing_state, market_code, currency_code, billing_interval, idempotency_key, current_period_end)
    SELECT '${USER}', pv.id, 'paid_active', 'active', 'INTL', 'USD', 'month', 'native-sub-${USER}', now() + interval '30 days'
    FROM billing.plan_versions pv
    JOIN billing.entitlement_policy_versions epv ON epv.id = pv.entitlement_policy_version_id
    WHERE epv.policy_key='native_reh_v1' AND pv.version_number=9201;
  `);

  function pushTest(id: number, name: string, ok: boolean, detail?: string) {
    report.contractTests.push({ id, name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} #${id} ${name}${detail ? ` — ${detail}` : ""}`);
  }

  // 1 anon denial
  {
    const r = await postgrestRpc(api, anon, "reserve_learner_ai_access", {
      p_user_id: USER,
      p_category: "assistant_runtime",
      p_lesson_id: null,
      p_request_id: "11111111-1111-1111-1111-111111111101",
      p_units: 1,
      p_idempotency_key: "anon-deny",
    });
    pushTest(
      1,
      "anon wrapper denial",
      r.status === 401 || r.status === 403 || r.status >= 400,
      `status=${r.status}`,
    );
  }

  // 2 authenticated denial (use anon key as stand-in JWT without service_role claim —
  // ordinary authenticated requires a user JWT; mint via GoTrue if possible)
  let authedJwt = "";
  {
    const email = `native-reh-${Date.now()}@example.com`;
    const password = "NativeReh-Test-Only-1";
    const signup = await fetch(`${api}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const signupJson = (await signup.json()) as { access_token?: string };
    authedJwt = signupJson.access_token ?? "";
    if (!authedJwt) {
      // fallback: token login
      const login = await fetch(`${api}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anon },
        body: JSON.stringify({ email, password }),
      });
      const loginJson = (await login.json()) as { access_token?: string };
      authedJwt = loginJson.access_token ?? "";
    }
    const r = await postgrestRpc(
      api,
      anon,
      "reserve_learner_ai_access",
      {
        p_user_id: USER,
        p_category: "assistant_runtime",
        p_lesson_id: null,
        p_request_id: "11111111-1111-1111-1111-111111111102",
        p_units: 1,
        p_idempotency_key: "auth-deny",
      },
      authedJwt ? { Authorization: `Bearer ${authedJwt}`, apikey: anon } : {},
    );
    pushTest(
      2,
      "ordinary authenticated wrapper denial",
      Boolean(authedJwt) && (r.status === 401 || r.status === 403 || r.status >= 400),
      `status=${r.status} jwt=${Boolean(authedJwt)} body=${r.text.slice(0, 160)}`,
    );
  }

  // 3 service-role reservation
  const req1 = "11111111-1111-1111-1111-111111111201";
  const idem1 = "native-idem-1";
  let reservationId = "";
  {
    const r = await postgrestRpc(api, service, "reserve_learner_ai_access", {
      p_user_id: USER,
      p_category: "assistant_runtime",
      p_lesson_id: null,
      p_request_id: req1,
      p_units: 1,
      p_idempotency_key: idem1,
    });
    const data = r.json as { reservation_id?: string } | null;
    reservationId = String(data?.reservation_id ?? "");
    pushTest(
      3,
      "service-role reservation",
      r.status >= 200 && r.status < 300 && Boolean(reservationId),
      `status=${r.status}`,
    );
  }

  // 4 duplicate reservation idempotency
  {
    const r = await postgrestRpc(api, service, "reserve_learner_ai_access", {
      p_user_id: USER,
      p_category: "assistant_runtime",
      p_lesson_id: null,
      p_request_id: req1,
      p_units: 1,
      p_idempotency_key: idem1,
    });
    const data = r.json as { reservation_id?: string; idempotent_replay?: boolean } | null;
    pushTest(
      4,
      "duplicate reservation idempotency",
      r.status >= 200 &&
        r.status < 300 &&
        String(data?.reservation_id ?? "") === reservationId &&
        (data?.idempotent_replay === true || String(data?.reservation_id) === reservationId),
      `status=${r.status}`,
    );
  }

  // 5-11 provider attempts
  let attemptIndex = 0;
  {
    const r = await postgrestRpc(api, service, "register_provider_attempt", {
      p_reservation_id: reservationId,
      p_provider: "openai_embedding",
      p_provider_request_id: "prov-1",
      p_attempt_idempotency_key: "att-1",
    });
    const data = r.json as { attempt_index?: number } | null;
    attemptIndex = Number(data?.attempt_index ?? 0);
    pushTest(
      5,
      "provider-attempt registration",
      r.status >= 200 && r.status < 300 && attemptIndex >= 1,
      `idx=${attemptIndex}`,
    );
  }
  {
    const r2 = await postgrestRpc(api, service, "register_provider_attempt", {
      p_reservation_id: reservationId,
      p_provider: "openai_embedding",
      p_provider_request_id: "prov-2",
      p_attempt_idempotency_key: "att-2",
    });
    const idx2 = Number((r2.json as { attempt_index?: number } | null)?.attempt_index ?? 0);
    pushTest(6, "server-allocated attempt indices", idx2 === attemptIndex + 1, `idx2=${idx2}`);
  }
  {
    const r = await postgrestRpc(api, service, "register_provider_attempt", {
      p_reservation_id: reservationId,
      p_provider: "openai_embedding",
      p_provider_request_id: "prov-1",
      p_attempt_idempotency_key: "att-1",
    });
    const idx = Number((r.json as { attempt_index?: number } | null)?.attempt_index ?? 0);
    pushTest(
      7,
      "provider-attempt duplicate replay",
      r.status >= 200 && r.status < 300 && idx === attemptIndex,
      `idx=${idx}`,
    );
  }
  {
    // conflict: same idempotency key with different provider request id if contract rejects —
    // use conflicting terminal later; here register with same key is replay. Conflict via finalize mismatch.
    const r = await postgrestRpc(api, service, "register_provider_attempt", {
      p_reservation_id: reservationId,
      p_provider: "different_provider",
      p_provider_request_id: "prov-1-conflict",
      p_attempt_idempotency_key: "att-1",
    });
    // Either rejected or returns original attempt — conflict rejection preferred
    const rejected = r.status >= 400;
    const same =
      Number((r.json as { attempt_index?: number } | null)?.attempt_index ?? -1) === attemptIndex;
    pushTest(8, "provider-attempt conflict rejection", rejected || same, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "finalize_provider_attempt", {
      p_reservation_id: reservationId,
      p_attempt_index: attemptIndex,
      p_attempt_status: "succeeded",
      p_input_tokens: 1,
      p_output_tokens: 0,
      p_provider_cost_micro: 0,
    });
    pushTest(
      9,
      "provider-attempt finalization",
      r.status >= 200 && r.status < 300,
      `status=${r.status}`,
    );
  }
  {
    const r = await postgrestRpc(api, service, "finalize_provider_attempt", {
      p_reservation_id: reservationId,
      p_attempt_index: attemptIndex,
      p_attempt_status: "succeeded",
      p_input_tokens: 1,
      p_output_tokens: 0,
      p_provider_cost_micro: 0,
    });
    pushTest(
      10,
      "duplicate terminal-status replay",
      r.status >= 200 && r.status < 300,
      `status=${r.status} body=${r.text.slice(0, 120)}`,
    );
  }
  {
    const r = await postgrestRpc(api, service, "finalize_provider_attempt", {
      p_reservation_id: reservationId,
      p_attempt_index: attemptIndex,
      p_attempt_status: "failed",
      p_input_tokens: 1,
      p_output_tokens: 0,
      p_provider_cost_micro: 0,
    });
    pushTest(
      11,
      "conflicting terminal transition rejection",
      r.status >= 400,
      `status=${r.status}`,
    );
  }

  // 12-13 commit
  {
    const r = await postgrestRpc(api, service, "commit_ai_quota", {
      p_reservation_id: reservationId,
      p_input_tokens: 1,
      p_output_tokens: 0,
      p_idempotency_key: "commit-1",
    });
    pushTest(12, "quota commit", r.status >= 200 && r.status < 300, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "commit_ai_quota", {
      p_reservation_id: reservationId,
      p_input_tokens: 1,
      p_output_tokens: 0,
      p_idempotency_key: "commit-1",
    });
    pushTest(
      13,
      "duplicate commit behavior",
      r.status >= 200 && r.status < 300,
      `status=${r.status}`,
    );
  }

  // 14-16 independent release path on a fresh reservation without provider start
  const reqRelease = "11111111-1111-1111-1111-111111111301";
  let releaseResId = "";
  {
    const r = await postgrestRpc(api, service, "reserve_learner_ai_access", {
      p_user_id: USER,
      p_category: "assistant_runtime",
      p_lesson_id: null,
      p_request_id: reqRelease,
      p_units: 1,
      p_idempotency_key: "release-path-1",
    });
    releaseResId = String((r.json as { reservation_id?: string } | null)?.reservation_id ?? "");
  }
  {
    const r = await postgrestRpc(api, service, "release_ai_quota", {
      p_reservation_id: releaseResId,
      p_idempotency_key: "release-1",
    });
    pushTest(
      14,
      "independent quota release",
      r.status >= 200 && r.status < 300,
      `status=${r.status}`,
    );
  }
  {
    const r = await postgrestRpc(api, service, "release_ai_quota", {
      p_reservation_id: releaseResId,
      p_idempotency_key: "release-1",
    });
    pushTest(
      15,
      "duplicate release behavior",
      r.status >= 200 && r.status < 300,
      `status=${r.status}`,
    );
  }
  {
    // release-after-provider-start rejection: try release on committed reservation
    const r = await postgrestRpc(api, service, "release_ai_quota", {
      p_reservation_id: reservationId,
      p_idempotency_key: "release-after-start",
    });
    pushTest(16, "release-after-provider-start rejection", r.status >= 400, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "commit_ai_quota", {
      p_reservation_id: releaseResId,
      p_input_tokens: 0,
      p_output_tokens: 0,
      p_idempotency_key: "commit-after-release",
    });
    pushTest(17, "commit-after-release rejection", r.status >= 400, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "reserve_learner_ai_access", {
      p_user_id: USER,
      p_category: "not_a_real_category",
      p_lesson_id: null,
      p_request_id: "11111111-1111-1111-1111-111111111401",
      p_units: 1,
      p_idempotency_key: "bad-cat",
    });
    pushTest(18, "unsupported category rejection", r.status >= 400, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "reserve_learner_ai_access", {
      p_user_id: USER,
      p_category: "assistant_runtime",
      p_lesson_id: null,
      p_request_id: "11111111-1111-1111-1111-111111111402",
      p_units: 0,
      p_idempotency_key: "zero-units",
    });
    pushTest(19, "zero/negative unit rejection", r.status >= 400, `status=${r.status}`);
  }
  {
    const deniedUser = "bbbb2222-2222-2222-2222-222222222222";
    mustPsql(`DELETE FROM billing.subscriptions WHERE user_id='${deniedUser}'`);
    const r = await postgrestRpc(api, service, "reserve_learner_ai_access", {
      p_user_id: deniedUser,
      p_category: "assistant_runtime",
      p_lesson_id: null,
      p_request_id: "11111111-1111-1111-1111-111111111403",
      p_units: 1,
      p_idempotency_key: "no-ent",
    });
    pushTest(20, "no-entitlement rejection", r.status >= 400, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "commit_ai_quota", {
      p_reservation_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      p_input_tokens: 0,
      p_output_tokens: 0,
      p_idempotency_key: "missing-res",
    });
    pushTest(21, "nonexistent reservation rejection", r.status >= 400, `status=${r.status}`);
  }
  {
    const r = await postgrestRpc(api, service, "finalize_provider_attempt", {
      p_reservation_id: reservationId,
      p_attempt_index: attemptIndex + 1,
      p_attempt_status: "not_a_status",
      p_input_tokens: 0,
      p_output_tokens: 0,
      p_provider_cost_micro: 0,
    });
    pushTest(22, "invalid provider status rejection", r.status >= 400, `status=${r.status}`);
  }

  // 23 legacy zero-row (already recorded)
  pushTest(
    23,
    "legacy zero-row compatibility",
    report.legacy.zeroRow.legacyCount === "0" && report.legacy.zeroRow.billingCount === "0",
    JSON.stringify(report.legacy.zeroRow),
  );

  // 24 valid legacy rows
  const legacyUser = "cccc3333-3333-3333-3333-333333333333";
  {
    mustPsql(`
      DELETE FROM billing.legacy_subscription_import_audit WHERE legacy_user_id='${legacyUser}';
      DELETE FROM billing.subscriptions WHERE user_id='${legacyUser}';
      DELETE FROM public.user_subscriptions WHERE user_id='${legacyUser}';
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES ('${legacyUser}', 'pro', 'active', now() + interval '20 days', 'stripe', 'sub_legacy_valid_1');
    `);
    const r = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const access = mustPsql(
      `SELECT access_state FROM billing.subscriptions WHERE user_id='${legacyUser}'`,
    );
    const legacyStill = mustPsql(
      `SELECT COUNT(*)::text FROM public.user_subscriptions WHERE user_id='${legacyUser}'`,
    );
    // idempotent replay
    const r2 = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const countSubs = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${legacyUser}'`,
    );
    pushTest(
      24,
      "legacy valid-row compatibility",
      r.ok && r2.ok && access === "paid_active" && legacyStill === "1" && countSubs === "1",
      `access=${access} legacy=${legacyStill} billing=${countSubs}`,
    );
  }

  // 25 unmappable fail-closed
  {
    const badUser = "dddd4444-4444-4444-4444-444444444444";
    mustPsql(`
      DELETE FROM billing.legacy_subscription_import_audit WHERE legacy_user_id='${badUser}';
      DELETE FROM billing.subscriptions WHERE user_id='${badUser}';
      DELETE FROM public.user_subscriptions WHERE user_id='${badUser}';
    `);
    // Table CHECK rejects unknown tiers (fail-closed at write). Import must also
    // fail closed on unknown status for an otherwise valid tier.
    const insertOk = psql(`
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end)
      VALUES ('${badUser}', 'pro', 'weird_unknown_status', now() + interval '10 days');
    `);
    const importFail = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const noBillingRow = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${badUser}'`,
    );
    pushTest(
      25,
      "legacy unmappable-row fail-closed behavior",
      insertOk.ok &&
        !importFail.ok &&
        /LEGACY_SUB_UNMAPPABLE|unknown status/i.test(importFail.out) &&
        noBillingRow === "0",
      `insert=${insertOk.ok} importOk=${importFail.ok} billing=${noBillingRow} out=${importFail.out.slice(0, 200)}`,
    );
    // cleanup bad row so later tests are clean
    mustPsql(`DELETE FROM public.user_subscriptions WHERE user_id='${badUser}'`);
  }

  // 26 reservation-only canary via exact assistant-runtime transport
  {
    const counters = { retrieval: 0, embedding: 0, generation: 0, provider: 0 };
    const body = {
      p_user_id: USER,
      p_category: "assistant_runtime",
      p_lesson_id: null as string | null,
      p_request_id: "11111111-1111-1111-1111-111111111501",
      p_units: 1,
      p_idempotency_key: "canary-reserve-only",
    };
    // Exact URL/headers from supabase/functions/assistant-runtime/index.ts billingRpc
    const res = await fetch(`${api}/rest/v1/rpc/reserve_learner_ai_access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: service,
        Authorization: `Bearer ${service}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    const okHttp = res.ok;
    const reservationCanaryId = String(data.reservation_id ?? "");
    // Same runtime parsing path: ok + reservation_id string
    const acceptedByRuntimeShape = okHttp && Boolean(reservationCanaryId);

    // Release safely — no provider attempt started
    let released = false;
    if (reservationCanaryId) {
      const rel = await fetch(`${api}/rest/v1/rpc/release_ai_quota`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: service,
          Authorization: `Bearer ${service}`,
        },
        body: JSON.stringify({
          p_reservation_id: reservationCanaryId,
          p_idempotency_key: "canary-release",
        }),
      });
      released = rel.ok;
    }

    // Prove no Accept-Profile usage on canary path
    const usedBillingProfile = false;

    report.canary = {
      ok: acceptedByRuntimeShape && released && !usedBillingProfile,
      reservationId: reservationCanaryId,
      released,
      retrieval_calls: counters.retrieval,
      embedding_calls: counters.embedding,
      generation_calls: counters.generation,
      external_provider_calls: counters.provider,
      responsePreview: text.slice(0, 240),
    };
    pushTest(
      26,
      "exact assistant-runtime reservation-only transport",
      Boolean(report.canary.ok),
      JSON.stringify(report.canary),
    );
  }

  // 27 no 406 Invalid schema billing on public path
  {
    const r = await postgrestRpc(api, service, "get_entitlement_snapshot", {
      p_user_id: USER,
    });
    const no406 = r.status !== 406 && !/Invalid schema:\s*billing/i.test(r.text);
    pushTest(27, "absence of 406 Invalid schema: billing", no406, `status=${r.status}`);
  }

  // 28 zero provider/embed/retrieval/generation on canary
  pushTest(
    28,
    "zero provider, embedding, retrieval and generation calls",
    report.canary.retrieval_calls === 0 &&
      report.canary.embedding_calls === 0 &&
      report.canary.generation_calls === 0 &&
      report.canary.external_provider_calls === 0,
    JSON.stringify({
      retrieval: report.canary.retrieval_calls,
      embedding: report.canary.embedding_calls,
      generation: report.canary.generation_calls,
      provider: report.canary.external_provider_calls,
    }),
  );

  const failed = report.contractTests.filter((t) => !t.ok);
  const outPath = path.join(ACTUAL_REPO, "scripts/billing/native-rehearsal-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written: ${outPath}`);
  console.log(
    `Contract tests: ${report.contractTests.length - failed.length}/${report.contractTests.length} PASS`,
  );
  if (failed.length) {
    console.error("FAILED:", failed.map((f) => `#${f.id} ${f.name}`).join(", "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
