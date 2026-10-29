import { z } from "zod";

const market = z.enum(["EG", "INTL"]);
const interval = z.enum(["month", "year"]);
const locale = z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]).optional();

export const liveCheckoutSchema = z.discriminatedUnion("product", [
  z.object({ product: z.literal("core"), planKey: z.enum(["pro", "pro_plus"]), billingInterval: interval, marketCode: market }),
  z.object({ product: z.literal("kids"), billingInterval: interval, marketCode: market, locale }),
  z.object({ product: z.literal("technical"), billingInterval: interval, marketCode: market, locale }),
  z.object({ product: z.literal("academic"), academicAssistant: z.boolean(), billingInterval: interval, marketCode: market, locale }),
]);

export const livePortalSchema = z.object({ scope: z.enum(["core", "kids", "academic", "technical"]) });
