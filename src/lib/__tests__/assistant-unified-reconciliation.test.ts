// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accountDeletionSchemaSql } from "./fixtures/account-deletion-db";
import {
  assembleMigration,
  files,
  withStatementBreakpoints,
} from "../../../scripts/release/assemble-unified-assistant-migration.mjs";

const read = (file: string) => readFileSync(file, "utf8").replaceAll("\r\n", "\n");
const sources = files.map((file: string) => ({ file, original: read(file) }));
const catalog = read("scripts/release/assistant-reconciliation-catalog.sql");
const approved = JSON.parse(
  read("scripts/release/assistant-operational-reconciliation-20261102.json"),
);
const pending = ["0027_commercial_policy_20261102.sql", "0028_commercial_offer_policy.sql"];
const journal = JSON.parse(read("drizzle/migrations/meta/_journal.json")) as {
  version: string;
  dialect: string;
  entries: { idx: number; version: string; when: number; tag: string; breakpoints: boolean }[];
};
let db: PGlite;

async function baseline() {
  db = new PGlite({ extensions: { vector, pgcrypto } });
  await db.exec(
    "CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; SET search_path=public,extensions;",
  );
  for (const sql of accountDeletionSchemaSql(true)) await db.exec(sql);
  await db.exec(
    "CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);",
  );
  await db.exec(read("supabase/migrations/20260924191000_kids_private_lesson_content.sql"));
  for (const file of [
    "20261004010000_commerce_foundation.sql",
    "20261004011000_commerce_commands.sql",
    "20261004012000_commerce_access.sql",
    "20261004013000_commerce_receipts_mail.sql",
    "20261004014000_commerce_account_retention.sql",
    "20261004015000_commerce_payment_mail.sql",
    "20261004016000_commerce_simple_offers.sql",
    "20261005100000_technical_education_integration.sql",
    "20261005101000_technical_stripe_test.sql",
    "20261005102000_technical_subscription_mail.sql",
    "20261005110000_admin_kids_lesson_review.sql",
    "20261006110000_academic_commerce.sql",
    "20261006111000_academic_content.sql",
    "20261006112000_academic_stripe_test.sql",
    "20261006113000_academic_mail_retention.sql",
    "20261006120000_academic_admin_review.sql",
  ])
    await db.exec(read(`supabase/migrations/${file}`));
  await db.exec(read("scripts/email-access/email-access-candidate.sql"));
  await db.exec(read("docs/billing/20260920_stripe_refunds.sql"));
  await db.exec(read("scripts/academic-education/assistant-rag-candidate.sql"));
  await db.exec(read("scripts/academic-education/assistant-native-candidate.sql"));
  for (const file of [
    "0008_stripe_live_environment_separation.sql",
    "0009_stripe_live_guard_lifecycle.sql",
    "0010_stripe_live_rpc_environment.sql",
    "0011_stripe_live_atomic_risk_holds.sql",
    "0012_stripe_live_risk_guard_binding_closure.sql",
    "0013_stripe_live_refund_lock_order.sql",
    "0014_stripe_live_offer_mapping_prerequisite.sql",
    "0015_stripe_live_offer_reservations.sql",
    "0016_stripe_live_offer_retention_and_replay.sql",
    "0017_stripe_live_offer_retention_stage_fix.sql",
    "0018_stripe_live_offer_binding_lifetime_closure.sql",
    "0019_stripe_live_offer_catalogue_binding.sql",
    "0020_stripe_live_offer_retry_input_closure.sql",
    "0021_stripe_live_offer_cross_channel_phone_guard.sql",
    "0022_live_offer_admin_operations.sql",
    "0023_billing_portal_environment_continuity.sql",
    "0024_live_offer_admin_list_alias_closure.sql",
    "0025_shared_coupon_rail_eligibility_and_attempts.sql",
  ])
    await db.exec(read(`drizzle/migrations/${file}`));
  await db.exec("ALTER TABLE auth.users ADD COLUMN created_at timestamptz DEFAULT now();");
  await db.exec(read("supabase/migrations/20261021120000_assistant_card_content_access.sql"));
  // Existing RAG baseline only. All eight new sections themselves are executed
  // unmodified from their real reviewed SQL, including pgvector and source FKs.
  await db.exec(`CREATE FUNCTION public.rag_require_service_role() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY';END IF;END$$;
    CREATE TABLE public.rag_index_versions(version_key text PRIMARY KEY,source_sha text,status text,package_count integer,chunk_count integer,chunk_manifest_checksum text,embedding_model text,activated_at timestamptz,superseded_at timestamptz);
    CREATE UNIQUE INDEX rag_one_active ON public.rag_index_versions(status) WHERE status='active';
    CREATE TABLE public.knowledge_chunks(source_type text,source_id text,path_id text,module_id text,lesson_id text,title text,content text,metadata jsonb,embedding extensions.vector(1536),locale text,package_path text,source_sha text,package_checksum text,chunk_checksum text,content_version text,index_version text,index_state text,section_index integer,section_role text,chunk_position integer,content_type text,production_route text,indexing_failed boolean,UNIQUE(index_version,source_id));
    CREATE SCHEMA drizzle;
    CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY,hash text NOT NULL,created_at bigint);
    INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES('fixture-reviewed-prerequisite25',1793312624810);`);
}

async function fingerprint() {
  const rows = (await db.query<{ object_key: string; sha256: string }>(catalog)).rows;
  return Object.fromEntries(rows.map((row) => [row.object_key, row.sha256]));
}

async function makeOperational() {
  for (const source of sources.slice(0, 8)) await db.exec(source.original);
  const embedding = JSON.stringify([1, ...Array(1535).fill(0)]);
  await db.exec(`UPDATE public.card_assistant_policy SET runtime_enabled=true;
    UPDATE public.assistant_auto_policy SET enabled=true;
    INSERT INTO public.assistant_auto_jobs(job_id,area,card_id,material,manifest,scope_count,next_offset,state,provider_calls)
      VALUES(repeat('a',64),'kids','level-1','unchanged operational job','{}',2,1,'held',1);
    INSERT INTO public.assistant_auto_attempts(request_id,job_id,scope_offset,state,provider_reserved,receipt)
      VALUES('11111111-1111-4111-8111-111111111111',repeat('a',64),0,'done',true,'{"alreadyPaid":true}');
    INSERT INTO public.rag_index_versions VALUES('preserved-active','source','active',1,1,'checksum','text-embedding-3-small',now(),NULL);`);
  await db.query(
    "INSERT INTO public.knowledge_chunks(source_type,source_id,content,index_version,index_state,embedding) VALUES('locale_lesson','preserved','existing approved content','preserved-active','active',$1::extensions.vector)",
    [embedding],
  );
  const major = (
    await db.query<{ major: number }>(
      "SELECT current_setting('server_version_num')::integer/10000 AS major",
    )
  ).rows[0].major;
  return { ...approved, postgres_major: major, objects: await fingerprint() };
}

async function preservedState() {
  return (
    await db.query<{ state: unknown }>(`SELECT jsonb_build_object(
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY area,card_id) FROM public.card_assistant_policy p),
    'auto',(SELECT jsonb_agg(to_jsonb(p)) FROM public.assistant_auto_policy p),
    'steps',(SELECT jsonb_agg(to_jsonb(s) ORDER BY area,card_id,step_id) FROM public.card_assistant_steps s),
    'jobs',(SELECT jsonb_agg(to_jsonb(j) ORDER BY job_id) FROM public.assistant_auto_jobs j),
    'attempts',(SELECT jsonb_agg(to_jsonb(a) ORDER BY request_id) FROM public.assistant_auto_attempts a),
    'versions',(SELECT jsonb_agg(to_jsonb(v) ORDER BY version_key) FROM public.rag_index_versions v),
    'vectors',(SELECT jsonb_agg(to_jsonb(k) ORDER BY source_id) FROM public.knowledge_chunks k)) state`)
  ).rows[0].state;
}

async function runNativeTransaction(sql26: string, failAfter = false) {
  // Exercise the installed driver and shared PgDialect.migrate implementation;
  // it owns every pending SQL statement, journal insertion and rollback.
  const cacheRoot = resolve(".unified-test-cache");
  mkdirSync(cacheRoot, { recursive: true });
  const folder = mkdtempSync(join(cacheRoot, "native-reconciliation-"));
  const checkedFolder = resolve(folder);
  if (!checkedFolder.startsWith(`${cacheRoot}${sep}`)) throw Error("Unsafe fixture cleanup path");
  const entries = journal.entries.filter((entry) => entry.idx >= 26);
  const finalEntry = {
    idx: 29,
    version: "7",
    when: entries[entries.length - 1].when + 1,
    tag: "0029_fixture_native_postcondition",
    breakpoints: true,
  };
  mkdirSync(join(folder, "meta"));
  writeFileSync(
    join(folder, "meta", "_journal.json"),
    JSON.stringify({ ...journal, entries: [...entries, finalEntry] }),
  );
  for (const entry of entries)
    writeFileSync(
      join(folder, `${entry.tag}.sql`),
      entry.idx === 26 ? sql26 : read(`drizzle/migrations/${entry.tag}.sql`),
    );
  writeFileSync(
    join(folder, `${finalEntry.tag}.sql`),
    withStatementBreakpoints(
      read("scripts/release/commercial-native-postcondition.sql") +
        (failAfter ? "\nDO $$ BEGIN RAISE EXCEPTION 'TEST_LATE_NATIVE_FAILURE'; END $$;\n" : ""),
    ),
  );
  try {
    await migrate(drizzle(db), { migrationsFolder: folder });
  } catch (error) {
    // Assert the actual database error, not matching text in Drizzle's SQL dump.
    let cause: unknown = error;
    while (cause instanceof Error && cause.cause instanceof Error) cause = cause.cause;
    throw cause;
  } finally {
    rmSync(checkedFolder, { recursive: true, force: true });
  }
}

beforeEach(baseline, 60000);
afterEach(async () => {
  await db?.close();
});

describe("pending unified native reconciliation, local PostgreSQL only", () => {
  it("reproduces the checked-in target manifest and installs all nine sections on a pristine baseline before exact27/28", async () => {
    const built = assembleMigration(sources, approved, catalog);
    expect(built.output).toBe(
      read("drizzle/migrations/0026_assistant_source_events_and_free_access.sql"),
    );
    expect(built.proof).toEqual(
      JSON.parse(read("scripts/release/unified-assistant-migration-sources.json")),
    );
    for (const sql of [built.output, ...pending.map((file) => read(`drizzle/migrations/${file}`))])
      expect(sql).not.toMatch(/^(BEGIN|COMMIT);\s*$/m);
    // Text fingerprints from merged main40d583, excluding only its outer
    // transaction envelope. New markers and the explanatory comment must be
    // the sole differences; procedure bodies and statement text stay exact.
    const reviewedBodies = [
      "11c4aadfa061f069ae898d3b98315e0522e9eff655df6a1c7a6992dbca5c7d0e",
      "53e5b1c411d3f532387bf5079fdabc99107307c083d2c81406bc1dd53996617a",
    ];
    pending.forEach((file, index) => {
      const body = read(`drizzle/migrations/${file}`)
        .replaceAll("\n--> statement-breakpoint\n", "")
        .replace(
          /^-- Transaction is owned by the native Drizzle runner across pending migrations\.\n/m,
          "",
        )
        .trim();
      expect(createHash("sha256").update(body).digest("hex")).toBe(reviewedBodies[index]);
    });
    await runNativeTransaction(built.output);
    expect(
      (await db.query<{ enabled: boolean }>("SELECT enabled FROM public.assistant_auto_policy"))
        .rows,
    ).toEqual([{ enabled: false }]);
    expect(
      (await db.query("SELECT 1 FROM public.card_assistant_policy WHERE runtime_enabled")).rows,
    ).toHaveLength(0);
    expect((await db.query("SELECT 1 FROM billing.free_access_windows")).rows).toHaveLength(0);
    expect((await db.query("SELECT 1 FROM drizzle.__drizzle_migrations")).rows).toHaveLength(5);
    await db.exec("GRANT SELECT ON billing.commercial_purchases TO authenticated");
    await expect(
      db.exec(read("scripts/release/commercial-native-postcondition.sql")),
    ).rejects.toThrow();
  }, 60000);

  it("preserves an exact operational schema, enabled policies, paid receipts and existing vectors while completing26 then27/28", async () => {
    const fixture = await makeOperational();
    const before = await preservedState();
    const output = assembleMigration(sources, fixture, catalog, { fixturePins: true }).output;
    await runNativeTransaction(output);
    expect(await preservedState()).toEqual(before);
    expect((await db.query("SELECT 1 FROM billing.free_access_windows")).rows).toHaveLength(0);
    expect((await db.query("SELECT 1 FROM billing.commercial_policy_release")).rows).toHaveLength(
      1,
    );
    expect((await db.query("SELECT 1 FROM drizzle.__drizzle_migrations")).rows).toHaveLength(5);
  }, 60000);

  it.each([
    "ALTER FUNCTION public.assistant_auto_status() SECURITY INVOKER",
    "GRANT SELECT ON public.assistant_auto_jobs TO authenticated",
    "UPDATE public.card_assistant_policy SET runtime_enabled=false WHERE area='technical'",
  ])(
    "rejects an unknown operational change before any new DDL: %s",
    async (mutation) => {
      const fixture = await makeOperational();
      await db.exec(mutation);
      const before = await preservedState();
      const output = assembleMigration(sources, fixture, catalog, { fixturePins: true }).output;
      await expect(runNativeTransaction(output)).rejects.toThrow(
        "UNIFIED_OPERATIONAL_SCHEMA_OR_REGISTRY_CHANGED",
      );
      expect(await preservedState()).toEqual(before);
      expect(
        (
          await db.query(
            "SELECT to_regclass('billing.free_access_windows') windows,to_regclass('billing.commercial_policy_release') commercial",
          )
        ).rows[0],
      ).toEqual({ windows: null, commercial: null });
      expect((await db.query("SELECT 1 FROM drizzle.__drizzle_migrations")).rows).toHaveLength(1);
    },
    60000,
  );

  it("rolls back all pending SQL and journal entries after a failure following28, retaining operational data", async () => {
    const fixture = await makeOperational();
    const before = await preservedState();
    const schemas = await fingerprint();
    const output = assembleMigration(sources, fixture, catalog, { fixturePins: true }).output;
    await expect(runNativeTransaction(output, true)).rejects.toThrow("TEST_LATE_NATIVE_FAILURE");
    expect(await preservedState()).toEqual(before);
    expect(await fingerprint()).toEqual(schemas);
    expect(
      (
        await db.query(
          "SELECT to_regclass('billing.free_access_windows') windows,to_regclass('billing.commercial_policy_release') commercial",
        )
      ).rows[0],
    ).toEqual({ windows: null, commercial: null });
    expect((await db.query("SELECT 1 FROM drizzle.__drizzle_migrations")).rows).toHaveLength(1);
  }, 60000);

  it("rejects an unreviewed partial installation and refuses target-manifest changes", async () => {
    await db.exec("CREATE TABLE public.card_assistant_policy(area text,card_id text)");
    await expect(
      runNativeTransaction(assembleMigration(sources, approved, catalog).output),
    ).rejects.toThrow();
    expect(
      (await db.query("SELECT to_regclass('billing.free_access_windows') windows")).rows[0],
    ).toEqual({ windows: null });
    expect(() =>
      assembleMigration(sources, { ...approved, target_database_ref: "another-target" }, catalog),
    ).toThrow("target");
    expect(() => assembleMigration(sources, { ...approved, postgres_major: 18 }, catalog)).toThrow(
      "target",
    );
  }, 60000);
});
