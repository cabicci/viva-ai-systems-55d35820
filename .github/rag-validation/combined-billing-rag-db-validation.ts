#!/usr/bin/env bun
/** Combined Billing + RAG disposable DB contract checks after migration replay. */
import { dockerReady, psql } from "../../scripts/rag/lib/disposable-db";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  if (!dockerReady()) {
    console.error("Docker not ready");
    process.exit(1);
  }

  const billingTables = Number(
    psql(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='billing' AND table_type='BASE TABLE'",
    ),
  );
  assert(billingTables === 32, `expected 32 billing tables, got ${billingTables}`);

  const billingFunctions = Number(
    psql(
      "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='billing'",
    ),
  );
  assert(billingFunctions >= 9, `expected >=9 billing functions, got ${billingFunctions}`);

  const lessonFeedbackRls = psql(
    "SELECT relrowsecurity FROM pg_class WHERE relname='lesson_feedback'",
  ).trim();
  assert(lessonFeedbackRls === "t", "lesson_feedback RLS must be enabled");

  const lessonFeedbackPolicies = Number(
    psql("SELECT count(*) FROM pg_policies WHERE tablename='lesson_feedback'"),
  );
  assert(lessonFeedbackPolicies === 0, `lesson_feedback should have 0 policies, got ${lessonFeedbackPolicies}`);

  const lessonFeedbackAnon = psql(
    "SELECT privilege_type FROM information_schema.role_table_grants WHERE table_name='lesson_feedback' AND grantee='anon'",
  ).trim();
  assert(lessonFeedbackAnon.length === 0, "lesson_feedback anon grants should be revoked");

  const ragMigration = psql(
    "SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '%rag_locale_index_versioning%'",
  );
  assert(ragMigration.includes("rag_locale_index_versioning"), "RAG migration missing from replay");

  const billingAuthFix = psql(
    "SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '%billing_service_role_auth_fix%'",
  );
  assert(
    billingAuthFix.includes("billing_service_role_auth_fix"),
    "billing_service_role_auth_fix migration missing",
  );

  const lessonFeedbackLockdown = psql(
    "SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '%lesson_feedback_security_lockdown%'",
  );
  assert(
    lessonFeedbackLockdown.includes("lesson_feedback_security_lockdown"),
    "lesson_feedback_security_lockdown migration missing",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        billingTables,
        billingFunctions,
        lessonFeedbackRls: true,
        lessonFeedbackPolicies,
        ragMigration: true,
        billingAuthFix: true,
        lessonFeedbackLockdown: true,
      },
      null,
      2,
    ),
  );
}

main();
