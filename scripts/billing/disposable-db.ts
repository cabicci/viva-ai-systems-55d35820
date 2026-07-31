import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

/**
 * Disposable Postgres helpers for billing concurrency proofs.
 * Prefers direct `psql` via PG* / DATABASE_URL (CI), then Docker
 * supabase_db container (local Windows/Linux).
 *
 * SQL is never interpolated into a shell command string. All SQL is delivered
 * via process stdin (or argv when already using spawn without a shell).
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

export function dockerBin(): string {
  if (process.env.DOCKER_BIN && process.env.DOCKER_BIN.trim()) {
    return process.env.DOCKER_BIN.trim();
  }
  const finder = process.platform === "win32" ? "where.exe" : "which";
  const found = spawnSync(finder, ["docker"], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    env: process.env,
  });
  if (found.status === 0) {
    const first = found.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean);
    if (first) return first;
  }
  // PATH-resolved name; no machine-specific absolute fallback.
  return "docker";
}

type ProcResult = { ok: boolean; out: string; status: number | null };

function runArgv(
  command: string,
  args: string[],
  opts: { input?: string; env?: NodeJS.ProcessEnv } = {},
): ProcResult {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    env: opts.env ?? process.env,
    encoding: "utf8",
    input: opts.input,
    windowsHide: true,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.error) {
    return { ok: false, out: `${out}\n${result.error.message}`.trim(), status: result.status };
  }
  return { ok: result.status === 0, out, status: result.status };
}

/** Non-SQL helper commands (supabase CLI). Not used for SQL payloads. */
export function run(cmd: string, cwd = REPO_ROOT): string {
  const result = spawnSync(cmd, {
    cwd,
    encoding: "utf8",
    env: process.env,
    shell: true,
    windowsHide: true,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    const err = new Error(out || `Command failed: ${cmd}`) as Error & {
      status: number | null;
      stdout: string;
      stderr: string;
    };
    err.status = result.status;
    err.stdout = result.stdout ?? "";
    err.stderr = result.stderr ?? "";
    throw err;
  }
  return out;
}

export function runAllowFail(cmd: string, cwd = REPO_ROOT): { ok: boolean; out: string } {
  try {
    return { ok: true, out: run(cmd, cwd) };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      out: `${err.stdout ?? ""}\n${err.stderr ?? err.message ?? ""}`.trim(),
    };
  }
}

export function dockerReady(): boolean {
  return runArgv(dockerBin(), ["info"]).ok;
}

function findSupabaseDbContainer(): string | null {
  if (!dockerReady()) return null;
  const preferred = process.env.SUPABASE_DB_CONTAINER?.trim();
  if (preferred) {
    const check = runArgv(dockerBin(), [
      "ps",
      "--filter",
      `name=^${preferred}$`,
      "--format",
      "{{.Names}}",
    ]);
    if (
      check.ok &&
      check.out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .includes(preferred)
    ) {
      return preferred;
    }
  }
  const result = runArgv(dockerBin(), [
    "ps",
    "--filter",
    "name=supabase_db",
    "--format",
    "{{.Names}}",
  ]);
  if (!result.ok) return null;
  return (
    result.out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean) ?? null
  );
}

export function supabaseDbContainer(): string {
  const name = findSupabaseDbContainer();
  if (!name) throw new Error("supabase_db container not found");
  return name;
}

type PsqlInvocation = {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
};

function psqlInvocation(): PsqlInvocation {
  const common = ["-v", "ON_ERROR_STOP=1", "-t", "-A"];
  if (process.env.DATABASE_URL) {
    return {
      command: "psql",
      args: [process.env.DATABASE_URL, ...common],
      env: process.env,
    };
  }
  if (process.env.PGHOST) {
    return {
      command: "psql",
      args: [
        "-h",
        process.env.PGHOST,
        "-p",
        process.env.PGPORT ?? "5432",
        "-U",
        process.env.PGUSER ?? "postgres",
        "-d",
        process.env.PGDATABASE ?? "postgres",
        ...common,
      ],
      env: process.env,
    };
  }
  const container = supabaseDbContainer();
  return {
    command: dockerBin(),
    args: [
      "exec",
      "-i",
      "-e",
      "PGPASSWORD=postgres",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      ...common,
    ],
    env: process.env,
  };
}

function runPsql(sql: string): ProcResult {
  const inv = psqlInvocation();
  return runArgv(inv.command, inv.args, { input: sql, env: inv.env });
}

export function directPsqlReady(): boolean {
  if (!process.env.PGHOST && !process.env.DATABASE_URL) return false;
  return runPsql("SELECT 1").ok;
}

export function disposableDbReady(): boolean {
  return directPsqlReady() || (dockerReady() && !!findSupabaseDbContainer());
}

export function psql(sql: string): string {
  const result = runPsql(sql);
  if (!result.ok) {
    const err = new Error(
      `Command failed: psql (exit ${result.status})\n${result.out}`,
    ) as Error & {
      status: number | null;
      stdout: string;
      stderr: string;
    };
    err.status = result.status;
    err.stdout = result.out;
    err.stderr = result.out;
    throw err;
  }
  return result.out;
}

export function psqlAllowFail(sql: string): { ok: boolean; out: string } {
  const result = runPsql(sql);
  return { ok: result.ok, out: result.out };
}

export function psqlAsync(sql: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const inv = psqlInvocation();
    const child = spawn(inv.command, inv.args, {
      cwd: REPO_ROOT,
      env: inv.env,
      windowsHide: true,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => {
      resolve({ ok: false, out: `${out}${err}\n${e.message}`.trim() });
    });
    child.on("close", (code) => {
      resolve({ ok: code === 0, out: `${out}${err}`.trim() });
    });
    child.stdin.write(sql);
    child.stdin.end();
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
