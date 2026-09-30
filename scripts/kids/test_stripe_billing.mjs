import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const pg = new PGlite();
const parent = "11111111-1111-4111-8111-111111111111";
const subscription = "sub_kids1";
const customer = "cus_kids1";
const price = "price_kids1";
const now = Math.floor(Date.now() / 1000);
const date = (seconds) => new Date(seconds * 1000).toISOString();
const assert = (value, message) => { if (!value) throw new Error(message); };
async function rpc(name, values) {
  const names = Object.keys(values);
  const result = await pg.query(
    `SELECT public.${name}(${names.map((key, i) => `${key}:=$${i + 1}`).join(",")}) AS value`,
    Object.values(values),
  );
  return result.rows[0].value;
}
const event = (id, paid, invoice, status = "active", occurred = now) => ({
  p_event_id: id, p_parent_id: parent, p_subscription_id: subscription,
  p_customer_id: customer, p_price_id: price, p_status: status,
  p_occurred_at: date(occurred), p_paid: paid, p_paid_invoice_id: invoice,
  p_period_start: paid ? date(now - 120) : null,
  p_period_end: paid ? date(now + 86400) : null,
});
try {
  await pg.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA billing;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;
    CREATE FUNCTION billing.is_service_role_caller() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE public.kids_parent_access_requests(parent_id uuid,parent_email text,country_code text,status text,adult_confirmed boolean);
    CREATE TABLE public.kids_parent_attestations(parent_id uuid,country_code text,policy_id uuid);
    CREATE TABLE public.kids_consent_policies(id uuid,country_code text,enabled boolean);
    CREATE TABLE public.kids_market_release(country_code text,accepts_child_data boolean);
    CREATE TABLE public.kids_release_control(singleton boolean,accepts_child_data boolean);
    CREATE TABLE billing.plan_catalog(id uuid,plan_key text);
    CREATE TABLE billing.plan_versions(id uuid,plan_id uuid);
    CREATE TABLE billing.subscriptions(user_id uuid,plan_version_id uuid,access_state text,current_period_end timestamptz);
    CREATE TABLE billing.gateway_customers(user_id uuid,gateway_code text,gateway_customer_id text,status text,
      UNIQUE(user_id,gateway_code));
    CREATE TABLE public.kids_family_entitlements(parent_id uuid PRIMARY KEY,active_from timestamptz,
      active_until timestamptz,entitlement_reference text);
    INSERT INTO auth.users VALUES ('${parent}','parent@test.invalid',now());
    INSERT INTO public.kids_parent_access_requests VALUES ('${parent}','parent@test.invalid','EG','approved',true);
    INSERT INTO public.kids_parent_attestations VALUES ('${parent}','EG','22222222-2222-4222-8222-222222222222');
    INSERT INTO public.kids_consent_policies VALUES ('22222222-2222-4222-8222-222222222222','EG',true);
    INSERT INTO public.kids_market_release VALUES ('EG',true);
    INSERT INTO public.kids_release_control VALUES (true,true);
    INSERT INTO billing.gateway_customers VALUES ('${parent}','stripe_us','${customer}','active');
  `);
  await pg.exec(readFileSync("supabase/migrations/20260928120000_kids_stripe_test_billing.sql", "utf8"));
  const quote = await rpc("get_kids_stripe_checkout_context", {
    p_user_id: parent, p_market_code: "EG", p_billing_interval: "month",
  });
  assert(quote.amount_minor === 19900 && !quote.discounted, "Server quote must use standard EG price");
  await rpc("register_kids_stripe_price", {
    p_market_code: "EG", p_billing_interval: "month", p_discounted: false,
    p_currency_code: "egp", p_amount_minor: 19900,
    p_product_id: "prod_kids1", p_price_id: price,
  });
  assert(await rpc("apply_kids_stripe_event", event("evt_one", false, null)), "Pending event stored");
  assert((await pg.query("SELECT * FROM public.kids_family_entitlements")).rows.length === 0,
    "No access without payment");
  assert(await rpc("apply_kids_stripe_event", event("evt_two", true, "in_invoice1", "active", now + 1)),
    "Paid invoice applied");
  assert((await pg.query("SELECT * FROM public.kids_family_entitlements")).rows.length === 1,
    "Paid invoice creates access");
  assert(!(await rpc("apply_kids_stripe_event", event("evt_two", true, "in_invoice1", "active", now + 1))),
    "Duplicate event ignored");
  const refund = (id, refundId, amount, status, occurred) => ({
    p_event_id: id, p_parent_id: parent, p_subscription_id: subscription, p_customer_id: customer,
    p_invoice_id: "in_invoice1", p_refund_id: refundId, p_refund_amount: amount,
    p_invoice_amount: 19900, p_refund_status: status, p_occurred_at: date(occurred),
  });
  assert(!(await rpc("apply_kids_stripe_refund", refund("evt_ref1", "re_first", 9900, "succeeded", now + 2))),
    "Partial refund preserves access");
  assert(await rpc("apply_kids_stripe_refund", refund("evt_ref2", "re_second", 10000, "succeeded", now + 3)),
    "Full cumulative refund revokes access");
  await rpc("apply_kids_stripe_refund", refund("evt_ref3", "re_second", 10000, "pending", now + 4));
  assert((await pg.query("SELECT status FROM public.kids_stripe_refunds WHERE refund_id='re_second'"))
    .rows[0].status === "succeeded", "Late pending event cannot undo refund");
  assert(!(await rpc("apply_kids_stripe_event", event("evt_latepaid", true, "in_invoice1", "active", now + 5))),
    "Late payment event cannot restore refunded access");
  assert((await pg.query("SELECT * FROM public.kids_family_entitlements")).rows.length === 0,
    "Refunded subscription remains closed");
  console.log("PASS: Kids Stripe quote, unpaid gate, paid entitlement, replay, partial/full refund and late event");
} finally { await pg.close(); }
