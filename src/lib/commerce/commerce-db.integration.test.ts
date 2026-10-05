// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  accountDeletionTestDb,
  accountDeletionSchemaSql,
} from "../__tests__/fixtures/account-deletion-db";

import type { Order, Invitation } from "./contracts";
type CommandResult = Order & {
  enabled: boolean;
  [index: number]: Invitation & { error: string; enabled: boolean };
};
type TestDb = {
  query<T>(sql: string, args?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
  close(): Promise<void>;
};
let db: TestDb;
const nativeUrl = process.env.COMMERCE_NATIVE_DATABASE_URL;
let nativeClient: ReturnType<typeof postgres> | undefined;
const admin = randomUUID(),
  user = randomUUID(),
  other = randomUUID();
const command = async (action: string, data: unknown = {}) =>
  (
    await db.query<{ value: CommandResult }>(
      "SELECT public.commerce_command($1,$2::jsonb) AS value",
      [action, JSON.stringify(data)],
    )
  ).rows[0].value;
const caller = (id: string) =>
  db.query(
    "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",
    [id],
  );
const value = async <T = unknown>(sql: string) =>
  (await db.query<{ value: T }>(sql)).rows[0]?.value;
async function denied(action: string, data: unknown, error: RegExp) {
  await db.exec("SAVEPOINT denied");
  try {
    await expect(command(action, data)).rejects.toThrow(error);
  } finally {
    await db.exec("ROLLBACK TO SAVEPOINT denied; RELEASE SAVEPOINT denied");
  }
}
beforeAll(async () => {
  if (nativeUrl) {
    const parsed = new URL(nativeUrl);
    if (
      !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
      parsed.pathname !== "/commerce_test"
    )
      throw new Error("Disposable localhost commerce_test database required");
    nativeClient = postgres(nativeUrl, { max: 1 });
    for (const sql of accountDeletionSchemaSql(true)) await nativeClient.unsafe(sql);
    db = {
      query: async <T>(sql: string, args: unknown[] = []) => ({
        rows: (await nativeClient!.unsafe(
          sql,
          args.map((v) =>
            typeof v === "string" && (v.startsWith("{") || v.startsWith("["))
              ? nativeClient!.json(JSON.parse(v))
              : v,
          ) as never,
        )) as unknown as T[],
      }),
      exec: async (sql) => nativeClient!.unsafe(sql),
      close: () => nativeClient!.end(),
    };
  } else db = await accountDeletionTestDb(true);
  await db.exec(`CREATE SCHEMA storage;
   CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);`);
  for (const name of [
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
  ])
    try {
      await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
    } catch (error) {
      console.error(name, (error as { message: string }).message);
      throw error;
    }
  await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${admin}','admin@example.test',now()),('${user}','member@example.test',now()),('${other}','other@example.test',now());
      INSERT INTO public.user_roles VALUES('${admin}','admin');`);
}, 30000);
afterAll(async () => db?.close());
describe("unified commerce with installed billing and LC09", () => {
  beforeEach(async () => {
    await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
    await caller(admin);
    await command("configure_method", {
      code: "instapay",
      enabled: true,
      instructions: "Transfer then upload",
      destination: "SYNTHETIC ONLY",
      currencies: ["EGP"],
    });
  });
  afterEach(async () => db.exec("ROLLBACK"));
  it("freezes four-locale instructions on the order and rejects invalid locale maps at the SQL boundary", async () => {
    const instructions_localized = {
      "ar-EG": "مصري",
      "ar-MSA": "فصحى",
      "ar-Gulf": "خليجي",
      en: "English",
    };
    const settings = {
      code: "instapay",
      enabled: true,
      instructions: "Fallback",
      destination: "SYNTHETIC ONLY",
      currencies: ["EGP"],
    };
    await command("configure_method", { ...settings, instructions_localized });
    await caller(user);
    const order = await command("create_order", {
      package: "pro",
      market: "EG",
      billing_interval: "month",
      method: "instapay",
      key: "localized-order-snapshot",
    });
    await caller(admin);
    await command("configure_method", settings);
    const methods = (await command("methods")) as unknown as {
      code: string;
      instructions_localized: typeof instructions_localized;
    }[];
    expect(
      methods.find((m: { code: string }) => m.code === "instapay")?.instructions_localized,
    ).toEqual(instructions_localized);
    await command("configure_method", {
      ...settings,
      instructions_localized: { ...instructions_localized, en: "Changed later" },
    });
    await caller(user);
    const stored = await command("order", { id: order.id });
    expect(stored.instructions_snapshot.instructions_localized).toEqual(instructions_localized);
    await caller(admin);
    for (const invalid of [
      { fr: "Unsupported" },
      { en: 123 },
      { en: "" },
      { en: "x".repeat(4001) },
    ]) {
      await db.exec("SAVEPOINT invalid_localized_instructions");
      await expect(
        command("configure_method", { ...settings, instructions_localized: invalid }),
      ).rejects.toThrow(/COMMERCE_INVALID_LOCALIZED_INSTRUCTIONS/);
      await db.exec("ROLLBACK TO SAVEPOINT invalid_localized_instructions");
    }
  });
  it("keeps feature disabled by default and forbids bare admin writes", async () => {
    await db.exec("UPDATE billing.commerce_control SET enabled=false");
    await caller(user);
    expect((await command("status")).enabled).toBe(false);
    expect((await command("methods"))[0].enabled).toBe(false);
    await denied(
      "create_order",
      {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        method: "instapay",
        key: randomUUID(),
      },
      /COMMERCE_DISABLED/,
    );
    await db.exec("UPDATE billing.commerce_control SET enabled=true");
    await denied("create_group", { name: "test" }, /ADMIN_REQUIRED/);
  });
  it("confirming twice cannot extend access or multiply revenue", async () => {
    await caller(user);
    const o = await command("create_order", {
      package: "pro",
      market: "EG",
      billing_interval: "month",
      method: "instapay",
      key: "order-0001",
    });
    expect(o.final_minor).toBe(16900);
    await caller(admin);
    const data = {
      key: "payment-0001",
      method: "instapay",
      currency: "EGP",
      amount_minor: 16900,
      transaction_reference: "synthetic-ref-0001",
      received_at: new Date().toISOString(),
      funds_verified: true,
      allocations: [{ order_id: o.id, amount_minor: 16900 }],
    };
    const first = await command("confirm", data);
    expect((await command("confirm", data)).id).toBe(first.id);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(1);
    expect(
      await value("SELECT sum(amount_minor)::int AS value FROM billing.commerce_payments"),
    ).toBe(16900);
    await caller(user);
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro");
    await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const snapshot = await value<{
      lessons: { entitled_lesson_ids: string[] };
      builder_access: boolean;
    }>(`SELECT billing.get_entitlement_snapshot('${user}') AS value`);
    expect(snapshot.lessons.entitled_lesson_ids).toHaveLength(71);
    expect(snapshot.builder_access).toBe(false);
    expect(
      snapshot.lessons.entitled_lesson_ids.every((id: string) => !id.startsWith("builder-")),
    ).toBe(true);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.gateway_customers WHERE user_id='${user}'`,
      ),
    ).toBe(0);
  });
  it("rejects unavailable destinations and explicit customer admin access", async () => {
    await caller(user);
    for (const method of ["bank", "paymob", "admin", "stripe"])
      await denied(
        "create_order",
        {
          package: "pro",
          market: "EG",
          billing_interval: "month",
          method,
          key: "unconfigured-" + method,
        },
        /METHOD_UNAVAILABLE/,
      );
  });
});

describe("commerce review, invitation and lifecycle edge cases", () => {
  beforeEach(async () => {
    await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
    await caller(admin);
    await command("configure_method", {
      code: "instapay",
      enabled: true,
      instructions: "Synthetic instructions",
      destination: "SYNTHETIC ONLY",
      currencies: ["EGP"],
    });
  });
  afterEach(async () => db.exec("ROLLBACK"));
  const selection = { package: "pro", market: "EG", billing_interval: "month", method: "instapay" };
  const order = async () => {
    await caller(user);
    return command("create_order", { ...selection, key: randomUUID() });
  };
  const pay = async (
    o: { id: string; final_minor: number },
    changes: Record<string, unknown> = {},
  ) => {
    await caller(admin);
    return command("confirm", {
      key: randomUUID(),
      method: "instapay",
      currency: "EGP",
      amount_minor: o.final_minor,
      transaction_reference: randomUUID(),
      received_at: new Date().toISOString(),
      funds_verified: true,
      allocations: [{ order_id: o.id, amount_minor: o.final_minor }],
      ...changes,
    });
  };
  const simple = async (changes: Record<string, unknown> = {}) => {
    const catalogue = (await command("offer_catalogue")) as unknown as {
      package: string;
      market: string;
      billing_interval: string;
      original_minor: number;
    }[];
    const params = {
      key: randomUUID(),
      audience: "public",
      emails: [],
      group_name: "",
      package: "pro",
      market: "EG",
      billing_interval: "month",
      percent: 100,
      delivery: "coupon",
      code: `S-${randomUUID().slice(0, 8)}`.toUpperCase(),
      locale: "ar-EG",
      limit_mode: "time",
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      max_redemptions: null,
      ...changes,
    };
    const input = {
      ...params,
      expected_price_minor: catalogue.find(
        (p) =>
          p.package === params.package &&
          p.market === params.market &&
          p.billing_interval === params.billing_interval,
      )!.original_minor,
    };
    return { input, offer: await command("simple_offer", input) };
  };
  const redeem = (code: string, phone = "+201012345678", key = randomUUID()) =>
    command("create_order", { ...selection, code, phone, key });
  it("creates time-only/count-only coupons atomically, with live prices and no automatic email", async () => {
    const { input, offer } = await simple();
    expect((offer as unknown as { max_redemptions: null }).max_redemptions).toBeNull();
    expect((await command("simple_offer", input)).id).toBe(offer.id);
    await denied("simple_offer", { ...input, percent: 50 }, /RETRY_CONFLICT/);
    await denied(
      "simple_offer",
      { ...input, key: randomUUID(), code: "TAMPERED", expected_price_minor: 1 },
      /PRICE_CHANGED/,
    );
    const counted = await simple({ limit_mode: "count", valid_until: null, max_redemptions: 2 });
    expect((counted.offer as unknown as { valid_until: null }).valid_until).toBeNull();
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_outbox")).toBe(0);
    await caller(user);
    await denied("simple_offer", { ...input, key: randomUUID() }, /ADMIN_REQUIRED/);
    await denied("offer_catalogue", {}, /ADMIN_REQUIRED/);
    expect(
      await value(
        "SELECT has_function_privilege('authenticated','billing.commerce_previous_simple_command(text,jsonb)','EXECUTE') AS value",
      ),
    ).toBe(false);
  });
  it("100 percent activates from redemption for a calendar month and rejects same email, phone or user", async () => {
    const { input } = await simple();
    await caller(user);
    await denied(
      "create_order",
      { ...selection, code: input.code, key: randomUUID() },
      /PHONE_REQUIRED/,
    );
    const key = randomUUID();
    const o = await redeem(input.code, undefined, key);
    expect(o.final_minor).toBe(0);
    expect(o.review_status).toBe("confirmed");
    expect((await redeem(input.code, undefined, key)).id).toBe(o.id);
    expect(
      await value(
        `SELECT ends_at=starts_at+interval '1 month' AND starts_at=now() AS value FROM billing.commerce_entitlements WHERE grant_id IN (SELECT id FROM billing.commerce_grants WHERE offer_order_id='${o.id}')`,
      ),
    ).toBe(true);
    await denied(
      "create_order",
      { ...selection, code: input.code, key: randomUUID(), phone: "+201112345678" },
      /ALREADY_USED/,
    );
    await caller(other);
    await denied(
      "create_order",
      { ...selection, code: input.code, key: randomUUID(), phone: "+201012345678" },
      /ALREADY_USED/,
    );
    expect((await redeem(input.code, "+201112345678")).review_status).toBe("confirmed");
  });
  it("restricts targeted coupons to listed emails and selected package interval", async () => {
    const { input } = await simple({ audience: "group", emails: ["member@example.test"] });
    await caller(other);
    await denied("quote", { ...selection, code: input.code }, /INELIGIBLE/);
    await caller(user);
    await denied(
      "quote",
      { ...selection, billing_interval: "year", code: input.code },
      /INELIGIBLE/,
    );
    expect((await redeem(input.code)).review_status).toBe("confirmed");
  });
  it("count-only coupons enforce capacity without expiry and time-only coupons expire", async () => {
    const { input } = await simple({ limit_mode: "count", valid_until: null, max_redemptions: 1 });
    await caller(user);
    await redeem(input.code);
    await caller(other);
    await denied(
      "create_order",
      { ...selection, code: input.code, key: randomUUID(), phone: "+201112345678" },
      /OFFER_LIMIT/,
    );
    await caller(admin);
    const timed = await simple();
    await db.query(
      "UPDATE billing.commerce_offers SET valid_from=now()-interval '2 days',valid_until=now()-interval '1 day' WHERE id=$1",
      [timed.offer.id],
    );
    await caller(user);
    await denied("quote", { ...selection, code: timed.input.code }, /INELIGIBLE/);
  });
  it.each([20, 100])(
    "direct %s percent invitations use 15-day deadline, email-only recipients and explicit send",
    async (percent) => {
      const { offer, input } = await simple({
        audience: "group",
        emails: ["member@example.test", "other@example.test"],
        delivery: "invitation",
        percent,
      });
      const invitations = (
        await db.query<Invitation>(
          "SELECT * FROM billing.commerce_invitations WHERE offer_id=$1 ORDER BY email",
          [offer.id],
        )
      ).rows;
      expect(invitations).toHaveLength(2);
      expect(invitations[0].name).toBeNull();
      expect(
        await value(
          `SELECT bool_and(deadline=now()+interval '15 days') AS value FROM billing.commerce_invitations WHERE offer_id='${offer.id}'`,
        ),
      ).toBe(true);
      expect(await value("SELECT count(*)::int AS value FROM billing.commerce_outbox")).toBe(0);
      await db.exec("UPDATE billing.commerce_control SET invitations_enabled=true");
      await command("send_offer_invitations", { id: offer.id });
      await command("send_offer_invitations", { id: offer.id });
      expect(await value("SELECT count(*)::int AS value FROM billing.commerce_outbox")).toBe(2);
      await caller(user);
      await denied("quote", { ...selection, code: input.code }, /INELIGIBLE/);
      await denied("accept", { id: invitations[0].id }, /PHONE_REQUIRED/);
      await command("accept", { id: invitations[0].id, phone: "+201012345678" });
      await command("accept", { id: invitations[0].id, phone: "+201012345678" });
      if (percent < 100) {
        const o = await command("order", { id: invitations[0].order_id });
        expect(o.final_minor).toBe(13520);
        expect(
          await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements"),
        ).toBe(0);
        await pay(o, { group_id: (offer as unknown as { group_id: string }).group_id });
      }
      expect(
        await value(
          `SELECT ends_at=starts_at+interval '1 month' AS value FROM billing.commerce_entitlements WHERE user_id='${user}'`,
        ),
      ).toBe(true);
      await caller(other);
      await denied("accept", { id: invitations[1].id, phone: "+201012345678" }, /ALREADY_USED/);
      await db.query(
        "UPDATE billing.commerce_invitations SET deadline=now()-interval '1 second' WHERE id=$1",
        [invitations[1].id],
      );
      await denied("accept", { id: invitations[1].id, phone: "+201112345678" }, /EXPIRED/);
    },
  );
  it("erases coupon phones and targeted emails with the existing account deletion lifecycle", async () => {
    const { input, offer } = await simple({
      audience: "individual",
      emails: ["member@example.test"],
    });
    await caller(user);
    const o = await redeem(input.code);
    await db.exec(
      `SELECT set_config('request.jwt.claim.role','service_role',false); UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='synthetic',crm_retention_reference='synthetic',responder_reference='synthetic',release_reference='synthetic'; INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}')`,
    );
    const claim = await value<{ lease_token: string }>(
      `SELECT public.lc09_claim_deletion('${user}') AS value`,
    );
    for (const stage of ["provider_reconciled", "learner_erased"])
      await db.query("SELECT public.lc09_advance_deletion($1,$2,$3)", [
        user,
        claim.lease_token,
        stage,
      ]);
    expect(
      await value(
        `SELECT redemption_phone AS value FROM billing.commerce_orders WHERE id='${o.id}'`,
      ),
    ).toBeNull();
    expect(
      await value(
        `SELECT audience_emails AS value FROM billing.commerce_offers WHERE id='${offer.id}'`,
      ),
    ).toEqual([]);
    expect(
      await value(`SELECT parameters AS value FROM billing.commerce_offers WHERE id='${offer.id}'`),
    ).toEqual({});
  });
  const recipient = (email = "member@example.test", changes: Record<string, unknown> = {}) => ({
    email,
    name: "Synthetic",
    locale: "ar-EG",
    package: "pro",
    access_kind: "complimentary",
    duration_days: 30,
    start_rule: "acceptance",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    market: "EG",
    billing_interval: "month",
    currency: "EGP",
    method: "instapay",
    ...changes,
  });
  it("queues one confirmation only after full payment and leases an immutable targeted message", async () => {
    const o = await order();
    await pay(o, { amount_minor: 169, allocations: [{ order_id: o.id, amount_minor: 169 }] });
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_outbox WHERE order_id='${o.id}'`,
      ),
    ).toBe(0);
    await pay(o, {
      amount_minor: o.final_minor - 169,
      allocations: [{ order_id: o.id, amount_minor: o.final_minor - 169 }],
    });
    await db.query("SELECT public.queue_commerce_payment_confirmation($1)", [o.id]);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_outbox WHERE order_id='${o.id}'`,
      ),
    ).toBe(1);
    await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const rpc = async (action: string, data: unknown) =>
      (
        await db.query<{ value: unknown }>(
          "SELECT public.commerce_payment_mail($1,$2::jsonb) AS value",
          [action, JSON.stringify(data)],
        )
      ).rows[0].value;
    const rows = (await rpc("claim", { order_id: o.id })) as {
      id: string;
      claim_token: string;
      payload: { amount_minor: number };
      recipient: string;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].recipient).toBe("member@example.test");
    expect(rows[0].payload.amount_minor).toBe(o.final_minor);
    expect(await rpc("claim", { order_id: o.id })).toEqual([]);
    const claim = { id: rows[0].id, claim_token: rows[0].claim_token };
    expect(await rpc("authorize_attempt", claim)).toBe(true);
    expect(await rpc("result", { ...claim, claim_token: randomUUID(), provider_id: "wrong" })).toBe(
      false,
    );
    expect(await rpc("result", { ...claim, provider_id: "synthetic-payment-mail" })).toBe(true);
    expect(await rpc("claim", { order_id: o.id })).toEqual([]);
  });
  it("blocks non-admin resend, service claims from clients, suppression and erases payment mail with learner identity", async () => {
    const o = await order();
    await pay(o);
    await caller(user);
    await db.exec("SAVEPOINT mail_denied");
    await expect(
      db.query("SELECT public.queue_commerce_payment_confirmation($1)", [o.id]),
    ).rejects.toThrow(/COMMERCE_ADMIN_REQUIRED/);
    await db.exec("ROLLBACK TO SAVEPOINT mail_denied");
    await expect(db.query("SELECT public.commerce_payment_mail('claim','{}')")).rejects.toThrow(
      /COMMERCE_SERVICE_ONLY/,
    );
    await db.exec("ROLLBACK TO SAVEPOINT mail_denied; RELEASE SAVEPOINT mail_denied");
    await db.exec(
      "INSERT INTO billing.commerce_mail_preferences(email,suppressed) VALUES('member@example.test',true); SELECT set_config('request.jwt.claim.role','service_role',false)",
    );
    expect(await value("SELECT public.commerce_payment_mail('claim','{}') AS value")).toEqual([]);
    expect(
      await value(`SELECT status AS value FROM billing.commerce_outbox WHERE order_id='${o.id}'`),
    ).toBe("suppressed");
    await db.query("UPDATE billing.commerce_orders SET recipient_email='' WHERE id=$1", [o.id]);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_outbox WHERE order_id='${o.id}'`,
      ),
    ).toBe(0);
  });
  it("bounds unknown mail retries and rechecks deletion before sending", async () => {
    const o = await order();
    await pay(o);
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const rows = await value<{ id: string; claim_token: string }[]>(
      `SELECT public.commerce_payment_mail('claim','{"order_id":"${o.id}"}') AS value`,
    );
    await db.exec(
      `INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}'); INSERT INTO billing.account_deletion_lifecycle(user_id,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES('${user}','blocked','synthetic','synthetic','synthetic')`,
    );
    expect(
      await value(
        `SELECT public.commerce_payment_mail('authorize_attempt','${JSON.stringify(rows[0])}') AS value`,
      ),
    ).toBe(false);
    await db.exec(
      `DELETE FROM billing.account_deletion_lifecycle WHERE user_id='${user}'; DELETE FROM billing.account_deletion_requests WHERE user_id='${user}'; UPDATE billing.commerce_outbox SET lease_until=now()-interval '1 minute',first_attempt_at=now()-interval '24 hours' WHERE order_id='${o.id}'`,
    );
    expect(
      await value(`SELECT public.commerce_payment_mail('claim','{"order_id":"${o.id}"}') AS value`),
    ).toEqual([]);
    expect(
      await value(`SELECT status AS value FROM billing.commerce_outbox WHERE order_id='${o.id}'`),
    ).toBe("unknown");
  });
  async function invite(rows: unknown[]) {
    await caller(admin);
    const group = await command("create_group", { name: "Synthetic group" });
    return { group, rows: await command("import", { group_id: group.id, rows }) };
  }
  it("queues sales review durably but waits for private storage, deduplicates and protects erasure", async () => {
    const o = await order(),
      id = randomUUID(),
      path = `${o.id}/${id}`;
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    await db.query("SELECT public.commerce_receipt($1,'attach',$2::jsonb)", [
      user,
      JSON.stringify({
        id,
        order_id: o.id,
        storage_path: path,
        mime: "image/png",
        size_bytes: 100,
        digest: "c".repeat(64),
      }),
    ]);
    expect(
      await value(
        `SELECT recipient AS value FROM billing.commerce_outbox WHERE receipt_id='${id}'`,
      ),
    ).toBe("sales@masaarat.ai");
    const claim = () =>
      value<{ id: string; claim_token: string; recipient: string; receipt_id: string }[]>(
        `SELECT public.commerce_payment_mail('claim','{"receipt_id":"${id}"}') AS value`,
      );
    expect(await claim()).toEqual([]);
    expect(
      await value(`SELECT status AS value FROM billing.commerce_outbox WHERE receipt_id='${id}'`),
    ).toBe("pending");
    await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('commerce-receipts',$1)", [
      path,
    ]);
    const rows = await claim();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ recipient: "sales@masaarat.ai", receipt_id: id });
    expect(await claim()).toEqual([]);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
    await db.exec("SAVEPOINT active_mail");
    await expect(
      db.query("UPDATE billing.commerce_orders SET recipient_email='' WHERE id=$1", [o.id]),
    ).rejects.toThrow("LC09_COMMERCE_MAIL_PENDING");
    await db.exec("ROLLBACK TO SAVEPOINT active_mail; RELEASE SAVEPOINT active_mail");
    await db.exec(
      `INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}'); INSERT INTO billing.account_deletion_lifecycle(user_id,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES('${user}','blocked','synthetic','synthetic','synthetic')`,
    );
    expect(
      await value(
        `SELECT public.commerce_payment_mail('authorize_attempt','${JSON.stringify(rows[0])}') AS value`,
      ),
    ).toBe(false);
    await db.query(
      "UPDATE billing.commerce_outbox SET lease_until=now()-interval '1 minute' WHERE receipt_id=$1",
      [id],
    );
    await db.query("UPDATE billing.commerce_orders SET recipient_email='' WHERE id=$1", [o.id]);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_outbox WHERE receipt_id='${id}'`,
      ),
    ).toBe(0);
  });
  it("discards an unsent sales alert with a failed upload manifest", async () => {
    const o = await order(),
      id = randomUUID();
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    await db.query("SELECT public.commerce_receipt($1,'attach',$2::jsonb)", [
      user,
      JSON.stringify({
        id,
        order_id: o.id,
        storage_path: `${o.id}/${id}`,
        mime: "image/png",
        size_bytes: 100,
        digest: "d".repeat(64),
      }),
    ]);
    await db.query("SELECT public.commerce_receipt($1,'discard',$2::jsonb)", [
      user,
      JSON.stringify({ id, order_id: o.id }),
    ]);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_outbox WHERE receipt_id='${id}'`,
      ),
    ).toBe(0);
  });
  it("receipt submission remains pending and private", async () => {
    const o = await order(),
      id = randomUUID();
    await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
    await db.query("SELECT public.commerce_receipt($1,'attach',$2::jsonb)", [
      user,
      JSON.stringify({
        id,
        order_id: o.id,
        storage_path: `${o.id}/${id}`,
        mime: "image/png",
        size_bytes: 100,
        digest: "a".repeat(64),
      }),
    ]);
    expect(
      await value(`SELECT review_status AS value FROM billing.commerce_orders WHERE id='${o.id}'`),
    ).toBe("pending");
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
    await db.exec("SAVEPOINT privacy");
    await expect(
      db.query("SELECT public.commerce_receipt($1,'read',$2::jsonb)", [
        other,
        JSON.stringify({ id }),
      ]),
    ).rejects.toThrow(/FORBIDDEN/);
    await db.exec("ROLLBACK TO SAVEPOINT privacy");
    await caller(other);
    await denied("order", { id: o.id }, /FORBIDDEN/);
  });
  it("rejection and more-information never activate access", async () => {
    const o = await order();
    await caller(admin);
    await command("review", { id: o.id, status: "rejected", reason: "No funds" });
    await denied(
      "confirm",
      {
        key: randomUUID(),
        method: "instapay",
        currency: "EGP",
        amount_minor: o.final_minor,
        transaction_reference: randomUUID(),
        received_at: new Date().toISOString(),
        funds_verified: true,
        allocations: [{ order_id: o.id, amount_minor: o.final_minor }],
      },
      /NOT_CONFIRMABLE/,
    );
    await command("review", { id: o.id, status: "more_info", reason: "Need transaction details" });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
  });
  it("duplicate transaction references cannot count a second payment", async () => {
    const a = await order(),
      b = await order();
    const reference = randomUUID();
    await pay(a, { transaction_reference: reference });
    await db.exec("SAVEPOINT repeated");
    await expect(pay(b, { transaction_reference: reference })).rejects.toThrow(
      /unique|duplicate|REUSED/i,
    );
    await db.exec("ROLLBACK TO SAVEPOINT repeated");
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_payments")).toBe(1);
  });
  it("imports are idempotent, do not send and require matching verified email", async () => {
    const row = recipient(),
      { group, rows } = await invite([row]);
    expect((await command("import", { group_id: group.id, rows: [row] }))[0].id).toBe(rows[0].id);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_outbox")).toBe(0);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
    await caller(other);
    await denied("accept", { id: rows[0].id }, /FORBIDDEN/);
    await caller(user);
    await command("invitation", { id: rows[0].id });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
    await command("accept", { id: rows[0].id });
    const ends = await value("SELECT ends_at::text AS value FROM billing.commerce_entitlements");
    await command("accept", { id: rows[0].id });
    expect(await value("SELECT ends_at::text AS value FROM billing.commerce_entitlements")).toBe(
      ends,
    );
  });
  it("import preview identifies per-row errors without reserving or writing", async () => {
    await caller(admin);
    const group = await command("create_group", { name: "Preview" });
    const rows = await command("preview_import", {
      group_id: group.id,
      rows: [
        recipient(),
        recipient("broken", { duration_days: 0 }),
        recipient("other@example.test", { access_kind: "external", method: "bank" }),
      ],
    });
    expect(rows[1].error).toMatch(/RECIPIENT/);
    expect(rows[2].error).toMatch(/UNAVAILABLE/);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_invitations")).toBe(0);
  });
  it("partial group payments count gross once and activate only fully funded accepted members", async () => {
    const { group, rows } = await invite([
      recipient(undefined, { access_kind: "external" }),
      recipient("other@example.test", { access_kind: "external" }),
    ]);
    await caller(user);
    await command("accept", { id: rows[0].id });
    await caller(other);
    await command("accept", { id: rows[1].id });
    const o = { id: rows[0].order_id!, final_minor: 16900 };
    await pay(o, {
      group_id: group.id,
      amount_minor: 20000,
      allocations: [
        { order_id: rows[0].order_id!, amount_minor: 16900 },
        { order_id: rows[1].order_id!, amount_minor: 3100 },
      ],
    });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(1);
    expect(
      await value("SELECT sum(amount_minor)::int AS value FROM billing.commerce_payments"),
    ).toBe(20000);
    await pay({ id: rows[1].order_id!, final_minor: 13800 }, { group_id: group.id });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(2);
    expect(
      await value("SELECT sum(amount_minor)::int AS value FROM billing.commerce_payments"),
    ).toBe(33800);
  });
  it("payment before invitation acceptance waits, then activates once", async () => {
    const { group, rows } = await invite([recipient(undefined, { access_kind: "external" })]);
    await pay({ id: rows[0].order_id!, final_minor: 16900 }, { group_id: group.id });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
    await caller(user);
    await command("accept", { id: rows[0].id });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(1);
  });
  it("paid offers reserve reversibly, enforce identity and never touch Stripe coupons", async () => {
    await caller(admin);
    await command("create_offer", {
      code: "PERSONAL",
      campaign: "Synthetic",
      package: "pro",
      kind: "percent",
      value_minor: 20,
      currency: "EGP",
      email: "member@example.test",
      duration_days: 30,
      eligibility: "all",
      renewals: false,
      valid_from: new Date(Date.now() - 1000).toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      max_redemptions: 1,
      per_email_limit: 1,
      enabled: true,
    });
    await caller(other);
    await denied("quote", { ...selection, code: "PERSONAL" }, /INELIGIBLE/);
    await caller(user);
    const o = await command("create_order", { ...selection, code: "PERSONAL", key: randomUUID() });
    expect(o.final_minor).toBe(13520);
    await denied("create_order", { ...selection, code: "PERSONAL", key: randomUUID() }, /LIMIT/);
    await command("cancel_order", { id: o.id });
    const b = await command("create_order", { ...selection, code: "PERSONAL", key: randomUUID() });
    expect(b.final_minor).toBe(13520);
    await pay(b);
    await caller(user);
    await denied("quote", { ...selection, code: "PERSONAL", renewal: true }, /INELIGIBLE/);
    expect(
      await value(
        "SELECT offer_consumed AS value FROM billing.commerce_orders WHERE id='" + b.id + "'",
      ),
    ).toBe(true);
  });
  it("expiring or revoking a gift preserves valid paid access and package boundaries", async () => {
    const o = await order();
    await pay(o);
    await caller(admin);
    const grant = await command("grant", {
      user_id: user,
      package: "pro_plus",
      duration_days: 1,
      reason: "Synthetic",
      key: randomUUID(),
    });
    await caller(user);
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
    await db.exec(
      `UPDATE billing.commerce_entitlements SET starts_at=now()-interval '2 days',ends_at=now()-interval '1 day' WHERE grant_id='${grant.id}'`,
    );
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro");
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_entitlements WHERE user_id='${user}' AND package='kids'`,
      ),
    ).toBe(0);
  });
  it("previews campaign capacity across the batch and preserves its anonymous consumed total", async () => {
    await caller(admin);
    const offer = await command("create_offer", {
      code: "BATCHLIMIT",
      campaign: "Synthetic",
      package: "pro",
      kind: "percent",
      value_minor: 20,
      currency: "EGP",
      duration_days: 30,
      renewals: true,
      valid_from: new Date(Date.now() - 1000).toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      max_redemptions: 1,
      per_email_limit: 1,
    });
    const group = await command("create_group", { name: "Capacity preview" });
    const preview = await command("preview_import", {
      group_id: group.id,
      rows: [
        recipient(undefined, { access_kind: "external", code: "BATCHLIMIT" }),
        recipient("other@example.test", { access_kind: "external", code: "BATCHLIMIT" }),
      ],
    });
    expect(preview[1].error).toMatch(/OFFER_LIMIT/);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_orders")).toBe(0);
    await caller(user);
    const o = await command("create_order", {
      ...selection,
      code: "BATCHLIMIT",
      key: randomUUID(),
    });
    await pay(o);
    expect(
      await value(
        `SELECT consumed_count AS value FROM billing.commerce_offers WHERE id='${offer.id}'`,
      ),
    ).toBe(1);
    // Simulate completed financial erasure of the identity-bearing order.
    await db.query("DELETE FROM billing.commerce_orders WHERE id=$1", [o.id]);
    await caller(other);
    await denied("quote", { ...selection, code: "BATCHLIMIT" }, /OFFER_LIMIT/);
  });
  it("financial erasure retains a shared payment until its last member is purged", async () => {
    const { group, rows } = await invite([
      recipient(undefined, { access_kind: "external" }),
      recipient("other@example.test", { access_kind: "external" }),
    ]);
    for (const [index, id] of [user, other].entries()) {
      await caller(id);
      await command("accept", { id: rows[index].id });
    }
    await pay(
      { id: rows[0].order_id!, final_minor: 16900 },
      { group_id: group.id, amount_minor: 33800, allocations: rowsAsAllocations(rows) },
    );
    await db.exec(
      `SELECT set_config('request.jwt.claim.role','service_role',false); UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='synthetic-finance',crm_retention_reference='synthetic-crm',responder_reference='synthetic-owner',release_reference='synthetic-release';`,
    );
    for (const [index, id] of [user, other].entries()) {
      await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [id]);
      const claim = await value<{ lease_token: string }>(
        `SELECT public.lc09_claim_deletion('${id}') AS value`,
      );
      for (const stage of ["provider_reconciled", "learner_erased"])
        await db.query("SELECT public.lc09_advance_deletion($1,$2,$3)", [
          id,
          claim.lease_token,
          stage,
        ]);
      await db.query("DELETE FROM auth.users WHERE id=$1", [id]);
      await db.query("SELECT public.lc09_advance_deletion($1,$2,'complete')", [
        id,
        claim.lease_token,
      ]);
      await db.query(
        "UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '361 hours' WHERE user_id=$1",
        [id],
      );
      const finance = await value<{ lease_token: string }>(
        `SELECT public.lc09_claim_financial_purge('${id}') AS value`,
      );
      await db.query("SELECT public.lc09_complete_financial_purge($1,$2)", [
        id,
        finance.lease_token,
      ]);
      expect(await value("SELECT count(*)::int AS value FROM billing.commerce_payments")).toBe(
        index === 0 ? 1 : 0,
      );
      expect(await value("SELECT count(*)::int AS value FROM billing.commerce_allocations")).toBe(
        index === 0 ? 1 : 0,
      );
    }
  });
  it("Kids eligibility and account suspension are never bypassed", async () => {
    await caller(user);
    await denied(
      "create_order",
      { ...selection, package: "kids", key: randomUUID() },
      /PARENT_REQUIRED/,
    );
    await caller(admin);
    await denied(
      "grant",
      { user_id: user, package: "kids", duration_days: 1, reason: "Synthetic", key: randomUUID() },
      /PARENT_REQUIRED/,
    );
    await db.exec(
      `INSERT INTO billing.subscriptions(user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key) VALUES('${user}','suspended','canceled','EG','EGP','month','synthetic-suspended')`,
    );
    await denied(
      "grant",
      {
        user_id: user,
        package: "pro_plus",
        duration_days: 1,
        reason: "Synthetic",
        key: randomUUID(),
      },
      /IDENTITY_UNAVAILABLE/,
    );
  });
  it("refunds affect only their order and cannot exceed allocation", async () => {
    const a = await order(),
      b = await order();
    const p = await pay(a);
    await pay(b);
    const request = {
      payment_id: p.id,
      order_id: a.id,
      amount_minor: a.final_minor,
      reference: "refund-synthetic",
      reason: "Synthetic",
      funds_verified: true,
      revoke_access: true,
      key: randomUUID(),
    };
    await command("refund", request);
    await command("refund", request);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_refunds")).toBe(1);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_entitlements WHERE revoked_at IS NULL`,
      ),
    ).toBe(1);
  });
  it("durable queue honors pause and suppression without provider calls", async () => {
    const { group, rows } = await invite([recipient()]);
    await command("queue", { ids: [rows[0].id] });
    await command("queue", { ids: [rows[0].id] });
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_outbox")).toBe(1);
    await db.exec("UPDATE billing.commerce_control SET invitations_enabled=true");
    await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
    let result = await db.query<{ value: unknown[] }>(
      "SELECT public.commerce_mail('claim',$1::jsonb) AS value",
      [JSON.stringify({ actor: admin, group_id: group.id })],
    );
    expect(result.rows[0].value).toHaveLength(0);
    await caller(admin);
    await command("group_state", { id: group.id, state: "ready" });
    await command("mail_preferences", {
      email: "member@example.test",
      marketing_opt_out: true,
      suppressed: false,
    });
    await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
    result = await db.query("SELECT public.commerce_mail('claim',$1::jsonb) AS value", [
      JSON.stringify({ actor: admin, group_id: group.id }),
    ]);
    expect(result.rows[0].value).toHaveLength(0);
  });
  it("bare authenticated clients cannot read tables or call service-only receipt/mail RPCs", async () => {
    await caller(user);
    await db.exec("SAVEPOINT acl; SET LOCAL ROLE authenticated");
    await expect(db.query("SELECT * FROM billing.commerce_orders")).rejects.toThrow(/permission/);
    await db.exec("ROLLBACK TO SAVEPOINT acl; SET LOCAL ROLE authenticated");
    await expect(
      db.query("SELECT public.commerce_receipt($1,'read','{}')", [user]),
    ).rejects.toThrow(/permission/);
    await db.exec("ROLLBACK TO SAVEPOINT acl; SET LOCAL ROLE authenticated");
    await expect(db.query("SELECT public.commerce_mail('claim','{}')")).rejects.toThrow(
      /permission/,
    );
    await db.exec("ROLLBACK TO SAVEPOINT acl");
  });
});

function rowsAsAllocations(rows: CommandResult) {
  return [rows[0], rows[1]].map((i) => ({ order_id: i.order_id!, amount_minor: 16900 }));
}

it("LC09 erases new access, preserves financial data for 15 days, then purges it", async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
  try {
    await caller(admin);
    await command("configure_method", {
      code: "instapay",
      enabled: true,
      instructions: "Synthetic",
      destination: "Synthetic",
      currencies: ["EGP"],
    });
    await caller(user);
    const o = await command("create_order", {
      package: "pro",
      market: "EG",
      billing_interval: "month",
      method: "instapay",
      key: randomUUID(),
    });
    await caller(admin);
    await command("confirm", {
      key: randomUUID(),
      method: "instapay",
      currency: "EGP",
      amount_minor: o.final_minor,
      transaction_reference: randomUUID(),
      received_at: new Date().toISOString(),
      funds_verified: true,
      allocations: [{ order_id: o.id, amount_minor: o.final_minor }],
    });
    const receiptId = randomUUID();
    await db.query("SELECT set_config('request.jwt.claim.role','service_role',false)");
    await db.query("SELECT public.commerce_receipt($1,'attach',$2::jsonb)", [
      admin,
      JSON.stringify({
        id: receiptId,
        order_id: o.id,
        storage_path: `${o.id}/${receiptId}`,
        mime: "image/png",
        size_bytes: 100,
        digest: "c".repeat(64),
      }),
    ]);
    await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('commerce-receipts',$1)", [
      `${o.id}/${receiptId}`,
    ]);
    await db.exec(`SELECT set_config('request.jwt.claim.role','service_role',false);
 UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='synthetic-finance',crm_retention_reference='synthetic-crm',responder_reference='synthetic-owner',release_reference='synthetic-release';
 INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');`);
    const claim = await value<{ lease_token: string }>(
      `SELECT public.lc09_claim_deletion('${user}') AS value`,
    );
    await db.query("SELECT public.lc09_advance_deletion($1,$2,'provider_reconciled')", [
      user,
      claim.lease_token,
    ]);
    await db.query("SELECT public.lc09_advance_deletion($1,$2,'learner_erased')", [
      user,
      claim.lease_token,
    ]);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_entitlements WHERE user_id='${user}'`,
      ),
    ).toBe(0);
    expect(
      await value(
        `SELECT recipient_email AS value FROM billing.commerce_orders WHERE id='${o.id}'`,
      ),
    ).toBe("");
    await db.query("DELETE FROM auth.users WHERE id=$1", [user]);
    await db.query("SELECT public.lc09_advance_deletion($1,$2,'complete')", [
      user,
      claim.lease_token,
    ]);
    await db.exec("SAVEPOINT early");
    await expect(db.query("SELECT public.lc09_claim_financial_purge($1)", [user])).rejects.toThrow(
      /NOT_DUE/,
    );
    await db.exec("ROLLBACK TO SAVEPOINT early");
    await db.query(
      "UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '361 hours' WHERE user_id=$1",
      [user],
    );
    const finance = await value<{
      lease_token: string;
      storage_objects: { bucket: string; name: string }[];
    }>(`SELECT public.lc09_claim_financial_purge('${user}') AS value`);
    expect(finance.storage_objects).toEqual([
      { bucket: "commerce-receipts", name: `${o.id}/${receiptId}` },
    ]);
    await db.exec("SAVEPOINT remaining_receipt");
    await expect(
      db.query("SELECT public.lc09_complete_financial_purge($1,$2)", [user, finance.lease_token]),
    ).rejects.toThrow(/RECEIPTS_REMAIN/);
    await db.exec("ROLLBACK TO SAVEPOINT remaining_receipt; RELEASE SAVEPOINT remaining_receipt");
    await db.query("DELETE FROM storage.objects WHERE bucket_id='commerce-receipts' AND name=$1", [
      `${o.id}/${receiptId}`,
    ]);
    await db.query("SELECT public.lc09_complete_financial_purge($1,$2)", [
      user,
      finance.lease_token,
    ]);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_orders WHERE user_id='${user}'`,
      ),
    ).toBe(0);
    expect(
      await value(
        `SELECT count(*)::int AS value FROM billing.commerce_payments WHERE user_id='${user}'`,
      ),
    ).toBe(0);
  } finally {
    await db.exec("ROLLBACK");
  }
});

it.skipIf(!nativeUrl)(
  "serializes genuinely concurrent campaign redemption and repeated confirmation",
  async () => {
    if (!nativeUrl || !nativeClient) throw new Error("Native disposable database required");
    await db.exec("UPDATE billing.commerce_control SET enabled=true");
    await caller(admin);
    await command("configure_method", {
      code: "instapay",
      enabled: true,
      instructions: "Synthetic",
      destination: "Synthetic",
      currencies: ["EGP"],
    });
    await command("create_offer", {
      code: "CONCURRENT",
      campaign: "Concurrent",
      package: "pro",
      kind: "complimentary",
      value_minor: 0,
      currency: "EGP",
      duration_days: 1,
      eligibility: "all",
      renewals: false,
      valid_from: new Date(Date.now() - 1000).toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      max_redemptions: 1,
      per_email_limit: 1,
      enabled: true,
    });
    const clients = [postgres(nativeUrl, { max: 1 }), postgres(nativeUrl, { max: 1 })];
    const nativeKey = `native-${randomUUID()}-`;
    try {
      const results = await Promise.allSettled(
        clients.map(async (client, index) => {
          await client.unsafe(
            "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",
            [index === 0 ? user : other],
          );
          return client.unsafe("SELECT public.commerce_command('create_order',$1::jsonb)", [
            client.json({
              package: "pro",
              market: "EG",
              billing_interval: "month",
              method: "admin",
              code: "CONCURRENT",
              key: nativeKey + index,
            }),
          ]);
        }),
      );
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
      expect(
        await value(
          "SELECT count(*)::int AS value FROM billing.commerce_orders o JOIN billing.commerce_offers f ON f.id=o.offer_id WHERE f.code='CONCURRENT'",
        ),
      ).toBe(1);
      await caller(user);
      const order = await command("create_order", {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        method: "instapay",
        key: nativeKey + "order",
      });
      const payment = {
        key: nativeKey + "payment",
        method: "instapay",
        currency: "EGP",
        amount_minor: order.final_minor,
        transaction_reference: randomUUID(),
        received_at: new Date().toISOString(),
        funds_verified: true,
        allocations: [{ order_id: order.id, amount_minor: order.final_minor }],
      };
      const confirmed = await Promise.all(
        clients.map(async (client) => {
          await client.unsafe(
            "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",
            [admin],
          );
          return client.unsafe("SELECT public.commerce_command('confirm',$1::jsonb) AS value", [
            client.json(payment),
          ]);
        }),
      );
      expect(confirmed[0][0].value.id).toBe(confirmed[1][0].value.id);
      expect(
        await value(
          `SELECT count(*)::int AS value FROM billing.commerce_entitlements WHERE order_id='${order.id}'`,
        ),
      ).toBe(1);
    } finally {
      await Promise.all(clients.map((client) => client.end()));
      await db.query("DELETE FROM billing.commerce_audit WHERE details->>'key' LIKE $1", [
        nativeKey + "%",
      ]);
      await db.query("DELETE FROM billing.commerce_orders WHERE request_key LIKE $1", [
        "%:" + nativeKey + "%",
      ]);
      await db.query("DELETE FROM billing.commerce_payments WHERE request_key LIKE $1", [
        "payment:" + nativeKey + "%",
      ]);
      await db.exec("DELETE FROM billing.commerce_offers WHERE code='CONCURRENT'");
    }
  },
);

it("uses private receipts, records out-of-order delivery durably and checks real funds separately", async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true,invitations_enabled=true");
  try {
    await caller(admin);
    const group = await command("create_group", { name: "Mail" });
    const row = {
      email: "member@example.test",
      name: "Synthetic",
      locale: "en",
      package: "pro",
      access_kind: "complimentary",
      duration_days: 1,
      start_rule: "acceptance",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      market: "EG",
      billing_interval: "month",
      currency: "EGP",
      method: "instapay",
    };
    const imported = await command("import", { group_id: group.id, rows: [row] });
    await command("queue", { ids: [imported[0].id] });
    await command("group_state", { id: group.id, state: "ready" });
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const claims = await db.query<{ value: { id: string }[] }>(
      "SELECT public.commerce_mail('claim',$1::jsonb) AS value",
      [JSON.stringify({ actor: admin, group_id: group.id })],
    );
    const outbox = claims.rows[0].value[0];
    expect(outbox).toBeDefined();
    await db.exec(
      "INSERT INTO public.contact_acknowledgement_outbox(id,recipient,locale,stream,subject,text_body,html_body,provider_email_id) VALUES(gen_random_uuid(),'member@example.test','en','support','Synthetic','Synthetic','Synthetic','existing_contact_email')",
    );
    expect(
      await value(
        "SELECT public.record_contact_mail_receipt('existing-delivered','existing_contact_email','member@example.test','email.delivered',now()) AS value",
      ),
    ).toBe("recorded");
    expect(await value("SELECT count(*)::int AS value FROM public.contact_mail_receipts")).toBe(1);
    expect(
      await value(
        "SELECT public.record_contact_mail_receipt('early','synthetic_email','member@example.test','email.delivered',now()) AS value",
      ),
    ).toBe("pending");
    await db.query("SELECT public.commerce_mail('result',$1::jsonb)", [
      JSON.stringify({ id: outbox.id, provider_id: "synthetic_email" }),
    ]);
    await db.exec(
      "SELECT public.record_contact_mail_receipt('delivered','synthetic_email','member@example.test','email.delivered',now());SELECT public.record_contact_mail_receipt('delivered','synthetic_email','member@example.test','email.delivered',now());SELECT public.record_contact_mail_receipt('older','synthetic_email','member@example.test','email.delivery_delayed',now()-interval '1 hour');",
    );
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_mail_receipts")).toBe(
      2,
    );
    expect(await value("SELECT delivery AS value FROM billing.commerce_outbox")).toBe(
      "email.delivered",
    );
    expect(
      await value("SELECT public AS value FROM storage.buckets WHERE id='commerce-receipts'"),
    ).toBe(false);
    expect(await value("SELECT count(*)::int AS value FROM billing.commerce_entitlements")).toBe(0);
    await caller(admin);
    const secondGroup = await command("create_group", { name: "Late suppression" });
    const second = await command("import", { group_id: secondGroup.id, rows: [row] });
    await command("queue", { ids: [second[0].id] });
    await command("group_state", { id: secondGroup.id, state: "ready" });
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const secondClaim = await value<{ id: string }[]>(
      `SELECT public.commerce_mail('claim','${JSON.stringify({ actor: admin, group_id: secondGroup.id })}'::jsonb) AS value`,
    );
    expect(secondClaim).toHaveLength(1);
    await db.exec(
      "SELECT public.record_contact_mail_receipt('existing-failed','existing_contact_email','member@example.test','email.failed',now())",
    );
    expect(
      await value(
        `SELECT public.commerce_mail('authorize_attempt','${JSON.stringify({ id: secondClaim[0].id })}'::jsonb) AS value`,
      ),
    ).toBe(false);
  } finally {
    await db.exec("ROLLBACK");
  }
});

it("uses canonical video and RAG lesson boundaries and existing AI quotas without stacking", async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
  try {
    await caller(admin);
    await command("grant", {
      user_id: user,
      package: "pro",
      duration_days: 30,
      reason: "Synthetic",
      key: randomUUID(),
    });
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const limits = await db.query<{ general_monthly_limit: number; per_lesson_limit: number }>(
      "SELECT * FROM billing.resolve_ai_assistant_limits($1)",
      [user],
    );
    expect(limits.rows[0]).toEqual({ general_monthly_limit: 50, per_lesson_limit: 3 });
    const builder = await value<string>(
      "SELECT lesson_id AS value FROM billing.commerce_lesson_catalog WHERE path_id='builder' ORDER BY lesson_id LIMIT 1",
    );
    const video = await db.query<{ value: { allowed: boolean } }>(
      "SELECT billing.evaluate_access($1,'video',$2) AS value",
      [user, builder],
    );
    expect(video.rows[0].value.allowed).toBe(false);
    const rag = await db.query<{ value: { allowed: boolean } }>(
      "SELECT billing.evaluate_access($1,'rag',$2) AS value",
      [user, builder],
    );
    expect(rag.rows[0].value.allowed).toBe(false);
    await caller(admin);
    await command("grant", {
      user_id: user,
      package: "pro_plus",
      duration_days: 30,
      reason: "Synthetic",
      key: randomUUID(),
    });
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    const larger = await db.query<{ general_monthly_limit: number; per_lesson_limit: number }>(
      "SELECT * FROM billing.resolve_ai_assistant_limits($1)",
      [user],
    );
    expect(larger.rows[0]).toEqual({ general_monthly_limit: 150, per_lesson_limit: 6 });
  } finally {
    await db.exec("ROLLBACK");
  }
});
it("preserves canonical Stripe paid access after a separate gift is revoked", async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
  try {
    await db.query(
      `INSERT INTO billing.subscriptions(user_id,plan_version_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key,current_period_start,current_period_end)
 SELECT $1,pv.id,'paid_active','active','EG','EGP','month','synthetic-preserved',now(),now()+interval '30 days' FROM billing.plan_versions pv JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE pc.plan_key='pro_plus' AND pv.billing_interval='month' ORDER BY pv.version_number LIMIT 1`,
      [user],
    );
    await caller(admin);
    const grant = await command("grant", {
      user_id: user,
      package: "pro",
      duration_days: 1,
      reason: "Synthetic",
      key: randomUUID(),
    });
    const entitlement = await value<string>(
      `SELECT id::text AS value FROM billing.commerce_entitlements WHERE grant_id='${grant.id}'`,
    );
    await command("manage_access", {
      id: entitlement,
      operation: "revoke",
      reason: "Synthetic",
      key: randomUUID(),
    });
    await caller(user);
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
    expect(
      await value(
        `SELECT access_state AS value FROM billing.subscriptions WHERE user_id='${user}'`,
      ),
    ).toBe("paid_active");
    await db.query("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1", [user]);
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
    await denied(
      "quote",
      { package: "pro", market: "EG", billing_interval: "month" },
      /IDENTITY_UNAVAILABLE/,
    );
    await db.exec("UPDATE billing.commerce_control SET enabled=false");
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
  } finally {
    await db.exec("ROLLBACK");
  }
});
it("an emergency stop of new commerce preserves already issued paid access", async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
  try {
    await caller(admin);
    await command("grant", {
      user_id: user,
      package: "pro",
      duration_days: 1,
      reason: "Synthetic",
      key: randomUUID(),
    });
    await db.exec("UPDATE billing.commerce_control SET enabled=false,invitations_enabled=false");
    await caller(user);
    expect(await value("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro");
    await denied(
      "create_order",
      {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        method: "instapay",
        key: randomUUID(),
      },
      /DISABLED/,
    );
  } finally {
    await db.exec("ROLLBACK");
  }
});

it("allocates confirmed group balances without new revenue and caps unallocated refunds", async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
  try {
    await caller(admin);
    await command("configure_method", {
      code: "instapay",
      enabled: true,
      instructions: "Synthetic",
      destination: "Synthetic",
      currencies: ["EGP"],
    });
    const group = await command("create_group", { name: "Balance" });
    const recipient = (email: string) => ({
      email,
      name: "Synthetic",
      locale: "en",
      package: "pro",
      access_kind: "external",
      duration_days: 30,
      start_rule: "acceptance",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      market: "EG",
      billing_interval: "month",
      currency: "EGP",
      method: "instapay",
    });
    const rows = await command("import", {
      group_id: group.id,
      rows: [recipient("member@example.test"), recipient("other@example.test")],
    });
    const p = await command("confirm", {
      key: randomUUID(),
      method: "instapay",
      currency: "EGP",
      group_id: group.id,
      amount_minor: 40000,
      transaction_reference: randomUUID(),
      received_at: new Date().toISOString(),
      funds_verified: true,
      allocations: [{ order_id: rows[0].order_id, amount_minor: 16900 }],
    });
    const allocation = {
      payment_id: p.id,
      key: randomUUID(),
      allocations: [{ order_id: rows[1].order_id, amount_minor: 16900 }],
    };
    await command("allocate", allocation);
    await command("allocate", allocation);
    expect(
      await value("SELECT sum(amount_minor)::int AS value FROM billing.commerce_payments"),
    ).toBe(40000);
    expect(
      await value("SELECT sum(amount_minor)::int AS value FROM billing.commerce_allocations"),
    ).toBe(33800);
    const refund = {
      payment_id: p.id,
      amount_minor: 6200,
      reference: randomUUID(),
      reason: "Synthetic surplus returned",
      revoke_access: false,
      funds_verified: true,
      key: randomUUID(),
    };
    await command("refund", refund);
    await command("refund", refund);
    expect(
      await value("SELECT sum(amount_minor)::int AS value FROM billing.commerce_refunds"),
    ).toBe(6200);
    await denied("refund", { ...refund, key: randomUUID(), amount_minor: 1 }, /AMOUNT_MISMATCH/);
  } finally {
    await db.exec("ROLLBACK");
  }
});

it.skipIf(!nativeUrl)(
  "serializes new coupons by phone and final available use under simultaneous redemption",
  async () => {
    if (!nativeUrl) throw new Error("Native disposable database required");
    await db.exec("UPDATE billing.commerce_control SET enabled=true");
    const clients = [postgres(nativeUrl, { max: 1 }), postgres(nativeUrl, { max: 1 })];
    try {
      for (const limitMode of ["time", "count"]) {
        await caller(admin);
        const catalogue = (await command("offer_catalogue")) as unknown as {
          package: string;
          market: string;
          billing_interval: string;
          original_minor: number;
        }[];
        const code = `RACE-${randomUUID().slice(0, 8)}`.toUpperCase();
        const f = await command("simple_offer", {
          key: randomUUID(),
          audience: "public",
          emails: [],
          group_name: "",
          package: "pro",
          market: "EG",
          billing_interval: "month",
          percent: 100,
          delivery: "coupon",
          code,
          locale: "en",
          limit_mode: limitMode,
          valid_until: limitMode === "time" ? new Date(Date.now() + 86400000).toISOString() : null,
          max_redemptions: limitMode === "count" ? 1 : null,
          expected_price_minor: catalogue.find(
            (p) => p.package === "pro" && p.market === "EG" && p.billing_interval === "month",
          )!.original_minor,
        });
        const results = await Promise.allSettled(
          clients.map(async (client, index) => {
            await client.unsafe(
              "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",
              [index === 0 ? user : other],
            );
            return client.unsafe("SELECT public.commerce_command('create_order',$1::jsonb)", [
              client.json({
                package: "pro",
                market: "EG",
                billing_interval: "month",
                method: "admin",
                code,
                key: randomUUID(),
                phone: limitMode === "time" || index === 0 ? "+201012345678" : "+201112345678",
              }),
            ]);
          }),
        );
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
        expect(
          await value(
            `SELECT consumed_count AS value FROM billing.commerce_offers WHERE id='${f.id}'`,
          ),
        ).toBe(1);
      }
    } finally {
      await Promise.all(clients.map((c) => c.end()));
    }
  },
);
