import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components'

const LOGO_URL = 'https://masaarat.ai/brand/masaarat-logo-lockup.png'
const CONTACT_URL = 'https://masaarat.ai/contact'

interface MasaaratShellProps {
  preview: string
  title: string
  children: React.ReactNode
  actionLabel?: string
  actionUrl?: string
  footerNote: string
}

/** Shared Masaarat brand shell for auth emails (Arabic-first, RTL). */
export const MasaaratShell = ({
  preview,
  title,
  children,
  actionLabel,
  actionUrl,
  footerNote,
}: MasaaratShellProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Img src={LOGO_URL} width="165" alt="Masaarat | مسارات" style={logo} />
        </div>
        <div style={content}>
          <Heading style={h1}>{title}</Heading>
          {children}
          {actionLabel && actionUrl ? (
            <Button style={button} href={actionUrl}>
              {actionLabel}
            </Button>
          ) : null}
          <Text style={note}>{footerNote}</Text>
        </div>
        <div style={footerBar}>
          <Text style={footerText}>
            تحتاج مساعدة؟{' '}
            <Link href={CONTACT_URL} style={footerLink}>
              تواصل مع مسارات
            </Link>
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export const bodyText = {
  fontSize: '16px',
  color: '#243044',
  lineHeight: '1.8',
  margin: '0 0 16px',
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Tajawal, Arial, sans-serif',
  padding: '24px 12px',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  border: '1px solid #dce6ed',
  borderRadius: '16px',
  overflow: 'hidden' as const,
}
const header = { backgroundColor: '#e8f1f6', padding: '30px 32px' }
const logo = { maxWidth: '100%', height: 'auto', border: '0', display: 'block' }
const content = { padding: '30px 32px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#243044',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#477eaa',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '13px 22px',
  textDecoration: 'none',
}
const note = { fontSize: '13px', color: '#566675', lineHeight: '1.7', margin: '24px 0 0' }
const footerBar = { backgroundColor: '#f3f8f8', padding: '18px 32px' }
const footerText = { fontSize: '13px', color: '#566675', margin: '0' }
const footerLink = { color: '#356f9a' }
