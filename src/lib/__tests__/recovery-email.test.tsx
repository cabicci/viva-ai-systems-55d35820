import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { RecoveryEmail } from "../email-templates/recovery";
import { recoveryCopy } from "../email-templates/recovery-copy";
import { resolveSignupProfile } from "../email-templates/signup-profile";

const resetUrl = "https://auth.example.test/verify?token=safe&type=recovery";

describe("password recovery email", () => {
  it.each([
    ["ar-EG", "أهلًا", "اختار كلمة مرور جديدة", "ar", "rtl"],
    ["ar-MSA", "مرحبًا", "اختر كلمة مرور جديدة", "ar", "rtl"],
    ["ar-Gulf", "حيّاك الله", "اختر كلمة مرور جديدة", "ar", "rtl"],
    ["en", "Hello", "Choose a new password", "en", "ltr"],
  ] as const)(
    "renders the server profile in %s with its direction and reset link",
    async (locale, greeting, preview, lang, dir) => {
      const profile = await resolveSignupProfile(
        "sara@example.test",
        async (email) => {
          expect(email).toBe("sara@example.test");
          return [{ full_name: "Sara", preferred_locale: locale }];
        },
      );
      const html = await render(
        React.createElement(RecoveryEmail, {
          ...profile,
          confirmationUrl: resetUrl,
        }),
      );
      const doc = new DOMParser().parseFromString(html, "text/html");
      expect(
        Array.from(doc.querySelectorAll("p")).map((text) => text.textContent),
      ).toContain(`${greeting} Sara`);
      expect(doc.body.getAttribute("dir")).toBe(dir);
      doc.querySelectorAll("h1,p").forEach((text) => {
        expect((text as HTMLElement).style.direction).toBe(dir);
        expect((text as HTMLElement).style.textAlign).toBe(
          dir === "rtl" ? "right" : "left",
        );
      });
      expect(html).toContain(preview);
      expect(html).toContain(`lang="${lang}"`);
      expect(html).toContain(`dir="${dir}"`);
      expect(html).toContain(resetUrl.replaceAll("&", "&amp;"));
      expect(recoveryCopy(locale)?.subject).toBe(
        locale === "en"
          ? "Reset your password | Masaarat"
          : "إعادة تعيين كلمة المرور | مسارات",
      );
    },
  );

  it("keeps a bilingual recovery message and original link when profile lookup fails", async () => {
    const profile = await resolveSignupProfile(
      "sara@example.test",
      async () => {
        throw new Error("profile unavailable");
      },
    );
    expect(profile).toEqual({ name: null, locale: null });
    expect(recoveryCopy(profile.locale)).toBeNull();
    const html = await render(
      React.createElement(RecoveryEmail, {
        ...profile,
        confirmationUrl: resetUrl,
      }),
    );
    expect(html).toContain("Reset your password");
    expect(html).toContain("إعادة تعيين كلمة المرور");
    expect(html).toContain(resetUrl.replaceAll("&", "&amp;"));
    expect(html).not.toContain("Sara");
  });

  it("escapes the recipient name without modifying the recovery destination", async () => {
    const html = await render(
      React.createElement(RecoveryEmail, {
        name: "<script>alert(1)</script>",
        locale: "en",
        confirmationUrl: resetUrl,
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain(resetUrl.replaceAll("&", "&amp;"));
  });
});
