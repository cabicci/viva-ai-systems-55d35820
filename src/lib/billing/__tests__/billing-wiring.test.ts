/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { decideBillingMode } from "@/lib/billing/billing-mode";
import {
  BillingUnavailableError,
  resolveCheckoutUrl,
  resolvePortalUrl,
  type LiveCheckoutRequest,
} from "@/lib/billing/checkout-client";
import { liveCheckoutSchema } from "@/lib/billing/live/schemas";
import { createLiveCheckout, type LiveDeps } from "@/lib/billing/live/stripe-live";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } }));

const env = (values: Record<string, string>) => (n: string) => values[n];

describe("server-owned billing mode", () => {
  it("defaults to Test when no mode is set, without touching the database", async () => {
    const db = vi.fn(async () => true);
    expect(await decideBillingMode("checkout", env({ STRIPE_LIVE_ENABLED: "true" }), db)).toBe("test");
    expect(await decideBillingMode("portal", env({}), db)).toBe("test");
    expect(db).not.toHaveBeenCalled();
  });
  it("Live mode with either checkout switch OFF is unavailable, never Test", async () => {
    expect(await decideBillingMode("checkout", env({ STRIPE_BILLING_MODE: "live" }), async () => true)).toBe("live_unavailable");
    expect(await decideBillingMode("checkout", env({ STRIPE_BILLING_MODE: "live", STRIPE_LIVE_ENABLED: "true" }), async () => false)).toBe("live_unavailable");
    expect(await decideBillingMode("checkout", env({ STRIPE_BILLING_MODE: "live", STRIPE_LIVE_ENABLED: "true" }), async () => { throw new Error("db"); })).toBe("live_unavailable");
    expect(await decideBillingMode("checkout", env({ STRIPE_BILLING_MODE: "live", STRIPE_LIVE_ENABLED: "true" }), async () => true)).toBe("live");
  });
  it("unknown mode values fail closed", async () => {
    expect(await decideBillingMode("checkout", env({ STRIPE_BILLING_MODE: "LIVE-ish" }), async () => true)).toBe("live_unavailable");
  });
  it("Live portal stays available for existing subscribers when checkout is OFF", async () => {
    expect(await decideBillingMode("portal", env({ STRIPE_BILLING_MODE: "live" }), async () => false)).toBe("live");
  });
});

function client(mode: string, live: { status: number; body: any } = { status: 200, body: { url: "https://checkout.stripe.com/c/live" } }) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const deps = {
    accessToken: async () => "jwt",
    fetch: (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.startsWith("/api/billing/mode")) return new Response(JSON.stringify({ mode }), { status: 200 });
      return new Response(JSON.stringify(live.body), { status: live.status });
    }) as any,
  };
  return { deps, calls };
}

// Every visible package / market / term button.
const VARIANTS: LiveCheckoutRequest[] = [];
for (const marketCode of ["EG", "INTL"] as const)
  for (const billingInterval of ["month", "year"] as const) {
    VARIANTS.push({ product: "core", planKey: "pro", billingInterval, marketCode });
    VARIANTS.push({ product: "core", planKey: "pro_plus", billingInterval, marketCode });
    VARIANTS.push({ product: "kids", billingInterval, marketCode, locale: "ar-EG" });
    VARIANTS.push({ product: "academic", academicAssistant: false, billingInterval, marketCode, locale: "en" });
    VARIANTS.push({ product: "academic", academicAssistant: true, billingInterval, marketCode, locale: "en" });
    VARIANTS.push({ product: "technical", billingInterval, marketCode, locale: "ar-MSA" });
  }

describe("purchase buttons", () => {
  it("covers 24 button variants and every one is a valid Live request", () => {
    expect(VARIANTS).toHaveLength(24);
    for (const v of VARIANTS) expect(liveCheckoutSchema.safeParse(v).success).toBe(true);
  });

  for (const v of VARIANTS) {
    const label = JSON.stringify(v);
    it(`Test mode keeps the existing Test call: ${label}`, async () => {
      const { deps, calls } = client("test");
      const test = vi.fn(async () => "https://checkout.stripe.com/c/test");
      expect(await resolveCheckoutUrl(v, test, deps)).toBe("https://checkout.stripe.com/c/test");
      expect(test).toHaveBeenCalledTimes(1);
      expect(calls.some((c) => c.url.startsWith("/api/stripe-live"))).toBe(false);
    });
    it(`Live mode posts the exact selection to the Live route: ${label}`, async () => {
      const { deps, calls } = client("live");
      const test = vi.fn(async () => "x");
      expect(await resolveCheckoutUrl(v, test, deps)).toBe("https://checkout.stripe.com/c/live");
      expect(test).not.toHaveBeenCalled();
      const post = calls.find((c) => c.url === "/api/stripe-live/checkout")!;
      expect(JSON.parse(String(post.init!.body))).toEqual(v);
      expect((post.init!.headers as any).Authorization).toBe("Bearer jwt");
    });
  }

  for (const [label, live] of [
    ["switch off", { status: 503, body: { error: "STRIPE_LIVE_CHECKOUT_DISABLED" } }],
    ["wrong origin", { status: 403, body: { error: "UNTRUSTED_ORIGIN" } }],
    ["missing Live price", { status: 503, body: { error: "LIVE_PRICE_NOT_REGISTERED" } }],
    ["non-Stripe URL", { status: 200, body: { url: "https://evil.example/checkout" } }],
  ] as const) {
    it(`a failed Live request (${label}) never falls back to Test`, async () => {
      const { deps } = client("live", live);
      const test = vi.fn(async () => "https://checkout.stripe.com/c/test");
      await expect(resolveCheckoutUrl(VARIANTS[0], test, deps)).rejects.toBeInstanceOf(BillingUnavailableError);
      expect(test).not.toHaveBeenCalled();
    });
  }

  it("Live unavailable at the mode check calls neither Live nor Test", async () => {
    const { deps, calls } = client("live_unavailable");
    const test = vi.fn(async () => "x");
    await expect(resolveCheckoutUrl(VARIANTS[2], test, deps)).rejects.toMatchObject({ code: "LIVE_UNAVAILABLE" });
    expect(test).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it("an unreachable mode check fails closed instead of guessing Test", async () => {
    const test = vi.fn(async () => "x");
    const deps = { accessToken: async () => "jwt", fetch: (async () => { throw new Error("offline"); }) as any };
    await expect(resolveCheckoutUrl(VARIANTS[0], test, deps)).rejects.toBeInstanceOf(BillingUnavailableError);
    expect(test).not.toHaveBeenCalled();
  });

  it("a failed Test request is never retried on Live", async () => {
    const { deps, calls } = client("test");
    await expect(resolveCheckoutUrl(VARIANTS[0], async () => { throw new Error("test down"); }, deps)).rejects.toThrow("test down");
    expect(calls.some((c) => c.url.startsWith("/api/stripe-live"))).toBe(false);
  });
});

describe("manage-subscription buttons", () => {
  for (const scope of ["core", "kids", "academic", "technical"] as const) {
    it(`Live portal for ${scope} requires a billing.stripe.com URL and never falls back`, async () => {
      const ok = client("live", { status: 200, body: { url: "https://billing.stripe.com/p/x" } });
      const test = vi.fn(async () => "x");
      expect(await resolvePortalUrl(scope, test, ok.deps)).toBe("https://billing.stripe.com/p/x");
      expect(JSON.parse(String(ok.calls.find((c) => c.url === "/api/stripe-live/portal")!.init!.body))).toEqual({ scope });
      const bad = client("live", { status: 503, body: { error: "LIVE_PORTAL_UNAVAILABLE" } });
      await expect(resolvePortalUrl(scope, test, bad.deps)).rejects.toBeInstanceOf(BillingUnavailableError);
      expect(test).not.toHaveBeenCalled();
    });
  }
});

describe("Live route with the real checkout logic", () => {
  const deps = (o: Partial<LiveDeps> = {}): LiveDeps & { stripeCalls: string[] } => {
    const stripeCalls: string[] = [];
    return {
      getEnv: (n) => ({ STRIPE_LIVE_ENABLED: "true" } as Record<string, string>)[n],
      databaseLiveEnabled: async () => true,
      rpc: async (name: string) => {
        if (name === "get_technical_stripe_checkout_context")
          return { amount_minor: 30900, currency_code: "egp", market_code: "EG", billing_interval: "month", discounted: false,
            gateway_customer_id: null, gateway_product_id: null, gateway_price_id: null, email: "u@example.com" } as any;
        throw new Error("UNEXPECTED_" + name);
      },
      stripe: async (path: string) => { stripeCalls.push(path); throw new Error("UNEXPECTED_STRIPE"); },
      stripeCalls,
      ...o,
    } as any;
  };
  const user = { id: "u1", email: "u@example.com" };
  const body = { product: "technical", billingInterval: "month", marketCode: "EG" } as const;

  it("switch off: 503 with no database or Stripe call", async () => {
    const d = deps({ databaseLiveEnabled: async () => false });
    expect((await createLiveCheckout(user, body, "https://masaarat.ai", d)).status).toBe(503);
    expect(d.stripeCalls).toHaveLength(0);
  });
  it("wrong origin: 403 before anything", async () => {
    const d = deps();
    expect(await createLiveCheckout(user, body, "https://viva-ai-systems.lovable.app", d)).toEqual({ status: 403, body: { error: "UNTRUSTED_ORIGIN" } });
    expect(d.stripeCalls).toHaveLength(0);
  });
  it("missing Live price: closed, and no product/price is created", async () => {
    const d = deps();
    expect(await createLiveCheckout(user, body, "https://masaarat.ai", d)).toEqual({ status: 503, body: { error: "LIVE_PRICE_NOT_REGISTERED" } });
    expect(d.stripeCalls).toHaveLength(0);
  });
});

describe("site wiring", () => {
  const files = {
    "src/components/billing/StripeCheckoutButtons.tsx": ["resolveCheckoutUrl", "billing-stripe-checkout"],
    "src/components/kids/KidsCheckoutButtons.tsx": ["resolveCheckoutUrl", "kids-stripe-checkout"],
    "src/components/billing/StripePortalButton.tsx": ["resolvePortalUrl", "billing-stripe-portal"],
    "src/routes/academic.pricing.tsx": ["resolveCheckoutUrl", "resolvePortalUrl", "academic-stripe-checkout", 'product: "academic", academicAssistant: withAssistant'],
    "src/routes/technical.pricing.tsx": ["resolveCheckoutUrl", "resolvePortalUrl", "technical-stripe-checkout", 'product: "technical"'],
  };
  for (const [file, needles] of Object.entries(files)) {
    it(`${file} routes its Test call through the server-owned mode`, () => {
      const src = readFileSync(file, "utf8");
      for (const n of needles) expect(src).toContain(n);
      // The Test edge-function call only appears inside the resolver's test callback.
      const invokes = src.match(/functions\.invoke\(/g)?.length ?? 0;
      const resolvers = (src.match(/resolve(Checkout|Portal)Url\(/g) ?? []).length;
      expect(invokes).toBe(resolvers);
      expect(src).toContain("BillingUnavailableError");
    });
  }
});
