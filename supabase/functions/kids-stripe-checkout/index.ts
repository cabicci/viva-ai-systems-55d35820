import { coordinateKidsCheckout } from "./coordinator.ts";

const ORIGINS = new Set([
  "https://masaarat.ai",
  "https://www.masaarat.ai",
  "https://id-preview--658adce0-747d-4c8e-90e3-d22225070b94.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);
const VERSION = "2026-08-26.dahlia";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}
function json(value: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin && ORIGINS.has(origin) ? origin : "https://masaarat.ai",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
  });
}
async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    if (detail?.message === "PARENT_CONSENT_REQUIRED") throw new Error("PARENT_CONSENT_REQUIRED");
    if (detail?.message === "KIDS_MARKET_MISMATCH") throw new Error("KIDS_MARKET_MISMATCH");
    throw new Error(`RPC_${name}_FAILED`);
  }
  return (await response.json()) as T;
}
async function stripe<T>(path: string, params?: URLSearchParams, idempotency?: string): Promise<T> {
  const key = env("STRIPE_SECRET_KEY");
  if (!/^(rk|sk)_test_/.test(key)) throw new Error("STRIPE_TEST_KEY_REQUIRED");
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": VERSION,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotency ? { "Idempotency-Key": idempotency } : {}),
    },
    body: params?.toString(),
  });
  const value = await response.json();
  if (!response.ok) throw new Error("STRIPE_TEST_UNAVAILABLE");
  return value as T;
}
type Context = {
  amount_minor: number;
  currency_code: "egp" | "usd";
  market_code: "EG" | "INTL";
  billing_interval: "month" | "year";
  discounted: boolean;
  gateway_customer_id: string | null;
  gateway_product_id: string | null;
  gateway_price_id: string | null;
  email: string;
};
async function ensureCustomer(context: Context, user: { id: string; email: string }) {
  if (context.gateway_customer_id) return context.gateway_customer_id;
  const params = new URLSearchParams({ email: user.email });
  params.set("metadata[user_id]", user.id);
  params.set("metadata[environment]", "test");
  const created = await stripe<{ id: string }>("/customers", params, `customer-${user.id}-test-v1`);
  return rpc<string>("register_kids_stripe_customer", {
    p_user_id: user.id,
    p_customer_id: created.id,
  });
}
async function ensurePrice(context: Context): Promise<string> {
  if (context.gateway_price_id) return context.gateway_price_id;
  const productParams = new URLSearchParams({ name: "Masaarat Kids Family" });
  productParams.set("metadata[product_scope]", "kids");
  productParams.set("metadata[environment]", "test");
  const product = await stripe<{ id: string }>(
    "/products",
    productParams,
    "catalog-product-kids-family-test-v1",
  );
  const variant = `${context.market_code.toLowerCase()}_${context.billing_interval}_${context.discounted ? "bundle" : "standard"}`;
  const priceParams = new URLSearchParams({
    product: product.id,
    currency: context.currency_code,
    unit_amount: String(context.amount_minor),
    tax_behavior: "exclusive",
    lookup_key: `masaarat_kids_${variant}_test_v1`,
  });
  priceParams.set("recurring[interval]", context.billing_interval);
  priceParams.set("metadata[product_scope]", "kids");
  priceParams.set("metadata[environment]", "test");
  const price = await stripe<{ id: string }>(
    "/prices",
    priceParams,
    `catalog-price-kids-${variant}-test-v1`,
  );
  return rpc<string>("register_kids_stripe_price", {
    p_market_code: context.market_code,
    p_billing_interval: context.billing_interval,
    p_discounted: context.discounted,
    p_currency_code: context.currency_code,
    p_amount_minor: context.amount_minor,
    p_product_id: product.id,
    p_price_id: price.id,
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return json({}, 200, origin);
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405, origin);
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401, origin);
    const account = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
      headers: { apikey: env("SUPABASE_ANON_KEY"), Authorization: authorization },
    });
    if (!account.ok) return json({ error: "UNAUTHORIZED" }, 401, origin);
    const user = (await account.json()) as { id?: string; email?: string };
    if (!user.id || !user.email) return json({ error: "UNAUTHORIZED" }, 401, origin);
    const body = await request.json();
    if (
      !["EG", "INTL"].includes(body?.marketCode) ||
      !["month", "year"].includes(body?.billingInterval)
    ) {
      return json({ error: "INVALID_KIDS_SELECTION" }, 400, origin);
    }
    const context = await rpc<Context>("get_kids_stripe_checkout_context", {
      p_user_id: user.id,
      p_market_code: body.marketCode,
      p_billing_interval: body.billingInterval,
    });
    if (context.email !== user.email) throw new Error("PARENT_EMAIL_MISMATCH");
    const customerId = await ensureCustomer(context, { id: user.id, email: user.email });
    const subscriptions = await stripe<{
      data: Array<{ status: string; metadata?: Record<string, string> }>;
      has_more: boolean;
    }>(
      `/subscriptions?${new URLSearchParams({ customer: customerId, status: "all", limit: "100" })}`,
    );
    if (subscriptions.has_more) throw new Error("SUBSCRIPTION_LIST_INCOMPLETE");
    if (
      subscriptions.data.some(
        (item) =>
          item.metadata?.product_scope === "kids" &&
          ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"].includes(
            item.status,
          ),
      )
    ) {
      return json({ error: "KIDS_SUBSCRIPTION_ALREADY_MANAGED" }, 409, origin);
    }
    const priceId = await ensurePrice(context);
    const appOrigin = origin && ORIGINS.has(origin) ? origin : "https://masaarat.ai";
    const params = new URLSearchParams({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: "false",
      billing_address_collection: "auto",
      success_url: `${appOrigin}/kids/family?payment=success`,
      cancel_url: `${appOrigin}/pricing?payment=canceled#kids`,
    });
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    const metadata = {
      product_scope: "kids",
      user_id: user.id,
      market_code: context.market_code,
      billing_interval: context.billing_interval,
      environment: "test",
    };
    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, value);
      params.set(`subscription_data[metadata][${key}]`, value);
    }
    const windowId = Math.floor(Date.now() / 300_000);
    const session = await coordinateKidsCheckout({
      begin: () =>
        rpc("lc09_begin_kids_checkout", {
          p_user_id: user.id,
          p_key: `kids-checkout-${user.id}-${context.market_code}-${context.billing_interval}-${context.discounted}-${windowId}`,
          p_parameters: params.toString(),
        }),
      create: (key) => stripe("/checkout/sessions", params, key),
      record: (attempt, session, expired = false) =>
        rpc("lc09_record_kids_checkout", {
          p_user_id: user.id,
          p_attempt: attempt,
          p_session: session,
          p_expired: expired,
        }),
      expire: (session) =>
        stripe(`/checkout/sessions/${encodeURIComponent(session)}/expire`, new URLSearchParams()),
    });
    return json({ url: session.url, sessionId: session.id }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("kids-stripe-checkout", message);
    if (message === "PARENT_CONSENT_REQUIRED") return json({ error: message }, 403, origin);
    if (message === "KIDS_MARKET_MISMATCH") return json({ error: message }, 400, origin);
    return json({ error: "KIDS_CHECKOUT_UNAVAILABLE" }, 503, origin);
  }
});
