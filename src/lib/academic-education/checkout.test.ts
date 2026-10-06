// @vitest-environment node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { beforeEach, expect, it, vi } from "vitest";
import { coordinateKidsCheckout } from "../../../supabase/functions/_shared/checkout-coordinator";
let endpoint: (request: Request) => Promise<Response>;
let calls: { url: string; body: unknown }[];
let released: boolean;
let stripeKey: string;
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
beforeEach(() => {
  calls = [];
  released = true;
  stripeKey = "sk_test_fixture_only";
  const compiled = ts.transpileModule(
    readFileSync("supabase/functions/academic-stripe-checkout/index.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  new Function("require", "Deno", "exports", "fetch", compiled)(
    () => ({ coordinateKidsCheckout }),
    {
      env: {
        get: (name: string) =>
          ({
            SUPABASE_URL: "https://db.test",
            SUPABASE_SERVICE_ROLE_KEY: "fixture-service",
            SUPABASE_ANON_KEY: "fixture-public",
            STRIPE_SECRET_KEY: stripeKey,
          })[name],
      },
      serve: (fn: typeof endpoint) => (endpoint = fn),
    },
    {},
    vi.fn(async (input: string, init?: RequestInit) => {
      const body = init?.body ? String(init.body) : "";
      calls.push({ url: input, body });
      if (input.endsWith("/auth/v1/user"))
        return response({ id: "fixture-user", email: "member@example.test" });
      if (input.endsWith("/get_academic_stripe_checkout_context"))
        return released
          ? response({
              email: "member@example.test",
              amount_minor: 30900,
              currency_code: "egp",
              market_code: "EG",
              billing_interval: "month",
              discounted: false,
              gateway_customer_id: "cus_existing",
              gateway_price_id: "price_academic",
            })
          : response({ message: "ACADEMIC_UNAVAILABLE" }, 400);
      if (input.includes("/subscriptions?")) return response({ data: [], has_more: false });
      if (input.endsWith("/lc09_begin_kids_checkout"))
        return response({
          attempt_id: "fixture-attempt",
          status: "creating",
          idempotency_key: "fixture-key",
          session_id: null,
          session_url: null,
        });
      if (input.endsWith("/checkout/sessions"))
        return response({
          id: "cs_academic",
          status: "open",
          url: "https://checkout.stripe.com/c/pay/cs_academic",
        });
      if (input.endsWith("/lc09_record_kids_checkout")) return response(true);
      throw Error("Unexpected external request: " + input);
    }),
  );
});
const checkout = (auth = true) =>
  endpoint(
    new Request("https://edge.test", {
      method: "POST",
      headers: {
        ...(auth ? { Authorization: "Bearer fixture" } : {}),
        Origin: "https://masaarat.ai",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ marketCode: "EG", billingInterval: "month", locale: "ar-Gulf" }),
    }),
  );
it("rejects anonymous callers before database/provider calls", async () => {
  expect((await checkout(false)).status).toBe(401);
  expect(calls).toEqual([]);
});
it("does not create a Stripe product or checkout when written release is closed", async () => {
  released = false;
  expect((await checkout()).status).toBe(503);
  expect(calls.some((c) => c.url.startsWith("https://api.stripe.com"))).toBe(false);
});
it("rejects LIVE credentials in the Academic checkout", async () => {
  stripeKey = "sk_live_fixture_only";
  expect((await checkout()).status).toBe(503);
  expect(calls.some((c) => c.url.startsWith("https://api.stripe.com"))).toBe(false);
});
it("uses the existing account/customer and independent Academic scope with locale preservation", async () => {
  const result = await checkout();
  expect(result.status).toBe(200);
  const call = calls.find((c) => c.url.endsWith("/checkout/sessions"))!;
  const params = new URLSearchParams(call.body as string);
  expect(params.get("customer")).toBe("cus_existing");
  expect(params.get("subscription_data[metadata][product_scope]")).toBe("academic");
  expect(params.get("subscription_data[metadata][environment]")).toBe("test");
  expect(params.get("success_url")).toBe(
    "https://masaarat.ai/academic?payment=success&locale=ar-Gulf",
  );
  expect(params.get("line_items[0][price]")).toBe("price_academic");
});
