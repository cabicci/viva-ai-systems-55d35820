import { afterEach, describe, expect, it, vi } from "vitest";
import { createLiveCheckout, type LiveDeps } from "@/lib/billing/live/stripe-live";

// All data and services in this fixture are synthetic. No HTTP client is created.
const actor = { id: "55555555-5555-4555-8555-555555555505", email: "m05@example.invalid" };
type Scope = "kids" | "technical" | "academic";
function fixture(scope: Scope, coded = false, retireOnBind = false) {
  const attempts = new Map<string, any>();
  const sessions = new Map<string, any>();
  let expired = 0,
    bound = 0;
  const offer = {
    id: "offer_m05",
    user_id: actor.id,
    customer_id: "cus_m05",
    session_id: null,
    subscription_id: null,
    consumed_invoice_id: null,
    original_minor: 30900,
    final_minor: 27810,
    mapping: {
      id: "mapping_m05",
      package: scope,
      market_code: "EG",
      currency: "EGP",
      billing_interval: "month",
      price_id: `price_m05_${scope}`,
      product_id: `prod_m05_${scope}`,
      coupon_id: "coupon_m05",
      promotion_code_id: "promo_m05",
      kind: "percent",
      value_minor: 10,
      duration: "once",
      duration_in_months: null,
    },
  };
  const params = {
    amount_minor: 30900,
    currency_code: "egp",
    market_code: "EG",
    billing_interval: "month",
    discounted: false,
    includes_assistant: true,
    gateway_customer_id: "cus_m05",
    gateway_product_id: `prod_m05_${scope}`,
    gateway_price_id: `price_m05_${scope}`,
    email: actor.email,
  };
  const deps: LiveDeps = {
    getEnv: (name) =>
      name === "STRIPE_LIVE_ENABLED" ? "true" : name === "STRIPE_BILLING_MODE" ? "live" : undefined,
    databaseLiveEnabled: async () => true,
    rpc: async <T>(name: string, body: Record<string, unknown>): Promise<T> => {
      if (name === `get_${scope}_stripe_checkout_context`) return { ...params } as T;
      if (name === "select_commercial_discount") return { use_offer: true } as T;
      if (name === "reserve_stripe_live_offer") return offer as T;
      if (name === "bind_stripe_live_offer") {
        bound++;
        return true as T;
      }
      // New protocol model. Native SQL lock/CAS behavior is tested separately.
      if (name === "prepare_scoped_checkout_intent") {
        expect(body.p_user_id).toBe(actor.id);
        let row = [...attempts.values()].find((a) => !a.resolved);
        if (!row) {
          const generation = `55555555-5555-4555-8555-${String(attempts.size + 1).padStart(12, "0")}`;
          const parameters = new URLSearchParams(String(body.p_parameters));
          const expires = Math.floor(Date.now() / 1000) + (body.p_offer ? 1860 : 86400);
          parameters.set("expires_at", String(expires));
          parameters.set("metadata[checkout_generation]", generation);
          parameters.set("subscription_data[metadata][checkout_generation]", generation);
          row = {
            checkout_generation: generation,
            checkout_session_id: null,
            idempotency_key: `scoped-${scope}-live-${generation}`,
            parameters: parameters.toString(),
            selection_parameters: body.p_parameters,
            session_expires_at: new Date(expires * 1000).toISOString(),
            create_started_at: new Date().toISOString(),
            legacy: false,
          };
          attempts.set(generation, row);
        }
        return [{ ...row, selection_matches: row.selection_parameters === body.p_parameters }] as T;
      }
      if (name === "lc09_record_kids_checkout" || name === "attach_scoped_checkout_intent") {
        const row = attempts.get(String(body.p_attempt ?? body.p_generation));
        if (!row || (row.checkout_session_id && row.checkout_session_id !== body.p_session))
          throw new Error("ATTEMPT_SESSION_MISMATCH");
        row.checkout_session_id = String(body.p_session);
        return true as T;
      }
      if (name === "confirm_scoped_checkout_intent") {
        const row = attempts.get(String(body.p_generation));
        return (!!row &&
          !row.resolved &&
          row.checkout_session_id === body.p_session &&
          !(retireOnBind && bound > 0)) as T;
      }
      if (name === "close_scoped_checkout_intent") {
        attempts.get(String(body.p_generation)).resolved = true;
        return true as T;
      }
      throw new Error(`UNEXPECTED_RPC_${name}`);
    },
    stripe: async <T>(
      path: string,
      options: { method?: string; params?: URLSearchParams; idempotencyKey?: string } = {},
    ): Promise<T> => {
      if (path.startsWith("/prices/") && !options.method)
        return {
          id: params.gateway_price_id,
          object: "price",
          livemode: true,
          active: true,
          type: "recurring",
          currency: "egp",
          unit_amount: params.amount_minor,
          recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
          tax_behavior: "exclusive",
          metadata: { environment: "live" },
          product: {
            id: params.gateway_product_id,
            object: "product",
            livemode: true,
            active: true,
            metadata: { environment: "live" },
          },
        } as T;
      if (path === "/customers/cus_m05" && !options.method)
        return {
          id: "cus_m05",
          object: "customer",
          livemode: true,
          metadata: { user_id: actor.id, environment: "live" },
        } as T;
      if (path.startsWith("/subscriptions?") && !options.method)
        return { object: "list", data: [], has_more: false } as T;
      if (path === "/checkout/sessions" && options.method === "POST") {
        expect(options.params?.get("metadata[product_scope]")).toBe(scope);
        expect(options.params?.get("customer")).toBe("cus_m05");
        const key = options.idempotencyKey;
        if (!key) throw new Error("MISSING_PROVIDER_KEY");
        let session = sessions.get(key);
        if (!session) {
          // Model Stripe receiving the request after transport and queueing.
          const receivedAt = Math.floor(Date.now() / 1000) + 2;
          const remaining = Number(options.params!.get("expires_at")) - receivedAt;
          if (remaining < 1800 || remaining > 86400) {
            throw new Error("PROVIDER_CHECKOUT_EXPIRY_OUT_OF_RANGE");
          }
          session = {
            id: `cs_m05_${sessions.size + 1}`,
            object: "checkout.session",
            livemode: true,
            status: "open",
            url: `https://checkout.stripe.com/c/m05-${sessions.size + 1}`,
          };
          sessions.set(key, session);
        }
        session.customer = "cus_m05";
        session.client_reference_id = actor.id;
        session.metadata = {
          app: "masaarat",
          user_id: actor.id,
          environment: "live",
          product_scope: scope,
          checkout_generation: options.params!.get("metadata[checkout_generation]"),
        };
        session.expires_at = Number(options.params!.get("expires_at"));
        session.line_items = {
          has_more: false,
          data: [{ price: params.gateway_price_id, quantity: 1 }],
        };
        if (coded) {
          session.mode = "subscription";
          session.currency = "egp";
          session.metadata.offer_reservation_id = offer.id;
          session.amount_subtotal = 30900;
          session.amount_total = 27810;
          session.total_details = { amount_discount: 3090, amount_tax: 0 };
          session.discounts = [
            {
              promotion_code: {
                id: "promo_m05",
                object: "promotion_code",
                livemode: true,
                promotion: {
                  coupon: {
                    id: "coupon_m05",
                    object: "coupon",
                    livemode: true,
                    duration: "once",
                    duration_in_months: null,
                    percent_off: 10,
                    applies_to: { products: [params.gateway_product_id] },
                  },
                },
              },
            },
          ];
        }
        return session as T;
      }
      if (path.endsWith("/expire") && options.method === "POST") {
        const session = [...sessions.values()].find(
          (s) => path === `/checkout/sessions/${s.id}/expire`,
        );
        if (!session) throw new Error("UNKNOWN_SESSION");
        session.status = "expired";
        expired++;
        return session as T;
      }
      if (path.startsWith("/checkout/sessions/") && !options.method) {
        const session = [...sessions.values()].find((s) =>
          path.startsWith(`/checkout/sessions/${s.id}?`),
        );
        if (session) return session as T;
      }
      throw new Error(`UNEXPECTED_PROVIDER_${path}`);
    },
  };
  const checkout = () =>
    createLiveCheckout(
      actor,
      {
        product: scope,
        academicAssistant: true,
        billingInterval: "month",
        marketCode: "EG",
        ...(coded
          ? { offer: { code: "SYNTHETIC", key: "55555555-5555-4555-8555-555555555509" } }
          : {}),
      },
      "https://masaarat.ai",
      deps,
    );
  return { checkout, attempts, sessions, expired: () => expired, bound: () => bound };
}
afterEach(() => vi.useRealTimers());
describe("M05 actual scoped checkout ownership, synthetic provider and durable-intent model", () => {
  for (const scope of ["kids", "technical", "academic"] as const) {
    it(`${scope}: same-window retry reuses one still-open session`, async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-05T00:00:01Z"));
      const f = fixture(scope);
      const first = await f.checkout();
      const second = await f.checkout();
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.body.sessionId).toBe(first.body.sessionId);
      expect(f.sessions.size).toBe(1);
      expect(f.attempts.size).toBe(1);
      expect(f.expired()).toBe(0);
    });
    it(`${scope}: crossing a clock bucket cannot leave two payable sessions`, async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-05T00:00:01Z"));
      const f = fixture(scope);
      const first = await f.checkout();
      vi.setSystemTime(new Date("2026-11-05T00:05:02Z"));
      const second = await f.checkout();
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(
        [...f.sessions.values()].filter((s) => s.status === "open").map((s) => s.id),
      ).toHaveLength(1);
    });
  }
});

describe("M05 actual coded scoped caller", () => {
  for (const scope of ["kids", "technical", "academic"] as const) {
    it(`${scope}: creates a valid offer session after transport delay and reuses it`, async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-05T00:00:00Z"));
      const f = fixture(scope, true);
      const first = await f.checkout();
      vi.setSystemTime(new Date("2026-11-05T00:01:00Z"));
      const second = await f.checkout();
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(first.body.sessionId).toBe(second.body.sessionId);
      expect(f.attempts.size).toBe(1);
      expect(f.sessions.size).toBe(1);
      expect(f.bound()).toBe(2);
      expect([...f.attempts.values()][0].session_expires_at).toBe("2026-11-05T00:31:00.000Z");
    });
  }
  it("cannot return a URL after generation retirement during actual offer binding", async () => {
    const f = fixture("kids", true, true);
    const result = await f.checkout();
    expect(result.status).toBe(409);
    expect(result.body.error).toBe("CHECKOUT_INTENT_SUPERSEDED");
    expect(result.body).not.toHaveProperty("url");
    expect(f.bound()).toBe(1);
  });
});
