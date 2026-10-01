import * as React from "react";

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const LOGO_URL = "https://masaarat.ai/brand/masaarat-logo-lockup.png";
const CONTACT_URL = "https://masaarat.ai/contact";

interface MasaaratShellProps {
  locale?: "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
  preview: string;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  actionUrl?: string;
  footerNote: string;
}

/** Shared Masaarat brand shell for auth emails (Arabic-first, RTL). */
export const MasaaratShell = ({
  locale = "ar-EG",
  preview,
  title,
  children,
  actionLabel,
  actionUrl,
  footerNote,
}: MasaaratShellProps) => {
  const direction = locale === "en" ? "ltr" : "rtl";
  const align = locale === "en" ? "left" : "right";
  const flow: React.CSSProperties = { direction, textAlign: align };
  return (
    <Html lang={locale === "en" ? "en" : "ar"} dir={direction}>
      <Head />
      <Preview>{preview}</Preview>
      <Body dir={direction} style={{ ...main, ...flow }}>
        <Container dir={direction} style={{ ...container, ...flow }}>
          <Section dir={direction}>
            <Row>
              <Column
                dir={direction}
                align={align}
                style={{ ...header, ...flow }}
              >
                <Img
                  src={LOGO_URL}
                  width="165"
                  alt="Masaarat | مسارات"
                  style={{
                    ...logo,
                    marginLeft: align === "right" ? "auto" : 0,
                    marginRight: align === "left" ? "auto" : 0,
                  }}
                />
              </Column>
            </Row>
            <Row>
              <Column
                dir={direction}
                align={align}
                style={{ ...content, ...flow }}
              >
                <Heading dir={direction} style={{ ...h1, ...flow }}>
                  {title}
                </Heading>
                {children}
                {actionLabel && actionUrl ? (
                  <Button dir={direction} style={button} href={actionUrl}>
                    {actionLabel}
                  </Button>
                ) : null}
                <Text dir={direction} style={{ ...note, ...flow }}>
                  {footerNote}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column
                dir={direction}
                align={align}
                style={{ ...footerBar, ...flow }}
              >
                <Text dir={direction} style={{ ...footerText, ...flow }}>
                  {locale === "en" ? "Need help? " : "تحتاج مساعدة؟ "}
                  <Link href={CONTACT_URL} style={footerLink}>
                    {locale === "en" ? "Contact Masaarat" : "تواصل مع مسارات"}
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const bodyText = {
  fontSize: "16px",
  color: "#243044",
  lineHeight: "1.8",
  margin: "0 0 16px",
  direction: "rtl" as const,
  textAlign: "right" as const,
};

export const bodyTextForLocale = (
  locale?: MasaaratShellProps["locale"] | null,
): React.CSSProperties => ({
  ...bodyText,
  direction: locale === "en" ? "ltr" : "rtl",
  textAlign: locale === "en" ? "left" : "right",
});

export const RecipientName = ({ name }: { name: string | null }) =>
  name ? (
    <>
      {" "}
      <span
        dir="auto"
        style={{ display: "inline-block", unicodeBidi: "isolate" }}
      >
        {name}
      </span>
    </>
  ) : null;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Tajawal, Arial, sans-serif",
  padding: "24px 12px",
};
const container = {
  maxWidth: "560px",
  margin: "0 auto",
  border: "1px solid #dce6ed",
  borderRadius: "16px",
  overflow: "hidden" as const,
};
const header = { backgroundColor: "#e8f1f6", padding: "30px 32px" };
const logo = {
  maxWidth: "100%",
  height: "auto",
  border: "0",
  display: "block",
};
const content = { padding: "30px 32px" };
const h1 = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#243044",
  margin: "0 0 20px",
};
const button = {
  backgroundColor: "#477eaa",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "bold" as const,
  borderRadius: "10px",
  padding: "13px 22px",
  textDecoration: "none",
};
const note = {
  fontSize: "13px",
  color: "#566675",
  lineHeight: "1.7",
  margin: "24px 0 0",
};
const footerBar = { backgroundColor: "#f3f8f8", padding: "18px 32px" };
const footerText = { fontSize: "13px", color: "#566675", margin: "0" };
const footerLink = { color: "#356f9a" };
