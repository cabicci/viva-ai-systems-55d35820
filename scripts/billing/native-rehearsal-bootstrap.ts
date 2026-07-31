/**
 * Bootstrap an isolated native Supabase stack for billing rehearsal.
 * Authorization: CR-BILLING-RAG-NATIVE-REHEARSAL-CORRECTION-20260801-01
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PROJECT_ID = "billing-native-reh-20260801";
const ISO_ROOT = process.env.BILLING_NATIVE_ISO_ROOT ?? "E:/Temp/billing-native-reh-20260801";
const BASELINE_CUTOFF = "20260603221717";
const TEMPLATE_CONFIG =
  process.env.BILLING_NATIVE_CONFIG_TEMPLATE ??
  "E:/Temp/masaarat-lv-method-a-pilot-20260727/workspace/app/supabase/config.toml";

function run(command: string, args: string[], cwd = ISO_ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: process.env,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${out}`);
  }
  return out;
}

function buildConfig(): string {
  let cfg: string;
  if (existsSync(TEMPLATE_CONFIG)) {
    cfg = readFileSync(TEMPLATE_CONFIG, "utf8");
  } else {
    // Minimal fallback when Method A template is unavailable.
    cfg = `project_id = "${PROJECT_ID}"

[api]
enabled = true
port = 56421
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 56422
shadow_port = 56420
major_version = 17

[db.migrations]
enabled = true

[db.seed]
enabled = false

[studio]
enabled = true
port = 56423

[local_smtp]
enabled = true
port = 56424

[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
`;
  }
  cfg = cfg.replace(/project_id\s*=\s*"[^"]+"/g, `project_id = "${PROJECT_ID}"`);
  cfg = cfg.replace(/masaarat-lv-method-a-pilot-20260727/g, PROJECT_ID);
  cfg = cfg.replace(/55431/g, "56421");
  cfg = cfg.replace(/55432/g, "56422");
  cfg = cfg.replace(/55420/g, "56420");
  cfg = cfg.replace(/55429/g, "56429");
  cfg = cfg.replace(/55433/g, "56423");
  cfg = cfg.replace(/55434/g, "56424");
  // Never expose private billing schema through PostgREST.
  if (!/schemas\s*=\s*\["public", "graphql_public"\]/.test(cfg)) {
    cfg = cfg.replace(/schemas\s*=\s*\[[^\]]*\]/, 'schemas = ["public", "graphql_public"]');
  }
  return cfg;
}

function main() {
  mkdirSync(path.join(ISO_ROOT, "supabase/migrations"), { recursive: true });
  writeFileSync(path.join(ISO_ROOT, "supabase/config.toml"), buildConfig());
  writeFileSync(path.join(ISO_ROOT, "supabase/seed.sql"), "");

  const migDir = path.join(ISO_ROOT, "supabase/migrations");
  for (const f of readdirSync(migDir)) {
    rmSync(path.join(migDir, f), { force: true });
  }

  const srcMig = path.join(REPO_ROOT, "supabase/migrations");
  let copied = 0;
  let skippedRealtime = 0;
  for (const name of readdirSync(srcMig).sort()) {
    if (!name.endsWith(".sql")) continue;
    if (name.slice(0, 14) > BASELINE_CUTOFF) continue;
    const body = readFileSync(path.join(srcMig, name), "utf8");
    // Local supabase_db role is not owner of realtime.messages; skip that
    // non-Billing migration so the production-shaped baseline can boot.
    if (/realtime\.messages/i.test(body)) {
      skippedRealtime += 1;
      continue;
    }
    copyFileSync(path.join(srcMig, name), path.join(migDir, name));
    copied += 1;
  }

  console.log(
    JSON.stringify(
      {
        isoRoot: ISO_ROOT,
        projectId: PROJECT_ID,
        baselineMigrationsCopied: copied,
        skippedRealtimeMigrations: skippedRealtime,
        productionLedgerAccepted: "20260603221716",
        repoHasRoleMigration: "20260603221717",
      },
      null,
      2,
    ),
  );

  // Stop any prior instance of this project only.
  spawnSync("bunx", ["supabase", "stop", "--no-backup"], {
    cwd: ISO_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  run("bunx", ["supabase", "start"]);
  console.log("Isolated native Supabase stack started.");
}

main();
