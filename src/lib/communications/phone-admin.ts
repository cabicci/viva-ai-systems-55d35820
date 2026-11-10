import { z } from "zod";

const channel = z.enum(["sms", "whatsapp"]);
export const phoneAdminInput = z
  .object({
    revision: z.number().int().min(0).max(2_147_483_647),
    enabled: z.boolean(),
    channels: z
      .array(channel)
      .min(1)
      .max(2)
      .refine((values) => new Set(values).size === values.length),
    dailyCap: z.number().int().min(1).max(100),
    testUsers: z
      .array(z.string().uuid())
      .max(100)
      .refine((values) => new Set(values).size === values.length),
  })
  .strict();

export const phoneAdminSnapshot = z.object({
  revision: z.number().int().min(0).max(2_147_483_647),
  enabled: z.boolean(),
  channels: z.array(channel),
  dailyCap: z.number().int().min(1).max(100),
  testUsers: z.array(z.string().uuid()),
  sentToday: z.number().int().nonnegative(),
  verifiedAccounts: z.number().int().nonnegative(),
  recent: z.array(
    z.object({
      id: z.string().uuid(),
      channel,
      phoneTail: z.string().regex(/^[0-9]{4}$/),
      state: z.enum(["reserved", "pending", "uncertain", "checking", "exhausted", "verified"]),
      createdAt: z.iso.datetime({ offset: true }),
    }),
  ),
});

export type PhoneAdminInput = z.infer<typeof phoneAdminInput>;
export type PhoneAdminSnapshot = z.infer<typeof phoneAdminSnapshot>;
