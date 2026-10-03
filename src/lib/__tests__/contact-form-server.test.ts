// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { captcha, rateLimit, mail } = vi.hoisted(() => ({
  captcha: vi.fn(),
  rateLimit: vi.fn(),
  mail: vi.fn(),
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
vi.mock("../contact-mail.server", () => ({ queueContactAcknowledgement: mail }));
import { submitContactForm, type ContactSubmitResult } from "../contact-form.functions";
import { contactFormInputSchema, type ContactFormInput } from "../contact-form";
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
  it("attempts mail only after CAPTCHA, rate limit and HubSpot acceptance", async () => {
    expect(await submit()).toEqual({ success: true });
    expect(mail).toHaveBeenCalledWith(input, expect.any(String));
    expect(captcha.mock.invocationCallOrder[0]).toBeLessThan(rateLimit.mock.invocationCallOrder[0]);
    expect(rateLimit.mock.invocationCallOrder[0]).toBeLessThan(
      transport.mock.invocationCallOrder[0],
    );
    expect(transport.mock.invocationCallOrder[0]).toBeLessThan(mail.mock.invocationCallOrder[0]);
  });
  it("preserves accepted intake when mail persistence or transport fails", async () => {
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
