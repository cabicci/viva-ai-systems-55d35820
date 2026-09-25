import * as React from 'react'

import { Link, Text } from '@react-email/components'

import { MasaaratShell, bodyText } from './masaarat-shell'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <MasaaratShell
    preview="أكّد بريدك الجديد في مسارات"
    title="تأكيد بريدك الجديد"
    actionLabel="تأكيد البريد الجديد"
    actionUrl={confirmationUrl}
    footerNote="إن لم تطلب تغيير البريد، فتجاهل هذه الرسالة وتواصل معنا فورًا."
  >
    <Text style={bodyText}>
      طلبت تغيير بريد حسابك في مسارات إلى{' '}
      <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>. أكّد البريد الجديد
      بالضغط على الزر بالأسفل.
    </Text>
  </MasaaratShell>
)

export default EmailChangeEmail

const link = { color: '#356f9a' }
