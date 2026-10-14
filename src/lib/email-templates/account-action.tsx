import * as React from "react";
import { Text } from "@react-email/components";
import { MasaaratShell, bodyTextForLocale, RecipientName } from "./masaarat-shell";
import type { SignupProfile } from "./signup-profile";

import { accountActionCopy, type AccountAction } from "./account-action-copy";

export type AccountActionProps = Partial<SignupProfile> & {
  kind: AccountAction;
  confirmationUrl?: string;
  token?: string;
  newEmail?: string;
};
export function AccountActionEmail({
  kind,
  locale = null,
  name = null,
  confirmationUrl,
  token,
  newEmail,
}: AccountActionProps) {
  const copy = accountActionCopy(kind, locale);
  return (
    <MasaaratShell
      locale={locale ?? "ar-MSA"}
      preview={copy.title}
      title={copy.title}
      actionLabel={copy.action}
      actionUrl={confirmationUrl}
      footerNote={copy.note}
    >
      {name ? (
        <Text dir={locale === "en" ? "ltr" : "rtl"} style={bodyTextForLocale(locale)}>
          {locale === "en" ? "Hello" : "مرحبًا"}
          <RecipientName name={name} />
        </Text>
      ) : null}
      <Text dir={locale === "en" ? "ltr" : "rtl"} style={bodyTextForLocale(locale)}>
        {copy.instruction}
      </Text>
      {kind === "email_change" && newEmail ? (
        <Text style={bodyTextForLocale(locale)}>
          <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {newEmail}
          </span>
        </Text>
      ) : null}
      {kind === "reauthentication" ? (
        <Text
          dir="ltr"
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            letterSpacing: "6px",
            color: "#243044",
            backgroundColor: "#f3f8f8",
            border: "1px solid #dce6ed",
            borderRadius: "10px",
            padding: "14px 20px",
            textAlign: "center",
            direction: "ltr",
          }}
        >
          {token}
        </Text>
      ) : null}
    </MasaaratShell>
  );
}
