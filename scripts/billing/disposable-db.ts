import { execSync, spawn } from "node:child_process";
import path from "node:path";

/**
 * Disposable Postgres helpers for billing concurrency proofs.
 * Prefers direct `psql` via PG* env (CI postgres/supabase), then Docker
 * supabase_db container (local).
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const DOCKER = "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe";

export function dockerBin(): string {
  return process.env.DOCKER_BIN ?? DOCKER;
}

export function run(cmd: string, cwd = REPO_ROOT): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  }).trim();
}

export function runAllowFail(cmd: string, cwd = REPO_ROOT): { ok: boolean; out: string } {
  try {
    return { ok: true, out: run(cmd, cwd) };
  } catch (e) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    return {
      ok: false,
      out: `${err.stdout?.toString() ?? ""}\n${err.stderr?.toString() ?? ""}`.trim(),
    };
  }
}

export function dockerReady(): boolean {
  return runAllowFail(`"${dockerBin()}" info`).ok;
}

export function directPsqlReady(): boolean {
  if (!process.env.PGHOST && !process.env.DATABASE_URL) return false;
  return runAllowFail(psqlCommand("SELECT 1")).ok;
}

export function disposableDbReady(): boolean {
  return directPsqlReady() || (dockerReady() && !!findSupabaseDbContainer());
}

function findSupabaseDbContainer(): string | null {
  if (!dockerReady()) return null;
  const out = runAllowFail(`"${dockerBin()}" ps --filter name=supabase_db --format {{.Names}}`).out;
  return (
    out
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean) ?? null
  );
}

export function supabaseDbContainer(): string {
  const name = findSupabaseDbContainer();
  if (!name) throw new Error("supabase_db container not found");
  return name;
}

function psqlCommand(sql: string): string {
  const escaped = sql.replace(/"/g, '\\"');
  if (process.env.DATABASE_URL) {
    return `psql "${process.env.DATABASE_URL}" -v ON_ERROR_STOP=1 -t -A -c "${escaped}"`;
  }
  if (process.env.PGHOST) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT ?? "5432";
    const user = process.env.PGUSER ?? "postgres";
    const db = process.env.PGDATABASE ?? "postgres";
    return `psql -h ${host} -p ${port} -U ${user} -d ${db} -v ON_ERROR_STOP=1 -t -A -c "${escaped}"`;
  }
  const container = supabaseDbContainer();
  return `"${dockerBin()}" exec -e PGPASSWORD=postgres ${container} psql -U postgres -d postgres -v ON_ERROR_STOP=1 -t -A -c "${escaped}"`;
}

export function psql(sql: string): string {
  return run(psqlCommand(sql));
}

export function psqlAllowFail(sql: string): { ok: boolean; out: string } {
  return runAllowFail(psqlCommand(sql));
}

export function psqlAsync(sql: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    if (process.env.DATABASE_URL || process.env.PGHOST) {
      const args = process.env.DATABASE_URL
        ? [process.env.DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", sql]
        : [
            "-h",
            process.env.PGHOST!,
            "-p",
            process.env.PGPORT ?? "5432",
            "-U",
            process.env.PGUSER ?? "postgres",
            "-d",
            process.env.PGDATABASE ?? "postgres",
            "-v",
            "ON_ERROR_STOP=1",
            "-t",
            "-A",
            "-c",
            sql,
          ];
      const child = spawn("psql", args, {
        cwd: REPO_ROOT,
        env: process.env,
      });
      let out = "";
      let err = "";
      child.stdout.on("data", (d) => (out += d.toString()));
      child.stderr.on("data", (d) => (err += d.toString()));
      child.on("close", (code) => {
        resolve({ ok: code === 0, out: `${out}${err}`.trim() });
      });
      return;
    }

    const container = supabaseDbContainer();
    const child = spawn(
      dockerBin(),
      [
        "exec",
        "-e",
        "PGPASSWORD=postgres",
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
      { cwd: REPO_ROOT },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", (code) => {
      resolve({ ok: code === 0, out: `${out}${err}`.trim() });
    });
  });
}

export function psqlConcurrent(sqls: string[]): Promise<{ ok: boolean; out: string }[]> {
  return Promise.all(sqls.map((s) => psqlAsync(s)));
}

export function resetLocalDatabase(): { ok: boolean; output: string } {
  const result = runAllowFail("npx supabase db reset --yes");
  return { ok: result.ok, output: result.out };
}

export function startLocalSupabase(): { ok: boolean; output: string } {
  const result = runAllowFail("npx supabase start");
  return { ok: result.ok, output: result.out };
}

export function stopLocalSupabase(): { ok: boolean; output: string } {
  const result = runAllowFail("npx supabase stop --no-backup");
  return { ok: result.ok, output: result.out };
}
