import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildHubSpotSubmission,
  contactCountryLanguage,
  contactFormInputSchema,
  fallbackCountryForLocale,
  normalizePhoneNumber,
  resolvePhoneCountry,
} from "../contact-form";

const validInput = contactFormInputSchema.parse({
  firstName: "خليل",
  lastName: "لطفي",
  email: "khalil@example.com",
  phone: "+201001234567",
  countryCode: "EG",
  company: "مسارات",
  message: "أرغب في معرفة المزيد عن المنصة.",
  locale: "ar-EG",
  consentToProcess: true,
  turnstileToken: "verified-token",
  pageUri: "https://masaarat.ai/contact?locale=ar-EG",
});

describe("contact form phone localization", () => {
  it.each([
    ["ar-EG", "ar"],
    ["ar-MSA", "ar"],
    ["ar-Gulf", "ar"],
    ["en", "en"],
  ] as const)("uses a valid country-name language for %s", (locale, expected) => {
    const language = contactCountryLanguage(locale);
    expect(language).toBe(expected);
    expect(() => new Intl.DisplayNames([language], { type: "region" })).not.toThrow();
    expect(() => "Egypt".localeCompare("United Kingdom", language)).not.toThrow();
  });

  it("uses the request country when it is a supported phone country", () => {
    expect(resolvePhoneCountry("SA", "ar-EG")).toBe("SA");
    expect(resolvePhoneCountry("eg", "en")).toBe("EG");
  });

  it("uses locale-aware fallbacks without defaulting English to +1", () => {
    expect(fallbackCountryForLocale("ar-EG")).toBe("EG");
    expect(fallbackCountryForLocale("ar-Gulf")).toBe("AE");
    expect(fallbackCountryForLocale("en")).toBe("GB");
  });

  it("normalizes a local Egyptian mobile number to E.164", () => {
    expect(normalizePhoneNumber("0100 123 4567", "EG")).toBe("+201001234567");
  });

  it("rejects an invalid local phone number", () => {
    expect(normalizePhoneNumber("123", "EG")).toBeNull();
  });

  it("rejects a valid number when it belongs to a different selected country", () => {
    expect(normalizePhoneNumber("+966501234567", "EG")).toBeNull();
  });
});

describe("HubSpot contact payload", () => {
  it("sends CRM fields, page context, and process consent without a marketing subscription", () => {
    const payload = buildHubSpotSubmission(validInput, {
      ipAddress: "203.0.113.8",
      hutk: "visitor-cookie",
    });

    expect(payload.fields).toEqual(
      expect.arrayContaining([
        { name: "email", value: "khalil@example.com" },
        { name: "phone", value: "+201001234567" },
        { name: "company", value: "مسارات" },
        { name: "message", value: "أرغب في معرفة المزيد عن المنصة." },
      ]),
    );
    expect(payload.context).toMatchObject({
      ipAddress: "203.0.113.8",
      hutk: "visitor-cookie",
      pageUri: "https://masaarat.ai/contact?locale=ar-EG",
    });
    expect(payload.legalConsentOptions.consent.consentToProcess).toBe(true);
    expect(payload.legalConsentOptions.consent.text).toBe(
      "أوافق إن مسارات تحفظ بياناتي وتعالجها للرد على طلبي.",
    );
    expect(payload.legalConsentOptions.consent.communications).toEqual([]);
  });

  it("keeps HubSpot endpoints out of the browser-facing form and route", () => {
    const component = readFileSync("src/components/site/ContactForm.tsx", "utf8");
    const route = readFileSync("src/routes/contact.tsx", "utf8");

    expect(component).not.toMatch(/hubspot|hsforms/i);
    expect(route).not.toMatch(/hubspot|hsforms/i);
  });
});
