// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  contactWithdrawalInput,
  contactAdministrationSnapshot,
  contactManualClosureInput,
} from "../contact-automation-admin";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), role: vi.fn(), current: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (fn: unknown) => fn,
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () =>
    new Request("https://example.test", {
      headers: { authorization: "Bearer synthetic-user-token" },
    }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("../mail-dispatch.server", () => ({ dispatchContactAdministration: mock.rpc }));
import {
  getContactAutomationAdministration,
  withdrawContactProcessing,
} from "../contact-automation-admin.functions";
const actor = "11111111-1111-4111-8111-111111111111",
  requestId = "22222222-2222-4222-8222-222222222222";
const context = { userId: actor, supabase: { rpc: mock.role, auth: { getUser: mock.current } } };
const snapshot = {
  ownerConfigured: true,
  total: 0,
  recent: [],
  counts: {
    awaitingOwner: 0,
    ownerReconciliation: 0,
    retryWindowExpired: 0,
    messageWindowExpired: 0,
    intakeReconciliation: 0,
    inFlight: 0,
    withdrawn: 0,
  },
};
type Handler = (args: {
  context: typeof context;
  data: { requestId?: string };
}) => Promise<unknown>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CONTACT_AUTOMATION_OWNER_EMAIL", "owner@example.test");
  mock.role.mockResolvedValue({ data: true, error: null });
  mock.current.mockResolvedValue({ data: { user: { id: actor } }, error: null });
  mock.rpc.mockResolvedValue(snapshot);
});
afterEach(() => vi.unstubAllEnvs());
describe("actual contact administration authorization", () => {
  it.each(["createdAt", "dueAt", "withdrawnAt"] as const)(
    "rejects malformed ISO %s before date rendering",
    (field) => {
      const row = {
        id: requestId,
        recipientMasked: "***@example.test",
        locale: "en",
        stream: "support",
        createdAt: "2026-11-08T09:00:00+02:00",
        dueAt: null,
        withdrawnAt: null,
        ackState: "pending",
        followupState: "pending",
        inFlight: false,
      };
      expect(contactAdministrationSnapshot.safeParse({ ...snapshot, recent: [row] }).success).toBe(
        true,
      );
      for (const value of [
        "not-a-date",
        "2026-99-99T09:00:00Z",
        "2026-11-08",
        "2026-02-30T09:00:00Z",
      ])
        expect(
          contactAdministrationSnapshot.safeParse({
            ...snapshot,
            recent: [{ ...row, [field]: value }],
          }).success,
        ).toBe(false);
    },
  );
  it.each([false, null])("denies non-admin role %s before service access", async (value) => {
    mock.role.mockResolvedValue({ data: value, error: null });
    await expect(
      (withdrawContactProcessing as unknown as Handler)({ context, data: { requestId } }),
    ).rejects.toThrow("admin role required");
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it.each([null, { id: "another-account" }])(
    "requires a current matching getUser session",
    async (user) => {
      mock.current.mockResolvedValue({ data: { user }, error: null });
      await expect(
        (getContactAutomationAdministration as unknown as Handler)({ context, data: {} }),
      ).rejects.toThrow("CONTACT_ACCOUNT_UNAVAILABLE");
      expect(mock.rpc).not.toHaveBeenCalled();
    },
  );
  it("uses the verified actor and server owner address, not client identity", async () => {
    await (withdrawContactProcessing as unknown as Handler)({ context, data: { requestId } });
    expect(mock.rpc).toHaveBeenCalledExactlyOnceWith(
      {
        actor,
        action: "withdraw",
        id: requestId,
        reference: null,
      },
      "Bearer synthetic-user-token",
    );
    expect(contactWithdrawalInput.safeParse({ requestId, p_actor: "spoofed" }).success).toBe(false);
  });
  it("returns only parsed minimal status and hides provider/database errors", async () => {
    expect(
      await (getContactAutomationAdministration as unknown as Handler)({ context, data: {} }),
    ).toEqual(snapshot);
    mock.rpc.mockRejectedValue(new Error("private worker detail"));
    await expect(
      (getContactAutomationAdministration as unknown as Handler)({ context, data: {} }),
    ).rejects.toThrow("CONTACT_ADMIN_UNAVAILABLE");
  });
});
