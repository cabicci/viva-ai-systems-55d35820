// Stripe environment separation. Test and Live never share keys, webhook
// secrets, events or object identifiers. Live is OFF unless BOTH the server
// env flag STRIPE_LIVE_ENABLED === "true" AND the database kill switch
// (billing.stripe_live_control) are on. Never import this into browser code.

export type StripeEnvironment = "test" | "live";

export const STRIPE_SECRET_NAMES = {
  test: { key: "STRIPE_SECRET_KEY", webhook: "STRIPE_WEBHOOK_SECRET" },
  live: { key: "STRIPE_LIVE_SECRET_KEY", webhook: "STRIPE_LIVE_WEBHOOK_SECRET" },
} as const;

export function assertKeyMatchesEnvironment(key: string, environment: StripeEnvironment): string {
  const pattern = environment === "live" ? /^(rk|sk)_live_/ : /^(rk|sk)_test_/;
  if (!pattern.test(key)) {
    throw new Error(environment === "live" ? "STRIPE_LIVE_KEY_REQUIRED" : "STRIPE_TEST_KEY_REQUIRED");
  }
  return key;
}

export function assertWebhookSecretShape(secret: string): string {
  if (!secret.startsWith("whsec_")) throw new Error("STRIPE_WEBHOOK_SECRET_INVALID");
  return secret;
}

// Every Stripe object/event carries livemode. Missing livemode is rejected.
export function assertObjectEnvironment(
  object: { livemode?: unknown } | null | undefined,
  environment: StripeEnvironment,
): void {
  const expected = environment === "live";
  if (!object || object.livemode !== expected) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
}

export function assertMetadataEnvironment(
  metadata: Record<string, unknown> | null | undefined,
  environment: StripeEnvironment,
): void {
  if (metadata?.environment !== environment) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
}

// Database rows tagged with stripe_environment must match the request env.
export function assertRowEnvironment(
  row: { stripe_environment?: unknown } | null | undefined,
  environment: StripeEnvironment,
): void {
  if (!row || row.stripe_environment !== environment) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
}

export function lookupKeySuffix(environment: StripeEnvironment): string {
  return environment === "live" ? "_live_v1" : "_test_v1";
}

export type LiveGateDeps = {
  getEnv: (name: string) => string | undefined;
  databaseLiveEnabled: () => Promise<boolean>;
};

// Fail closed: env flag first (no DB/Stripe call when OFF), then DB switch.
export async function isLiveEnabled(deps: LiveGateDeps): Promise<boolean> {
  if (deps.getEnv("STRIPE_LIVE_ENABLED") !== "true") return false;
  try {
    return (await deps.databaseLiveEnabled()) === true;
  } catch {
    return false;
  }
}

export async function resolveStripeKey(
  environment: StripeEnvironment,
  deps: LiveGateDeps,
): Promise<string> {
  if (environment === "live" && !(await isLiveEnabled(deps))) throw new Error("STRIPE_LIVE_DISABLED");
  const value = deps.getEnv(STRIPE_SECRET_NAMES[environment].key);
  if (!value) throw new Error(`MISSING_${STRIPE_SECRET_NAMES[environment].key}`);
  return assertKeyMatchesEnvironment(value, environment);
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function secureEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i += 1) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  nowSeconds = Date.now() / 1000,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!secret.startsWith("whsec_")) return false;
  const parts = header.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const unix = Number(timestamp);
  if (!Number.isFinite(unix) || Math.abs(nowSeconds - unix) > toleranceSeconds) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = hex(digest);
  return signatures.some((s) => secureEqual(s, expected));
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Live webhook: separate endpoint + separate secret. Phase 1 never mutates
// billing data; once verified it acknowledges without processing.
export async function handleLiveWebhook(request: Request, deps: LiveGateDeps): Promise<Response> {
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (!(await isLiveEnabled(deps))) return json({ error: "STRIPE_LIVE_DISABLED" }, 503);
  const secret = deps.getEnv(STRIPE_SECRET_NAMES.live.webhook);
  if (!secret) return json({ error: "STRIPE_LIVE_NOT_CONFIGURED" }, 503);
  const payload = await request.text();
  const header = request.headers.get("stripe-signature") ?? "";
  if (!(await verifyStripeSignature(payload, header, secret))) return json({ error: "INVALID_SIGNATURE" }, 400);
  let event: { id?: string; livemode?: unknown };
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "INVALID_PAYLOAD" }, 400);
  }
  if (event.livemode !== true) return json({ error: "TEST_EVENT_REJECTED" }, 400);
  return json({ received: true, processed: false, reason: "LIVE_PROCESSING_NOT_ENABLED" }, 202);
}
