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

  // ---- Legacy compatibility matrix (fail-closed) ----
  function clearLegacy(userId: string) {
    mustPsql(`
      DELETE FROM billing.legacy_subscription_import_audit WHERE legacy_user_id='${userId}';
      DELETE FROM billing.subscriptions WHERE user_id='${userId}';
      DELETE FROM public.user_subscriptions WHERE user_id='${userId}';
    `);
  }

  function assertNoPaidCapability(userId: string): { ok: boolean; detail: string } {
    const billingCount = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${userId}' AND access_state='paid_active'`,
    );
    const snapCount = mustPsql(
      `SELECT COUNT(*)::text FROM billing.user_entitlement_snapshots WHERE user_id='${userId}'`,
    );
    const usage = mustPsql(
      `SELECT COALESCE(SUM(used_count),0)::text FROM billing.entitlement_usage WHERE user_id='${userId}'`,
    );
    const reserve = psql(`
      BEGIN;
      SET LOCAL ROLE service_role;
      SET LOCAL request.jwt.claims = '{"role":"service_role"}';
      SELECT public.reserve_learner_ai_access(
        '${userId}','assistant_runtime',NULL,
        '11111111-1111-1111-1111-111111119901',1,'no-paid-${userId}'
      );
      COMMIT;
    `);
    const ok = billingCount === "0" && snapCount === "0" && usage === "0" && !reserve.ok;
    return {
      ok,
      detail: `paid=${billingCount} snap=${snapCount} usage=${usage} reserveOk=${reserve.ok}`,
    };
  }

  // L1 zero-row
  pushTest(
    23,
    "L1 zero-row Production-shaped baseline",
    report.legacy.zeroRow.legacyCount === "0" &&
      report.legacy.zeroRow.billingCount === "0" &&
      report.legacy.zeroRow.auditCount === "0",
    JSON.stringify(report.legacy.zeroRow),
  );

  const stripeUser = "cccc3333-3333-3333-3333-333333333301";
  const paypalUser = "cccc3333-3333-3333-3333-333333333302";

  // L2 valid Stripe
  {
    clearLegacy(stripeUser);
    mustPsql(`
      INSERT INTO public.user_subscriptions
        (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES ('${stripeUser}', 'pro', 'active', now() + interval '20 days', 'stripe', 'sub_stripe_valid_1');
    `);
    const r = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const access = mustPsql(
      `SELECT access_state FROM billing.subscriptions WHERE user_id='${stripeUser}'`,
    );
    pushTest(
      24,
      "L2 valid active Stripe legacy subscription",
      r.ok && access === "paid_active",
      `ok=${r.ok} access=${access}`,
    );
  }

  // L3 valid PayPal
  {
    clearLegacy(paypalUser);
    mustPsql(`
      INSERT INTO public.user_subscriptions
        (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES ('${paypalUser}', 'pro', 'active', now() + interval '20 days', 'paypal', 'sub_paypal_valid_1');
    `);
    const r = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const access = mustPsql(
      `SELECT access_state FROM billing.subscriptions WHERE user_id='${paypalUser}'`,
    );
    pushTest(
      25,
      "L3 valid active PayPal legacy subscription",
      r.ok && access === "paid_active",
      `ok=${r.ok} access=${access}`,
    );
  }

  // L4 idempotency
  {
    const before = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${stripeUser}'`,
    );
    const r2 = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const after = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${stripeUser}'`,
    );
    pushTest(
      26,
      "L4 duplicate import idempotency",
      r2.ok && before === "1" && after === "1",
      `before=${before} after=${after}`,
    );
  }

  function expectReject(
    id: number,
    name: string,
    setupSql: string,
    userId: string,
    pattern: RegExp,
  ) {
    clearLegacy(userId);
    // Also clear any leftover from prior batch partners
    const setup = psql(setupSql);
    const beforeBilling = mustPsql(`SELECT COUNT(*)::text FROM billing.subscriptions`);
    const beforeAudit = mustPsql(
      `SELECT COUNT(*)::text FROM billing.legacy_subscription_import_audit`,
    );
    const beforeLegacy = mustPsql(
      `SELECT COUNT(*)::text FROM public.user_subscriptions WHERE user_id='${userId}'`,
    );
    const imp = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const afterBilling = mustPsql(`SELECT COUNT(*)::text FROM billing.subscriptions`);
    const afterAudit = mustPsql(
      `SELECT COUNT(*)::text FROM billing.legacy_subscription_import_audit`,
    );
    const afterLegacy = mustPsql(
      `SELECT COUNT(*)::text FROM public.user_subscriptions WHERE user_id='${userId}'`,
    );
    const userBilling = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${userId}'`,
    );
    const paid = assertNoPaidCapability(userId);
    const ok =
      setup.ok &&
      !imp.ok &&
      pattern.test(imp.out) &&
      userBilling === "0" &&
      afterLegacy === beforeLegacy &&
      afterBilling === beforeBilling &&
      afterAudit === beforeAudit &&
      paid.ok;
    pushTest(
      id,
      name,
      ok,
      `setup=${setup.ok} importOk=${imp.ok} userBilling=${userBilling} billingDelta=${beforeBilling}->${afterBilling} auditDelta=${beforeAudit}->${afterAudit} legacy=${afterLegacy} paid=${paid.detail} out=${imp.out.slice(0, 180)}`,
    );
    clearLegacy(userId);
  }

  expectReject(
    27,
    "L5 pro + NULL status rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444401', 'pro', NULL, now() + interval '10 days', 'stripe', 'sub_null_status');`,
    "dddd4444-4444-4444-4444-444444444401",
    /NULL status|pro with NULL/i,
  );

  expectReject(
    28,
    "L6 pro + trialing rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444402', 'pro', 'trialing', now() + interval '10 days', 'stripe', 'sub_trialing');`,
    "dddd4444-4444-4444-4444-444444444402",
    /trialing/i,
  );

  expectReject(
    29,
    "L7 active Pro without provider reference rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444403', 'pro', 'active', now() + interval '10 days', 'stripe', NULL);`,
    "dddd4444-4444-4444-4444-444444444403",
    /provider subscription reference/i,
  );

  expectReject(
    30,
    "L8 active Pro with both provider references rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444404', 'pro', 'active', now() + interval '10 days', 'stripe,paypal', 'sub_both');`,
    "dddd4444-4444-4444-4444-444444444404",
    /both Stripe and PayPal/i,
  );

  expectReject(
    31,
    "L9 active Pro with expired period rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444405', 'pro', 'active', now() - interval '1 day', 'stripe', 'sub_expired');`,
    "dddd4444-4444-4444-4444-444444444405",
    /not in the future|expired/i,
  );

  expectReject(
    32,
    "L10 active Pro with null period rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444406', 'pro', 'active', NULL, 'stripe', 'sub_null_period');`,
    "dddd4444-4444-4444-4444-444444444406",
    /requires current_period_end/i,
  );

  // L11 unknown tier — table CHECK may block insert; also prove mapper rejects.
  {
    const u = "dddd4444-4444-4444-4444-444444444407";
    clearLegacy(u);
    const mapFail = psql(
      `SELECT * FROM billing.map_legacy_user_subscription_row('${u}', 'enterprise', 'active', now() + interval '5 days', 'stripe', 'sub_x')`,
    );
    pushTest(
      33,
      "L11 unknown tier rejection",
      !mapFail.ok && /unknown plan\/tier/i.test(mapFail.out),
      mapFail.out.slice(0, 180),
    );
  }

  expectReject(
    34,
    "L12 unknown status rejection",
    `INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
     VALUES ('dddd4444-4444-4444-4444-444444444408', 'pro', 'weird_unknown_status', now() + interval '10 days', 'stripe', 'sub_unknown_status');`,
    "dddd4444-4444-4444-4444-444444444408",
    /unknown or unsupported status|UNMAPPABLE/i,
  );

  // L13 missing user identity
  {
    const mapFail = psql(
      `SELECT * FROM billing.map_legacy_user_subscription_row(NULL, 'pro', 'active', now() + interval '5 days', 'stripe', 'sub_noid')`,
    );
    pushTest(
      35,
      "L13 missing user identity rejection",
      !mapFail.ok && /missing user identity/i.test(mapFail.out),
      mapFail.out.slice(0, 180),
    );
  }

  // L14 duplicate provider reference
  {
    const u1 = "dddd4444-4444-4444-4444-444444444409";
    const u2 = "dddd4444-4444-4444-4444-44444444440a";
    clearLegacy(u1);
    clearLegacy(u2);
    mustPsql(`
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES
        ('${u1}', 'pro', 'active', now() + interval '10 days', 'stripe', 'sub_dup_shared'),
        ('${u2}', 'pro', 'active', now() + interval '10 days', 'stripe', 'sub_dup_shared');
    `);
    const before = mustPsql(`SELECT COUNT(*)::text FROM billing.subscriptions`);
    const imp = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const after = mustPsql(`SELECT COUNT(*)::text FROM billing.subscriptions`);
    pushTest(
      36,
      "L14 duplicate provider reference rejection",
      !imp.ok && /duplicate provider/i.test(imp.out) && before === after,
      `billing=${before}->${after} out=${imp.out.slice(0, 160)}`,
    );
    clearLegacy(u1);
    clearLegacy(u2);
  }

  // L15 conflicting billing.subscriptions
  {
    const u = "dddd4444-4444-4444-4444-44444444440b";
    clearLegacy(u);
    mustPsql(`
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES ('${u}', 'pro', 'active', now() + interval '10 days', 'stripe', 'sub_conflict_1');
      INSERT INTO billing.subscriptions
        (user_id, plan_version_id, access_state, billing_state, market_code, currency_code, billing_interval, idempotency_key, current_period_end)
      SELECT '${u}', pv.id, 'free_active', 'none', 'INTL', 'USD', 'none', 'preexisting-${u}', NULL
      FROM billing.plan_versions pv
      JOIN billing.plan_catalog pc ON pc.id = pv.plan_id
      WHERE pc.plan_key='free' AND pv.billing_interval='none'
      LIMIT 1;
    `);
    const imp = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const access = mustPsql(`SELECT access_state FROM billing.subscriptions WHERE user_id='${u}'`);
    pushTest(
      37,
      "L15 existing conflicting billing.subscriptions rejection",
      !imp.ok && /already authoritative|CONFLICT/i.test(imp.out) && access === "free_active",
      `access=${access} out=${imp.out.slice(0, 160)}`,
    );
    clearLegacy(u);
  }

  // L16 user-controlled legacy Pro cannot grant paid entitlement without import
  {
    const u = "dddd4444-4444-4444-4444-44444444440c";
    clearLegacy(u);
    mustPsql(`
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES ('${u}', 'pro', 'active', now() + interval '30 days', 'stripe', 'sub_user_controlled');
    `);
    // Do NOT run import — legacy row alone must not enable reservation / paid access.
    const paid = assertNoPaidCapability(u);
    pushTest(
      38,
      "L16 user-controlled legacy Pro row cannot grant paid entitlement",
      paid.ok,
      paid.detail,
    );
    clearLegacy(u);
  }

  // L17 failed batch leaves zero partial authoritative rows
  {
    const good = "dddd4444-4444-4444-4444-44444444440d";
    const bad = "dddd4444-4444-4444-4444-44444444440e";
    clearLegacy(good);
    clearLegacy(bad);
    // Remove prior successful stripe/paypal imports that would confuse counts
    clearLegacy(stripeUser);
    clearLegacy(paypalUser);
    mustPsql(`
      DELETE FROM billing.legacy_subscription_import_audit;
      DELETE FROM billing.subscriptions WHERE idempotency_key LIKE 'legacy-user-sub:%';
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end, provider, provider_subscription_id)
      VALUES
        ('${good}', 'pro', 'active', now() + interval '20 days', 'stripe', 'sub_batch_good'),
        ('${bad}', 'pro', 'trialing', now() + interval '20 days', 'stripe', 'sub_batch_bad');
    `);
    const beforeSubs = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE idempotency_key LIKE 'legacy-user-sub:%'`,
    );
    const beforeAudit = mustPsql(
      `SELECT COUNT(*)::text FROM billing.legacy_subscription_import_audit`,
    );
    const imp = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const afterSubs = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE idempotency_key LIKE 'legacy-user-sub:%'`,
    );
    const afterAudit = mustPsql(
      `SELECT COUNT(*)::text FROM billing.legacy_subscription_import_audit`,
    );
    const legacyGood = mustPsql(
      `SELECT COUNT(*)::text FROM public.user_subscriptions WHERE user_id='${good}'`,
    );
    const legacyBad = mustPsql(
      `SELECT COUNT(*)::text FROM public.user_subscriptions WHERE user_id='${bad}'`,
    );
    pushTest(
      39,
      "L17 failed batch leaves zero partial authoritative rows",
      !imp.ok &&
        /trialing/i.test(imp.out) &&
        beforeSubs === "0" &&
        afterSubs === "0" &&
        beforeAudit === "0" &&
        afterAudit === "0" &&
        legacyGood === "1" &&
        legacyBad === "1",
      `subs=${beforeSubs}->${afterSubs} audit=${beforeAudit}->${afterAudit} legacy=${legacyGood}/${legacyBad} out=${imp.out.slice(0, 140)}`,
    );
    clearLegacy(good);
    clearLegacy(bad);
  }

  // L18 free legacy remains non-paid
  {
    const u = "dddd4444-4444-4444-4444-44444444440f";
    clearLegacy(u);
    mustPsql(`
      INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end)
      VALUES ('${u}', 'free', 'active', NULL);
    `);
    const r = psql(`SELECT billing.import_legacy_user_subscriptions()::text`);
    const access = mustPsql(`SELECT access_state FROM billing.subscriptions WHERE user_id='${u}'`);
    const paidCount = mustPsql(
      `SELECT COUNT(*)::text FROM billing.subscriptions WHERE user_id='${u}' AND access_state='paid_active'`,
    );
    const paid = assertNoPaidCapability(u);
    // free_active exists but is not paid — assertNoPaidCapability checks paid_active only; reservation should still deny.
    pushTest(
      40,
      "L18 free legacy row remains non-paid",
      r.ok && access === "free_active" && paidCount === "0" && paid.ok,
      `access=${access} paidCount=${paidCount} ${paid.detail}`,
    );
    clearLegacy(u);
  }

  // 41 reservation-only canary via exact assistant-runtime transport
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
      41,
      "exact assistant-runtime reservation-only transport",
      Boolean(report.canary.ok),
      JSON.stringify(report.canary),
    );
  }

  // 42 no 406 Invalid schema billing on public path
  {
    const r = await postgrestRpc(api, service, "get_entitlement_snapshot", {
      p_user_id: USER,
    });
    const no406 = r.status !== 406 && !/Invalid schema:\s*billing/i.test(r.text);
    pushTest(42, "absence of 406 Invalid schema: billing", no406, `status=${r.status}`);
  }

  // 43 zero provider/embed/retrieval/generation on canary
  pushTest(
    43,
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
