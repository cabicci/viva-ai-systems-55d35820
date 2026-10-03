// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { attemptAccountWelcome } from "../account-welcome.server";
import { requestAccountWelcome } from "../account-welcome.functions";
const { dispatch, actor } = vi.hoisted(() => ({ dispatch: vi.fn(), actor: vi.fn() }));
vi.mock("../mail-dispatch.server", () => ({ dispatchImmediateMail: dispatch }));
vi.mock("@/lib/ssr-request-auth.server", () => ({ resolveVerifiedRequestUser: actor }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ handler: (fn: unknown) => fn }),
}));
const userId = "b08ff00f-e77a-4489-925f-8336d814a750";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ACCOUNT_WELCOME_ENABLED", "true");
  actor.mockResolvedValue({ userId });
  dispatch.mockResolvedValue({ accepted: 1, deferred: 0 });
});
afterEach(() => vi.unstubAllEnvs());
describe("immediate welcome server", () => {
  it("dispatches only the verified request actor, ignoring browser identity or recipient", async () => {
    await requestAccountWelcome({
      data: { userId: "victim", email: "attacker@example.test" },
    } as never);
    expect(actor).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ stream: "welcome", id: userId });
  });
  it("does not dispatch for an unverified request", async () => {
    actor.mockResolvedValue(null);
    await requestAccountWelcome();
    expect(dispatch).not.toHaveBeenCalled();
  });
  it.each(["false", ""])("respects the existing welcome flag (%s)", async (flag) => {
    vi.stubEnv("ACCOUNT_WELCOME_ENABLED", flag);
    await attemptAccountWelcome(userId);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("allows an already-completed welcome to return without another send", async () => {
    dispatch.mockResolvedValue({ accepted: 0, deferred: 0 });
    expect(await requestAccountWelcome()).toBeNull();
  });
  it("preserves worker failure for the existing retry without making a second transport attempt", async () => {
    dispatch.mockRejectedValue(new Error("mail_dispatch_deferred"));
    await expect(attemptAccountWelcome(userId)).rejects.toThrow("mail_dispatch_deferred");
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
