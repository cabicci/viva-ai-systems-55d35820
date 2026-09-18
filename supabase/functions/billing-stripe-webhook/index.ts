const STRIPE_API_VERSION = "2026-07-29.dahlia";
const SIGNATURE_TOLERANCE_SECONDS = 300;

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function secureEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function verifySignature(payload: string, header: string, secret: string): Promise<boolean> {
  if (!secret.startsWith("whsec_")) return false;
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const unix = Number(timestamp);
  if (!Number.isFinite(unix) || Math.abs(Date.now() / 1000 - unix) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = hex(digest);
  return signatures.some((signature) => secureEqual(signature, expected));
}

async function stripeGet<T>(path: string): Promise<T> {
  const secretKey = env("STRIPE_SECRET_KEY");
  if (!/^(rk|sk)_test_/.test(secretKey)) throw new Error("STRIPE_TEST_KEY_REQUIRED");

  const result = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
    },
  });
  const payload = await result.json();
  if (!result.ok) throw new Error(`STRIPE_API_ERROR:${payload?.error?.message ?? "request failed"}`);
  return payload as T;
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const result = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await result.text();
  if (!result.ok) throw new Error(`RPC_${name}_FAILED:${text}`);
  return text ? JSON.parse(text) as T : (null as T);
}

type StripeEvent = {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  data: { object: Record<string, any> };
};

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as any).id === "string") {
    return (value as any).id;
  }
  return null;
}

function subscriptionIdFrom(object: Record<string, any>): string | null {
  return idOf(object.subscription)
    ?? idOf(object.parent?.subscription_details?.subscription)
    ?? idOf(object.lines?.data?.[0]?.parent?.subscription_item_details?.subscription)
    ?? (object.object === "subscription" ? idOf(object) : null);
}

function transitionFor(event: StripeEvent, subscription: Record<string, any>): string | null {
  if (event.type === "checkout.session.completed") {
    return event.data.object.payment_status === "paid" && subscription.status === "active"
      ? "payment_succeeded"
      : null;
  }
  if (event.type === "invoice.paid") {
    return event.data.object.status === "paid" && subscription.status === "active"
      ? "payment_succeeded"
      : null;
  }
  if (event.type === "invoice.payment_failed") return "payment_failed";
  if (event.type === "customer.subscription.deleted") return "canceled";
  if (event.type === "customer.subscription.updated") {
    if (subscription.cancel_at_period_end) return "cancel_at_period_end";
    if (["past_due", "unpaid"].includes(subscription.status)) return "payment_failed";
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("Stripe-Signature");
    if (!signature || !await verifySignature(rawBody, signature, env("STRIPE_WEBHOOK_SECRET"))) {
      return response({ error: "INVALID_SIGNATURE" }, 400);
    }

    const event = JSON.parse(rawBody) as StripeEvent;
    if (event.livemode) return response({ error: "LIVE_EVENT_REJECTED" }, 400);

    const supported = new Set([
      "checkout.session.completed",
      "invoice.paid",
      "invoice.payment_failed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ]);
    if (!supported.has(event.type)) return response({ received: true, ignored: true });

    const object = event.data.object;
    const gatewaySubscriptionId = subscriptionIdFrom(object);
    if (!gatewaySubscriptionId) return response({ received: true, ignored: true });

    const subscription = event.type.startsWith("customer.subscription.")
      ? object
      : await stripeGet<Record<string, any>>(`/subscriptions/${encodeURIComponent(gatewaySubscriptionId)}`);

    const metadata = subscription.metadata ?? {};
    const internalSubscriptionId = metadata.internal_subscription_id;
    const userId = metadata.user_id;
    const activePriceId = idOf(subscription.items?.data?.[0]?.price);
    const resolvedPlan = activePriceId
      ? await rpc<{
          plan_version_id: string;
          market_price_id: string;
          plan_key: string;
          market_code: string;
          billing_interval: string;
        } | null>("resolve_stripe_subscription_plan", { p_gateway_price_id: activePriceId })
      : null;
    const planVersionId = resolvedPlan?.plan_version_id ?? metadata.plan_version_id;
    const marketPriceId = resolvedPlan?.market_price_id ?? metadata.market_price_id;
    const gatewayCustomerId = idOf(subscription.customer);
    if (!internalSubscriptionId || !userId || !planVersionId || !marketPriceId || !gatewayCustomerId) {
      throw new Error("STRIPE_METADATA_INCOMPLETE");
    }

    const periodStart = subscription.current_period_start
      ?? subscription.items?.data?.[0]?.current_period_start
      ?? null;
    const periodEnd = subscription.current_period_end
      ?? subscription.items?.data?.[0]?.current_period_end
      ?? null;

    const transition = transitionFor(event, subscription);
    const isPaidInvoice = event.type === "invoice.paid";
    const minimized = {
      stripe_event_type: event.type,
      stripe_status: subscription.status,
      checkout_generation: metadata.checkout_generation ?? null,
      plan_key: resolvedPlan?.plan_key ?? metadata.plan_key,
      market_code: resolvedPlan?.market_code ?? metadata.market_code,
      billing_interval: resolvedPlan?.billing_interval ?? metadata.billing_interval,
      billing_reason: object.billing_reason ?? null,
      livemode: false,
    };

    const result = await rpc("apply_stripe_webhook_event", {
      p_gateway_event_id: event.id,
      p_event_type: event.type,
      p_effective_at: new Date(event.created * 1000).toISOString(),
      p_transition: transition,
      p_subscription_id: internalSubscriptionId,
      p_user_id: userId,
      p_plan_version_id: planVersionId,
      p_market_price_id: marketPriceId,
      p_gateway_customer_id: gatewayCustomerId,
      p_gateway_subscription_id: gatewaySubscriptionId,
      p_gateway_status: subscription.status,
      p_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      p_gateway_transaction_id: isPaidInvoice ? object.id : null,
      p_amount_minor: isPaidInvoice ? Number(object.amount_paid ?? 0) : null,
      p_currency_code: isPaidInvoice ? object.currency : null,
      p_payload_minimized: minimized,
    });

    return response({ received: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error("billing-stripe-webhook", message);
    return response({ error: "WEBHOOK_PROCESSING_FAILED" }, 500);
  }
});
