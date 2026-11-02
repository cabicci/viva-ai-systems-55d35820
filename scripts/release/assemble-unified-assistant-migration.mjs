/** Deterministic source assembly only. Never connects to a DB or provider. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const files = [
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
export const destination = "drizzle/migrations/0026_assistant_source_events_and_free_access.sql";
const operationalManifestPath =
  "scripts/release/assistant-operational-reconciliation-20261102.json";
const catalogPath = "scripts/release/assistant-reconciliation-catalog.sql";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const normalized = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const quoted = (value, tag) => {
  if (value.includes(`$${tag}$`)) throw Error(`SQL delimiter collision: ${tag}`);
  return `$${tag}$${value}$${tag}$`;
};

export function withStatementBreakpoints(sql) {
  // Canonical Drizzle statement chunks also work with prepared-query adapters.
  // Only comments are inserted; quoted bodies, literals and comments are retained.
  const ends = [];
  let quote = "";
  let dollar = "";
  let blockDepth = 0;
  let lineComment = false;
  let escapeString = false;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
    } else if (blockDepth) {
      if (char === "/" && next === "*") {
        blockDepth++;
        i++;
      } else if (char === "*" && next === "/") {
        blockDepth--;
        i++;
      }
    } else if (dollar) {
      if (sql.startsWith(dollar, i)) {
        i += dollar.length - 1;
        dollar = "";
      }
    } else if (quote) {
      if (escapeString && char === "\\") i++;
      else if (char === quote && next === quote) i++;
      else if (char === quote) quote = "";
    } else if (char === "-" && next === "-") {
      lineComment = true;
      i++;
    } else if (char === "/" && next === "*") {
      blockDepth = 1;
      i++;
    } else if (char === "'" || char === '"') {
      quote = char;
      escapeString =
        char === "'" && /[eE]/.test(sql[i - 1] ?? "") && !/[a-zA-Z0-9_$]/.test(sql[i - 2] ?? "");
    } else if (char === "$") {
      const tag = sql.slice(i).match(/^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/)?.[0];
      if (tag) {
        dollar = tag;
        i += tag.length - 1;
      }
    } else if (char === ";") ends.push(i + 1);
  }
  if (quote || dollar || blockDepth) throw Error("Unterminated SQL in migration source");
  const marker = "\n--> statement-breakpoint\n";
  if (sql.includes(marker)) throw Error("Unexpected pre-existing migration marker");
  let output = sql;
  for (const position of ends.slice(0, -1).reverse())
    output = output.slice(0, position) + marker + output.slice(position);
  return output;
}

/** Pure assembly; fixture pins may be supplied only by local tests. The CLI
 * always uses the checked-in, reviewed production schema/registry manifest. */
export function assembleMigration(sources, operational, catalog, { fixturePins = false } = {}) {
  if (
    operational.schema_version !== "masaarat-assistant-operational-schema-v1" ||
    !Number.isInteger(operational.postgres_major) ||
    operational.postgres_major < 14 ||
    operational.postgres_major > 99 ||
    Object.keys(operational.objects ?? {}).length < 40 ||
    Object.values(operational.objects).some((value) => !/^[a-f0-9]{64}$/.test(value))
  ) {
    throw Error("Invalid reviewed operational schema manifest");
  }
  if (
    !fixturePins &&
    (operational.postgres_major !== 17 ||
      operational.target_project !== "658adce0-747d-4c8e-90e3-d22225070b94" ||
      operational.target_database_ref !== "abyqqeboyrkkwhjpwmtd" ||
      Object.keys(operational.objects).length !== 66)
  )
    throw Error("Operational reconciliation target or reviewed inventory changed");
  if (sources.length !== files.length || sources.some((source, i) => source.file !== files[i]))
    throw Error("Unexpected unified migration source order");
  const manifest = [];
  const bodies = sources.map(({ file, original }, index) => {
    const starts = original.match(/^BEGIN;[ \t]*$/gm) ?? [];
    const ends = original.match(/^COMMIT;[ \t]*$/gm) ?? [];
    if (starts.length !== 1 || ends.length !== 1)
      throw Error(`Unexpected transaction envelope: ${file}`);
    const sha256 = digest(original);
    manifest.push({ file, sha256 });
    const body = original
      .replace(/^BEGIN;[ \t]*$/m, "")
      .replace(/^COMMIT;[ \t]*$/m, "")
      .trim();
    return `\n -- Source: ${file}\n -- LF SHA256: ${sha256}\n EXECUTE ${quoted(body, `unified_source_${index}`)};\n`;
  });
  const query = catalog.trim().replace(/;$/, "");
  const fingerprintSql = `SELECT coalesce(jsonb_object_agg(object_key,sha256),'{}'::jsonb) FROM (${query}) reviewed_objects`;
  const readFingerprint = `EXECUTE ${quoted(fingerprintSql, "unified_catalog")} INTO actual;`;
  const expected = quoted(JSON.stringify(operational.objects), "unified_expected");
  const header = `-- Assembled by scripts/release/assemble-unified-assistant-migration.mjs.
-- Requires the reviewed cumulative commerce/email-access and native Academic
-- baseline. Drizzle journal owns execution; never run both migration systems.
-- The native Drizzle transaction owns COMMIT/ROLLBACK across 0026, 0027 and 0028.
-- Pristine targets install all original sources. The one reviewed operational
-- schema is preserved exactly, then only EMPTY free-access tables are added.
-- Unknown partial states fail closed. No fake journal/adoption or provider calls.
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
SET LOCAL search_path=public,extensions;
DO $unified_reconciliation$
DECLARE operational boolean; actual jsonb; preserved jsonb;
 expected constant jsonb := ${expected}::jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('masaarat:assistant:0026:reconciliation',0));
 IF to_regclass('billing.email_access_grants') IS NULL
   OR to_regclass('public.academic_assistant_policy') IS NULL
   OR to_regclass('public.rag_index_versions') IS NULL
   OR to_regprocedure('public.rag_require_service_role()') IS NULL
   OR to_regprocedure('public.lc09_advance_deletion(uuid,uuid,text)') IS NULL
 THEN RAISE EXCEPTION 'UNIFIED_BASELINE_PREREQUISITES_MISSING'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='billing' AND c.relname LIKE 'free_access_%')
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE (n.nspname='billing' AND (p.proname LIKE 'free_access_%' OR p.proname LIKE 'free_window_%'))
      OR (n.nspname='public' AND p.proname IN ('get_my_free_access','free_access_window_command')))
 THEN RAISE EXCEPTION 'UNIFIED_FREE_ACCESS_ALREADY_PRESENT_REQUIRES_REVIEW'; END IF;
 operational:=EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND (c.relname LIKE 'card_assistant_%' OR c.relname LIKE 'assistant_auto_%' OR c.relname LIKE 'rag_current_%'))
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND (p.proname LIKE 'card_assistant_%' OR p.proname LIKE 'assistant_auto_%'
    OR p.proname LIKE 'rag_current_%' OR p.proname IN ('rag_reusable_embeddings','academic_sync_chunks')))
 OR EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academic_rag_chunks'
   AND column_name IN ('embedding_model','embedding_dimensions'));
 IF operational THEN
  IF current_setting('server_version_num')::integer/10000<>${operational.postgres_major} THEN RAISE EXCEPTION 'UNIFIED_OPERATIONAL_SERVER_CHANGED'; END IF;
  ${readFingerprint}
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'UNIFIED_OPERATIONAL_SCHEMA_OR_REGISTRY_CHANGED'; END IF;
 ELSE
`;
  const output = withStatementBreakpoints(
    header +
      bodies.slice(0, 8).join("\n") +
      `
 END IF;
 ${readFingerprint}
 preserved:=actual;
` +
      bodies[8] +
      `
 ${readFingerprint}
 IF actual IS DISTINCT FROM preserved THEN RAISE EXCEPTION 'UNIFIED_OPERATIONAL_STATE_CHANGED'; END IF;
END $unified_reconciliation$;
`,
  );
  return {
    output,
    proof: {
      migration: destination,
      sha256: digest(output),
      transaction: "native Drizzle transaction; no inner BEGIN/COMMIT in pending 0026..0028",
      sources: manifest,
      operational_reconciliation: {
        manifest: operationalManifestPath,
        manifest_sha256: digest(JSON.stringify(operational, null, 2) + "\n"),
        schema_version: operational.schema_version,
        target_project: operational.target_project,
        target_database_ref: operational.target_database_ref,
        catalog: catalogPath,
        catalog_sha256: digest(catalog),
        object_count: Object.keys(operational.objects).length,
        pristine_original_sha256:
          "a3ca78427e47ed4e6b92d29bc0ae07ee5c9e34bff47cbfd659a032baaedd4acd",
      },
      activation:
        "preserve operational policies/jobs/vectors; fresh install remains disabled; never create or enable a free-access window",
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { output, proof } = assembleMigration(
    files.map((file) => ({ file, original: normalized(file) })),
    JSON.parse(normalized(operationalManifestPath)),
    normalized(catalogPath),
  );
  if (process.argv.includes("--check")) {
    if (
      normalized(destination) !== output ||
      normalized("scripts/release/unified-assistant-migration-sources.json") !==
        JSON.stringify(proof, null, 2) + "\n"
    )
      throw Error("Unified migration source/manifest is not reproducible");
    console.log("Unified migration and proof match reviewed source inputs.");
  } else {
    writeFileSync(destination, output);
    writeFileSync(
      "scripts/release/unified-assistant-migration-sources.json",
      JSON.stringify(proof, null, 2) + "\n",
    );
    console.log(
      `Assembled ${files.length} pinned SQL sources and ${Object.keys(JSON.parse(normalized(operationalManifestPath)).objects).length} reviewed operational fingerprints; no database contacted.`,
    );
  }
}
