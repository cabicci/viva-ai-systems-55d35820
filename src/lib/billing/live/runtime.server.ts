// Real dependencies for the Stripe LIVE flows. Server-only.
import { resolveLifecycleKey } from "../../../../supabase/functions/_shared/stripe-environment";
import type { LiveDeps, LiveUser } from "./stripe-live";

const STRIPE_API_VERSION = "2026-07-29.dahlia";
export const LIVE_ENV_HEADER = "x-masaarat-stripe-environment";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

function serviceHeaders(): Record<string, string> {
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  // Opaque sb_secret_ keys go in apikey only; legacy JWT keys also as bearer.
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

async function liveRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${required("SUPABASE_URL")}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { ...serviceHeaders(), "Content-Type": "application/json", [LIVE_ENV_HEADER]: "live" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`RPC_${name}_FAILED`);
  return text ? (JSON.parse(text) as T) : (null as T);
}

export function liveRuntime(): LiveDeps {
  const getEnv = (name: string) => process.env[name];
  return {
    getEnv,
    databaseLiveEnabled: async () => (await liveRpc<boolean>("get_stripe_live_enabled", {})) === true,
    rpc: liveRpc,
    stripe: async <T>(path: string, options: { method?: "GET" | "POST" | "DELETE"; params?: URLSearchParams; idempotencyKey?: string } = {}) => {
      const key = resolveLifecycleKey("live", getEnv);
      const method = options.method ?? "GET";
      const response = await fetch(`https://api.stripe.com/v1${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          "Stripe-Version": STRIPE_API_VERSION,
          ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
          ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        },
        body: method === "POST" ? (options.params ?? new URLSearchParams()).toString() : undefined,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("STRIPE_LIVE_API_ERROR");
      return payload as T;
    },
  };
}

export async function authenticateBearer(request: Request): Promise<LiveUser | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const response = await fetch(`${required("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: serviceHeaders().apikey, Authorization: auth },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string; email?: string };
  return user.id && user.email ? { id: user.id, email: user.email } : null;
}

const ORIGINS = new Set(["https://masaarat.ai", "https://www.masaarat.ai"]);
export function appOriginFor(request: Request): string {
  const origin = request.headers.get("Origin");
  return origin && ORIGINS.has(origin) ? origin : "https://masaarat.ai";
}
