import * as React from "react";
import { Text } from "@react-email/components";
import { MasaaratShell, bodyText } from "./masaarat-shell";
import type { SignupProfile } from "./signup-profile";
import { recoveryCopy } from "./recovery-copy";

interface RecoveryEmailProps extends SignupProfile {
  confirmationUrl: string;
}

export const RecoveryEmail = ({ confirmationUrl, name, locale }: RecoveryEmailProps) => {
  const copy = recoveryCopy(locale);
  return (
    <MasaaratShell
      locale={locale ?? "ar-MSA"}
      preview={copy?.preview ?? "استعادة حساب مسارات | Recover your Masaarat account"}
      title={copy?.title ?? "إعادة تعيين كلمة المرور | Reset your password"}
      actionLabel={copy?.action ?? "تعيين كلمة المرور | Reset password"}
      actionUrl={confirmationUrl}
      footerNote={
        copy?.note ??
        "إن لم تطلب تغيير كلمة المرور، تجاهل الرسالة؛ كلمة مرورك الحالية تبقى كما هي. If you did not request a reset, ignore this email. Your current password remains unchanged."
      }
    >
      <Text style={bodyText}>
        {copy?.greeting ?? "مرحبًا / Hello"}
        {name ? ` ${name}` : ""}
      </Text>
      <Text style={bodyText}>
        {copy?.instruction ??
          "اضغط الزر لاختيار كلمة مرور جديدة. Use the button to choose a new password."}
      </Text>
    </MasaaratShell>
  );
};

export default RecoveryEmail;
