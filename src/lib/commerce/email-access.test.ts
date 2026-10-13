import { describe, expect, it, vi } from "vitest";
import { emailAccessInput, emailAccessCopy } from "./email-access";
import { runEmailAccessMailJob } from "../../../supabase/functions/_shared/email-access-mail-worker";
import { emailAccessInvitationContent } from "../../../supabase/functions/_shared/masaarat-mail";
import { isImmediateMailTarget } from "../../../supabase/functions/_shared/immediate-mail-request";
const id = "00000000-0000-4000-8000-000000000001";
describe("email access contracts and isolated invitation delivery", () => {
  it("encodes the stored recipient into the signup link without treating it as authority", () => {
    const content = emailAccessInvitationContent({
      locale: "ar-Gulf",
      scope_mode: "all_published",
      catalogues: [],
      duration_days: 30,
      recipient_email: "Invited+one@example.test",
    });
    const doc = new DOMParser().parseFromString(content.html, "text/html");
    const links = [...doc.querySelectorAll("a")].map((link) => new URL(link.href));
    const signup = links.find((link) => link.pathname === "/signup")!;
    expect(signup.searchParams.get("email")).toBe("Invited+one@example.test");
    expect(signup.searchParams.get("locale")).toBe("ar-Gulf");
    expect([...signup.searchParams.keys()]).toEqual(["locale", "email"]);
    expect(content.html).not.toContain("https://masaarat.ai/login");
  });
  it("validates scopes, permanent access, duration and rejects user/role injection", () => {
    const data = {
      email: "future@example.test",
      scope_mode: "all_published",
      catalogues: [],
      duration_days: null,
      invitation: false,
      locale: "en",
      key: id,
    };
    expect(emailAccessInput.parse({ action: "create", data }).data).toEqual(data);
    for (const change of [
      { user_id: id },
      { role: "admin" },
      { duration_days: 0 },
      { scope_mode: "selected" },
      { catalogues: ["kids"] },
    ])
      expect(() =>
        emailAccessInput.parse({ action: "create", data: { ...data, ...change } }),
      ).toThrow();
    expect(isImmediateMailTarget({ stream: "email_access", id })).toBe(true);
    expect(
      isImmediateMailTarget({ stream: "email_access", id, email: "attacker@example.test" }),
    ).toBe(false);
  });
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "provides invitation and admin copy for %s, with no claim token/payment/coupon",
    (locale) => {
      expect(emailAccessCopy(locale).pending_registration).toBeTruthy();
      const content = emailAccessInvitationContent({
        locale,
        scope_mode: "all_published",
        catalogues: [],
        duration_days: 30,
      });
      expect(content.html).toContain(`https://masaarat.ai/signup?locale=${locale}`);
      expect(content.html).toContain(locale === "en" ? 'dir="ltr"' : 'dir="rtl"');
      expect(content.html).toContain("Kids");
      const permanent = emailAccessInvitationContent({
        locale,
        scope_mode: "selected",
        catalogues: ["<script>"],
        duration_days: null,
      });
      expect(permanent.html).not.toContain("<script>");
      expect(permanent.html).toContain("&lt;script&gt;");
    },
  );
  it("targets only a stored opt-in invitation and persists delivery outcome with stable provider key", async () => {
    const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => ({
      error: null,
      data:
        args.p_action === "claim"
          ? [
              {
                id,
                claim_token: id,
                recipient: "synthetic@example.test",
                payload: {
                  locale: "en",
                  scope_mode: "all_published",
                  catalogues: [],
                  duration_days: 30,
                },
              },
            ]
          : true,
    }));
    const send = vi.fn(async (_message: unknown) => ({
      ok: true as const,
      emailId: "fake-provider-id",
    }));
    expect(await runEmailAccessMailJob({ rpc }, send, id)).toEqual({ accepted: 1, deferred: 0 });
    expect(rpc.mock.calls[0]).toEqual(["email_access_mail", { p_action: "claim", p_data: { id } }]);
    expect(send.mock.calls[0]).toHaveLength(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "synthetic@example.test",
        idempotencyKey: "email-access/" + id,
      }),
    );
    expect(send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        text: expect.stringContaining("email=synthetic%40example.test"),
      }),
    );
    expect(rpc).toHaveBeenLastCalledWith(
      "email_access_mail",
      expect.objectContaining({
        p_action: "result",
        p_data: expect.objectContaining({ provider_id: "fake-provider-id" }),
      }),
    );
  });
  it("never sends mismatched or revoked grants; retains unknown provider outcome for bounded retry", async () => {
    const stored = {
      id,
      claim_token: id,
      recipient: "synthetic@example.test",
      payload: { locale: "en", scope_mode: "selected", catalogues: ["kids"], duration_days: null },
    };
    const send = vi.fn(async () => {
      throw Error("uncertain");
    });
    const mismatch = {
      rpc: vi.fn(async () => ({ error: null, data: [{ ...stored, id: "different" }] })),
    };
    await expect(runEmailAccessMailJob(mismatch, send, id)).rejects.toThrow("target_mismatch");
    expect(send).not.toHaveBeenCalled();
    const rpc = vi.fn(async (_: string, args: Record<string, unknown>) => ({
      error: null,
      data: args.p_action === "claim" ? [stored] : args.p_action !== "authorize_attempt",
    }));
    expect(await runEmailAccessMailJob({ rpc }, send, id)).toEqual({ accepted: 0, deferred: 1 });
    expect(send).not.toHaveBeenCalled();
    rpc.mockImplementation(async (_: string, args: Record<string, unknown>) => ({
      error: null,
      data: args.p_action === "claim" ? [stored] : true,
    }));
    expect(await runEmailAccessMailJob({ rpc }, send, id)).toEqual({ accepted: 0, deferred: 1 });
    expect(rpc).toHaveBeenLastCalledWith(
      "email_access_mail",
      expect.objectContaining({
        p_action: "result",
        p_data: expect.objectContaining({ provider_id: null, retryable: true }),
      }),
    );
  });
});
