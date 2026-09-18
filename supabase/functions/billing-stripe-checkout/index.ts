const ALLOWED_ORIGINS = new Set([
  "https://masaarat.ai",
  "https://www.masaarat.ai",
  "https://preview--viva-ai-systems.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const STRIPE_API_VERSION = "2026-07-29.dahlia";
const INTEGRATION_IDENTIFIER = "masaarat_checkout_qxkntzpv";

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://masaarat.ai";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

async function supabaseRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`RPC_${name}_FAILED:${text}`);
  return text ? JSON.parse(text) as T : (null as T);
}

async function stripeRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; params?: URLSearchParams; idempotencyKey?: string } = {},
): Promise<T> {
  const secretKey = env("STRIPE_SECRET_KEY");
  if (!/^(rk|sk)_test_/.test(secretKey)) {
    throw new Error("STRIPE_TEST_KEY_REQUIRED");
  }

  const method = options.method ?? "GET";
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? options.params?.toString() : undefined,
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message ?? "Stripe request failed";
    throw new Error(`STRIPE_API_ERROR:${message}`);
  }
  return payload as T;
}

type StripeSubscription = {
  id: string;
  status: string;
  metadata?: Record<string, string>;
};

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  status: string | null;
  metadata?: Record<string, string>;
};

const MANAGED_STRIPE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
]);

type CheckoutContext = {
  plan_version_id: string;
  market_price_id: string;
  plan_key: "pro" | "pro_plus";
  plan_name: string;
  billing_interval: "month" | "year";
  market_code: "EG" | "INTL";
  currency_code: string;
  amount_minor: number;
  tax_behavior: "exclusive";
  gateway_price_id: string | null;
  gateway_product_id: string | null;
  gateway_customer_id: string | null;
  subscription_id: string | null;
  access_state: string | null;
};

async function authenticate(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const response = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      apikey: env("SUPABASE_ANON_KEY"),
      Authorization: auth,
    },
  });
  if (!response.ok) throw new Error("UNAUTHORIZED");
  const user = await response.json();
  if (!user?.id || !user?.email) throw new Error("UNAUTHORIZED");
  return user as { id: string; email: string };
}

async function ensureStripePrice(context: CheckoutContext) {
  if (context.gateway_price_id && context.gateway_product_id) {
    return {
      priceId: context.gateway_price_id,
      productId: context.gateway_product_id,
    };
  }

  const productParams = new URLSearchParams();
  productParams.set("name", context.plan_name);
  productParams.set("metadata[plan_key]", context.plan_key);
  productParams.set("metadata[environment]", "test");
  const product = await stripeRequest<{ id: string }>("/products", {
    method: "POST",
    params: productParams,
    idempotencyKey: `catalog-product-${context.plan_key}-test-v1`,
  });

  const priceParams = new URLSearchParams();
  priceParams.set("product", product.id);
  priceParams.set("currency", context.currency_code);
  priceParams.set("unit_amount", String(context.amount_minor));
  priceParams.set("recurring[interval]", context.billing_interval);
  priceParams.set("tax_behavior", "exclusive");
  priceParams.set(
    "lookup_key",
    `masaarat_${context.plan_key}_${context.market_code.toLowerCase()}_${context.billing_interval}_test_v1`,
  );
  priceParams.set("metadata[market_price_id]", context.market_price_id);
  priceParams.set("metadata[environment]", "test");
  const price = await stripeRequest<{ id: string }>("/prices", {
    method: "POST",
    params: priceParams,
    idempotencyKey: `catalog-price-${context.market_price_id}-test-v1`,
  });

  const registered = await supabaseRpc<{ gateway_price_id: string; gateway_product_id: string }>(
    "register_stripe_gateway_catalog",
    {
      p_market_price_id: context.market_price_id,
      p_gateway_price_id: price.id,
      p_gateway_product_id: product.id,
    },
  );
  return {
    priceId: registered.gateway_price_id,
    productId: registered.gateway_product_id,
  };
}

async function ensureStripeCustomer(
  context: CheckoutContext,
  user: { id: string; email: string },
): Promise<string> {
  if (context.gateway_customer_id) return context.gateway_customer_id;

  const params = new URLSearchParams();
  params.set("email", user.email);
  params.set("metadata[user_id]", user.id);
  params.set("metadata[environment]", "test");
  const customer = await stripeRequest<{ id: string }>("/customers", {
    method: "POST",
    params,
    idempotencyKey: `customer-${user.id}-test-v1`,
  });
  return customer.id;
}


async function hasManagedStripeSubscription(customerId: string): Promise<boolean> {
  const query = new URLSearchParams({
    customer: customerId,
    status: "all",
    limit: "100",
  });
  const result = await stripeRequest<{ data: StripeSubscription[] }>(
    `/subscriptions?${query.toString()}`,
  );
  return result.data.some((subscription) =>
    subscription.metadata?.environment === "test"
    && MANAGED_STRIPE_SUBSCRIPTION_STATUSES.has(subscription.status)
  );
}

async function findReusableCheckoutSession(
  customerId: string,
  context: CheckoutContext,
): Promise<StripeCheckoutSession | null> {
  const query = new URLSearchParams({
    customer: customerId,
    status: "open",
    limit: "100",
  });
  const result = await stripeRequest<{ data: StripeCheckoutSession[] }>(
    `/checkout/sessions?${query.toString()}`,
  );
  return result.data.find((session) =>
    Boolean(session.url)
    && session.metadata?.environment === "test"
    && session.metadata?.plan_key === context.plan_key
    && session.metadata?.billing_interval === context.billing_interval
    && session.metadata?.market_code === context.market_code
  ) ?? null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405, origin);

  try {
    const user = await authenticate(request);
    const body = await request.json();
    const planKey = body?.planKey;
    const billingInterval = body?.billingInterval;
    const marketCode = body?.marketCode;

    if (!["pro", "pro_plus"].includes(planKey)
      || !["month", "year"].includes(billingInterval)
      || !["EG", "INTL"].includes(marketCode)) {
      return json({ error: "INVALID_CHECKOUT_SELECTION" }, 400, origin);
    }

    const context = await supabaseRpc<CheckoutContext>("get_stripe_checkout_context", {
      p_user_id: user.id,
      p_plan_key: planKey,
      p_billing_interval: billingInterval,
      p_market_code: marketCode,
    });

    if (["paid_active", "past_due", "canceled_at_period_end"].includes(context.access_state ?? "")) {
      return json({ error: "SUBSCRIPTION_ALREADY_MANAGED" }, 409, origin);
    }

    const [{ priceId }, customerId] = await Promise.all([
      ensureStripePrice(context),
      ensureStripeCustomer(context, user),
    ]);

    if (await hasManagedStripeSubscription(customerId)) {
      return json({ error: "SUBSCRIPTION_ALREADY_MANAGED" }, 409, origin);
    }

    const reusableSession = await findReusableCheckoutSession(customerId, context);
    if (reusableSession?.url) {
      return json({ url: reusableSession.url, sessionId: reusableSession.id }, 200, origin);
    }

    const checkoutWindow = Math.floor(Date.now() / 300_000);
    const checkoutNonce = `${user.id}:${planKey}:${billingInterval}:${marketCode}:${checkoutWindow}`;
    const prepared = await supabaseRpc<{ subscription_id: string }>("prepare_stripe_checkout", {
      p_user_id: user.id,
      p_plan_version_id: context.plan_version_id,
      p_market_price_id: context.market_price_id,
      p_market_code: context.market_code,
      p_currency_code: context.currency_code,
      p_billing_interval: context.billing_interval,
      p_gateway_customer_id: customerId,
      p_idempotency_key: `stripe-checkout:${user.id}:${checkoutNonce}`,
    });

    const appOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://masaarat.ai";
    const metadata: Record<string, string> = {
      user_id: user.id,
      internal_subscription_id: prepared.subscription_id,
      plan_version_id: context.plan_version_id,
      market_price_id: context.market_price_id,
      plan_key: context.plan_key,
      market_code: context.market_code,
      billing_interval: context.billing_interval,
      environment: "test",
    };

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("customer", customerId);
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("client_reference_id", user.id);
    params.set("success_url", `${appOrigin}/account?payment=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appOrigin}/pricing?payment=canceled`);
    params.set("allow_promotion_codes", "false");
    params.set("billing_address_collection", "auto");
    params.set("integration_identifier", INTEGRATION_IDENTIFIER);
    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, value);
      params.set(`subscription_data[metadata][${key}]`, value);
    }

    const session = await stripeRequest<{ id: string; url: string | null }>("/checkout/sessions", {
      method: "POST",
      params,
      idempotencyKey: `checkout-session-${checkoutNonce}`,
    });

    if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");
    return json({ url: session.url, sessionId: session.id }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error("billing-stripe-checkout", message);
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return json({ error: status === 401 ? "UNAUTHORIZED" : "CHECKOUT_UNAVAILABLE" }, status, origin);
  }
});
