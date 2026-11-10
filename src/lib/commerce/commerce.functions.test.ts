import { beforeEach, afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  rows: [] as Record<string, unknown>[],
  error: null as unknown,
  filters: [] as unknown[],
  enabled: true,
  mode: "live",
  flag: "true",
  gateFailure: false,
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (value: unknown) => value;
    const chain = {
      middleware: () => chain,
      validator: (fn: typeof validate) => {
        validate = fn;
        return chain;
      },
      handler: (fn: (input: any) => unknown) => (input: any) =>
        fn({ data: validate(input.data), context: input.context }),
    };
    return chain;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: { synthetic: true },
}));
vi.mock("@/lib/billing/live/runtime.server", () => ({
  liveRuntime: () => ({
    getEnv: (key: string) => (key === "STRIPE_BILLING_MODE" ? state.mode : state.flag),
    databaseLiveEnabled: async () => {
      if (state.gateFailure) throw new Error("Synthetic gate failure");
      return state.enabled;
    },
  }),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      expect(table).toBe("stripe_live_offer_mappings");
      let selected = state.rows;
      const chain = {
        select: (_columns: string) => chain,
        eq: (key: string, value: unknown) => {
          state.filters.push([key, value]);
          selected = selected.filter((row) => row[key] === value);
          return chain;
        },
        in: (key: string, values: unknown[]) => {
          state.filters.push([key, values]);
          selected = selected.filter((row) => values.includes(row[key]));
          return chain;
        },
        order: () => chain,
        limit: async (count: number) => ({ data: selected.slice(0, count), error: state.error }),
      };
      return chain;
    },
  },
}));
import { commerceCommand } from "./commerce.functions";
const quote = {
  original_minor: 19900,
  final_minor: 15920,
  currency: "EGP",
  offer_id: "synthetic-offer",
  offer_kind: "percent",
  phone_required: true,
};
function mapping(duration = "repeating", months: unknown = 3) {
  return {
    id: "synthetic-mapping",
    offer_id: "synthetic-offer",
    enabled: true,
    package: "kids",
    market_code: "EG",
    currency: "EGP",
    billing_interval: "month",
    duration,
    duration_in_months: months,
  };
}
const selection = { package: "kids", market: "EG", billing_interval: "month", code: "SYNTHETIC" };
function run(data: Record<string, unknown> = selection, action = "quote") {
  return (commerceCommand as any)({
    data: { action, data },
    context: { userId: "synthetic-verified-user", supabase: { rpc: state.rpc } },
  });
}
beforeEach(() => {
  state.rpc.mockReset().mockResolvedValue({ data: { ...quote }, error: null });
  state.rows = [mapping()];
  state.error = null;
  state.enabled = true;
  state.mode = "live";
  state.flag = "true";
  state.filters = [];
  state.gateFailure = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("NETWORK_FORBIDDEN");
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
it.each(["once", "repeating", "forever"])(
  "advertises the approved enabled %s subscription mapping without altering quote amounts",
  async (duration) => {
    state.rows = [mapping(duration, duration === "repeating" ? 3 : null)];
    expect(await run()).toEqual({ ...quote, live_stripe_available: true });
    expect(state.rpc).toHaveBeenCalledWith("commerce_command", {
      p_action: "quote",
      p_data: selection,
    });
  },
);
it.each([1, 1200])("accepts the approved repeating month boundary %s", async (months) => {
  state.rows = [mapping("repeating", months)];
  expect((await run()).live_stripe_available).toBe(true);
});
it.each([null, undefined, 0, -1, 1201, 1.5, "3", NaN])(
  "does not advertise invalid repeating months %s",
  async (months) => {
    state.rows = [{ ...mapping("repeating", months), duration_in_months: months }];
    expect((await run()).live_stripe_available).toBe(false);
  },
);
it.each(["once", "forever"])("refuses %s metadata that carries month counts", async (duration) => {
  state.rows = [mapping(duration, 3)];
  expect((await run()).live_stripe_available).toBe(false);
});
it.each(["month", "year"])(
  "permits an exactly matched USD %s subscription mapping",
  async (interval) => {
    state.rpc.mockResolvedValue({ data: { ...quote, currency: "USD" }, error: null });
    state.rows = [
      { ...mapping(), market_code: "INTL", currency: "USD", billing_interval: interval },
    ];
    expect(
      (await run({ ...selection, market: "INTL", billing_interval: interval }))
        .live_stripe_available,
    ).toBe(true);
    expect(state.filters).toContainEqual(["currency", "USD"]);
  },
);
it.each(["package", "market_code", "currency", "billing_interval", "offer_id", "enabled"])(
  "refuses a mismatched mapping %s",
  async (field) => {
    state.rows = [{ ...mapping("once", null), [field]: field === "enabled" ? false : "different" }];
    expect((await run()).live_stripe_available).toBe(false);
  },
);
it("refuses a mismatched quote currency before advertising a rail", async () => {
  state.rpc.mockResolvedValue({ data: { ...quote, currency: "USD" }, error: null });
  expect((await run()).live_stripe_available).toBe(false);
});
it.each(["repeating", "forever"])(
  "does not offer Stripe for an established manual %s renewal",
  async (duration) => {
    state.rows = [mapping(duration, duration === "repeating" ? 3 : null)];
    state.rpc.mockResolvedValue({ data: { ...quote, term_renewal: true }, error: null });
    expect(await run({ ...selection, renewal: true })).toEqual({
      ...quote,
      term_renewal: true,
      live_stripe_available: false,
    });
    expect(state.filters).toEqual([]);
  },
);
it.each(["environment", "flag", "database"])("keeps the existing %s live gate", async (gate) => {
  if (gate === "environment") state.mode = "test";
  if (gate === "flag") state.flag = "false";
  if (gate === "database") state.enabled = false;
  expect((await run()).live_stripe_available).toBe(false);
});
it("does not turn the Academic assistant selector into a mapped rail", async () => {
  state.rows = [{ ...mapping(), package: "academic" }];
  expect(
    (await run({ ...selection, package: "academic", academicAssistant: true }))
      .live_stripe_available,
  ).toBe(false);
});
it("preserves the existing manual quote if the Live gate cannot be read", async () => {
  state.gateFailure = true;
  expect(await run()).toEqual({ ...quote, live_stripe_available: false });
  expect(state.filters).toEqual([]);
});
it("does not convert a failed mapping read into availability", async () => {
  state.error = { message: "synthetic unavailable" };
  expect((await run()).live_stripe_available).toBe(false);
});
it("reports availability for the server-selected automatic Kids discount without a mapping read", async () => {
  const automatic = {
    original_minor: 19900,
    final_minor: 17910,
    currency: "EGP",
    automatic_discount: true,
    phone_required: false,
  };
  state.rpc.mockResolvedValue({ data: automatic, error: null });
  expect(await run()).toEqual({ ...automatic, live_stripe_available: true });
  expect(state.filters).toEqual([]);
  state.mode = "test";
  expect(await run()).toEqual({ ...automatic, live_stripe_available: false });
  expect(await run({ ...selection, code: "" })).toEqual(automatic);
});
it.each(["COMMERCE_OFFER_LIMIT", "COMMERCE_OFFER_INELIGIBLE", "COMMERCE_OFFER_ALREADY_USED"])(
  "preserves authoritative refusal %s without checking a provider mapping",
  async (error) => {
    state.rpc.mockResolvedValue({ data: null, error: { message: error } });
    await expect(run()).rejects.toThrow(error);
    expect(state.filters).toEqual([]);
  },
);
it("decorates an explicitly scoped EGP one-time topup mapping", async () => {
  state.rows = [
    { ...mapping("once", null), package: "question_topup", billing_interval: "one_time" },
  ];
  expect(
    (
      await run(
        { kind: "question_topup", wallet_scope: "account", code: "SYNTHETIC" },
        "one_time_quote",
      )
    ).live_stripe_available,
  ).toBe(true);
});
it.each(["repeating", "forever", "subscription", "USD"])(
  "does not advertise an incompatible topup %s mapping",
  async (invalid) => {
    const row = {
      ...mapping("once", null),
      package: "question_topup",
      billing_interval: "one_time",
    };
    if (invalid === "subscription") row.package = "kids";
    else if (invalid === "USD") row.currency = "USD";
    else {
      row.duration = invalid;
      row.duration_in_months = invalid === "repeating" ? 3 : null;
    }
    state.rows = [row];
    expect(
      (
        await run(
          { kind: "question_topup", wallet_scope: "family", code: "SYNTHETIC" },
          "one_time_quote",
        )
      ).live_stripe_available,
    ).toBe(false);
  },
);
it("leaves the lifetime no-coupon quote unchanged", async () => {
  const lifetime = {
    original_minor: 7500,
    final_minor: 7500,
    currency: "EGP",
    kind: "lifetime_course",
  };
  state.rpc.mockResolvedValue({ data: lifetime, error: null });
  expect(
    await run(
      { kind: "lifetime_course", wallet_scope: "account", area: "ai", course: "ai" },
      "one_time_quote",
    ),
  ).toEqual(lifetime);
});

it.each(["invitation", "accept"])(
  "rejects a stale account for %s before reading or mutating the invitation",
  async (action) => {
    const request = {
      action,
      expectedAccountId: "11111111-1111-4111-8111-111111111111",
      data: { id: "22222222-2222-4222-8222-222222222222" },
    };
    const invoke = commerceCommand as unknown as (input: {
      data: typeof request;
      context: { userId: string; supabase: { rpc: typeof state.rpc } };
    }) => Promise<unknown>;
    const supabase = { rpc: state.rpc };
    await expect(
      invoke({ data: request, context: { userId: request.data.id, supabase } }),
    ).rejects.toThrow("ACCOUNT_CHANGED");
    expect(state.rpc).not.toHaveBeenCalled();
    await invoke({ data: request, context: { userId: request.expectedAccountId, supabase } });
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith("commerce_command", {
      p_action: action,
      p_data: request.data,
    });
  },
);
