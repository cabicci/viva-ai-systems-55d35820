// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { queueContactAcknowledgement } from "../contact-mail.server";
import { contactFormInputSchema } from "../contact-form";
const { rpc, dispatch } = vi.hoisted(() => ({ rpc: vi.fn(), dispatch: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));
vi.mock("../mail-dispatch.server", () => ({ dispatchImmediateMail: dispatch }));
const input = contactFormInputSchema.parse({
  firstName: "Visitor",
  lastName: "Name",
  email: "visitor@example.test",
  phone: "",
  countryCode: "EG",
  company: "",
  message: "Please contact me about the platform.",
  locale: "en",
  consentToProcess: true,
  turnstileToken: "test",
  pageUri: "https://masaarat.ai/contact",
});
const id = "7c1e0a52-3b6d-4f8e-9a21-c0a7ac700001";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CONTACT_MAIL_ENABLED", "false");
  vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", "true");
  rpc.mockImplementation(async (name) => ({
    error: null,
    data: name === "auth_signup_email_profile" ? [] : true,
  }));
  dispatch.mockResolvedValue({ accepted: 1, deferred: 0 });
});
afterEach(() => vi.unstubAllEnvs());
describe("server acknowledgement", () => {
  it("persists frozen content before dispatching only the submitted message", async () => {
    await queueContactAcknowledgement(input, id);
    expect(rpc.mock.calls.map((c) => c[0])).toEqual([
      "auth_signup_email_profile",
      "queue_contact_acknowledgement",
    ]);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ stream: "contact", id });
    expect(rpc.mock.invocationCallOrder[1]).toBeLessThan(dispatch.mock.invocationCallOrder[0]);
    expect(rpc).toHaveBeenCalledWith(
      "queue_contact_acknowledgement",
      expect.objectContaining({ p_id: id, p_recipient: input.email, p_locale: "en" }),
    );
  });
  it.each(["false", ""])("does nothing when the direct switch is %s", async (flag) => {
    vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", flag);
    await queueContactAcknowledgement(input, id);
    expect(rpc).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("cannot be reactivated through the retired switch", async () => {
    vi.stubEnv("CONTACT_MAIL_ENABLED", "true");
    vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", "false");
    await queueContactAcknowledgement(input, id);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("retains the queued retry if the immediate worker is unavailable", async () => {
    dispatch.mockRejectedValue(new Error("mail_dispatch_unavailable"));
    await expect(queueContactAcknowledgement(input, id)).rejects.toThrow(
      "mail_dispatch_unavailable",
    );
    expect(rpc).toHaveBeenCalledWith(
      "queue_contact_acknowledgement",
      expect.objectContaining({ p_id: id }),
    );
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it("uses saved account language and name before freezing the message", async () => {
    rpc.mockImplementation(async (name) => ({
      error: null,
      data:
        name === "auth_signup_email_profile"
          ? [{ full_name: "Saved Name", preferred_locale: "ar-EG" }]
          : true,
    }));
    await queueContactAcknowledgement(input, id);
    expect(rpc).toHaveBeenCalledWith(
      "queue_contact_acknowledgement",
      expect.objectContaining({ p_locale: "ar-EG", p_html: expect.stringContaining("Saved Name") }),
    );
  });
  it("does not dispatch when persistence fails", async () => {
    rpc.mockImplementation(async (name) => ({
      data: [],
      error: name === "queue_contact_acknowledgement" ? "failed" : null,
    }));
    await expect(queueContactAcknowledgement(input, id)).rejects.toThrow(
      "contact_mail_queue_failed",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });
});
