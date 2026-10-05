/* SQL fixture returns differ by RPC action. */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { beforeAll, afterAll, beforeEach, afterEach, it, expect } from "vitest";
import { accountDeletionTestDb } from "../__tests__/fixtures/account-deletion-db";
import type { PGlite } from "@electric-sql/pglite";
let db: PGlite;
const admin = randomUUID(),
  user = randomUUID(),
  other = randomUUID();
const value = async <T = any>(sql: string, args: unknown[] = []) =>
  (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const call = (action: string, data: unknown = {}) =>
  value("SELECT public.commerce_command($1,$2::jsonb) v", [action, JSON.stringify(data)]);
const tech = (action: string, id = "M01-L02", locale = "en", data: unknown = {}) =>
  value("SELECT public.technical_command($1,$2,$3,$4::jsonb) v", [
    action,
    id,
    locale,
    JSON.stringify(data),
  ]);
const caller = async (id: string = user, role = "authenticated") => {
  await db.query(
    "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)",
    [id, role],
  );
};
const grant = async (pack = "technical") => {
  await caller(admin);
  const result = await call("grant", {
    user_id: user,
    package: pack,
    duration_days: 30,
    reason: "Isolated synthetic",
    key: randomUUID(),
  });
  await caller();
  return result;
};
const migration = (name: string) => readFileSync(`supabase/migrations/${name}.sql`, "utf8");
beforeAll(async () => {
  db = await accountDeletionTestDb(true);
  await db.exec(
    `CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);`,
  );
  for (const name of [
    "20261004010000_commerce_foundation",
    "20261004011000_commerce_commands",
    "20261004012000_commerce_access",
    "20261004013000_commerce_receipts_mail",
    "20261004014000_commerce_account_retention",
    "20261004015000_commerce_payment_mail",
    "20261004016000_commerce_simple_offers",
    "20261005100000_technical_education_integration",
    "20261005101000_technical_stripe_test",
    "20261005102000_technical_subscription_mail",
    "20261005110000_admin_kids_lesson_review",
  ])
    await db.exec(migration(name));
  await db.exec(
    `INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${admin}','admin@example.test',now()),('${user}','member@example.test',now()),('${other}','other@example.test',now()); INSERT INTO public.user_roles VALUES('${admin}','admin');`,
  );
  const delivery = JSON.parse(readFileSync("scripts/technical-education/delivery.json", "utf8"));
  for (const l of delivery.lessons)
    await db.query("INSERT INTO public.technical_lesson_content VALUES($1,$2,$3,$4::jsonb,$5,$6)", [
      l.lesson_id,
      l.locale,
      l.kind,
      JSON.stringify(l.payload),
      l.video_guid,
      l.source_sha256,
    ]);
  for (const a of delivery.assets)
    await db.query("INSERT INTO public.technical_asset_manifest VALUES($1,$2,$3,$4,$5)", [
      a.path,
      a.lesson_id,
      a.locale,
      a.kind,
      a.sha256,
    ]);
}, 60000);
afterAll(async () => await db?.close());
beforeEach(async () => {
  await db.exec(
    "BEGIN; UPDATE public.technical_release_control SET enabled=true; UPDATE billing.commerce_control SET enabled=true",
  );
  await caller(admin);
  await call("configure_method", {
    code: "instapay",
    enabled: true,
    instructions: "SYNTHETIC ONLY",
    destination: "SYNTHETIC",
    currencies: ["EGP"],
  });
  await caller();
});
afterEach(async () => {
  await db.exec("ROLLBACK");
});
it("prices technical exactly at Pro Plus in every existing market and interval, with 16 admin choices", async () => {
  for (const market of ["EG", "INTL"])
    for (const interval of ["month", "year"]) {
      const a = await call("quote", { package: "technical", market, billing_interval: interval });
      const b = await call("quote", { package: "pro_plus", market, billing_interval: interval });
      expect(a.original_minor).toBe(b.original_minor);
      expect(a.currency).toBe(b.currency);
    }
  await caller(admin);
  expect(await call("offer_catalogue")).toHaveLength(16);
});
it("requires identity, allows first lesson only and keeps AI/Kids/technical separate", async () => {
  expect((await tech("lesson", "M01-L01")).allowed).toBe(true);
  expect(await tech("lesson")).toEqual({ allowed: false });
  await grant("pro_plus");
  await db.query(
    "WITH g AS (INSERT INTO billing.commerce_grants(user_id,package,reason,request_key) VALUES($1,'kids','Isolated existing entitlement',$2) RETURNING id) INSERT INTO billing.commerce_entitlements(user_id,package,grant_id,starts_at,ends_at) SELECT $1,'kids',id,now(),now()+interval '1 day' FROM g",
    [user, randomUUID()],
  );
  expect((await tech("status")).paid).toBe(false);
  await grant();
  expect((await tech("status")).paid).toBe(true);
  await caller(other);
  expect(await tech("lesson")).toEqual({ allowed: false });
  await caller(admin);
  expect((await tech("lesson")).allowed).toBe(true);
  await caller("");
  await expect(tech("lesson", "M01-L01")).rejects.toThrow(/ACCOUNT_UNAVAILABLE/);
});
it("technical alone never grants adult or family access", async () => {
  await grant();
  expect(await value("SELECT public.get_my_billing_access_tier() v")).toBe("free");
  expect(
    await value(
      `SELECT count(*)::int v FROM billing.commerce_entitlements WHERE user_id='${user}' AND package IN ('pro','pro_plus','kids')`,
    ),
  ).toBe(0);
});
it("opens all 320 technical packages for the administrator without a paid grant", async () => {
  await caller(admin);
  const delivery = JSON.parse(readFileSync("scripts/technical-education/delivery.json", "utf8"));
  for (const item of delivery.lessons) {
    expect((await tech("lesson", item.lesson_id, item.locale)).allowed).toBe(true);
  }
  expect(
    await value("SELECT count(*)::int v FROM billing.commerce_entitlements WHERE user_id=$1", [
      admin,
    ]),
  ).toBe(0);
  await db.query("DELETE FROM public.user_roles WHERE user_id=$1", [admin]);
  expect(await tech("lesson")).toEqual({ allowed: false });
});
it("allows administrator-owned Kids review for all 144 approved tuples without creating child profiles", async () => {
  await db.exec(
    "UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true",
  );
  await db.exec(`INSERT INTO public.kids_content_approvals(level_id,lesson_number,locale,approved_at,approval_reference)
    SELECT 'level-'||level,lesson,locale,now(),'synthetic-admin-review'
    FROM generate_series(1,3) level CROSS JOIN generate_series(1,12) lesson
    CROSS JOIN unnest(ARRAY['ar-EG','ar-MSA','ar-Gulf','en']) locale ON CONFLICT DO NOTHING`);
  const kids = (profile: string, level = "level-3", lesson = 12, locale = "en") =>
    value("SELECT public.kids_can_access_lesson($1,$2,$3,$4) v", [profile, level, lesson, locale]);
  await caller(admin);
  for (let level = 1; level <= 3; level++)
    for (let lesson = 1; lesson <= 12; lesson++)
      for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"])
        expect(await kids(admin, `level-${level}`, lesson, locale)).toBe(true);
  expect(await kids(user)).toBe(false);
  expect(await kids(admin, "level-3", 13)).toBe(false);
  expect(await kids(admin, "level-3", 12, "fr")).toBe(false);
  expect(await value("SELECT count(*)::int v FROM public.kids_profiles")).toBe(0);
  await caller(user);
  expect(await kids(user)).toBe(false);
  expect(await kids(admin)).toBe(false);
  await caller("");
  await db.exec("SAVEPOINT anonymous_review");
  await expect(kids(admin)).rejects.toThrow(/ACCOUNT_USER_REQUIRED/);
  await db.exec("ROLLBACK TO SAVEPOINT anonymous_review");
  await caller(admin);
  await db.exec("UPDATE public.kids_release_control SET lesson_access_enabled=false");
  expect(await kids(admin)).toBe(false);
  await db.exec("UPDATE public.kids_release_control SET lesson_access_enabled=true");
  await db.query("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1", [admin]);
  expect(await kids(admin)).toBe(false);
  await db.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [admin]);
  await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [admin]);
  await db.query(
    "INSERT INTO billing.account_deletion_lifecycle(user_id,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES($1,'blocked','synthetic','synthetic','synthetic')",
    [admin],
  );
  expect(await kids(admin)).toBe(false);
  await db.query("DELETE FROM billing.account_deletion_lifecycle WHERE user_id=$1", [admin]);
  await db.query("DELETE FROM billing.account_deletion_requests WHERE user_id=$1", [admin]);
  expect(await kids(admin)).toBe(true);
  await db.query("DELETE FROM public.user_roles WHERE user_id=$1", [admin]);
  expect(await kids(admin)).toBe(false);
  expect(
    await value(
      "SELECT has_function_privilege('authenticated','billing.kids_previous_admin_lesson_access(uuid,text,integer,text)','EXECUTE') v",
    ),
  ).toBe(false);
  expect(
    await value(
      "SELECT has_function_privilege('anon','public.kids_can_access_lesson(uuid,text,integer,text)','EXECUTE') v",
    ),
  ).toBe(false);
});
it("delivers all 320 protected packages, original videos and private file references, without quiz keys", async () => {
  await grant();
  const delivery = JSON.parse(readFileSync("scripts/technical-education/delivery.json", "utf8"));
  for (const item of delivery.lessons) {
    const r = await tech("lesson", item.lesson_id, item.locale);
    expect(r.allowed).toBe(true);
    expect(r.video).toContain(item.video_guid);
    expect(r.files).toHaveLength(item.kind === "cabinet" ? 3 : 2);
    for (const q of r.lesson.quiz) {
      expect(q).not.toHaveProperty("correct");
      expect(q).not.toHaveProperty("explanation");
    }
  }
  expect(await value("SELECT public.technical_storage_allowed('M01-L02/en/workbook.pdf') v")).toBe(
    true,
  );
  expect(await value("SELECT public.technical_storage_allowed('unknown/path.pdf') v")).toBe(false);
  await caller(other);
  expect(await value("SELECT public.technical_storage_allowed('M01-L02/en/workbook.pdf') v")).toBe(
    false,
  );
  expect(await value("SELECT public.technical_storage_allowed('M01-L01/en/workbook.pdf') v")).toBe(
    true,
  );
});
it("grades quizzes on the server and saves account-owned multilingual drafts", async () => {
  await grant();
  const l = JSON.parse(
    readFileSync(
      "scripts/technical-education/source/technical-education/lessons/M01-L02__en.json",
      "utf8",
    ),
  );
  const answers = Object.fromEntries(l.quiz.map((q: any) => [q.id, q.correct]));
  expect((await tech("quiz", "M01-L02", "en", { answers })).passed).toBe(true);
  expect((await tech("status")).progress["M01-L02"].quizPassed).toBe(true);
  answers[l.quiz[0].id] = (answers[l.quiz[0].id] + 1) % l.quiz[0].options.length;
  expect((await tech("quiz", "M01-L02", "en", { answers })).passed).toBe(false);
  const values = l.assignment.fields.map(() => "Synthetic workshop notes");
  await tech("practice", "M01-L02", "en", { values, criteria: [true, true, true] });
  await tech("read");
  const progress = (await tech("status")).progress["M01-L02"];
  expect(progress.drafts.en).toEqual(values);
  expect(progress.read).toBe(true);
  expect(progress.practiceReviewed).toBe(true);
  await caller(other);
  expect((await tech("status")).progress).toEqual({});
  await caller();
  expect((await tech("status")).progress["M01-L02"].drafts.en).toEqual(values);
  expect(
    (
      await tech("quiz", "M04-L02", "ar-EG", {
        answers: { width: 1, depth: 2, quantity: 0, release: 1 },
      })
    ).passed,
  ).toBe(true);
  expect(
    (
      await tech("practice", "M04-L02", "ar-EG", {
        values: { innerWidth: "764", bodyDepth: "344", opening: "323" },
      })
    ).passed,
  ).toBe(true);
  expect(
    (
      await tech("practice", "M04-L02", "ar-EG", {
        values: { innerWidth: "0", bodyDepth: "344", opening: "323" },
      })
    ).passed,
  ).toBe(false);
});
it("supports individual 100% coupon activation once per email and recorded phone", async () => {
  await caller(admin);
  const offer = await call("simple_offer", {
    key: randomUUID(),
    delivery: "coupon",
    audience: "individual",
    emails: ["member@example.test"],
    package: "technical",
    market: "EG",
    billing_interval: "month",
    expected_price_minor: 30900,
    percent: 100,
    code: "TECH100",
    locale: "en",
  });
  expect(offer.package).toBe("technical");
  await caller();
  const o = await call("create_order", {
    package: "technical",
    market: "EG",
    billing_interval: "month",
    method: "admin",
    code: "TECH100",
    phone: "+201012345678",
    key: randomUUID(),
  });
  expect(o.final_minor).toBe(0);
  expect((await tech("status")).paid).toBe(true);
  await db.exec("SAVEPOINT repeat");
  await expect(
    call("create_order", {
      package: "technical",
      market: "EG",
      billing_interval: "month",
      method: "admin",
      code: "TECH100",
      phone: "+201012345678",
      key: randomUUID(),
    }),
  ).rejects.toThrow(/LIMIT|PHONE|USED|INELIGIBLE/);
  await db.exec("ROLLBACK TO repeat");
});
async function stripeEvent(overrides: Record<string, unknown> = {}) {
  const args = {
    event_id: "evt_technicalOne",
    parent_id: user,
    subscription_id: "sub_technicalOne",
    customer_id: "cus_technicalOne",
    price_id: "price_technicalOne",
    status: "active",
    occurred_at: new Date().toISOString(),
    paid: true,
    paid_invoice_id: "in_technicalOne",
    period_start: new Date(Date.now() - 10000).toISOString(),
    period_end: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
  return value(
    "SELECT public.apply_technical_stripe_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) v",
    Object.values(args),
  );
}
async function stripeSetup() {
  await caller(user, "service_role");
  await db.query(
    "INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status,metadata) VALUES($1,'stripe_us','cus_technicalOne','active','{\"mode\":\"test\"}')",
    [user],
  );
  await value(
    "SELECT public.register_technical_stripe_price('EG','month',false,'egp',30900,'prod_technicalOne','price_technicalOne') v",
  );
}
it("activates Stripe only from known paid evidence, deduplicates invoices, queues welcome and fully revokes refund", async () => {
  await stripeSetup();
  await stripeEvent({ paid: false, paid_invoice_id: null, period_start: null, period_end: null });
  await caller();
  expect((await tech("status")).paid).toBe(false);
  await caller(user, "service_role");
  await stripeEvent({ event_id: "evt_technicalPaid" });
  expect(await stripeEvent({ event_id: "evt_technicalPaid" })).toBe(false);
  expect(await value("SELECT count(*)::int v FROM public.technical_mail_outbox")).toBe(1);
  await caller();
  expect((await tech("status")).paid).toBe(true);
  expect(await value("SELECT public.get_my_billing_access_tier() v")).toBe("free");
  await caller(user, "service_role");
  await stripeEvent({ event_id: "evt_duplicateInvoice" });
  expect(await value("SELECT count(*)::int v FROM public.technical_mail_outbox")).toBe(1);
  const claims = await value<any[]>("SELECT public.technical_mail_command('claim') v");
  expect(claims).toHaveLength(1);
  expect(
    await value("SELECT public.technical_mail_command('authorize',$1::jsonb) v", [
      JSON.stringify(claims[0]),
    ]),
  ).toBe(true);
  expect(
    await value("SELECT public.technical_mail_command('result',$1::jsonb) v", [
      JSON.stringify({ ...claims[0], provider_id: "synthetic-provider" }),
    ]),
  ).toBe(true);
  expect(await value("SELECT public.technical_mail_command('claim') v")).toEqual([]);
  expect(
    await value(
      "SELECT public.apply_technical_stripe_refund('evt_refund',$1,'sub_technicalOne','cus_technicalOne','in_technicalOne','re_technicalOne',30900,30900,'succeeded',now()) v",
      [user],
    ),
  ).toBe(true);
  await caller();
  expect((await tech("status")).paid).toBe(false);
  await caller(user, "service_role");
  expect(await stripeEvent({ event_id: "evt_lateInvoice" })).toBe(false);
});
it("erases technical progress on account deletion and finance only after the existing 15 days", async () => {
  await grant();
  await tech("read");
  await stripeSetup();
  await stripeEvent();
  await db.exec(
    "UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='synthetic',crm_retention_reference='synthetic',responder_reference='synthetic',release_reference='synthetic'",
  );
  await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
  const claim = await value<any>("SELECT public.lc09_claim_deletion($1) v", [user]);
  await value("SELECT public.lc09_advance_deletion($1,$2,'provider_reconciled') v", [
    user,
    claim.lease_token,
  ]);
  await value("SELECT public.lc09_advance_deletion($1,$2,'learner_erased') v", [
    user,
    claim.lease_token,
  ]);
  expect(
    await value("SELECT count(*)::int v FROM public.technical_progress WHERE user_id=$1", [user]),
  ).toBe(0);
  expect(
    await value("SELECT count(*)::int v FROM public.technical_mail_outbox WHERE user_id=$1", [
      user,
    ]),
  ).toBe(0);
  expect(
    await value(
      "SELECT count(*)::int v FROM billing.technical_stripe_subscriptions WHERE user_id=$1",
      [user],
    ),
  ).toBe(1);
  await db.query("DELETE FROM auth.users WHERE id=$1", [user]);
  await value("SELECT public.lc09_advance_deletion($1,$2,'complete') v", [user, claim.lease_token]);
  await db.exec("SAVEPOINT early");
  await expect(value("SELECT public.lc09_claim_financial_purge($1) v", [user])).rejects.toThrow(
    /NOT_DUE/,
  );
  await db.exec("ROLLBACK TO early");
  await db.query(
    "UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '16 days' WHERE user_id=$1",
    [user],
  );
  const purge = await value<any>("SELECT public.lc09_claim_financial_purge($1) v", [user]);
  await value("SELECT public.lc09_complete_financial_purge($1,$2,false) v", [
    user,
    purge.lease_token,
  ]);
  expect(
    await value(
      "SELECT count(*)::int v FROM billing.technical_stripe_subscriptions WHERE user_id=$1",
      [user],
    ),
  ).toBe(0);
  expect(await value("SELECT count(*)::int v FROM public.technical_lesson_content")).toBe(320);
});
it("preserves every original PDF byte and prohibits public paid payloads", () => {
  const delivery = JSON.parse(readFileSync("scripts/technical-education/delivery.json", "utf8"));
  expect(delivery.lessons).toHaveLength(320);
  expect(delivery.assets).toHaveLength(644);
  for (const a of delivery.assets)
    expect(createHash("sha256").update(readFileSync(a.local)).digest("hex")).toBe(a.sha256);
});
