import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const COMMUNICATION_EVENTS = [
  "account_registered",
  "phone_verified",
  "plan_activated",
  "grant_activated",
  "coupon_redeemed",
  "invitation_accepted",
  "receipt_reviewed",
] as const;
export type CommunicationEvent = (typeof COMMUNICATION_EVENTS)[number];
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

// Verify supplies the authentication message/code. These are transactional
// notification drafts, never authentication templates or approved send requests.
export const EVENT_DRAFTS: Record<CommunicationEvent, { ar: string; en: string }> = {
  account_registered: {
    ar: "مرحبًا {{name}}، تم إنشاء حسابك في مسارات.",
    en: "Welcome {{name}}, your Masaarat account has been created.",
  },
  phone_verified: {
    ar: "تم توثيق رقم هاتفك في مسارات.",
    en: "Your phone number has been verified on Masaarat.",
  },
  plan_activated: {
    ar: "تم تفعيل باقة {{plan}}. يمكنك متابعة التعلم من حسابك.",
    en: "Your {{plan}} plan is active. Continue learning from your account.",
  },
  grant_activated: {
    ar: "تم تفعيل المنحة الخاصة بباقة {{plan}} على حسابك.",
    en: "Your grant for {{plan}} is active on your account.",
  },
  coupon_redeemed: {
    ar: "تم تطبيق العرض على طلبك. يمكنك مراجعة تفاصيله من حسابك.",
    en: "Your offer has been applied. Review the details in your account.",
  },
  invitation_accepted: {
    ar: "تم قبول دعوتك. راجع تفاصيل الوصول من حسابك.",
    en: "Your invitation has been accepted. Review access details in your account.",
  },
  receipt_reviewed: {
    ar: "تم تحديث حالة مراجعة إيصالك. راجع النتيجة من حسابك.",
    en: "Your receipt review has been updated. Check the result in your account.",
  },
};

export type CommunicationsReadiness = {
  credentialsConfigured: boolean;
  verifyConfigured: boolean;
  verifyReachable: boolean | null;
  messagingConfigured: boolean;
  whatsappSenderConfigured: boolean;
  // This draft has no persistent switches and cannot send customer messages.
  activationAvailable: false;
};
