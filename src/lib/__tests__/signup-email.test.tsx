import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { SignupEmail, signupCopy } from "../email-templates/signup";
import { resolveSignupProfile } from "../email-templates/signup-profile";

describe("signup confirmation email", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "aligns the actual email content and action for %s without relying on html inheritance",
    async (locale) => {
      const url = "https://auth.example.test/verify?token=safe";
      const html = await render(
        React.createElement(SignupEmail, {
          name: "Test4",
          locale,
          siteUrl: "https://masaarat.ai",
          confirmationUrl: url,
        }),
      );
      const doc = new DOMParser().parseFromString(html, "text/html");
      const direction = locale === "en" ? "ltr" : "rtl";
      const alignment = locale === "en" ? "left" : "right";
      expect(doc.body.getAttribute("dir")).toBe(direction);
      const cells = doc.querySelectorAll("td[dir]");
      expect(cells.length).toBe(3);
      cells.forEach((cell) => {
        expect(cell.getAttribute("dir")).toBe(direction);
        expect(cell.getAttribute("align")).toBe(alignment);
        expect((cell as HTMLElement).style.textAlign).toBe(alignment);
      });
      doc.querySelectorAll("h1,p").forEach((text) => {
        expect((text as HTMLElement).style.textAlign).toBe(alignment);
        expect((text as HTMLElement).style.direction).toBe(direction);
      });
      const greeting = Array.from(doc.querySelectorAll("p")).find((text) =>
        text.textContent?.includes("Test4"),
      );
      expect(greeting?.querySelector('span[dir="auto"]')?.textContent).toBe(
        "Test4",
      );
      const action = doc.querySelector(`a[href="${url}"]`);
      expect(action?.textContent).toBe(signupCopy(locale)?.action);
      expect(action?.closest("td")?.getAttribute("align")).toBe(alignment);
    },
  );
  it("uses the exact unique server profile to select name and locale", async () => {
    const profile = await resolveSignupProfile(
      "sara@example.test",
      async (email) => {
        expect(email).toBe("sara@example.test");
        return [{ full_name: "  Sara  ", preferred_locale: "en" }];
      },
    );
    expect(profile).toEqual({ name: "Sara", locale: "en" });
    expect(signupCopy(profile.locale)?.subject).toBe(
      "Confirm your email | Masaarat",
    );
    const html = await render(
      React.createElement(SignupEmail, {
        ...profile,
        siteUrl: "https://masaarat.ai",
        confirmationUrl: "https://auth.example.test/verify?token=safe",
      }),
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(
      Array.from(doc.querySelectorAll("p")).map((text) => text.textContent),
    ).toContain("Hello Sara");
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
      expect(
        await resolveSignupProfile("sara@example.test", async () => rows),
      ).toEqual({
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
