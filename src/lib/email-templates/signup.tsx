import * as React from "react";

import { Link, Text } from "@react-email/components";
import { MasaaratShell, bodyText } from "./masaarat-shell";
import type { SignupProfile } from "./signup-profile";

interface SignupEmailProps extends SignupProfile {
  siteUrl: string;
  confirmationUrl: string;
}

const copies = {
  "ar-EG": {
    subject: "أكّد بريدك الإلكتروني | مسارات",
    preview: "خطوة أخيرة لإنشاء حسابك في مسارات",
    title: "أكّد بريدك الإلكتروني",
    greeting: "أهلًا",
    instruction: "فاضل خطوة أخيرة لإنشاء حسابك في مسارات: اضغط الزر لتأكيد بريدك الإلكتروني.",
    action: "تأكيد البريد",
    note: "لو ما طلبتش إنشاء الحساب، تجاهل الرسالة دي.",
  },
  "ar-MSA": {
    subject: "تأكيد بريدك الإلكتروني | مسارات",
    preview: "أكمل إنشاء حسابك في مسارات",
    title: "تأكيد البريد الإلكتروني",
    greeting: "مرحبًا",
    instruction: "تبقّت خطوة واحدة لإنشاء حسابك في مسارات: اضغط الزر لتأكيد بريدك الإلكتروني.",
    action: "تأكيد البريد",
    note: "إذا لم تطلب إنشاء الحساب، فتجاهل هذه الرسالة.",
  },
  "ar-Gulf": {
    subject: "تأكيد بريدك الإلكتروني | مسارات",
    preview: "باقي خطوة لإكمال حسابك في مسارات",
    title: "تأكيد البريد الإلكتروني",
    greeting: "حيّاك الله",
    instruction: "باقي خطوة لإكمال حسابك في مسارات: اضغط الزر لتأكيد بريدك الإلكتروني.",
    action: "تأكيد البريد",
    note: "إذا ما طلبت إنشاء الحساب، تجاهل هالرسالة.",
  },
  en: {
    subject: "Confirm your email | Masaarat",
    preview: "One more step to create your Masaarat account",
    title: "Confirm your email",
    greeting: "Hello",
    instruction:
      "One more step to create your Masaarat account: use the button to confirm your email address.",
    action: "Confirm email",
    note: "If you did not create this account, you can ignore this email.",
  },
} as const;

export const signupCopy = (locale: SignupProfile["locale"]) => (locale ? copies[locale] : null);

export const SignupEmail = ({ siteUrl, confirmationUrl, name, locale }: SignupEmailProps) => {
  const copy = signupCopy(locale);
  return (
    <MasaaratShell
      locale={locale ?? "ar-MSA"}
      preview={copy?.preview ?? "تأكيد بريدك في مسارات | Confirm your Masaarat email"}
      title={copy?.title ?? "تأكيد البريد | Confirm your email"}
      actionLabel={copy?.action ?? "تأكيد البريد | Confirm email"}
      actionUrl={confirmationUrl}
      footerNote={
        copy?.note ??
        "إن لم تنشئ هذا الحساب، تجاهل الرسالة. If you did not sign up, ignore this email."
      }
    >
      <Text style={bodyText}>
        {copy?.greeting ?? "مرحبًا / Hello"}
        {name ? ` ${name}` : ""}
      </Text>
      <Text style={bodyText}>
        {copy?.instruction ?? "اضغط الزر لتأكيد بريدك. Use the button to confirm your email."}{" "}
        <Link href={siteUrl} style={{ color: "#356f9a" }}>
          Masaarat
        </Link>
      </Text>
    </MasaaratShell>
  );
};

export default SignupEmail;
