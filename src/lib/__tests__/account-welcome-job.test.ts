import { describe, expect, it, vi } from "vitest";
import {
  authorizedWelcomeJob,
  runWelcomeJob,
  welcomeContent,
} from "../../../supabase/functions/account-welcome-job/handler";
const claim = { user_id: "user-1", recipient: "confirmed@example.test", claim_token: "lease-1" };
function db() {
  return {
    rpc: vi.fn(async (name: string) => ({
      data: name === "claim_account_welcome_emails" ? [claim] : true,
      error: null,
    })),
  };
}
describe("transactional account welcome", () => {
  it("requires the dedicated service secret, not a client JWT", async () => {
    const secret = "x".repeat(48);
    expect(
      await authorizedWelcomeJob(
        new Request("https://example.test", { headers: { authorization: `Bearer ${secret}` } }),
        secret,
      ),
    ).toBe(true);
    expect(
      await authorizedWelcomeJob(
        new Request("https://example.test", { headers: { authorization: "Bearer user-jwt" } }),
        secret,
      ),
    ).toBe(false);
    expect(await authorizedWelcomeJob(new Request("https://example.test"), undefined)).toBe(false);
  });
  it("uses only the server-claimed recipient and immutable content on retry", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true, emailId: "provider-id" });
    const database = db();
    expect(await runWelcomeJob(database, send)).toEqual({ accepted: 1, deferred: 0 });
    expect(send).toHaveBeenCalledWith({
      to: claim.recipient,
      ...welcomeContent,
      idempotencyKey: "account-welcome-v1/user-1",
    });
    expect(database.rpc).toHaveBeenLastCalledWith("complete_account_welcome_email", {
      p_user: "user-1",
      p_claim: "lease-1",
      p_email_id: "provider-id",
      p_block: false,
    });
  });
  it("blocks permanent provider rejections", async () => {
    const database = db();
    await runWelcomeJob(database, vi.fn().mockResolvedValue({ ok: false, retryable: false }));
    expect(database.rpc).toHaveBeenLastCalledWith(
      "complete_account_welcome_email",
      expect.objectContaining({ p_block: true }),
    );
  });
  it("defers ambiguous network failures with the same provider key", async () => {
    const database = db();
    expect(await runWelcomeJob(database, vi.fn().mockRejectedValue(new Error("timeout")))).toEqual({
      accepted: 0,
      deferred: 1,
    });
    expect(database.rpc).toHaveBeenLastCalledWith(
      "complete_account_welcome_email",
      expect.objectContaining({ p_block: false, p_email_id: null }),
    );
  });
  it("fails closed on database claim or completion failures", async () => {
    const database = db();
    const send = vi.fn().mockResolvedValue({ ok: true, emailId: "id" });
    database.rpc.mockResolvedValueOnce({ data: null as never, error: "denied" as never });
    await expect(runWelcomeJob(database, send)).rejects.toThrow("welcome_claim_failed");
    expect(send).not.toHaveBeenCalled();
    database.rpc
      .mockResolvedValueOnce({ data: [claim], error: null })
      .mockResolvedValueOnce({ data: false as never, error: null });
    await expect(runWelcomeJob(database, send)).rejects.toThrow("welcome_record_failed");
  });
});
