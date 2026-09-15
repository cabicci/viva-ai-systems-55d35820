// CI-only environment plumbing. Never logs local keys or reads hosted credentials.
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { candidate, localOrigin, requireValue } from "./local-guards.mjs";

function exportEnv(name, value, secret = false) {
  if (typeof value !== "string" || !value || /[\r\n]/.test(value)) throw new Error(`Invalid single-line ${name}`);
  if (secret) process.stdout.write(`::add-mask::${value}\n`);
  appendFileSync(requireValue("GITHUB_ENV"), `${name}=${value}\n`);
}

const mode = process.argv[2];
if (mode === "prepare") {
  if (process.env.GITHUB_ACTIONS !== "true" || process.platform !== "linux") throw new Error("This draft runner requires Linux GitHub Actions");
  const { repo, head } = candidate();
  const runRoot = mkdtempSync(join(resolve(requireValue("RUNNER_TEMP")), "masaarat-b023-"));
  const privateRoot = join(runRoot, "private");
  const receipts = join(runRoot, "receipts");
  mkdirSync(privateRoot, { mode: 0o700 });
  mkdirSync(receipts);
  const scripts = join(repo, ".github/scripts/b023_contextual_v2_validation");
  for (const [name, value] of Object.entries({
    B023_RUN_ROOT: runRoot,
    B023_PRIVATE_ROOT: privateRoot,
    B023_RECEIPTS_ROOT: receipts,
    B023_DISPOSABLE_ROOT: join(runRoot, "disposable-supabase"),
    B023_BROWSER_RECEIPTS_DIR: join(receipts, "browser"),
    B023_BUILD_GRAPH_RECEIPT: join(receipts, "build-module-graph.json"),
    B023_FROZEN_GATE_PATH: join(scripts, "browser-network-gate.mjs"),
    B023_LOCAL_SUPABASE_ORIGIN: "http://127.0.0.1:54321",
    B023_BASE_URL: "http://127.0.0.1:4173",
    B023_BUN_BIN: execFileSync("which", ["bun"], { encoding: "utf8" }).trim(),
  })) exportEnv(name, value);
  writeFileSync(join(receipts, "candidate.json"), `${JSON.stringify({ head, repo, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT }, null, 2)}\n`);
} else if (mode === "local-status") {
  candidate();
  const status = JSON.parse(readFileSync(join(requireValue("B023_PRIVATE_ROOT"), "supabase-status.json"), "utf8"));
  const origin = localOrigin(status.API_URL, "Supabase status API_URL");
  if (origin !== requireValue("B023_LOCAL_SUPABASE_ORIGIN")) throw new Error("Disposable CLI reported an unexpected local API origin");
  for (const name of ["VITE_SUPABASE_URL", "SUPABASE_URL"]) exportEnv(name, origin);
  for (const name of ["VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY"]) exportEnv(name, status.ANON_KEY, true);
  exportEnv("B023_LOCAL_SERVICE_ROLE_KEY", status.SERVICE_ROLE_KEY, true);
  const requireRepo = createRequire(join(requireValue("B023_REPO_ROOT"), "package.json"));
  const { chromium } = requireRepo("playwright");
  exportEnv("B023_CHROME_EXECUTABLE", chromium.executablePath());
  // Do not export DB passwords, signing secrets or raw status JSON.
} else {
  throw new Error("Expected prepare or local-status mode");
}
