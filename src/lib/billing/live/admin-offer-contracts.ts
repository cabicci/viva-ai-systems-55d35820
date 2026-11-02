import { z } from "zod";

const key = z.string().uuid();
const review = { reviewed: z.literal(true), review_reference: z.string().trim().min(3).max(500) };
export const liveOfferAdminSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }).strict(),
  z
    .object({
      action: z.literal("provision"),
      key,
      offer_id: key,
      market: z.enum(["EG", "INTL"]),
      interval: z.enum(["month", "year", "one_time"]),
      price_id: z.string().regex(/^price_[A-Za-z0-9_]+$/),
      product_id: z.string().regex(/^prod_[A-Za-z0-9_]+$/),
      coupon_id: z.string().trim().min(1).max(255),
      promotion_code_id: z.string().regex(/^promo_[A-Za-z0-9_]+$/),
      duration: z.enum(["once", "repeating", "forever"]),
      duration_in_months: z.number().int().min(1).max(1200).nullable().optional(),
      ...review,
    })
    .strict()
    .superRefine((value, ctx) => {
      if ((value.duration === "repeating") !== (value.duration_in_months != null))
        ctx.addIssue({ code: "custom", message: "INVALID_DISCOUNT_DURATION" });
      if (value.interval === "one_time" && value.duration !== "once")
        ctx.addIssue({ code: "custom", message: "INVALID_ONE_TIME_DURATION" });
    }),
  z.object({ action: z.literal("enable"), id: key, key, ...review }).strict(),
  z.object({ action: z.literal("disable"), id: key, key }).strict(),
  z.object({ action: z.literal("reconcile"), id: key, key }).strict(),
]);
export type LiveOfferAdminInput = z.infer<typeof liveOfferAdminSchema>;
export type LiveOfferAdminList = {
  offers: {
    id: string;
    package: string;
    kind: string;
    value_minor: number;
    currency: string;
    billing_interval: string;
    enabled: boolean;
  }[];
  mappings: {
    id: string;
    offer_id: string;
    version: number;
    package: string;
    market_code: string;
    billing_interval: string;
    duration: string;
    enabled: boolean;
  }[];
  reservations: { id: string; mapping_id: string; created_at: string; state: string }[];
};
