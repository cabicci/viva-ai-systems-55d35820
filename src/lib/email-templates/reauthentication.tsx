import * as React from 'react'

import { Text } from '@react-email/components'

import { MasaaratShell, bodyText } from './masaarat-shell'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <MasaaratShell
    preview="رمز التحقق لحسابك في مسارات"
    title="رمز التحقق"
    footerNote="إن لم تطلب هذا الرمز، فتجاهل هذه الرسالة."
  >
    <Text style={bodyText}>استخدم الرمز التالي لإكمال التحقق من حسابك في مسارات:</Text>
    <Text style={codeStyle}>{token}</Text>
  </MasaaratShell>
)

export default ReauthenticationEmail

const codeStyle = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  color: '#243044',
  backgroundColor: '#f3f8f8',
  border: '1px solid #dce6ed',
  borderRadius: '10px',
  padding: '14px 20px',
  textAlign: 'center' as const,
  direction: 'ltr' as const,
}
