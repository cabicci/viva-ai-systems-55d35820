import { execSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const DOCKER = "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe";

export function dockerBin(): string {
  return process.env.DOCKER_BIN ?? DOCKER;
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
  const name = out.split("\n").map((s) => s.trim()).find(Boolean);
  if (!name) throw new Error("supabase_db container not found");
  return name;
}

export function psql(sql: string): string {
  const bin = dockerBin();
  const container = supabaseDbContainer();
  const escaped = sql.replace(/"/g, '\\"');
  return run(`"${bin}" exec ${container} psql -U postgres -d postgres -t -A -c "${escaped}"`);
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
