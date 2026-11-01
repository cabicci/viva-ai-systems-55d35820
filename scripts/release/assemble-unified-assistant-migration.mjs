/** Deterministic source assembly only. Never connects to a DB or provider. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const files = [
  "scripts/card-assistant/assistant-candidate.sql",
  "scripts/card-assistant/assistant-registry-seed.sql",
  "scripts/rag/incremental-embedding-reuse-candidate.sql",
  "scripts/rag/current-release-candidate.sql",
  "scripts/academic-education/assistant-card-index-maintenance-candidate.sql",
  "scripts/assistant/automatic-indexing-candidate.sql",
  "scripts/assistant/automatic-publication-candidate.sql",
  "scripts/assistant/automatic-source-events-candidate.sql",
  "scripts/free-access/free-access-candidate.sql",
];
const destination = "drizzle/migrations/0026_assistant_source_events_and_free_access.sql";
const manifest = [];
const header = `-- Assembled by scripts/release/assemble-unified-assistant-migration.mjs.
-- Requires the reviewed cumulative commerce/email-access and native Academic
-- baseline. Drizzle journal owns execution; never run both migration systems.
-- Installs disabled preparation, metadata capture and EMPTY free-access tables.
-- Does not approve sources, embed, activate runtime, enable worker or create an offer.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
DO $unified_preflight$ BEGIN
 IF to_regclass('billing.email_access_grants') IS NULL
   OR to_regclass('public.academic_assistant_policy') IS NULL
   OR to_regclass('public.rag_index_versions') IS NULL
   OR to_regprocedure('public.rag_require_service_role()') IS NULL
   OR to_regprocedure('public.lc09_advance_deletion(uuid,uuid,text)') IS NULL
 THEN RAISE EXCEPTION 'UNIFIED_BASELINE_PREREQUISITES_MISSING'; END IF;
 IF to_regclass('public.card_assistant_policy') IS NOT NULL
   OR to_regclass('public.rag_current_releases') IS NOT NULL
   OR to_regclass('public.assistant_auto_jobs') IS NOT NULL
   OR to_regclass('billing.free_access_windows') IS NOT NULL
   OR EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public'
     AND table_name='academic_rag_chunks' AND column_name='embedding_model')
 THEN RAISE EXCEPTION 'UNIFIED_PARTIAL_INSTALL_REQUIRES_REVIEW'; END IF;
END $unified_preflight$;
`;
const sections = files.map(file => {
  const original = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const starts = original.match(/^BEGIN;[ \t]*$/gm) ?? [];
  const ends = original.match(/^COMMIT;[ \t]*$/gm) ?? [];
  if (starts.length !== 1 || ends.length !== 1) throw Error(`Unexpected transaction envelope: ${file}`);
  const sha256 = createHash("sha256").update(original).digest("hex");
  manifest.push({ file, sha256 });
  const body = original.replace(/^BEGIN;[ \t]*$/m, "").replace(/^COMMIT;[ \t]*$/m, "").trim();
  return `\n-- Source: ${file}\n-- LF SHA256: ${sha256}\n${body}\n`;
});
const output = header + sections.join("\n") + "\nCOMMIT;\n";
writeFileSync(destination, output);
writeFileSync("scripts/release/unified-assistant-migration-sources.json", JSON.stringify({
  migration: destination, sha256: createHash("sha256").update(output).digest("hex"),
  transaction: "one atomic migration; original internal envelopes removed", sources: manifest,
  activation: "separate reviewed source/index/provider/access verification; never enabled by installation",
}, null, 2) + "\n");
console.log(`Assembled ${files.length} pinned SQL sources; no database contacted.`);
