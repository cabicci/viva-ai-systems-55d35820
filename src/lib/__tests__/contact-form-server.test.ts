// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { captcha, rateLimit, mail, reserve, finish, begin } = vi.hoisted(() => ({
  captcha: vi.fn(),
  rateLimit: vi.fn(),
  mail: vi.fn(),
  reserve: vi.fn(),
  finish: vi.fn(),
  begin: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ inputValidator: () => ({ handler: (fn: unknown) => fn }) }),
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () =>
    new Request("https://masaarat.ai/contact", { headers: { "cf-connecting-ip": "192.0.2.1" } }),
}));
vi.mock("../turnstile.server", () => ({ verifyTurnstileToken: captcha }));
vi.mock("../rate-limit.server", () => ({
  enforceRateLimit: rateLimit,
  RateLimitExceededError: class extends Error {},
}));
vi.mock("../contact-mail.server", () => ({
  dispatchAcceptedContact: mail,
  reserveContactSubmission: reserve,
  completeContactSubmission: finish,
  beginContactSubmission: begin,
}));
import { submitContactForm, type ContactSubmitResult } from "../contact-form.functions";
import { contactFormInputSchema, type ContactFormInput } from "../contact-form";
const input = contactFormInputSchema.parse({
  attemptId: "7c1e0a52-3b6d-4f8e-9a21-c0a7ac700001",
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
const submit = () =>
  (
    submitContactForm as unknown as (args: {
      data: ContactFormInput;
    }) => Promise<ContactSubmitResult>
  )({ data: input });
let transport: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  captcha.mockResolvedValue({ success: true });
  rateLimit.mockResolvedValue(undefined);
  mail.mockResolvedValue(undefined);
  reserve.mockResolvedValue({ state: "dispatch", claim: "server-claim" });
  finish.mockResolvedValue(undefined);
  begin.mockResolvedValue(true);
  transport = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", transport);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("accepted contact intake triggers the server mail flow", () => {
  it("rechecks the durable consent/lifecycle gate immediately before the external POST", async () => {
    begin.mockResolvedValue(false);
    expect(await submit()).toEqual({ success: false, error: "pending_review" });
    expect(begin).toHaveBeenCalledWith(input.attemptId, "server-claim");
    expect(transport).not.toHaveBeenCalled();
    expect(mail).not.toHaveBeenCalled();
  });
  it("returns a manually closed attempt without sending or declaring CRM acceptance", async () => {
    reserve.mockResolvedValue({ state: "closed_manual" });
    expect(await submit()).toEqual({ success: false, error: "closed_manual" });
    expect(begin).not.toHaveBeenCalled();
    expect(transport).not.toHaveBeenCalled();
  });
  it("does not repeat an already accepted attempt even when the first HTTP result was lost", async () => {
    reserve.mockResolvedValue({ state: "accepted" });
    expect(await submit()).toEqual({ success: true, replayed: true });
    expect(transport).not.toHaveBeenCalled();
    expect(mail).toHaveBeenCalledWith(input.attemptId);
  });
  it("keeps an ambiguous attempt for review without repeating the external POST", async () => {
    transport.mockRejectedValueOnce(new Error("timeout after remote acceptance"));
    expect(await submit()).toEqual({ success: false, error: "pending_review" });
    expect(finish).toHaveBeenCalledWith(input.attemptId, "server-claim", false);
    reserve.mockResolvedValue({ state: "reconciliation_required" });
    expect(await submit()).toEqual({ success: false, error: "pending_review" });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(mail).not.toHaveBeenCalled();
  });
  it("never contacts the provider if the durable reservation or payload binding fails", async () => {
    reserve.mockRejectedValue(new Error("CONTACT_ATTEMPT_PAYLOAD_CONFLICT"));
    expect(await submit()).toEqual({ success: false, error: "service_unavailable" });
    expect(transport).not.toHaveBeenCalled();
  });
  it("does not send an ACK when accepted-intake persistence has an unknown outcome", async () => {
    finish.mockRejectedValue(new Error("commit response lost"));
    expect(await submit()).toEqual({ success: false, error: "pending_review" });
    expect(mail).not.toHaveBeenCalled();
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("attempts mail only after CAPTCHA, rate limit and HubSpot acceptance", async () => {
    expect(await submit()).toEqual({ success: true });
    expect(mail).toHaveBeenCalledWith(input.attemptId);
    expect(reserve.mock.invocationCallOrder[0]).toBeLessThan(transport.mock.invocationCallOrder[0]);
    expect(finish).toHaveBeenCalledWith(input.attemptId, "server-claim", true);
    expect(captcha.mock.invocationCallOrder[0]).toBeLessThan(rateLimit.mock.invocationCallOrder[0]);
    expect(rateLimit.mock.invocationCallOrder[0]).toBeLessThan(
      transport.mock.invocationCallOrder[0],
    );
    expect(transport.mock.invocationCallOrder[0]).toBeLessThan(mail.mock.invocationCallOrder[0]);
  });
  it("preserves accepted intake when acknowledgement dispatch fails", async () => {
    mail.mockRejectedValue(new Error("unavailable"));
    expect(await submit()).toEqual({ success: true });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(["captcha", "rate_limit", "hubspot"])(
    "does not send after %s rejection",
    async (reason) => {
      if (reason === "captcha") captcha.mockResolvedValue({ success: false });
      if (reason === "rate_limit") rateLimit.mockRejectedValue(new Error("denied"));
      if (reason === "hubspot") transport.mockResolvedValue(new Response(null, { status: 503 }));
      expect((await submit()).success).toBe(false);
      expect(mail).not.toHaveBeenCalled();
    },
  );
});
