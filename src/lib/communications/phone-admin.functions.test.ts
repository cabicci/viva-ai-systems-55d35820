// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { phoneAdminInput, phoneAdminSnapshot } from "./phone-admin";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  role: vi.fn(),
  current: vi.fn(),
  validate: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: unknown) => {
        mocks.validate(fn);
        return builder;
      },
      handler: (fn: unknown) => fn,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
import { configurePhoneAdministration, getPhoneAdministration } from "./phone-admin.functions";
const actor = "11111111-1111-4111-8111-111111111111";
const context = { userId: actor, supabase: { rpc: mocks.role, auth: { getUser: mocks.current } } };
const settings = { revision: 0, enabled: false, channels: ["sms"], dailyCap: 20, testUsers: [] };
const snapshot = { ...settings, sentToday: 0, verifiedAccounts: 0, recent: [] };
type Handler = (arg: { context: typeof context; data?: unknown }) => Promise<unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.role.mockResolvedValue({ data: true, error: null });
  mocks.current.mockResolvedValue({ data: { user: { id: actor } }, error: null });
  mocks.rpc.mockResolvedValue({ data: snapshot, error: null });
});
describe("phone administration authorization", () => {
  it.each([false, null])("denies role %s before privileged reads", async (role) => {
    mocks.role.mockResolvedValue({ data: role, error: null });
    await expect((getPhoneAdministration as unknown as Handler)({ context })).rejects.toThrow(
      "admin role required",
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([null, { id: "another-actor" }])(
    "denies an absent or changed current session",
    async (user) => {
      mocks.current.mockResolvedValue({ data: { user }, error: null });
      await expect((getPhoneAdministration as unknown as Handler)({ context })).rejects.toThrow(
        "PHONE_ACCOUNT_UNAVAILABLE",
      );
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("uses the verified actor and returns validated status", async () => {
    expect(await (getPhoneAdministration as unknown as Handler)({ context })).toEqual(snapshot);
    expect(mocks.rpc).toHaveBeenCalledWith("admin_account_phone_command", {
      p_actor: actor,
      p_action: "status",
      p_data: {},
    });
  });
  it("passes revision and exact approved settings to the server", async () => {
    await (configurePhoneAdministration as unknown as Handler)({ context, data: settings });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_account_phone_command", {
      p_actor: actor,
      p_action: "configure",
      p_data: settings,
    });
  });
  it("reports an edit conflict without retrying or overwriting", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "PHONE_CONTROL_CONFLICT" } });
    await expect(
      (configurePhoneAdministration as unknown as Handler)({ context, data: settings }),
    ).rejects.toThrow("PHONE_CONTROL_CONFLICT");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("redacts database error details", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "private provider detail" } });
    await expect((getPhoneAdministration as unknown as Handler)({ context })).rejects.toThrow(
      "PHONE_ADMIN_UNAVAILABLE",
    );
  });
});

describe("phone administration input", () => {
  it.each([
    { dailyCap: 0 },
    { dailyCap: 101 },
    { dailyCap: 1.5 },
    { revision: -1 },
    { revision: 2_147_483_648 },
    { channels: [] },
    { channels: ["email"] },
    { channels: ["sms", "sms"] },
    { testUsers: [actor, actor] },
    { testUsers: ["invalid"] },
    { actor: "spoofed" },
  ])("rejects invalid configuration %j", (change) => {
    expect(phoneAdminInput.safeParse({ ...settings, ...change }).success).toBe(false);
  });
  it("rejects a malformed provider response", () => {
    expect(
      phoneAdminSnapshot.safeParse({
        ...snapshot,
        recent: [
          {
            id: actor,
            channel: "sms",
            phoneTail: "+201012345678",
            state: "verified",
            createdAt: new Date().toISOString(),
          },
        ],
      }).success,
    ).toBe(false);
  });
});
