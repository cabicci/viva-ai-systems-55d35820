import { z } from "zod";
import { phoneVerificationInput } from "./contracts";

export const accountPhoneStart = phoneVerificationInput;
export const accountPhoneCheck = z
  .object({
    challengeId: z.string().uuid(),
    code: z.string().regex(/^[0-9]{6}$/),
  })
  .strict();
export type PhoneStatus = {
  enabled: boolean;
  channels: ("whatsapp" | "sms")[];
  phone: string | null;
  verifiedAt: string | null;
};
export type PhoneChallenge = { challengeId: string; expiresAt: string };
export type PhoneError = "disabled" | "email" | "phone" | "limit" | "challenge" | "unavailable";
export type PhoneResult<T> = { ok: true; value: T } | { ok: false; error: PhoneError };
