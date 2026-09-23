import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { z } from "zod";
import type { SupportedLocale } from "./locale/types";
import { getUiString } from "./locale/ui-strings";

export const HUBSPOT_PORTAL_ID = "149377620";
export const HUBSPOT_CONTACT_FORM_ID = "c1bee095-d92a-441f-8da1-9e91a8130bd1";

const countryCodes = new Set<string>(getCountries());

export const contactFormInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\+[1-9]\d{7,14}$/.test(value)),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => countryCodes.has(value)),
  company: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(5).max(4_000),
  locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
  consentToProcess: z.literal(true),
  turnstileToken: z.string().min(1).max(2_048),
  pageUri: z.string().url().max(2_000),
});

export type ContactFormInput = z.infer<typeof contactFormInputSchema>;

export function isCountryCode(value: string | undefined): value is CountryCode {
  return Boolean(value && countryCodes.has(value.toUpperCase()));
}

export function fallbackCountryForLocale(locale: SupportedLocale): CountryCode {
  if (locale === "ar-EG" || locale === "ar-MSA") return "EG";
  if (locale === "ar-Gulf") return "AE";
  return "GB";
}

export function resolvePhoneCountry(
  ipCountryCode: string | undefined,
  locale: SupportedLocale,
): CountryCode {
  const normalized = ipCountryCode?.toUpperCase();
  return isCountryCode(normalized) ? normalized : fallbackCountryForLocale(locale);
}

export function normalizePhoneNumber(rawNumber: string, countryCode: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(rawNumber, countryCode);
  return parsed?.isValid() && parsed.country === countryCode ? parsed.number : null;
}

export function getCallingCode(countryCode: CountryCode): string {
  return `+${getCountryCallingCode(countryCode)}`;
}

export function buildHubSpotSubmission(
  input: ContactFormInput,
  context: { ipAddress?: string; hutk?: string },
) {
  const fields = [
    { name: "firstname", value: input.firstName },
    { name: "email", value: input.email },
    { name: "message", value: input.message },
  ];
  if (input.lastName) fields.push({ name: "lastname", value: input.lastName });
  if (input.phone) fields.push({ name: "phone", value: input.phone });
  if (input.company) fields.push({ name: "company", value: input.company });
  return {
    submittedAt: Date.now().toString(),
    fields,
    context: {
      pageUri: input.pageUri,
      pageName: "Masaarat contact",
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.hutk ? { hutk: context.hutk } : {}),
    },
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: getUiString(input.locale, "contact.consent"),
        communications: [],
      },
    },
  };
}
