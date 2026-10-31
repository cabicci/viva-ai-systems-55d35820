/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  isTestStripeLocked,
  testEventAllowedWhileLocked,
} from "../../../../supabase/functions/_shared/billing-mode";
import { decideBillingMode } from "@/lib/billing/billing-mode";

const WHSEC = "whsec_fixture";
const ORIGIN = "https://masaarat.ai";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

type Fetched = { url: string; method: string; body?: string };

async function load(
  entry: string,
  mode: string | undefined,
  route: (f: Fetched) => any = () => ({}),
) {
  let handler!: (r: Request) => Promise<Response>;
  const fetched: Fetched[] = [];
  const values: Record<string, string> = {
    STRIPE_SECRET_KEY: "rk_test_fixture",
    STRIPE_WEBHOOK_SECRET: WHSEC,
    SUPABASE_URL: "https://db.example.test",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    ...(mode === undefined ? {} : { STRIPE_BILLING_MODE: mode }),
  };
  vi.stubGlobal("Deno", {
    serve: (fn: typeof handler) => {
      handler = fn;
    },
    env: { get: (n: string) => values[n] },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const call = {
        url: String(url),
        method: init.method ?? "GET",
        body: init.body ? String(init.body) : undefined,
      };
      fetched.push(call);
      return new Response(JSON.stringify(route(call)), { status: 200 });
    }),
  );
  await import(/* @vite-ignore */ `../../../../supabase/functions/${entry}/index.ts`);
  return { handler: () => handler, fetched };
}

const CHECKOUTS: [string, Record<string, unknown>][] = [
  ["billing-stripe-checkout", { planKey: "pro", billingInterval: "month", marketCode: "EG" }],
  ["kids-stripe-checkout", { marketCode: "EG", billingInterval: "month" }],
  [
    "academic-stripe-checkout",
    { marketCode: "EG", billingInterval: "month", academicAssistant: true },
  ],
  ["technical-stripe-checkout", { marketCode: "INTL", billingInterval: "year" }],
  ["billing-stripe-portal", { scope: "adult" }],
];

const post = (body: unknown, auth = true) =>
  new Request("https://fn.local/", {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      ...(auth ? { Authorization: "Bearer user-jwt" } : {}),
    },
    body: JSON.stringify(body),
  });

describe("shared mode source", () => {
  it("only unset/empty/test keep Test open; anything else locks it", () => {
    for (const v of [undefined, "", "test", " TEST "])
      expect(isTestStripeLocked(() => v)).toBe(false);
    for (const v of ["live", "LIVE", "prod", "1"]) expect(isTestStripeLocked(() => v)).toBe(true);
  });
  it("site and functions agree: Test mode on the site means Test is not locked", async () => {
    for (const v of [undefined, "test", "live", "weird"]) {
      const getEnv = (n: string) => (n === "STRIPE_BILLING_MODE" ? v : undefined);
      expect((await decideBillingMode("checkout", getEnv, async () => true)) === "test").toBe(
        !isTestStripeLocked(getEnv),
      );
    }
  });
  it("only revoke-type events pass the lock", () => {
    for (const t of [
      "refund.created",
      "refund.updated",
      "refund.failed",
      "customer.subscription.deleted",
    ])
      expect(testEventAllowedWhileLocked(t)).toBe(true);
    for (const t of [
      "checkout.session.completed",
      "invoice.paid",
      "invoice.payment_failed",
      "customer.subscription.updated",
    ])
      expect(testEventAllowedWhileLocked(t)).toBe(false);
  });
});

describe("direct calls to Test checkout / portal functions", () => {
  for (const [entry, body] of CHECKOUTS) {
    it(`${entry}: Live mode refuses an authenticated direct call before any DB or Stripe request`, async () => {
      const fn = await load(entry, "live");
      const res = await fn.handler()(post(body));
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "TEST_STRIPE_LOCKED" });
      expect(fn.fetched).toHaveLength(0);
    });
    it(`${entry}: an unknown mode value also fails closed`, async () => {
      const fn = await load(entry, "Live-ish");
      expect((await fn.handler()(post(body))).status).toBe(503);
      expect(fn.fetched).toHaveLength(0);
    });
    it(`${entry}: unset and "test" keep current Test behaviour (auth still required)`, async () => {
      for (const mode of [undefined, "test"]) {
        const fn = await load(entry, mode);
        const res = await fn.handler()(post(body, false));
        expect(res.status).toBe(401);
        vi.resetModules();
      }
    });
  }
});

function signed(event: Record<string, unknown>) {
  const t = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ created: t, livemode: false, ...event });
  const v1 = createHmac("sha256", WHSEC).update(`${t}.${body}`).digest("hex");
  return new Request("https://fn.local/", {
    method: "POST",
    body,
    headers: { "Stripe-Signature": `t=${t},v1=${v1}` },
  });
}

describe("signed Test webhook events", () => {
  const sub = {
    id: "sub_test",
    object: "subscription",
    livemode: false,
    status: "active",
    customer: "cus_test",
    metadata: {
      internal_subscription_id: "isub",
      user_id: "u1",
      plan_version_id: "pv",
      market_price_id: "mp",
    },
    items: {
      data: [{ price: { id: "price_test" }, current_period_start: 1, current_period_end: 2 }],
    },
  };
  const granting = [
    {
      type: "invoice.paid",
      data: { object: { id: "in_1", object: "invoice", subscription: "sub_test", status: "paid" } },
    },
    {
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", subscription: "sub_test", payment_status: "paid" } },
    },
    { type: "customer.subscription.updated", data: { object: sub } },
    { type: "invoice.payment_failed", data: { object: { id: "in_2", subscription: "sub_test" } } },
  ];
  for (const e of granting) {
    it(`Live mode: ${e.type} is acknowledged and dropped with no Stripe or database call`, async () => {
      const fn = await load("billing-stripe-webhook", "live");
      const res = await fn.handler()(signed({ id: `evt_${e.type}`, ...e }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        received: true,
        ignored: true,
        reason: "TEST_STRIPE_LOCKED",
      });
      expect(fn.fetched).toHaveLength(0);
    });
    it(`Test mode: ${e.type} is still processed as before`, async () => {
      const fn = await load("billing-stripe-webhook", undefined, () => sub);
      await fn.handler()(signed({ id: `evt_t_${e.type}`, ...e }));
      expect(fn.fetched.length).toBeGreaterThan(0);
    });
  }

  it("Live mode: a Test subscription deletion is still applied (revokes access)", async () => {
    const fn = await load("billing-stripe-webhook", "live", (c) =>
      c.url.includes("/rpc/") ? { applied: true } : sub,
    );
    const res = await fn.handler()(
      signed({
        id: "evt_del",
        type: "customer.subscription.deleted",
        data: { object: { ...sub, status: "canceled" } },
      }),
    );
    expect(res.status).toBe(200);
    const write = fn.fetched.find((c) => c.url.endsWith("/rpc/apply_stripe_webhook_event"))!;
    expect(JSON.parse(write.body!)).toMatchObject({
      p_transition: "canceled",
      p_gateway_subscription_id: "sub_test",
    });
  });

  const refundObjects = (status: string) => (c: Fetched) => {
    const p = c.url.replace("https://api.stripe.com/v1", "");
    if (c.url.includes("/rpc/apply_stripe_refund_event"))
      return { processed: true, cancel_subscription: false };
    if (c.url.includes("/rpc/")) return false;
    if (p.startsWith("/refunds/"))
      return { id: "re_t", status, amount: 100, currency: "egp", payment_intent: "pi_t" };
    if (p.startsWith("/payment_intents/"))
      return {
        id: "pi_t",
        livemode: false,
        status: "succeeded",
        customer: "cus_test",
        currency: "egp",
        amount_received: 100,
      };
    if (p.startsWith("/invoice_payments"))
      return {
        has_more: false,
        data: [
          {
            livemode: false,
            status: "paid",
            invoice: "in_t",
            currency: "egp",
            amount_paid: 100,
            payment: { type: "payment_intent", payment_intent: "pi_t" },
          },
        ],
      };
    if (p.startsWith("/invoices/"))
      return {
        id: "in_t",
        livemode: false,
        status: "paid",
        customer: "cus_test",
        currency: "egp",
        amount_paid: 100,
        subscription: "sub_test",
      };
    if (p.startsWith("/subscriptions/")) return { ...sub, latest_invoice: "in_t" };
    return {};
  };
  it("Live mode: a succeeded Test refund is still applied (revokes access)", async () => {
    const fn = await load("billing-stripe-webhook", "live", refundObjects("succeeded"));
    const res = await fn.handler()(
      signed({ id: "evt_ref", type: "refund.created", data: { object: { id: "re_t" } } }),
    );
    expect(res.status).toBe(200);
    expect(fn.fetched.some((c) => c.url.endsWith("/rpc/apply_stripe_refund_event"))).toBe(true);
  });
  it("Live mode: a failed Test refund cannot restore access (no database write)", async () => {
    const fn = await load("billing-stripe-webhook", "live", refundObjects("failed"));
    const res = await fn.handler()(
      signed({ id: "evt_ref_f", type: "refund.failed", data: { object: { id: "re_t" } } }),
    );
    expect(await res.json()).toEqual({
      received: true,
      ignored: true,
      reason: "TEST_STRIPE_LOCKED",
    });
    expect(fn.fetched.some((c) => c.url.includes("/rpc/apply_"))).toBe(false);
  });
  it("Test mode: a failed Test refund is processed as before", async () => {
    const fn = await load("billing-stripe-webhook", undefined, refundObjects("failed"));
    await fn.handler()(
      signed({ id: "evt_ref_f2", type: "refund.failed", data: { object: { id: "re_t" } } }),
    );
    expect(fn.fetched.some((c) => c.url.endsWith("/rpc/apply_stripe_refund_event"))).toBe(true);
  });
  it("still rejects Live events and bad signatures on the Test endpoint", async () => {
    const fn = await load("billing-stripe-webhook", "live");
    expect(
      (
        await fn.handler()(
          signed({ id: "e", type: "invoice.paid", livemode: true, data: { object: {} } }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await fn.handler()(
          new Request("https://fn.local/", {
            method: "POST",
            body: "{}",
            headers: { "Stripe-Signature": "t=1,v1=bad" },
          }),
        )
      ).status,
    ).toBe(400);
  });
});
