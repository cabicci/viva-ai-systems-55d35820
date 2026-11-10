import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export type DeliveryChannel = "sms" | "whatsapp";

export const phoneVerificationInput = z
  .object({
    phone: z
      .string()
      .max(40)
      .transform((value, ctx) => {
        const phone = parsePhoneNumberFromString(value.trim());
        if (!value.trim().startsWith("+") || !phone?.isValid()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "COMMUNICATIONS_INVALID_PHONE" });
          return z.NEVER;
        }
        return phone.number;
      }),
    channel: z.enum(["sms", "whatsapp"]),
    locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
  })
  .strict();

export type CommunicationsReadiness = {
  credentialsConfigured: boolean;
  verifyConfigured: boolean;
  verifyReachable: boolean | null;
  messagingConfigured: boolean;
  whatsappSenderConfigured: boolean;
  // Readiness inspection never activates delivery.
  activationAvailable: false;
};
