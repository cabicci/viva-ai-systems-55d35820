// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, afterEach, it, expect } from "vitest";
import { accountDeletionTestDb } from "../__tests__/fixtures/account-deletion-db";
import type { PGlite } from "@electric-sql/pglite";
let db: PGlite;
const admin = randomUUID(),
  user = randomUUID(),
  other = randomUUID();
const value = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const caller = async (id: string = user) => {
  await db.query(
    "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",
    [id],
  );
};
const command = (action: string, id = "AC-BUS-M01-L02", locale = "en", data: unknown = {}) =>
  value<Record<string, unknown>>("SELECT public.academic_command($1,$2,$3,$4,$5::jsonb) v", [
    action,
    "AC-BUS",
    id,
    locale,
    JSON.stringify(data),
  ]);
const commerce = (action: string, data: unknown) =>
  value<Record<string, unknown>>("SELECT public.commerce_command($1,$2::jsonb) v", [
    action,
    JSON.stringify(data),
  ]);
const grant = async (pack = "academic") => {
  await caller(admin);
  await commerce("grant", {
    user_id: user,
    package: pack,
    duration_days: 30,
    reason: "Isolated fixture",
    key: randomUUID(),
  });
  await caller();
};
const rejectsSql = async (operation: () => Promise<unknown>, message: string) => {
  await db.exec("SAVEPOINT expected_error");
  try {
    await expect(operation()).rejects.toThrow(message);
  } finally {
    await db.exec("ROLLBACK TO SAVEPOINT expected_error; RELEASE SAVEPOINT expected_error");
  }
};
beforeAll(async () => {
  db = await accountDeletionTestDb(true);
  await db.exec(
    "CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);",
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
    await db.exec(readFileSync(`supabase/migrations/${name}.sql`, "utf8"));
  await db.exec(readFileSync("scripts/academic-education/commerce-candidate.sql", "utf8"));
  await db.exec(readFileSync("scripts/academic-education/integration-candidate.sql", "utf8"));
  await db.exec(
    `INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${admin}','admin@academic.test',now()),('${user}','learner@academic.test',now()),('${other}','other@academic.test',now()); INSERT INTO public.user_roles VALUES('${admin}','admin');`,
  );
  const pilot = JSON.parse(readFileSync("experiments/academic/content/en.json", "utf8"));
  for (const [index, id] of ["AC-BUS-M01-L01", "AC-BUS-M01-L02"].entries())
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"])
      await db.query(
        "INSERT INTO public.academic_lesson_content(course_id,lesson_id,locale,position,introductory,approved,payload,source_sha256) VALUES($1,$2,$3,$4,$5,true,$6::jsonb,$7)",
        [
          "AC-BUS",
          id,
          locale,
          index + 1,
          index === 0,
          JSON.stringify({
            ...pilot,
            id,
            locale,
            privateTeacherNotes: "NEVER_DELIVER",
            provenance: { private: true },
          }),
          "0".repeat(64),
        ],
      );
  await db.exec(
    "INSERT INTO public.academic_asset_manifest VALUES('AC-BUS/L02-en.pdf','AC-BUS','AC-BUS-M01-L02','en','workbook',repeat('0',64))",
  );
}, 60000);
afterAll(async () => await db?.close());
beforeEach(async () => {
  await db.exec(
    "BEGIN; UPDATE public.academic_courses SET enabled=true; UPDATE billing.commerce_control SET enabled=true,access_enabled=true",
  );
  await caller();
});
afterEach(async () => {
  await db.exec("ROLLBACK");
});
it("erases academic learner progress at the existing deletion stage without erasing finance early", async () => {
  await caller(admin);
  await commerce("configure_method", {
    code: "instapay",
    enabled: true,
    instructions: "Synthetic fixture",
    destination: "SYNTHETIC ONLY",
    currencies: ["EGP"],
  });
  await caller();
  const order = await commerce("create_order", {
    package: "academic",
    market: "EG",
    billing_interval: "month",
    method: "instapay",
    key: randomUUID(),
    locale: "en",
  });
  await grant();
  await command("read");
  await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
  await db.exec(
    "UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='synthetic',crm_retention_reference='synthetic',responder_reference='synthetic',release_reference='synthetic'",
  );
  await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
  const claim = await value<{ lease_token: string }>("SELECT public.lc09_claim_deletion($1) v", [
    user,
  ]);
  await value("SELECT public.lc09_advance_deletion($1,$2,'provider_reconciled') v", [
    user,
    claim.lease_token,
  ]);
  await value("SELECT public.lc09_advance_deletion($1,$2,'learner_erased') v", [
    user,
    claim.lease_token,
  ]);
  expect(
    await value("SELECT count(*)::int v FROM public.academic_progress WHERE user_id=$1", [user]),
  ).toBe(0);
  expect(
    await value("SELECT count(*)::int v FROM billing.commerce_orders WHERE id=$1", [order.id]),
  ).toBe(1);
  await caller();
  await rejectsSql(() => command("read"), "COMMERCE_ACCOUNT_UNAVAILABLE");
});
it("keeps Pro Plus pricing parity without giving Pro Plus academic rights", async () => {
  for (const market of ["EG", "INTL"])
    for (const interval of ["month", "year"]) {
      const a = await commerce("quote", {
        package: "academic",
        market,
        billing_interval: interval,
      });
      const b = await commerce("quote", {
        package: "pro_plus",
        market,
        billing_interval: interval,
      });
      expect(a.original_minor).toBe(b.original_minor);
      expect(a.currency).toBe(b.currency);
    }
  await grant("pro_plus");
  expect(await command("lesson")).toEqual({ allowed: false });
});
it("exposes only approved public catalogue titles, even to anonymous visitors", async () => {
  await caller("");
  await db.exec("SET LOCAL ROLE anon");
  const catalog = await value<
    { id: string; title: string; lessons: { id: string; title: string }[] }[]
  >("SELECT public.academic_catalogue('en') v");
  expect(catalog).toHaveLength(1);
  expect(catalog[0].lessons).toHaveLength(2);
  expect(JSON.stringify(catalog)).not.toMatch(/sections|quiz|assignment|correct|NEVER_DELIVER/);
  await db.exec("RESET ROLE");
  await db.exec(
    "UPDATE public.academic_lesson_content SET approved=false WHERE lesson_id='AC-BUS-M01-L02'",
  );
  const filtered = await value<{ lessons: unknown[] }[]>(
    "SELECT public.academic_catalogue('en') v",
  );
  expect(filtered[0].lessons).toHaveLength(1);
  await db.exec("UPDATE public.academic_courses SET enabled=false");
  expect(await value("SELECT public.academic_catalogue('en') v")).toEqual([]);
});
it("reuses the individual coupon path without granting the assistant or another line", async () => {
  await caller(admin);
  const offer = await commerce("simple_offer", {
    key: randomUUID(),
    delivery: "coupon",
    audience: "individual",
    emails: ["learner@academic.test"],
    package: "academic",
    market: "EG",
    billing_interval: "month",
    expected_price_minor: 30900,
    percent: 100,
    code: "ACAD100",
    locale: "ar-EG",
  });
  expect(offer.package).toBe("academic");
  await caller();
  const order = {
    package: "academic",
    market: "EG",
    billing_interval: "month",
    method: "admin",
    code: "ACAD100",
    phone: "+201012345678",
  };
  expect((await commerce("create_order", { ...order, key: randomUUID() })).final_minor).toBe(0);
  expect((await command("lesson")).allowed).toBe(true);
  expect((await command("lesson")).assistantAllowed).toBe(false);
  expect(await value("SELECT public.get_my_billing_access_tier() v")).toBe("free");
  await rejectsSql(() => commerce("create_order", { ...order, key: randomUUID() }), "COMMERCE_");
});
it("keeps invitations recipient-bound and activates only academic access", async () => {
  await caller(admin);
  const offer = await commerce("simple_offer", {
    key: randomUUID(),
    delivery: "invitation",
    code: "ACADINVITE100",
    audience: "individual",
    emails: ["learner@academic.test"],
    package: "academic",
    market: "EG",
    billing_interval: "month",
    expected_price_minor: 30900,
    percent: 100,
    locale: "en",
  });
  const id = await value<string>(
    "SELECT id v FROM billing.commerce_invitations WHERE offer_id=$1",
    [offer.id],
  );
  expect(await value("SELECT count(*)::int v FROM billing.commerce_outbox")).toBe(0);
  await caller(other);
  await rejectsSql(() => commerce("accept", { id, phone: "+201112345678" }), "COMMERCE_");
  await caller();
  await commerce("accept", { id, phone: "+201012345678" });
  await commerce("accept", { id, phone: "+201012345678" });
  expect((await command("lesson")).allowed).toBe(true);
  expect(
    await value("SELECT count(*)::int v FROM billing.commerce_entitlements WHERE user_id=$1", [
      user,
    ]),
  ).toBe(1);
  expect(await value("SELECT public.get_my_billing_access_tier() v")).toBe("free");
});
it("keeps manual receipts private and pending without prematurely enabling lessons", async () => {
  await caller(admin);
  await commerce("configure_method", {
    code: "instapay",
    enabled: true,
    instructions: "Synthetic fixture",
    destination: "SYNTHETIC ONLY",
    currencies: ["EGP"],
  });
  await caller();
  const order = await commerce("create_order", {
    package: "academic",
    market: "EG",
    billing_interval: "month",
    method: "instapay",
    key: randomUUID(),
    locale: "ar-EG",
  });
  const id = randomUUID();
  await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
  await db.query("SELECT public.commerce_receipt($1,'attach',$2::jsonb)", [
    user,
    JSON.stringify({
      id,
      order_id: order.id,
      storage_path: `${order.id}/${id}`,
      mime: "image/png",
      size_bytes: 100,
      digest: "a".repeat(64),
    }),
  ]);
  expect(
    await value("SELECT review_status v FROM billing.commerce_orders WHERE id=$1", [order.id]),
  ).toBe("pending");
  await rejectsSql(
    () =>
      db.query("SELECT public.commerce_receipt($1,'read',$2::jsonb)", [
        other,
        JSON.stringify({ id }),
      ]),
    "FORBIDDEN",
  );
  await caller();
  expect(await command("lesson")).toEqual({ allowed: false });
});
it("allows the free introductory lesson, but no other course content or private download", async () => {
  expect((await command("lesson", "AC-BUS-M01-L01")).allowed).toBe(true);
  expect(await command("lesson")).toEqual({ allowed: false });
  expect(await value("SELECT public.academic_storage_allowed('AC-BUS/L02-en.pdf') v")).toBe(false);
});
it("allows paid academic content while assistant remains independently closed", async () => {
  await grant();
  const r = await command("lesson");
  expect(r.allowed).toBe(true);
  expect(r.video).toBeNull();
  expect(r.assistantAllowed).toBe(false);
  expect(JSON.stringify(r)).not.toMatch(/NEVER_DELIVER|provenance|"correct"|"explanation"/);
  expect(await value("SELECT public.academic_storage_allowed('AC-BUS/L02-en.pdf') v")).toBe(true);
});
it("checks stored admin role on every request and clears access when revoked", async () => {
  await caller(admin);
  expect((await command("lesson")).allowed).toBe(true);
  await db.query("DELETE FROM public.user_roles WHERE user_id=$1", [admin]);
  expect(await command("lesson")).toEqual({ allowed: false });
});
it("rejects invalid locales, inactive courses and unapproved exact locale packages", async () => {
  await grant();
  await rejectsSql(() => command("lesson", "AC-BUS-M01-L02", "fr"), "ACADEMIC_INVALID_LOCALE");
  await db.exec("UPDATE public.academic_lesson_content SET approved=false WHERE locale='ar-Gulf'");
  await rejectsSql(() => command("lesson", "AC-BUS-M01-L02", "ar-Gulf"), "ACADEMIC_INVALID_LESSON");
  await db.exec("UPDATE public.academic_courses SET enabled=false");
  await rejectsSql(() => command("lesson"), "ACADEMIC_UNAVAILABLE");
});
it("grades only server answer keys, rejects forged pass fields and saves only the caller progress", async () => {
  await grant();
  const pilot = JSON.parse(readFileSync("experiments/academic/content/en.json", "utf8"));
  const answers = Object.fromEntries(
    pilot.quiz.map((q: { id: string; correct: number }) => [q.id, q.correct]),
  );
  await rejectsSql(
    () => command("quiz", "AC-BUS-M01-L02", "en", { answers, passed: true }),
    "ACADEMIC_INVALID_ANSWERS",
  );
  expect((await command("quiz", "AC-BUS-M01-L02", "en", { answers })).passed).toBe(true);
  await caller(other);
  expect((await command("status")).progress).toEqual({});
});
it("validates practice shape and calls it submission rather than grading", async () => {
  await grant();
  await rejectsSql(
    () => command("practice", "AC-BUS-M01-L02", "en", { values: ["x"], score: 100 }),
    "ACADEMIC_INVALID_PRACTICE",
  );
  expect(
    (
      await command("practice", "AC-BUS-M01-L02", "en", {
        values: Array(5).fill("A completed task field"),
      })
    ).allowed,
  ).toBe(true);
  const result = JSON.stringify(await command("status"));
  expect(result).toContain('"practiceSubmitted":true');
  expect(result).toContain('"quizPassed":false');
});
it("revokes paid access and download when entitlement expires", async () => {
  await grant();
  await db.query(
    "UPDATE billing.commerce_entitlements SET ends_at=now()-interval '1 minute',starts_at=now()-interval '2 days' WHERE user_id=$1",
    [user],
  );
  expect(await command("lesson")).toEqual({ allowed: false });
  expect(await value("SELECT public.academic_storage_allowed('AC-BUS/L02-en.pdf') v")).toBe(false);
});
it("keeps raw content inaccessible through the authenticated table role", async () => {
  await db.exec("SAVEPOINT raw_table");
  try {
    await db.exec("SET LOCAL ROLE authenticated");
    await expect(db.query("SELECT payload FROM public.academic_lesson_content")).rejects.toThrow(
      /permission denied/,
    );
  } finally {
    await db.exec("ROLLBACK TO SAVEPOINT raw_table; RELEASE SAVEPOINT raw_table");
  }
});
it("requires an authenticated stored identity even for introductory lessons", async () => {
  await db.query("SELECT set_config('request.jwt.claim.sub','',false)");
  await rejectsSql(() => command("lesson", "AC-BUS-M01-L01"), "COMMERCE_ACCOUNT_UNAVAILABLE");
});
it("uses the existing technical complete-correction rule rather than inventing a pass threshold", async () => {
  await grant();
  const pilot = JSON.parse(readFileSync("experiments/academic/content/en.json", "utf8"));
  const answers = Object.fromEntries(
    pilot.quiz.map((q: { id: string; correct: number }) => [q.id, q.correct]),
  );
  answers[pilot.quiz[0].id] = (answers[pilot.quiz[0].id] + 1) % pilot.quiz[0].options.length;
  expect((await command("quiz", "AC-BUS-M01-L02", "en", { answers })).passed).toBe(false);
});
