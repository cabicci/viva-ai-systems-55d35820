import { z } from "zod";

const market = z.enum(["EG", "INTL"]);
const interval = z.enum(["month", "year"]);
const locale = z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]).optional();
const offer = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .regex(/^[A-Za-z0-9_-]+$/),
    phone: z
      .string()
      .regex(/^\+[1-9][0-9]{7,14}$/)
      .optional(),
    key: z.string().uuid(),
    renewal: z.boolean().optional(),
  })
  .strict()
  .optional();

export const liveCheckoutSchema = z.discriminatedUnion("product", [
  z
    .object({
      product: z.literal("core"),
      planKey: z.enum(["pro", "pro_plus"]),
      billingInterval: interval,
      marketCode: market,
      offer,
    })
    .strict(),
  z
    .object({
      product: z.literal("kids"),
      billingInterval: interval,
      marketCode: market,
      locale,
      offer,
    })
    .strict(),
  z
    .object({
      product: z.literal("technical"),
      billingInterval: interval,
      marketCode: market,
      locale,
      offer,
    })
    .strict(),
  z
    .object({
      product: z.literal("academic"),
      academicAssistant: z.boolean(),
      billingInterval: interval,
      marketCode: market,
      locale,
      offer,
    })
    .strict(),
]);

export const livePortalSchema = z.object({
  scope: z.enum(["core", "kids", "academic", "technical"]),
});
