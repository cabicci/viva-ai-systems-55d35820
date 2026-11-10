// @vitest-environment node
import { describe, it, expect } from "vitest";
import { contactAttemptFingerprint, contactAttemptIdentity } from "../contact-automation-attempt";
import type { ContactFormInput } from "../contact-form";
const input = {
  firstName: "Person",
  lastName: "",
  email: "person@example.test",
  phone: "",
  countryCode: "EG",
  company: "",
  message: "Question",
  locale: "en",
  consentToProcess: true,
  turnstileToken: "token",
  pageUri: "https://masaarat.ai/contact",
} as ContactFormInput;
describe("stable contact attempt identity", () => {
  it("reuses a persisted nonce across CAPTCHA refreshes and retries", async () => {
    const hash = await contactAttemptFingerprint(input);
    const prior = contactAttemptIdentity(hash, null);
    expect(
      contactAttemptIdentity(
        await contactAttemptFingerprint({ ...input, turnstileToken: "new-token" }),
        JSON.parse(JSON.stringify(prior)),
      ),
    ).toEqual(prior);
  });
  it.each(["email", "message", "locale", "requestType"] as const)(
    "binds changed %s to a different payload",
    async (field) => {
      const hash = await contactAttemptFingerprint(input);
      const altered = await contactAttemptFingerprint({
        ...input,
        [field]: field === "locale" ? "ar-EG" : field === "requestType" ? "sales" : "different",
      } as ContactFormInput);
      expect(altered).not.toBe(hash);
      const pending = contactAttemptIdentity(hash, null);
      expect(contactAttemptIdentity(altered, pending)).toEqual(pending);
      expect(contactAttemptIdentity(hash, contactAttemptIdentity(altered, pending))).toEqual(
        pending,
      );
    },
  );
});

describe("contact identity lifecycle", () => {
  it("ignores page navigation when identifying the same business request", async () => {
    expect(
      await contactAttemptFingerprint({ ...input, pageUri: "https://masaarat.ai/another-page" }),
    ).toBe(await contactAttemptFingerprint(input));
  });
  it("preserves terminal attempts until an explicit new request clears them", async () => {
    const current = {
      ...contactAttemptIdentity(await contactAttemptFingerprint(input), null),
      status: "accepted" as const,
      conversionTracked: true,
    };
    expect(contactAttemptIdentity(await contactAttemptFingerprint(input), current)).toEqual(
      current,
    );
    expect(contactAttemptIdentity(await contactAttemptFingerprint(input), null).id).not.toBe(
      current.id,
    );
  });
});
