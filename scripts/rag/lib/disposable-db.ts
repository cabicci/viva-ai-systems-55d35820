import { execSync, spawnSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const DOCKER = "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe";

export function dockerBin(): string {
  return process.env.DOCKER_BIN ?? DOCKER;
}

/**
 * Native Bun executable for Windows-safe Supabase lifecycle launches.
 * Never returns npx.cmd / npm.cmd / process.execPath (Node).
 */
export function bunBin(): string {
  const override = process.env.BUN_BIN?.trim();
  if (override) return override;
  return process.platform === "win32" ? "bun.exe" : "bun";
}

export function run(cmd: string, cwd = REPO_ROOT): string {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
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
  const bin = dockerBin();
  return runAllowFail(`"${bin}" info`).ok;
}

export function supabaseDbContainer(): string {
  const bin = dockerBin();
  const out = run(`"${bin}" ps --filter name=supabase_db --format {{.Names}}`);
  const name = out
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean);
  if (!name) throw new Error("supabase_db container not found");
  return name;
}

/** Docker argv for Windows-safe stdin SQL transport (no shell, no -c). */
export function buildPsqlDockerArgs(container: string): string[] {
  return [
    "exec",
    "-i",
    container,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-t",
    "-A",
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "-",
  ];
}

export type PsqlSpawnResult = {
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
  stdout: string;
  stderr: string;
};

export type PsqlSpawnFn = (
  program: string,
  args: readonly string[],
  options: { input: string; encoding: "utf8"; cwd: string },
) => PsqlSpawnResult;

function defaultPsqlSpawn(
  program: string,
  args: readonly string[],
  options: { input: string; encoding: "utf8"; cwd: string },
): PsqlSpawnResult {
  const result = spawnSync(program, [...args], {
    cwd: options.cwd,
    encoding: options.encoding,
    input: options.input,
    shell: false,
    windowsHide: true,
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export class PsqlTransportError extends Error {
  readonly stdout: string;
  readonly stderr: string;
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly spawnError?: Error;

  constructor(
    message: string,
    details: Omit<PsqlSpawnResult, "stdout" | "stderr"> & {
      stdout: string;
      stderr: string;
    },
  ) {
    super(message);
    this.name = "PsqlTransportError";
    this.stdout = details.stdout;
    this.stderr = details.stderr;
    this.status = details.status;
    this.signal = details.signal;
    this.spawnError = details.error;
  }
}

/**
 * Execute SQL against the disposable Supabase Postgres via:
 *   docker exec -i <container> psql ... -v ON_ERROR_STOP=1 -f -
 * SQL is supplied on stdin — never embedded in a shell command string.
 */
export function executePsqlSql(
  sql: string,
  options?: {
    container?: string;
    dockerProgram?: string;
    spawnFn?: PsqlSpawnFn;
    cwd?: string;
  },
): string {
  const program = options?.dockerProgram ?? dockerBin();
  const container = options?.container ?? supabaseDbContainer();
  const args = buildPsqlDockerArgs(container);
  const spawnFn = options?.spawnFn ?? defaultPsqlSpawn;
  const cwd = options?.cwd ?? REPO_ROOT;

  const result = spawnFn(program, args, {
    input: sql,
    encoding: "utf8",
    cwd,
  });

  if (result.error) {
    throw new PsqlTransportError(`psql transport spawn failed: ${result.error.message}`, result);
  }
  if (result.signal) {
    throw new PsqlTransportError(`psql transport terminated by signal: ${result.signal}`, result);
  }
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new PsqlTransportError(`psql failed: ${detail}`, result);
  }

  return result.stdout.replace(/\r\n/g, "\n").trim();
}

/** Public helper used by RAG disposable DB tests. */
export function psql(sql: string): string {
  return executePsqlSql(sql);
}

export function psqlJson<T>(sql: string): T[] {
  const raw = psql(sql);
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const cols = line.split("|");
      return cols as unknown as T;
    });
}

/**
 * Structured Bun argv for local disposable Supabase start.
 * Excludes Analytics (logflare), optional vector *service*, and Studio UI —
 * does NOT exclude Postgres and does NOT disable the pgvector extension.
 */
export function buildSupabaseStartArgs(): string[] {
  return ["x", "supabase", "start", "-x", "logflare,vector,studio"];
}

export function buildSupabaseStatusArgs(): string[] {
  return ["x", "supabase", "status"];
}

export function buildSupabaseStopArgs(): string[] {
  return ["x", "supabase", "stop", "--no-backup"];
}

export function buildSupabaseDbResetArgs(): string[] {
  return ["x", "supabase", "db", "reset", "--yes"];
}

export type ProcessSpawnResult = {
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
  stdout: string;
  stderr: string;
};

export type ProcessSpawnFn = (
  program: string,
  args: readonly string[],
  options: { encoding: "utf8"; cwd: string; shell: false },
) => ProcessSpawnResult;

function defaultProcessSpawn(
  program: string,
  args: readonly string[],
  options: { encoding: "utf8"; cwd: string; shell: false },
): ProcessSpawnResult {
  const result = spawnSync(program, [...args], {
    cwd: options.cwd,
    encoding: options.encoding,
    shell: false,
    windowsHide: true,
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * Run a Supabase CLI lifecycle command via native Bun (`bun x supabase …`).
 * Never uses npx.cmd / shell: true / Node process.execPath.
 */
export function runSupabaseViaBun(
  args: readonly string[],
  options?: {
    spawnFn?: ProcessSpawnFn;
    cwd?: string;
    bunProgram?: string;
  },
): { ok: boolean; output: string; stdout: string; stderr: string; status: number | null; signal: NodeJS.Signals | null } {
  const program = options?.bunProgram ?? bunBin();
  const spawnFn = options?.spawnFn ?? defaultProcessSpawn;
  const cwd = options?.cwd ?? REPO_ROOT;

  const result = spawnFn(program, args, {
    encoding: "utf8",
    cwd,
    shell: false,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const output = `${stdout}\n${stderr}`.trim();

  if (result.error) {
    return {
      ok: false,
      output: `spawn failed: ${result.error.message}\n${output}`.trim(),
      stdout,
      stderr,
      status: result.status,
      signal: result.signal,
    };
  }
  if (result.signal) {
    return {
      ok: false,
      output: `terminated by signal: ${result.signal}\n${output}`.trim(),
      stdout,
      stderr,
      status: result.status,
      signal: result.signal,
    };
  }
  if (result.status !== 0) {
    return { ok: false, output, stdout, stderr, status: result.status, signal: result.signal };
  }
  return { ok: true, output, stdout, stderr, status: result.status, signal: result.signal };
}

export function startLocalSupabase(options?: {
  spawnFn?: ProcessSpawnFn;
  cwd?: string;
  bunProgram?: string;
}): { ok: boolean; output: string } {
  const result = runSupabaseViaBun(buildSupabaseStartArgs(), options);
  return { ok: result.ok, output: result.output };
}

export function statusLocalSupabase(options?: {
  spawnFn?: ProcessSpawnFn;
  cwd?: string;
  bunProgram?: string;
}): { ok: boolean; output: string } {
  const result = runSupabaseViaBun(buildSupabaseStatusArgs(), options);
  return { ok: result.ok, output: result.output };
}

export function stopLocalSupabase(options?: {
  spawnFn?: ProcessSpawnFn;
  cwd?: string;
  bunProgram?: string;
}): { ok: boolean; output: string } {
  const result = runSupabaseViaBun(buildSupabaseStopArgs(), options);
  return { ok: result.ok, output: result.output };
}

export function resetLocalDatabase(options?: {
  spawnFn?: ProcessSpawnFn;
  cwd?: string;
  bunProgram?: string;
}): { ok: boolean; output: string } {
  const result = runSupabaseViaBun(buildSupabaseDbResetArgs(), options);
  return { ok: result.ok, output: result.output };
}
