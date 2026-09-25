import * as React from "react";

import { Text } from "@react-email/components";

import { MasaaratShell, bodyText } from "./masaarat-shell";

interface RecoveryEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <MasaaratShell
    preview="إعادة تعيين كلمة المرور لحسابك في مسارات"
    title="إعادة تعيين كلمة المرور"
    actionLabel="تعيين كلمة المرور"
    actionUrl={confirmationUrl}
    footerNote="إن لم تطلب إعادة التعيين، فتجاهل هذه الرسالة؛ كلمة مرورك الحالية تبقى كما هي."
  >
    <Text style={bodyText}>استخدم الزر بالأسفل لاختيار كلمة مرور جديدة لحسابك في مسارات.</Text>
  </MasaaratShell>
);

export default RecoveryEmail;
