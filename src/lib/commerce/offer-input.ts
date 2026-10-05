import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
export function normalizeOfferPhone(input: string): string | null {
  const value = input.trim().replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (!value.startsWith("+")) return null;
  const phone = parsePhoneNumberFromString(value);
  return phone?.isValid() ? phone.number : null;
}
export const offerPhoneSchema = z
  .string()
  .max(50)
  .transform((value, ctx) => {
    const normalized = normalizeOfferPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "COMMERCE_PHONE_REQUIRED" });
      return z.NEVER;
    }
    return normalized;
  });
export const simpleOfferSchema = z
  .object({
    key: z.string().min(8).max(100),
    audience: z.enum(["individual", "group", "public"]),
    emails: z
      .array(
        z
          .string()
          .trim()
          .email()
          .max(120)
          .transform((s) => s.toLowerCase()),
      )
      .max(1000),
    group_name: z.string().trim().max(120).default(""),
    package: z.enum(["pro", "pro_plus", "kids", "technical"]),
    market: z.enum(["EG", "INTL"]),
    billing_interval: z.enum(["month", "year"]),
    percent: z.number().int().min(1).max(100),
    delivery: z.enum(["coupon", "invitation"]),
    code: z.string().regex(/^[A-Z0-9_-]{3,64}$/),
    locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
    limit_mode: z.enum(["time", "count"]),
    valid_until: z.string().datetime({ offset: true }).nullable(),
    max_redemptions: z.number().int().min(1).max(100000).nullable(),
    expected_price_minor: z.number().int().min(0).max(1_000_000_000),
  })
  .superRefine((v, ctx) => {
    if (
      (v.audience === "individual" && v.emails.length !== 1) ||
      (v.audience === "group" && !v.emails.length) ||
      (v.audience === "public" && (v.emails.length || v.delivery !== "coupon"))
    )
      ctx.addIssue({ code: "custom", message: "Invalid audience" });
    if (
      v.audience === "public" &&
      (v.limit_mode === "time"
        ? !v.valid_until || Date.parse(v.valid_until) <= Date.now() || v.max_redemptions !== null
        : v.max_redemptions === null || v.valid_until !== null)
    )
      ctx.addIssue({ code: "custom", message: "Invalid offer limit" });
  });
export type SimpleOfferInput = z.infer<typeof simpleOfferSchema>;
