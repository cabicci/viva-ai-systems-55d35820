import * as React from 'react'

import { Link, Text } from '@react-email/components'

import { MasaaratShell, bodyText } from './masaarat-shell'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <MasaaratShell
    preview="أكّد بريدك لإتمام إنشاء حسابك في مسارات"
    title="أكّد بريدك الإلكتروني"
    actionLabel="تأكيد البريد"
    actionUrl={confirmationUrl}
    footerNote="إن لم تطلب إنشاء هذا الحساب، فتجاهل هذه الرسالة."
  >
    <Text style={bodyText}>
      أهلًا بك في <Link href={siteUrl} style={link}>مسارات</Link>! خطوة أخيرة: أكّد بريدك (
      <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>) بالضغط على الزر بالأسفل.
    </Text>
  </MasaaratShell>
)

export default SignupEmail

const link = { color: '#356f9a' }
