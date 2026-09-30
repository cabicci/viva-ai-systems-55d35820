import { afterEach, describe, expect, it, vi } from "vitest";

// Runtime-loaded Deno entrypoints are tested with a captured Deno.serve boundary.
// Keep Deno globals out of the frontend TypeScript program.
const checkoutModule = "../../../../supabase/functions/billing-stripe-checkout/index.ts";
const webhookModule = "../../../../supabase/functions/billing-stripe-webhook/index.ts";
const kidsCheckoutModule = "../../../../supabase/functions/kids-stripe-checkout/index.ts";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Stripe deployed handler boundaries", () => {
  it("rejects missing Checkout auth without contacting the provider", async () => {
    let handler!: (request: Request) => Promise<Response>;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Deno", {
      serve: (fn: typeof handler) => {
        handler = fn;
      },
      env: { get: () => "test" },
    });
    await import(checkoutModule);
    const response = await handler(new Request("https://test.local/checkout", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects anonymous Kids checkout without contacting Stripe or Supabase", async () => {
    let handler!: (request: Request) => Promise<Response>;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Deno", {
      serve: (fn: typeof handler) => {
        handler = fn;
      },
      env: { get: () => "test" },
    });
    await import(kidsCheckoutModule);
    const response = await handler(
      new Request("https://test.local/kids-checkout", { method: "POST" }),
    );
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks a new Checkout while a Stripe subscription is active", async () => {
    let handler!: (request: Request) => Promise<Response>;
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(String(url));
        const data = String(url).endsWith("/auth/v1/user")
          ? { id: "owner", email: "owner@example.test" }
          : String(url).includes("get_stripe_checkout_context")
            ? {
                access_state: "free_active",
                gateway_price_id: "price_pro",
                gateway_product_id: "prod_pro",
                gateway_customer_id: "cus_owner",
              }
            : String(url).includes("/subscriptions?")
              ? {
                  data: [
                    { id: "sub_existing", status: "active", metadata: { environment: "test" } },
                  ],
                }
              : null;
        if (!data) throw new Error("Unexpected network call: " + url);
        return new Response(JSON.stringify(data));
      }),
    );
    vi.stubGlobal("Deno", {
      serve: (fn: typeof handler) => {
        handler = fn;
      },
      env: {
        get: (key: string) =>
          key === "STRIPE_SECRET_KEY" ? "sk_test_fixture_only" : "https://db.example.test",
      },
    });
    await import(checkoutModule);
    const response = await handler(
      new Request("https://test.local/checkout", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({ planKey: "pro", billingInterval: "month", marketCode: "EG" }),
      }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "SUBSCRIPTION_ALREADY_MANAGED" });
    expect(
      calls.some(
        (url) => url.includes("/checkout/sessions") || url.includes("prepare_stripe_checkout"),
      ),
    ).toBe(false);
  });

  it("rejects an unsigned webhook before any RPC or Stripe request", async () => {
    let handler!: (request: Request) => Promise<Response>;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Deno", {
      serve: (fn: typeof handler) => {
        handler = fn;
      },
      env: { get: () => "whsec_fixture_only" },
    });
    await import(webhookModule);
    const response = await handler(
      new Request("https://test.local/webhook", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "INVALID_SIGNATURE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes a signed, paid Kids invoice to Kids entitlements, away from adult billing", async () => {
    let handler!: (request: Request) => Promise<Response>;
    const periodStart = Math.floor(Date.now() / 1000) - 60;
    const periodEnd = periodStart + 30 * 86400;
    const event = {
      id: "evt_kids_paid",
      type: "invoice.paid",
      created: periodStart,
      livemode: false,
      data: {
        object: {
          id: "in_kids",
          status: "paid",
          amount_remaining: 0,
          subscription: "sub_kids",
          customer: "cus_parent",
          lines: {
            data: [{ amount: 799, price: "price_kids", subscription: "sub_kids" }],
            has_more: false,
          },
        },
      },
    };
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push(String(url));
        if (String(url).includes("/subscriptions/sub_kids"))
          return new Response(
            JSON.stringify({
              id: "sub_kids",
              livemode: false,
              status: "active",
              latest_invoice: "in_kids",
              customer: "cus_parent",
              metadata: { product_scope: "kids", environment: "test", user_id: "parent-1" },
              items: {
                data: [
                  {
                    price: "price_kids",
                    current_period_start: periodStart,
                    current_period_end: periodEnd,
                  },
                ],
              },
            }),
          );
        if (String(url).includes("apply_kids_stripe_event")) {
          const body = JSON.parse(String(init?.body));
          expect(body.p_paid).toBe(true);
          expect(body.p_price_id).toBe("price_kids");
          return new Response("true");
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );
    vi.stubGlobal("Deno", {
      serve: (fn: typeof handler) => {
        handler = fn;
      },
      env: {
        get: (key: string) =>
          key === "STRIPE_WEBHOOK_SECRET"
            ? "whsec_fixture_only"
            : key === "STRIPE_SECRET_KEY"
              ? "sk_test_fixture_only"
              : "https://db.example.test",
      },
    });
    await import(webhookModule);
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("whsec_fixture_only"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = [
      ...new Uint8Array(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)),
      ),
    ]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    const response = await handler(
      new Request("https://test.local/webhook", {
        method: "POST",
        headers: { "Stripe-Signature": `t=${timestamp},v1=${signature}` },
        body: payload,
      }),
    );
    expect(response.status).toBe(200);
    expect(calls.some((value) => value.includes("apply_stripe_webhook_event"))).toBe(false);
  });
});
