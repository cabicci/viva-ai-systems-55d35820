import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { SignupEmail, signupCopy } from "../email-templates/signup";
import { resolveSignupProfile } from "../email-templates/signup-profile";

describe("signup confirmation email", () => {
  it("uses the exact unique server profile to select name and locale", async () => {
    const profile = await resolveSignupProfile("sara@example.test", async (email) => {
      expect(email).toBe("sara@example.test");
      return [{ full_name: "  Sara  ", preferred_locale: "en" }];
    });
    expect(profile).toEqual({ name: "Sara", locale: "en" });
    expect(signupCopy(profile.locale)?.subject).toBe("Confirm your email | Masaarat");
    const html = await render(
      React.createElement(SignupEmail, {
        ...profile,
        siteUrl: "https://masaarat.ai",
        confirmationUrl: "https://auth.example.test/verify?token=safe",
      }),
    );
    expect(html).toContain("Hello<!-- --> Sara");
    expect(html).toContain('lang="en"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("https://auth.example.test/verify?token=safe");
  });

  it("fails closed to a bilingual greeting for missing, ambiguous, or failed lookup", async () => {
    for (const rows of [
      [],
      [
        { full_name: "One", preferred_locale: "en" },
        { full_name: "Two", preferred_locale: "en" },
      ],
    ]) {
      expect(await resolveSignupProfile("sara@example.test", async () => rows)).toEqual({
        name: null,
        locale: null,
      });
    }
    expect(
      await resolveSignupProfile("sara@example.test", async () => {
        throw new Error("database down");
      }),
    ).toEqual({ name: null, locale: null });
    const html = await render(
      React.createElement(SignupEmail, {
        name: null,
        locale: null,
        siteUrl: "https://masaarat.ai",
        confirmationUrl: "https://auth.example.test/verify",
      }),
    );
    expect(html).toContain("Confirm your email");
    expect(html).toContain("تأكيد البريد");
  });

  it("rejects unsafe names and unsupported languages without changing the confirmation link", async () => {
    expect(
      await resolveSignupProfile("sara@example.test", async () => [
        { full_name: "Eve\nAdmin", preferred_locale: "fr" },
      ]),
    ).toEqual({ name: null, locale: null });
    const html = await render(
      React.createElement(SignupEmail, {
        name: "<script>alert(1)</script>",
        locale: "ar-EG",
        siteUrl: "https://masaarat.ai",
        confirmationUrl: "https://auth.example.test/verify",
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
