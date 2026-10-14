import type { SignupProfile } from "./signup-profile";
export type AccountAction = "invite" | "magiclink" | "email_change" | "reauthentication";
type Copy = { title: string; instruction: string; action: string; note: string; subject: string };
const messages = {
  invite: {
    "ar-EG": [
      "دعوتك إلى مسارات",
      "اتدعيت للانضمام لمسارات. اقبل الدعوة من الزر عشان تكمّل إنشاء حسابك.",
      "قبول الدعوة",
      "لو ما كنتش متوقع الدعوة دي، تجاهل الرسالة.",
    ],
    "ar-MSA": [
      "دعوتك إلى مسارات",
      "تمت دعوتك للانضمام إلى مسارات. استخدم الزر لقبول الدعوة وإكمال إنشاء حسابك.",
      "قبول الدعوة",
      "إذا لم تكن تتوقع هذه الدعوة، فتجاهل الرسالة.",
    ],
    "ar-Gulf": [
      "دعوتك لمسارات",
      "وصلتك دعوة للانضمام لمسارات. اقبل الدعوة من الزر عشان تكمّل إنشاء حسابك.",
      "قبول الدعوة",
      "إذا ما كنت تتوقع هالدعوة، تجاهل الرسالة.",
    ],
    en: [
      "Your Masaarat invitation",
      "You have been invited to join Masaarat. Accept the invitation to finish creating your account.",
      "Accept invitation",
      "If you were not expecting this invitation, ignore this email.",
    ],
  },
  magiclink: {
    "ar-EG": [
      "رابط تسجيل الدخول",
      "استخدم الزر لتسجيل الدخول لحسابك في مسارات.",
      "تسجيل الدخول",
      "لو ما طلبتش الرابط ده، تجاهل الرسالة.",
    ],
    "ar-MSA": [
      "رابط تسجيل الدخول",
      "استخدم الزر لتسجيل الدخول إلى حسابك في مسارات.",
      "تسجيل الدخول",
      "إذا لم تطلب هذا الرابط، فتجاهل الرسالة.",
    ],
    "ar-Gulf": [
      "رابط تسجيل الدخول",
      "استخدم الزر عشان تسجّل دخولك لحسابك في مسارات.",
      "تسجيل الدخول",
      "إذا ما طلبت هالرابط، تجاهل الرسالة.",
    ],
    en: [
      "Your login link",
      "Use the button to sign in to your Masaarat account.",
      "Sign in",
      "If you did not request this link, ignore this email.",
    ],
  },
  email_change: {
    "ar-EG": [
      "تأكيد بريدك الجديد",
      "استخدم الزر لتأكيد تغيير بريد حسابك في مسارات.",
      "تأكيد البريد",
      "لو ما طلبتش تغيير البريد، ما تستخدمش الرابط وتواصل معانا فورًا.",
    ],
    "ar-MSA": [
      "تأكيد بريدك الجديد",
      "استخدم الزر لتأكيد تغيير البريد الإلكتروني لحسابك في مسارات.",
      "تأكيد البريد",
      "إذا لم تطلب تغيير البريد، فلا تستخدم الرابط وتواصل معنا فورًا.",
    ],
    "ar-Gulf": [
      "تأكيد بريدك الجديد",
      "استخدم الزر عشان تأكّد تغيير إيميل حسابك في مسارات.",
      "تأكيد البريد",
      "إذا ما طلبت تغيير الإيميل، لا تستخدم الرابط وتواصل معنا فورًا.",
    ],
    en: [
      "Confirm your new email",
      "Use the button to confirm the email address change for your Masaarat account.",
      "Confirm email",
      "If you did not request this change, do not use the link and contact us immediately.",
    ],
  },
  reauthentication: {
    "ar-EG": [
      "رمز التحقق",
      "استخدم الرمز التالي لإكمال التحقق من حسابك في مسارات.",
      "",
      "لو ما طلبتش الرمز ده، تجاهل الرسالة. ما تشاركش الرمز مع أي حد.",
    ],
    "ar-MSA": [
      "رمز التحقق",
      "استخدم الرمز التالي لإكمال التحقق من حسابك في مسارات.",
      "",
      "إذا لم تطلب هذا الرمز، فتجاهل الرسالة. لا تشارك الرمز مع أي شخص.",
    ],
    "ar-Gulf": [
      "رمز التحقق",
      "استخدم الرمز التالي عشان تكمّل التحقق من حسابك في مسارات.",
      "",
      "إذا ما طلبت هالرمز، تجاهل الرسالة. لا تشارك الرمز مع أحد.",
    ],
    en: [
      "Your verification code",
      "Use this code to complete verification of your Masaarat account.",
      "",
      "If you did not request this code, ignore this email. Do not share the code with anyone.",
    ],
  },
} as const;
export function accountActionCopy(kind: AccountAction, locale: SignupProfile["locale"]): Copy {
  const [title, instruction, action, note] = messages[kind][locale ?? "ar-MSA"];
  if (locale) return { title, instruction, action, note, subject: `${title} | Masaarat` };
  const english = messages[kind].en;
  return {
    title: `${title} | ${english[0]}`,
    instruction: `${instruction} ${english[1]}`,
    action: action ? `${action} | ${english[2]}` : "",
    note: `${note} ${english[3]}`,
    subject: `${title} | ${english[0]} | Masaarat`,
  };
}
