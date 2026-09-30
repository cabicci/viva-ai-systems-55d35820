import type { SignupProfile } from "./signup-profile";

const copies = {
  "ar-EG": {
    subject: "إعادة تعيين كلمة المرور | مسارات",
    preview: "اختار كلمة مرور جديدة لحسابك في مسارات",
    title: "إعادة تعيين كلمة المرور",
    greeting: "أهلًا",
    instruction: "اضغط الزر لاختيار كلمة مرور جديدة لحسابك في مسارات.",
    action: "تعيين كلمة المرور",
    note: "لو ما طلبتش تغيير كلمة المرور، تجاهل الرسالة دي؛ كلمة مرورك الحالية هتفضل زي ما هي.",
  },
  "ar-MSA": {
    subject: "إعادة تعيين كلمة المرور | مسارات",
    preview: "اختر كلمة مرور جديدة لحسابك في مسارات",
    title: "إعادة تعيين كلمة المرور",
    greeting: "مرحبًا",
    instruction: "استخدم الزر لاختيار كلمة مرور جديدة لحسابك في مسارات.",
    action: "تعيين كلمة المرور",
    note: "إذا لم تطلب إعادة التعيين، فتجاهل هذه الرسالة؛ كلمة مرورك الحالية تبقى كما هي.",
  },
  "ar-Gulf": {
    subject: "إعادة تعيين كلمة المرور | مسارات",
    preview: "اختر كلمة مرور جديدة لحسابك في مسارات",
    title: "إعادة تعيين كلمة المرور",
    greeting: "حيّاك الله",
    instruction: "اضغط الزر عشان تختار كلمة مرور جديدة لحسابك في مسارات.",
    action: "تعيين كلمة المرور",
    note: "إذا ما طلبت تغيير كلمة المرور، تجاهل هالرسالة؛ كلمة مرورك الحالية بتبقى مثل ما هي.",
  },
  en: {
    subject: "Reset your password | Masaarat",
    preview: "Choose a new password for your Masaarat account",
    title: "Reset your password",
    greeting: "Hello",
    instruction: "Use the button to choose a new password for your Masaarat account.",
    action: "Reset password",
    note: "If you did not request a password reset, ignore this email. Your current password remains unchanged.",
  },
} as const;

export const recoveryCopy = (locale: SignupProfile["locale"]) => (locale ? copies[locale] : null);
