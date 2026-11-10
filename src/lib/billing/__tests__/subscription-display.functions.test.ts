import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rpc: vi.fn(), portal: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      validator: () => builder,
      inputValidator: () => builder,
      handler: (handler: unknown) => handler,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: state.portal } }));
import { getAccountSubscriptions } from "../subscription-display.functions";
import { getAdminOverview, type AdminOverview } from "../../admin.functions";

const owner = "d0200000-0000-4000-8000-000000000001";
const invoke = getAccountSubscriptions as unknown as (input: {
  data: { expectedAccountId: string };
  context: { userId: string; supabase: { rpc: typeof state.rpc } };
}) => Promise<{ sources: { portalScope: string | null }[] }>;
const call = (expectedAccountId = owner) =>
  invoke({ data: { expectedAccountId }, context: { userId: owner, supabase: { rpc: state.rpc } } });
const snapshot = (actorUserId = owner) => ({
  actorUserId,
  serverTime: new Date().toISOString(),
  sources: [],
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_BILLING_MODE", "live");
  vi.stubEnv("STRIPE_LIVE_ENABLED", "true");
});
afterEach(() => vi.unstubAllEnvs());
const invokeAdmin = getAdminOverview as unknown as (input: {
  context: { userId: string; supabase: { rpc: typeof state.rpc } };
}) => Promise<AdminOverview>;
const callAdmin = () => invokeAdmin({ context: { userId: owner, supabase: { rpc: state.rpc } } });
const emptySummary = {
  activePaidAccounts: 0,
  activePaidSources: 0,
  activeInvitationSources: 0,
  activeGrantSources: 0,
  activeLifetimeSources: 0,
  byArea: {},
  byKind: {},
};
describe("actual admin handler with SQL-shaped subscription responses", () => {
  it.each([
    {
      ...emptySummary,
      activePaidAccounts: 1,
      activePaidSources: 3,
      byArea: { ai: { accounts: 1, sources: 2 }, kids: { accounts: 1, sources: 1 } },
    },
    emptySummary,
  ])(
    "preserves sparse/empty summaries through authentication and schema parsing %#",
    async (summary) => {
      const serverTime = new Date().toISOString();
      state.rpc.mockImplementation(async (name, args) => {
        if (name === "has_role") return { data: true, error: null };
        if (name === "commerce_command" && args.p_action === "admin_subscription_display")
          return { data: { actorUserId: owner, serverTime, summary }, error: null };
        if (name === "get_admin_overview")
          return { data: { total_users: 7, pro_users: 999 }, error: null };
        throw new Error("Unexpected RPC");
      });
      const result = await callAdmin();
      expect(result.subscriptionSnapshot).toEqual({ actorUserId: owner, serverTime, summary });
      expect(result.totalUsers).toBe(7);
      expect(result).not.toHaveProperty("pro_users");
      expect(state.rpc.mock.calls).toEqual([
        ["has_role", { _user_id: owner, _role: "admin" }],
        ["get_admin_overview"],
        ["commerce_command", { p_action: "admin_subscription_display", p_data: {} }],
      ]);
    },
  );
  it.each([
    { actorUserId: owner, summary: { ...emptySummary, byKind: { unexpected: 1 } } },
    {
      actorUserId: owner,
      summary: { ...emptySummary, byArea: { ai: { accounts: -1, sources: 1 } } },
    },
    { actorUserId: owner.replace(/1$/, "2"), summary: emptySummary },
  ])(
    "suppresses invalid aggregates or another actor while keeping other statistics %#",
    async (response) => {
      state.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: { total_users: 7 }, error: null })
        .mockResolvedValueOnce({
          data: { serverTime: new Date().toISOString(), ...response },
          error: null,
        });
      expect(await callAdmin()).toMatchObject({ totalUsers: 7, subscriptionSnapshot: null });
      expect(state.rpc).toHaveBeenCalledTimes(3);
    },
  );
  it("still rejects a non-admin before reading summaries", async () => {
    state.rpc.mockResolvedValue({ data: false, error: null });
    await expect(callAdmin()).rejects.toThrow("Forbidden: admin role required");
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
});
describe("authenticated subscription display server boundary", () => {
  it("rejects a changed account before any read", async () => {
    await expect(call(owner.replace(/1$/, "2"))).rejects.toThrow("ACCOUNT_CHANGED");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("calls only the implemented read action and preserves an empty success", async () => {
    state.rpc.mockResolvedValue({ data: snapshot(), error: null });
    expect((await call()).sources).toEqual([]);
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith("commerce_command", {
      p_action: "account_subscription_display",
      p_data: {},
    });
    expect(state.portal).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: {} },
    { data: {}, error: null },
    { data: { ...snapshot(), sources: null }, error: null },
  ])("fails truthful on malformed or failed read %#", async (response) => {
    state.rpc.mockResolvedValue(response);
    await expect(call()).rejects.toThrow("SUBSCRIPTIONS_UNAVAILABLE");
  });
  it("checks the response actor rather than trusting request ownership alone", async () => {
    state.rpc.mockResolvedValue({ data: snapshot(owner.replace(/1$/, "2")), error: null });
    await expect(call()).rejects.toThrow("ACCOUNT_CHANGED");
  });
  it.each(["live", "test", "unavailable"])(
    "uses existing portal environment contract: %s",
    async (environment) => {
      state.rpc.mockResolvedValue({
        error: null,
        data: {
          ...snapshot(),
          sources: [
            {
              sourceKey: "a".repeat(32),
              kind: "core_subscription",
              area: "ai",
              product: "pro",
              targets: ["ai"],
              beneficiary: null,
              sourceStatus: "paid_active",
              startsAt: null,
              accessUntil: null,
              isLifetime: false,
              paid: true,
              eligible: true,
              cancelAtPeriodEnd: false,
              paymentMethod: "stripe_us_live",
              paymentEnvironment: "live",
              portalScope: "core",
              termsUntil: null,
            },
          ],
        },
      });
      vi.stubEnv("STRIPE_LIVE_ENABLED", "false");
      state.portal.mockResolvedValue({ error: null, data: environment });
      expect((await call()).sources[0].portalScope).toBe(environment === "live" ? "core" : null);
      expect(state.portal).toHaveBeenCalledExactlyOnceWith("get_stripe_portal_environment", {
        p_user_id: owner,
        p_scope: "core",
      });
    },
  );
});
