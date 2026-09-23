import { stripeSecretKey } from "../_shared/stripe-environment.ts";

const ALLOWED_ORIGINS = new Set([
  "https://masaarat.ai",
  "https://www.masaarat.ai",
  "https://preview--viva-ai-systems.lovable.app",
  "https://id-preview--658adce0-747d-4c8e-90e3-d22225070b94.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const STRIPE_API_VERSION = "2026-07-29.dahlia";

function allowedOrigin(origin: string | null): string {
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://masaarat.ai";
}

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin),
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
  if (!user?.id) throw new Error("UNAUTHORIZED");
  return user as { id: string };
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/${name}`, {
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
  return JSON.parse(text) as T;
}

async function createPortalSession(customerId: string, returnUrl: string) {
  const secretKey = stripeSecretKey({ STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY") });

  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("return_url", returnUrl);

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`STRIPE_API_ERROR:${payload?.error?.message ?? "request failed"}`);
  }
  return payload as { url?: string };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405, origin);

  try {
    const user = await authenticate(request);
    const context = await rpc<{
      gateway_customer_id: string;
      gateway_subscription_id: string;
    }>("get_stripe_portal_context", { p_user_id: user.id });

    if (!context.gateway_customer_id || !context.gateway_subscription_id) {
      throw new Error("STRIPE_PORTAL_CONTEXT_INCOMPLETE");
    }

    const session = await createPortalSession(
      context.gateway_customer_id,
      `${allowedOrigin(origin)}/account`,
    );
    if (!session.url) throw new Error("STRIPE_PORTAL_URL_MISSING");

    return json({ url: session.url }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error("billing-stripe-portal", message);
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return json({ error: status === 401 ? "UNAUTHORIZED" : "PORTAL_UNAVAILABLE" }, status, origin);
  }
});
