// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { queueContactAcknowledgement } from "../contact-mail.server";
import { contactFormInputSchema } from "../contact-form";
const { rpc, send } = vi.hoisted(() => ({ rpc: vi.fn(), send: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));
vi.mock("../../../supabase/functions/_shared/resend", () => ({ sendTransactionalEmail: send }));
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
const row = {
  id: "outbox-1",
  claim_token: "lease-1",
  recipient: input.email,
  subject: "Frozen subject",
  text_body: "Frozen text",
  html_body: "Frozen html",
  sender: "info@mail.masaarat.ai",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CONTACT_MAIL_ENABLED", "false");
  vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "synthetic-test-only");
  rpc.mockImplementation(async (name) => ({
    error: null,
    data:
      name === "auth_signup_email_profile"
        ? []
        : name === "claim_contact_acknowledgement"
          ? [row]
          : true,
  }));
  send.mockResolvedValue({ ok: true, emailId: "provider-id" });
});
afterEach(() => vi.unstubAllEnvs());
describe("server acknowledgement", () => {
  it("queues before sending only its own stored content through Resend", async () => {
    await queueContactAcknowledgement(input, row.id);
    expect(rpc.mock.calls.map((c) => c[0])).toEqual([
      "auth_signup_email_profile",
      "queue_contact_acknowledgement",
      "claim_contact_acknowledgement",
      "complete_contact_acknowledgement",
    ]);
    expect(rpc).toHaveBeenCalledWith("claim_contact_acknowledgement", { p_id: row.id });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: row.sender, enabled: true }),
      expect.objectContaining({
        to: input.email,
        subject: row.subject,
        idempotencyKey: "contact-ack-v1/outbox-1",
      }),
    );
  });
  it.each(["false", ""])("does nothing when the direct switch is %s", async (flag) => {
    vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", flag);
    await queueContactAcknowledgement(input, row.id);
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("cannot be reactivated through the retired switch", async () => {
    vi.stubEnv("CONTACT_MAIL_ENABLED", "true");
    vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", "false");
    await queueContactAcknowledgement(input, row.id);
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("sends through the owner-enabled direct route with the original switch disabled", async () => {
    vi.stubEnv("CONTACT_MAIL_ENABLED", "false");
    vi.stubEnv("CONTACT_MAIL_DIRECT_ENABLED", "true");
    await queueContactAcknowledgement(input, row.id);
    expect(rpc).toHaveBeenCalledWith("claim_contact_acknowledgement", { p_id: row.id });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("persists a retry before detecting missing transport configuration", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(queueContactAcknowledgement(input, row.id)).rejects.toThrow(
      "contact_mail_transport_unconfigured",
    );
    expect(rpc).toHaveBeenCalledWith(
      "queue_contact_acknowledgement",
      expect.objectContaining({ p_id: row.id }),
    );
    expect(send).not.toHaveBeenCalled();
  });
  it("does not send when persistence fails", async () => {
    rpc.mockImplementation(async (name) => ({
      data: [],
      error: name === "queue_contact_acknowledgement" ? "failed" : null,
    }));
    await expect(queueContactAcknowledgement(input, row.id)).rejects.toThrow(
      "contact_mail_queue_failed",
    );
    expect(send).not.toHaveBeenCalled();
  });
});
