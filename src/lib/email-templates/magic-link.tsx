import * as React from "react";

import { Text } from "@react-email/components";

import { MasaaratShell, bodyText } from "./masaarat-shell";

interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <MasaaratShell
    preview="رابط تسجيل الدخول إلى حسابك في مسارات"
    title="رابط تسجيل الدخول"
    actionLabel="تسجيل الدخول"
    actionUrl={confirmationUrl}
    footerNote="إن لم تطلب هذا الرابط، فتجاهل هذه الرسالة."
  >
    <Text style={bodyText}>اضغط على الزر بالأسفل لتسجيل الدخول إلى حسابك في مسارات.</Text>
  </MasaaratShell>
);

export default MagicLinkEmail;
