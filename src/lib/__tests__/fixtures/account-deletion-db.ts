import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const migration = (name: string) => readFileSync(`supabase/migrations/${name}`, "utf8");
export async function accountDeletionTestDb(financial = false) {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT jsonb_build_object('role',current_setting('request.jwt.claim.role',true))$$;
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
      CREATE TYPE public.app_role AS ENUM('admin','user');
      CREATE TABLE public.user_roles(user_id uuid,role public.app_role);
      CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)$$;
      CREATE TABLE public.lc09_policy_probe(value integer); INSERT INTO public.lc09_policy_probe VALUES(1);
      ALTER TABLE public.lc09_policy_probe ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON public.lc09_policy_probe TO authenticated;
      CREATE POLICY administrator_read ON public.lc09_policy_probe TO authenticated USING(public.has_role(auth.uid(),'admin'));
      CREATE TABLE public.user_subscriptions(user_id uuid PRIMARY KEY,tier text,status text,current_period_end timestamptz,provider text,provider_subscription_id text);
      CREATE TABLE public.lesson_progress(user_id uuid,lesson_id text);
      CREATE FUNCTION public.delete_my_account_data() RETURNS void LANGUAGE sql AS $$SELECT$$;
      GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;`);
  for (const name of [
    // This installed ownership table is part of the financial inventory.
    "20260709190000_billing_schema_phase1.sql",
    "20260710153000_billing_service_role_auth_fix.sql",
    "20260722180000_billing_launch_closure_contracts_v3.sql",
    "20260722190000_billing_v3_corrective_refresh.sql",
    "20260801120000_billing_legacy_user_subscriptions_compat.sql",
    "20260914190000_billing_entitlement_snapshot_validity.sql",
    "20260915070000_billing_paid_ai_quota_alignment.sql",
    "20260916183000_billing_pro_71_lesson_contract.sql",
    "20260917120000_stripe_test_checkout_bridge.sql",
    "20260918173000_stripe_customer_portal_upgrade.sql",
    "20260923123000_account_deletion_request_gate.sql",
    "20260924190000_kids_parent_content_access_foundation.sql",
    "20260925120000_kids_parent_access_review.sql",
    "20260925140000_kids_market_release_gates.sql",
    "20260925160000_kids_family_profile_limit.sql",
    "20260925190000_kids_retention_email.sql",
    "20260925210000_kids_profile_consent.sql",
    "20260925220000_account_welcome_email.sql",
    "20260925230000_branded_account_mail.sql",
    "20260927110000_kids_parent_self_attestation.sql",
    "20260928100000_kids_parent_privacy_record.sql",
    "20260928120000_kids_stripe_test_billing.sql",
    "20260929110000_kids_refund_reentry_and_access_status.sql",
    "20261001120000_contact_acknowledgements.sql",
    "20261001123000_contact_mail_receipts.sql",
  ])
    await db.exec(migration(name));
  // Exercise the runtime generation extension as well as cumulative migration
  // functions. The wrapper must retain this installed implementation.
  await db.exec(
    readFileSync("docs/billing/20260918_stripe_resubscription_generation_guard.sql", "utf8"),
  );
  await db.exec(migration("20261001153000_account_deletion_lifecycle.sql"));
  if (financial) await db.exec(migration("20261002090000_account_financial_retention_15_days.sql"));
  return db;
}
