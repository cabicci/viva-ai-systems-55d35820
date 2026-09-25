import * as React from "react";
import { createAuthEmailHandler } from "@lovable.dev/email-js";
import { createFileRoute } from "@tanstack/react-router";
import { SignupEmail, signupCopy } from "@/lib/email-templates/signup";
import { resolveSignupProfile } from "@/lib/email-templates/signup-profile";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";

// Configuration
const SITE_NAME = "مسارات | Masaarat";
const SENDER_DOMAIN = "auth.masaarat.ai";
const ROOT_DOMAIN = "masaarat.ai";
const FROM_DOMAIN = "auth.masaarat.ai";
const SITE_URL = `https://${ROOT_DOMAIN}`;

// The SDK handler owns verification, dispatch, and retry semantics; this file
// owns only the email decisions: subjects, templates, and per-type props.
export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const handler = createAuthEmailHandler({
          apiKey: process.env["LOVABLE_API_KEY"]!,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          senderDomain: SENDER_DOMAIN,
          sendUrl: process.env["LOVABLE_SEND_URL"],
          emails: {
            signup: async (data) => {
              // The SDK verifies the webhook signature before it calls this function.
              const profile = await resolveSignupProfile(data.email, async (email) => {
                // Load the privileged client only inside the verified server-only handler.
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                const result = await supabaseAdmin.rpc(
                  "auth_signup_email_profile" as never,
                  {
                    p_email: email,
                  } as never,
                );
                if (result.error) throw result.error;
                return (result.data ?? []) as Array<{
                  full_name: unknown;
                  preferred_locale: unknown;
                }>;
              });
              return {
                subject:
                  signupCopy(profile.locale)?.subject ??
                  "تأكيد بريدك | Confirm your email | Masaarat",
                element: React.createElement(SignupEmail, {
                  siteUrl: SITE_URL,
                  confirmationUrl: data.url,
                  ...profile,
                }),
              };
            },
            invite: {
              subject: "دعوتك إلى مسارات | Your Masaarat invite",
              render: (data) =>
                React.createElement(InviteEmail, {
                  siteName: SITE_NAME,
                  siteUrl: SITE_URL,
                  confirmationUrl: data.url,
                }),
            },
            magiclink: {
              subject: "رابط تسجيل الدخول | Your login link",
              render: (data) =>
                React.createElement(MagicLinkEmail, {
                  siteName: SITE_NAME,
                  confirmationUrl: data.url,
                }),
            },
            recovery: {
              subject: "إعادة تعيين كلمة المرور | Reset your password",
              render: (data) =>
                React.createElement(RecoveryEmail, {
                  siteName: SITE_NAME,
                  confirmationUrl: data.url,
                }),
            },
            email_change: {
              subject: "تأكيد بريدك الجديد | Confirm your new email",
              render: (data) =>
                React.createElement(EmailChangeEmail, {
                  siteName: SITE_NAME,
                  oldEmail: data.old_email ?? "",
                  email: data.email,
                  newEmail: data.new_email ?? "",
                  confirmationUrl: data.url,
                }),
            },
            reauthentication: {
              subject: "رمز التحقق | Your verification code",
              render: (data) =>
                React.createElement(ReauthenticationEmail, { token: data.token ?? "" }),
            },
          },
        });
        return handler(request);
      },
    },
  },
});
