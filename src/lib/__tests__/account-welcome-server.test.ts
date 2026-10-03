// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { attemptAccountWelcome } from "../account-welcome.server";
import { requestAccountWelcome } from "../account-welcome.functions";
const { rpc, send, actor } = vi.hoisted(() => ({ rpc: vi.fn(), send: vi.fn(), actor: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));
vi.mock("../../../supabase/functions/_shared/resend", () => ({ sendTransactionalEmail: send }));
vi.mock("@/lib/ssr-request-auth.server", () => ({ resolveVerifiedRequestUser: actor }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ handler: (fn: unknown) => fn }),
}));
const claim = {
  user_id: "verified-user",
  recipient: "confirmed@example.test",
  claim_token: "lease-1",
  template_version: 2,
  display_name: "Saved Name",
  preferred_locale: "en",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ACCOUNT_WELCOME_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "synthetic-test-only");
  vi.stubEnv("RESEND_FROM_EMAIL", "notifications@mail.masaarat.ai");
  vi.stubEnv("RESEND_REPLY_TO_EMAIL", "info@masaarat.ai");
  actor.mockResolvedValue({ userId: claim.user_id });
  rpc.mockImplementation(async (name) => ({
    error: null,
    data: name === "claim_account_welcome_email" ? [claim] : true,
  }));
  send.mockResolvedValue({ ok: true, emailId: "provider-id" });
});
afterEach(() => vi.unstubAllEnvs());
describe("immediate welcome server", () => {
  it("derives the target from verified request identity and reuses stored localized content", async () => {
    // Extra browser input has no recipient/identity authority.
    await requestAccountWelcome({
      data: { userId: "victim", email: "attacker@example.test" },
    } as never);
    expect(actor).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenNthCalledWith(1, "claim_account_welcome_email", {
      p_user: "verified-user",
    });
    expect(send).toHaveBeenCalledWith(
      {
        apiKey: "synthetic-test-only",
        from: "notifications@mail.masaarat.ai",
        replyTo: "info@masaarat.ai",
        enabled: true,
      },
      expect.objectContaining({
        to: claim.recipient,
        idempotencyKey: "account-welcome-v2/verified-user",
        subject: "Welcome to Masaarat",
      }),
    );
    expect(send.mock.calls[0][1].html).toContain("Saved Name");
  });
  it("does not access the service client or send for an unverified request", async () => {
    actor.mockResolvedValue(null);
    await requestAccountWelcome();
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["false", ""])("respects the existing welcome flag (%s)", async (flag) => {
    vi.stubEnv("ACCOUNT_WELCOME_ENABLED", flag);
    await attemptAccountWelcome(claim.user_id);
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["RESEND_API_KEY", "RESEND_FROM_EMAIL"])(
    "keeps the retry untouched when %s is missing",
    async (name) => {
      vi.stubEnv(name, "");
      await expect(attemptAccountWelcome(claim.user_id)).rejects.toThrow(
        "welcome_transport_unconfigured",
      );
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it("does not resend a completed welcome", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await requestAccountWelcome();
    expect(send).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("retains a retry after a provider timeout with the existing idempotency key", async () => {
    send.mockRejectedValue(new Error("timeout"));
    expect(await attemptAccountWelcome(claim.user_id)).toEqual({ accepted: 0, deferred: 1 });
    expect(rpc).toHaveBeenLastCalledWith("complete_account_welcome_email", {
      p_user: claim.user_id,
      p_claim: claim.claim_token,
      p_email_id: null,
      p_block: false,
    });
  });
});
