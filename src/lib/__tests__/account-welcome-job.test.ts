import { describe, expect, it, vi } from "vitest";
import {
  authorizedWelcomeJob,
  runWelcomeJob,
  runSubscriptionMailJob,
  legacyWelcomeContent,
} from "../../../supabase/functions/account-welcome-job/handler";
import {
  subscriptionContent,
  welcomeContent,
} from "../../../supabase/functions/_shared/masaarat-mail";
const claim = { user_id: "user-1", recipient: "confirmed@example.test", claim_token: "lease-1" };
function db() {
  return {
    rpc: vi.fn(async (name: string) => ({
      data: name === "claim_account_welcome_emails_v2" ? [claim] : true,
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
      ...legacyWelcomeContent,
      idempotencyKey: "account-welcome-v1/user-1",
    });
    expect(database.rpc).toHaveBeenLastCalledWith("complete_account_welcome_email", {
      p_user: "user-1",
      p_claim: "lease-1",
      p_email_id: "provider-id",
      p_block: false,
    });
  });
  it("personalizes the chosen locale without rendering a name as HTML", () => {
    const branded = welcomeContent("<img src=x onerror=alert(1)>", "en");
    expect(branded.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(branded.html).toContain('lang="en" dir="ltr"');
    expect(branded.html).toContain("/brand/masaarat-logo-lockup.png");
    expect(welcomeContent("خليل", "ar-Gulf").text).toContain("خليل");
    expect(welcomeContent("خليل", "unknown").html).toContain('lang="ar" dir="rtl"');
  });
  it("explains the learning paths and approved plan boundaries in the selected language", () => {
    const arabic = welcomeContent("خليل", "ar-MSA");
    const mixedName = welcomeContent("khalil wahi", "ar-MSA");
    expect(mixedName.html).toContain('<bdi dir="auto">khalil wahi</bdi>');
    expect(mixedName.html).toContain('background:#fdfefe');
    expect(mixedName.html).toContain('<table role="presentation" dir="rtl"');
    expect(arabic.html).toContain("الدرس الأول من كل مسار");
    expect(arabic.html).toContain("باستثناء مسار Builder (٧١ درسًا)");
    expect(arabic.html).toContain("بما فيها مسار Builder");
    expect(arabic.html).toContain("https://masaarat.ai/pricing");
    expect(arabic.text).toContain("دروس ومهام عملية");
    expect(arabic.html).toContain("https://masaarat.ai/dashboard");
    const english = welcomeContent("Khalil", "en");
    expect(english.html).toContain("Free: the introduction and first lesson of every path.");
    expect(english.html).toContain("Pro Plus: all 100 lessons, including Builder.");
    expect(subscriptionContent("pro", "activated", "Khalil", "en").html).not.toContain(
      "Choose your plan",
    );
  });
  it("keeps the subscription notice distinct from a payment receipt", () => {
    expect(subscriptionContent("pro_plus", "renewed", "Khalil", "en").text).toContain(
      "not a payment receipt",
    );
    const database = {
      rpc: vi.fn(async (name: string) => ({
        data:
          name === "claim_subscription_mail"
            ? [
                {
                  event_id: "event-1",
                  recipient: "buyer@example.test",
                  claim_token: "claim-1",
                  display_name: "Khalil",
                  preferred_locale: "en",
                  plan_key: "pro_plus",
                  kind: "activated",
                },
              ]
            : true,
        error: null,
      })),
    };
    return runSubscriptionMailJob(
      database,
      vi.fn().mockResolvedValue({ ok: true, emailId: "provider-1" }),
    ).then((stats) => {
      expect(stats).toEqual({ accepted: 1, deferred: 0 });
      expect(database.rpc).toHaveBeenLastCalledWith("complete_subscription_mail", {
        p_event: "event-1",
        p_claim: "claim-1",
        p_email_id: "provider-1",
        p_block: false,
      });
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
