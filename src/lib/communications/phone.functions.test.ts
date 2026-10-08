// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  load: vi.fn(),
  begin: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const b = { middleware: () => b, validator: () => b, handler: (handler: unknown) => handler };
    return b;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
vi.mock("./phone.server", () => ({
  loadAccountPhone: mocks.load,
  beginAccountPhone: mocks.begin,
  confirmAccountPhone: mocks.confirm,
}));
import { getAccountPhone, sendAccountPhoneCode } from "./phone.functions";
type Handler = (arg: { context: unknown; data?: unknown }) => Promise<unknown>;
const context = { userId: "trusted-actor", supabase: { auth: { getUser: mocks.getUser } } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "trusted-actor", email_confirmed_at: "confirmed" } },
    error: null,
  });
  mocks.rpc.mockResolvedValue({
    data: { enabled: false, phone: null, verifiedAt: null },
    error: null,
  });
});
describe("phone server endpoint authority", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "uses the saved registration language %s for both channels, even on a different page locale",
    async (locale) => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: {
            id: "trusted-actor",
            email_confirmed_at: "confirmed",
            user_metadata: { preferred_locale: locale },
          },
        },
        error: null,
      });
      for (const channel of ["whatsapp", "sms"]) {
        const input = { phone: "+201012345678", channel, locale: locale === "en" ? "ar-EG" : "en" };
        await (sendAccountPhoneCode as unknown as Handler)({ context, data: input });
        expect(mocks.begin).toHaveBeenLastCalledWith(
          { ...input, locale },
          expect.any(Function),
          process.env,
        );
      }
    },
  );
  it.each([undefined, "fr", null])(
    "uses the explicit page language for a legacy account without a valid saved language %s",
    async (locale) => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: {
            id: "trusted-actor",
            email_confirmed_at: "confirmed",
            user_metadata: { preferred_locale: locale },
          },
        },
        error: null,
      });
      const input = { phone: "+201012345678", channel: "whatsapp", locale: "ar-Gulf" };
      await (sendAccountPhoneCode as unknown as Handler)({ context, data: input });
      expect(mocks.begin).toHaveBeenLastCalledWith(input, expect.any(Function), process.env);
    },
  );
  it.each([null, { id: "different-actor", email_confirmed_at: "confirmed" }])(
    "rejects missing/current-account mismatch %j",
    async (user) => {
      mocks.getUser.mockResolvedValue({ data: { user }, error: null });
      await expect((getAccountPhone as unknown as Handler)({ context })).rejects.toThrow(
        "PHONE_ACCOUNT_UNAVAILABLE",
      );
      expect(mocks.rpc).not.toHaveBeenCalled();
      expect(mocks.load).not.toHaveBeenCalled();
    },
  );
  it("uses current Auth email confirmation, not JWT metadata", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "trusted-actor" } }, error: null });
    await expect(
      (getAccountPhone as unknown as Handler)({
        context: { ...context, claims: { email_verified: true } },
      }),
    ).rejects.toThrow("EMAIL_CONFIRMATION_REQUIRED");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("derives every storage actor from the verified session", async () => {
    mocks.load.mockImplementation((db) => db("status"));
    await (getAccountPhone as unknown as Handler)({ context });
    expect(mocks.rpc).toHaveBeenCalledWith("account_phone_command", {
      p_actor: "trusted-actor",
      p_action: "status",
      p_data: {},
    });
  });
  it("passes only the authenticated actor to the reservation boundary and redacts DB detail", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "PHONE_LIMIT: confidential-phone/provider-text" },
    });
    mocks.begin.mockImplementation(async (_data, db) => {
      try {
        await db("reserve", { phone: "synthetic" });
      } catch (e) {
        return (e as Error).message;
      }
    });
    expect(
      await (sendAccountPhoneCode as unknown as Handler)({
        context,
        data: { phone: "synthetic", locale: "en" },
      }),
    ).toBe("PHONE_LIMIT");
    expect(mocks.rpc.mock.calls[0][1].p_actor).toBe("trusted-actor");
  });
});
