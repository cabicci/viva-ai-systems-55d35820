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
      product: z.literal("curriculum_lifetime"),
      area: z.enum(["ai", "academic", "technical", "kids"]),
      course: z.string().trim().min(1).max(120),
      childId: z.string().uuid().optional(),
      requestId: z.string().uuid(),
      marketCode: z.literal("EG"),
      locale,
      offer,
    })
    .strict()
    .superRefine((value, ctx) => {
      if ((value.area === "kids") !== Boolean(value.childId))
        ctx.addIssue({ code: "custom", message: "CHILD_SELECTION_INVALID", path: ["childId"] });
    }),
  z
    .object({
      product: z.literal("question_topup"),
      walletScope: z.enum(["account", "family"]),
      requestId: z.string().uuid(),
      marketCode: z.literal("EG"),
      locale,
      offer,
    })
    .strict(),
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

export const livePortalSchema = z.union([
  z.object({ scope: z.enum(["core", "kids", "academic", "technical"]) }),
  z
    .object({
      action: z.enum(["campaign_status", "campaign_cancel"]),
      sourceKey: z.string().regex(/^[a-f0-9]{32}$/),
    })
    .strict(),
]);
