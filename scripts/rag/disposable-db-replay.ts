#!/usr/bin/env bun
/**
 * Disposable Supabase migration replay (2x clean reset) + schema SQL validation.
 */
import fs from "node:fs";
import path from "node:path";
import {
  dockerReady,
  psql,
  resetLocalDatabase,
  startLocalSupabase,
  stopLocalSupabase,
} from "./lib/disposable-db";

const REPORT = path.resolve(import.meta.dirname, "../../artifacts/rag/disposable-db-replay-report.json");

const report: Record<string, unknown> = {
  timestamp: new Date().toISOString(),
  commands: [] as string[],
};

function log(cmd: string, ok: boolean, output: string) {
  (report.commands as Array<{ cmd: string; ok: boolean; output: string }>).push({
    cmd,
    ok,
    output: output.slice(-6000),
  });
}

if (!dockerReady()) {
  report.error = "Docker daemon not ready";
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

const start = startLocalSupabase();
log("npx supabase start", start.ok, start.output);
if (!start.ok) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  process.exit(1);
}

const reset1 = resetLocalDatabase();
log("npx supabase db reset --yes #1", reset1.ok, reset1.output);
if (!reset1.ok) process.exit(1);

report.schema = {
  rag_index_versions: psql(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_index_versions' ORDER BY 1",
  ),
  knowledge_chunks_cols: psql(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_chunks' AND column_name IN ('locale','package_path','source_sha','package_checksum','chunk_checksum','content_version','index_version','index_state','section_index','section_role','chunk_position','content_type','production_route','indexing_failed') ORDER BY 1",
  ),
  rag_migration: psql(
    "SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '%rag_locale_index_versioning%'",
  ),
  rag_rls: psql(
    "SELECT relrowsecurity FROM pg_class WHERE relname='rag_index_versions'",
  ),
  kc_delete_priv: psql(
    "SELECT privilege_type, grantee FROM information_schema.role_table_grants WHERE table_name='knowledge_chunks' AND privilege_type IN ('INSERT','UPDATE','DELETE') AND grantee IN ('anon','authenticated') ORDER BY 1",
  ),
};

const stop = stopLocalSupabase();
log("npx supabase stop --no-backup", stop.ok, stop.output);

const start2 = startLocalSupabase();
log("npx supabase start #2", start2.ok, start2.output);
if (!start2.ok) process.exit(1);

const reset2 = resetLocalDatabase();
log("npx supabase db reset --yes #2", reset2.ok, reset2.output);

report.replay2Ok = reset2.ok;
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(reset2.ok ? 0 : 1);
