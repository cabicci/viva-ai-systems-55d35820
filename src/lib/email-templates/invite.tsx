import * as React from 'react'

import { Link, Text } from '@react-email/components'

import { MasaaratShell, bodyText } from './masaarat-shell'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <MasaaratShell
    preview="تمت دعوتك للانضمام إلى مسارات"
    title="دعوتك إلى مسارات"
    actionLabel="قبول الدعوة"
    actionUrl={confirmationUrl}
    footerNote="إن لم تكن تتوقع هذه الدعوة، فتجاهل هذه الرسالة."
  >
    <Text style={bodyText}>
      تمت دعوتك للانضمام إلى <Link href={siteUrl} style={link}>مسارات</Link>. اضغط على الزر
      بالأسفل لقبول الدعوة وإنشاء حسابك.
    </Text>
  </MasaaratShell>
)

export default InviteEmail

const link = { color: '#356f9a' }
