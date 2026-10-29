// Browser-side entry for every purchase / manage-subscription button.
// The server picks Test or Live; a failed Live request is never retried on
// Test and a failed Test request is never retried on Live.
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/lib/locale/locale-context";

export type LiveCheckoutRequest =
  | { product: "core"; planKey: "pro" | "pro_plus"; billingInterval: "month" | "year"; marketCode: "EG" | "INTL" }
  | { product: "kids" | "technical"; billingInterval: "month" | "year"; marketCode: "EG" | "INTL"; locale?: string }
  | { product: "academic"; academicAssistant: boolean; billingInterval: "month" | "year"; marketCode: "EG" | "INTL"; locale?: string };
export type LivePortalScope = "core" | "kids" | "academic" | "technical";

export class BillingUnavailableError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "BillingUnavailableError";
  }
}

export type BillingClientDeps = {
  fetch: typeof fetch;
  accessToken: () => Promise<string | null>;
};

const defaultDeps: BillingClientDeps = {
  fetch: (...args) => fetch(...args),
  accessToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
};

async function serverMode(intent: "checkout" | "portal", deps: BillingClientDeps): Promise<"test" | "live"> {
  let mode: unknown;
  try {
    const res = await deps.fetch(`/api/billing/mode?intent=${intent}`, { cache: "no-store" });
    mode = res.ok ? (await res.json())?.mode : null;
  } catch {
    mode = null;
  }
  if (mode === "test" || mode === "live") return mode;
  throw new BillingUnavailableError(mode === "live_unavailable" ? "LIVE_UNAVAILABLE" : "MODE_UNKNOWN");
}

async function postLive(path: string, body: unknown, expectedOrigin: string, deps: BillingClientDeps): Promise<string> {
  const token = await deps.accessToken();
  if (!token) throw new BillingUnavailableError("UNAUTHORIZED");
  let res: Response;
  try {
    res = await deps.fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new BillingUnavailableError("LIVE_NETWORK_ERROR");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new BillingUnavailableError(typeof data?.error === "string" ? data.error : "LIVE_UNAVAILABLE");
  const url = typeof data?.url === "string" ? data.url : "";
  let origin = "";
  try { origin = new URL(url).origin; } catch { /* invalid */ }
  if (origin !== expectedOrigin) throw new BillingUnavailableError("LIVE_URL_INVALID");
  return url;
}

/** Returns the Stripe URL to open. `test` is the existing Test call, untouched. */
export async function resolveCheckoutUrl(
  live: LiveCheckoutRequest,
  test: () => Promise<string>,
  deps: BillingClientDeps = defaultDeps,
): Promise<string> {
  const mode = await serverMode("checkout", deps);
  if (mode === "test") return test();
  return postLive("/api/stripe-live/checkout", live, "https://checkout.stripe.com", deps);
}

export async function resolvePortalUrl(
  scope: LivePortalScope,
  test: () => Promise<string>,
  deps: BillingClientDeps = defaultDeps,
): Promise<string> {
  const mode = await serverMode("portal", deps);
  if (mode === "test") return test();
  return postLive("/api/stripe-live/portal", { scope }, "https://billing.stripe.com", deps);
}

const UNAVAILABLE: Record<Locale, string> = {
  "ar-EG": "الدفع غير متاح حاليًا. لم يتم خصم أي مبلغ، جرّب لاحقًا.",
  "ar-MSA": "الدفع غير متاح حاليًا. لم يُخصم أي مبلغ، حاول لاحقًا.",
  "ar-Gulf": "الدفع غير متاح حاليًا. ما انخصم أي مبلغ، حاول لاحقًا.",
  en: "Payment is unavailable right now. You were not charged. Please try again later.",
};
export function billingUnavailableMessage(locale: Locale): string {
  return UNAVAILABLE[locale] ?? UNAVAILABLE.en;
}
