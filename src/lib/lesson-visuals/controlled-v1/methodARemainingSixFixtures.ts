/**
 * Disposable local-dev fixture setup for the Method A remaining-six capture run
 * (CR-LV-METHOD-A-QUERY-CONCEPT-NORMALIZATION-SIX-LESSON-SINGLE-RUN-20260728-01).
 *
 * Upserts lesson_progress / user_streaks / user_activity_time / mission_submissions
 * rows for exactly one synthetic user (identified via secrets/session.json) against
 * the disposable local Postgres (docker exec into the existing DB container).
 * Never touches any other user's data — every write is scoped by an explicit
 * user_id equal to the resolved session user. No migrations / schema changes.
 *
 * Never logs secret material. Returned before/after snapshots sanitize emails/UUIDs.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** Lessons upserted to lesson_progress status=completed for the fixture user. */
export const METHOD_A_REMAINING_SIX_FIXTURE_LESSON_IDS = [
  "builder-m1-l1-what-is-llm",
  "builder-m1-l2-tokens-training",
  "intro-m1-l1-what-is-ai",
  "intro-m1-l2-first-prompt",
  "intro-m1-l3-setup-your-ai",
  "intro-m1-l4-ai-can-cannot",
  "intro-m1-l5-ai-vs-software",
  "intro-m1-l6-learn-without-fear",
] as const;

export const METHOD_A_REMAINING_SIX_FIXTURE_STREAK = 5;
export const METHOD_A_REMAINING_SIX_FIXTURE_TOTAL_SECONDS = 7_500;
export const METHOD_A_REMAINING_SIX_FIXTURE_MISSION_ID =
  "method-a-remaining-six-fixture-mission-01";
export const METHOD_A_REMAINING_SIX_FIXTURE_MISSION_LESSON_ID = "builder-m7-l3-queries";

const FIXTURE_TABLES = [
  "lesson_progress",
  "user_streaks",
  "user_activity_time",
  "mission_submissions",
] as const;
type FixtureTable = (typeof FIXTURE_TABLES)[number];

export interface FixtureTableSnapshot {
  table: FixtureTable;
  rows: unknown[] | null;
  tableExists: boolean;
  error?: string;
}

export interface MethodARemainingSixFixturesResult {
  ok: boolean;
  before: Record<FixtureTable, FixtureTableSnapshot>;
  after: Record<FixtureTable, FixtureTableSnapshot>;
  errors: string[];
  userIdSanitized: string;
}

export interface SetupMethodARemainingSixFixturesOptions {
  secretsRoot?: string;
  lessonIds?: readonly string[];
  /** Injected for unit tests — when set, skips live docker/psql and returns ok with empty tables. */
  dryRun?: boolean;
  /** Override docker binary path. */
  dockerBin?: string;
  /** Override disposable DB container name. */
  dbContainer?: string;
  /** Injected SQL runner for tests. */
  sqlFn?: (sql: string) => string;
}

const DEFAULT_DB_CONTAINER = "supabase_db_masaarat-lv-method-a-pilot-20260727";

function defaultSecretsRoot(): string {
  return (
    process.env.METHOD_A_LOCAL_SECRETS_ROOT ?? "E:/Temp/masaarat-lv-method-a-pilot-20260727/secrets"
  );
}

function resolveFixtureUserId(
  secretsRoot: string,
): { ok: true; userId: string } | { ok: false; error: string } {
  const sessionPath = resolve(secretsRoot, "session.json");
  if (!existsSync(sessionPath)) {
    return { ok: false, error: `missing session.json at ${sessionPath}` };
  }
  try {
    const raw = readFileSync(sessionPath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as { user?: { id?: string } };
    const userId = parsed.user?.id;
    if (!userId || typeof userId !== "string") {
      return { ok: false, error: "session.json missing user.id" };
    }
    return { ok: true, userId };
  } catch (err) {
    return {
      ok: false,
      error: `failed to parse session.json: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Refresh the disposable synthetic-admin session via local GoTrue password grant.
 * Writes UTF-8 (no BOM) session.json. Never logs secret material.
 */
export async function refreshMethodARemainingSixSession(
  secretsRoot?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const root = secretsRoot ?? defaultSecretsRoot();
  const statusPath = resolve(root, "supabase-status.env");
  const synthPath = resolve(root, "synthetic-admin.env");
  const sessionPath = resolve(root, "session.json");
  if (!existsSync(statusPath) || !existsSync(synthPath)) {
    return { ok: false, error: "missing supabase-status.env or synthetic-admin.env" };
  }
  const status = loadEnvFile(statusPath);
  const synth = loadEnvFile(synthPath);
  const anon = status.ANON_KEY;
  const apiUrl = (status.API_URL ?? "http://127.0.0.1:55431").replace(/\/$/, "");
  const email = synth.SYNTH_EMAIL;
  const password = synth.SYNTH_PASSWORD;
  if (!anon || !email || !password) {
    return { ok: false, error: "missing ANON_KEY / SYNTH_EMAIL / SYNTH_PASSWORD" };
  }
  if (!/127\.0\.0\.1|localhost/.test(apiUrl)) {
    return { ok: false, error: "refusing non-loopback API_URL for session refresh" };
  }
  try {
    const res = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return { ok: false, error: `local auth refresh HTTP ${res.status}` };
    }
    const body = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      user?: { id?: string };
    };
    if (!body.access_token || !body.refresh_token || !body.user?.id) {
      return { ok: false, error: "local auth refresh missing token/user" };
    }
    const expiresIn = Number(body.expires_in ?? 3600);
    const payload = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      token_type: body.token_type ?? "bearer",
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      user: body.user,
    };
    writeFileSync(sessionPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) out[m[1]!.trim()] = m[2]!.trim();
  }
  return out;
}

export function sanitizeFixtureUserId(userId: string): string {
  const digest = createHash("sha256").update(userId).digest("hex").slice(0, 16);
  return `user_${digest}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeFixtureValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.includes("@")) return "[REDACTED_EMAIL]";
    if (UUID_RE.test(value)) return sanitizeFixtureUserId(value);
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeFixtureValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeFixtureValue(v);
    }
    return out;
  }
  return value;
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function createSqlRunner(
  options: SetupMethodARemainingSixFixturesOptions,
): (sql: string) => string {
  if (options.sqlFn) return options.sqlFn;
  const dockerBin =
    options.dockerBin ??
    process.env.METHOD_A_DOCKER_BIN ??
    "E:/Docker/Desktop/resources/bin/docker.exe";
  const container = options.dbContainer ?? DEFAULT_DB_CONTAINER;
  return (sql: string) => {
    return execFileSync(
      dockerBin,
      [
        "exec",
        "-i",
        container,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-t",
        "-A",
        "-c",
        sql,
      ],
      { encoding: "utf8" },
    ).trim();
  };
}

function fetchUserRows(
  runSql: (sql: string) => string,
  table: FixtureTable,
  userId: string,
): FixtureTableSnapshot {
  try {
    const raw = runSql(
      `SELECT COALESCE(json_agg(t), '[]'::json)::text FROM (SELECT * FROM public.${table} WHERE user_id = ${sqlLiteral(userId)}::uuid) t;`,
    );
    const rows = JSON.parse(raw || "[]") as unknown[];
    return { table, rows: Array.isArray(rows) ? rows : [], tableExists: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/does not exist|undefined_table|42P01/i.test(msg)) {
      return { table, rows: null, tableExists: false };
    }
    return { table, rows: null, tableExists: true, error: msg.slice(0, 240) };
  }
}

/**
 * Upserts fixture rows for exactly one disposable synthetic user via local Postgres.
 */
export async function setupMethodARemainingSixFixtures(
  options: SetupMethodARemainingSixFixturesOptions = {},
): Promise<MethodARemainingSixFixturesResult> {
  const errors: string[] = [];
  const secretsRoot = options.secretsRoot ?? defaultSecretsRoot();

  const emptySnapshot = (table: FixtureTable): FixtureTableSnapshot => ({
    table,
    rows: null,
    tableExists: false,
  });
  const emptyResult = (message: string): MethodARemainingSixFixturesResult => ({
    ok: false,
    before: Object.fromEntries(FIXTURE_TABLES.map((t) => [t, emptySnapshot(t)])) as Record<
      FixtureTable,
      FixtureTableSnapshot
    >,
    after: Object.fromEntries(FIXTURE_TABLES.map((t) => [t, emptySnapshot(t)])) as Record<
      FixtureTable,
      FixtureTableSnapshot
    >,
    errors: [message],
    userIdSanitized: "",
  });

  if (options.dryRun) {
    return {
      ok: true,
      before: Object.fromEntries(FIXTURE_TABLES.map((t) => [t, emptySnapshot(t)])) as Record<
        FixtureTable,
        FixtureTableSnapshot
      >,
      after: Object.fromEntries(FIXTURE_TABLES.map((t) => [t, emptySnapshot(t)])) as Record<
        FixtureTable,
        FixtureTableSnapshot
      >,
      errors: [],
      userIdSanitized: "user_dry_run",
    };
  }

  const refresh = await refreshMethodARemainingSixSession(secretsRoot);
  if (!refresh.ok) {
    return emptyResult(`session refresh failed: ${refresh.error}`);
  }

  const userResolved = resolveFixtureUserId(secretsRoot);
  if (!userResolved.ok) return emptyResult(userResolved.error);
  const { userId } = userResolved;
  const userIdSanitized = sanitizeFixtureUserId(userId);
  const lessonIds = options.lessonIds ?? METHOD_A_REMAINING_SIX_FIXTURE_LESSON_IDS;
  const runSql = createSqlRunner(options);

  const before: Record<FixtureTable, FixtureTableSnapshot> = Object.fromEntries(
    FIXTURE_TABLES.map((t) => [t, fetchUserRows(runSql, t, userId)]),
  ) as Record<FixtureTable, FixtureTableSnapshot>;

  try {
    const values = lessonIds
      .map(
        (lessonId) =>
          `(${sqlLiteral(userId)}::uuid, ${sqlLiteral(lessonId)}, 'completed'::lesson_status, now(), now())`,
      )
      .join(",\n");
    runSql(`
      INSERT INTO public.lesson_progress (user_id, lesson_id, status, created_at, updated_at)
      VALUES ${values}
      ON CONFLICT (user_id, lesson_id) DO UPDATE
      SET status = EXCLUDED.status, updated_at = now();
    `);
  } catch (err) {
    errors.push(
      `lesson_progress upsert failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    runSql(`
      INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, created_at, updated_at)
      VALUES (
        ${sqlLiteral(userId)}::uuid,
        ${METHOD_A_REMAINING_SIX_FIXTURE_STREAK},
        ${METHOD_A_REMAINING_SIX_FIXTURE_STREAK},
        ${sqlLiteral(todayIso)}::date,
        now(),
        now()
      )
      ON CONFLICT (user_id) DO UPDATE
      SET current_streak = EXCLUDED.current_streak,
          longest_streak = GREATEST(public.user_streaks.longest_streak, EXCLUDED.longest_streak),
          last_activity_date = EXCLUDED.last_activity_date,
          updated_at = now();
    `);
  } catch (err) {
    errors.push(`user_streaks upsert failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (before.user_activity_time.tableExists !== false) {
    try {
      runSql(`
        INSERT INTO public.user_activity_time (user_id, total_seconds, created_at, updated_at)
        VALUES (${sqlLiteral(userId)}::uuid, ${METHOD_A_REMAINING_SIX_FIXTURE_TOTAL_SECONDS}, now(), now())
        ON CONFLICT (user_id) DO UPDATE
        SET total_seconds = EXCLUDED.total_seconds, updated_at = now();
      `);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/does not exist|42P01/i.test(msg)) {
        errors.push(`user_activity_time upsert failed: ${msg}`);
      }
    }
  }

  if (before.mission_submissions.tableExists !== false) {
    try {
      const existing = runSql(`
        SELECT count(*)::text FROM public.mission_submissions
        WHERE user_id = ${sqlLiteral(userId)}::uuid AND status = 'passed';
      `);
      if (Number(existing || "0") < 1) {
        runSql(`
          INSERT INTO public.mission_submissions (
            user_id, mission_id, lesson_id, status, score, attempt_count, submitted_at, evaluated_at, created_at, updated_at
          ) VALUES (
            ${sqlLiteral(userId)}::uuid,
            ${sqlLiteral(METHOD_A_REMAINING_SIX_FIXTURE_MISSION_ID)},
            ${sqlLiteral(METHOD_A_REMAINING_SIX_FIXTURE_MISSION_LESSON_ID)},
            'passed'::mission_submission_status,
            100,
            1,
            now(),
            now(),
            now(),
            now()
          );
        `);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/does not exist|42P01/i.test(msg)) {
        errors.push(`mission_submissions upsert failed: ${msg}`);
      }
    }
  }

  const after: Record<FixtureTable, FixtureTableSnapshot> = Object.fromEntries(
    FIXTURE_TABLES.map((t) => [t, fetchUserRows(runSql, t, userId)]),
  ) as Record<FixtureTable, FixtureTableSnapshot>;

  const sanitizeSnapshot = (snap: FixtureTableSnapshot): FixtureTableSnapshot => ({
    ...snap,
    rows: snap.rows ? (sanitizeFixtureValue(snap.rows) as unknown[]) : snap.rows,
  });

  return {
    ok: errors.length === 0,
    before: Object.fromEntries(
      FIXTURE_TABLES.map((t) => [t, sanitizeSnapshot(before[t])]),
    ) as Record<FixtureTable, FixtureTableSnapshot>,
    after: Object.fromEntries(FIXTURE_TABLES.map((t) => [t, sanitizeSnapshot(after[t])])) as Record<
      FixtureTable,
      FixtureTableSnapshot
    >,
    errors,
    userIdSanitized,
  };
}
