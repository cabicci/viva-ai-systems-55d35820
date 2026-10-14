import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@react-email/render";
import { AccountActionEmail } from "../email-templates/account-action";
import { accountActionCopy, type AccountAction } from "../email-templates/account-action-copy";
import {
  emailAccessInvitationContent,
  invitationContent,
  paymentConfirmationContent,
  subscriptionContent,
} from "../../../supabase/functions/_shared/masaarat-mail";
import { runEmailAccessMailJob } from "../../../supabase/functions/_shared/email-access-mail-worker";
const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
const kinds: AccountAction[] = ["invite", "magiclink", "email_change", "reauthentication"];
const authUrl =
  "https://auth.example.test/verify?token_hash=unchanged&redirect_to=https%3A%2F%2Fmasaarat.ai%2Faccount";
describe("localized neutral platform emails", () => {
  for (const kind of kinds)
    it.each(locales)(`${kind} uses %s without changing auth data`, async (locale) => {
      const html = await render(
        <AccountActionEmail
          kind={kind}
          locale={locale}
          name="<script>name</script>"
          confirmationUrl={kind === "reauthentication" ? undefined : authUrl}
          token="123456"
          newEmail="new@example.test"
        />,
      );
      const text = await render(
        <AccountActionEmail kind={kind} locale={locale} confirmationUrl={authUrl} token="123456" />,
        { plainText: true },
      );
      const doc = new DOMParser().parseFromString(html, "text/html");
      expect(doc.documentElement.lang).toBe(locale === "en" ? "en" : "ar");
      expect(doc.body.getAttribute("dir")).toBe(locale === "en" ? "ltr" : "rtl");
      expect(doc.querySelector("h1")?.textContent).toBe(accountActionCopy(kind, locale).title);
      expect(text).toContain(accountActionCopy(kind, locale).instruction);
      expect(text + html).not.toMatch(/Pro Plus|Builder|باقة|pricing/);
      expect(html).not.toContain("<script>name</script>");
      if (kind !== "reauthentication")
        expect([...doc.querySelectorAll("a")].some((a) => a.href === authUrl)).toBe(true);
      else expect(doc.body.textContent).toContain("123456");
      expect(html).toContain("/contact?locale=" + locale);
    });
  it.each(kinds)("keeps %s bilingual when recipient locale is unknown", async (kind) => {
    const html = await render(
      <AccountActionEmail kind={kind} confirmationUrl={authUrl} token="123456" />,
    );
    expect(html).toContain(accountActionCopy(kind, "en").instruction);
    expect(html).toContain(accountActionCopy(kind, "ar-MSA").instruction);
  });
  it.each(locales)("uses friendly selected scopes and conditional Kids notes in %s", (locale) => {
    const technical = emailAccessInvitationContent({
      locale,
      scope_mode: "selected",
      catalogues: ["technical:furniture"],
      duration_days: 14,
    });
    expect(technical.text).toContain(
      locale === "en" ? "carpentry and furniture" : "النجارة وصناعة الأثاث",
    );
    expect(technical.text).not.toMatch(/technical:furniture|Kids|الأطفال|ولي الأمر/);
    const academic = emailAccessInvitationContent({
      locale,
      scope_mode: "selected",
      catalogues: ["academic:course-1"],
      catalogue_titles: { "academic:course-1": "Project Management <Course>" },
      duration_days: null,
    });
    expect(academic.text).toContain("Project Management <Course>");
    expect(academic.html).toContain("Project Management &lt;Course&gt;");
    expect(academic.text).not.toContain("academic:course-1");
    const kids = emailAccessInvitationContent({
      locale,
      scope_mode: "selected",
      catalogues: ["kids"],
      duration_days: 14,
    });
    expect(kids.text).toContain(locale === "en" ? "guardian consent" : "ولي الأمر");
  });
  it("resolves academic names once from the server catalogue, after grant authorization", async () => {
    const rows = [1, 2].map((n) => ({
      id: String(n),
      claim_token: "claim",
      recipient: "recipient@example.test",
      payload: {
        locale: "en",
        scope_mode: "selected",
        catalogues: ["academic:course-1"],
        duration_days: 30,
      },
    }));
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => ({
      error: null,
      data:
        name === "academic_catalogue"
          ? [{ id: "course-1", title: "Project management" }]
          : args.p_action === "claim"
            ? rows
            : true,
    }));
    const send = vi.fn(async () => ({ ok: true as const, emailId: "synthetic" }));
    await runEmailAccessMailJob({ rpc }, send);
    expect(rpc.mock.calls.filter(([name]) => name === "academic_catalogue")).toEqual([
      ["academic_catalogue", { p_locale: "en" }],
    ]);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@example.test",
        text: expect.stringContaining("Project management"),
      }),
    );
    expect(rpc.mock.calls[1][1].p_action).toBe("authorize_attempt");
  });
  it("does not load titles or send for an unauthorized grant", async () => {
    const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => ({
      error: null,
      data:
        args.p_action === "claim"
          ? [{ id: "1", claim_token: "claim", payload: { catalogues: ["academic:x"] } }]
          : false,
    }));
    const send = vi.fn();
    await runEmailAccessMailJob({ rpc }, send);
    expect(send).not.toHaveBeenCalled();
    expect(rpc.mock.calls).toHaveLength(2);
  });
  it("keeps package details on financial and package-specific invitations", () => {
    for (const packageName of ["pro", "pro_plus", "kids", "technical", "academic"]) {
      const payment = paymentConfirmationContent({
        order_id: "00000000-0000-4000-8000-000000000001",
        package: packageName,
        locale: "en",
        reference: "ORDER-TEST",
        amount_minor: 10000,
        currency: "EGP",
      });
      expect(payment.text).toContain("ORDER-TEST");
      expect(payment.text).toContain("100.00");
      const invite = invitationContent({
        id: "00000000-0000-4000-8000-000000000001",
        package: packageName,
        locale: "ar-EG",
        duration_days: 30,
        deadline: "2030-01-01",
        access_kind: "free",
      });
      expect(invite.text).toContain("عندك دعوة");
      expect(invite.text).toContain("30");
      expect(invite.text.includes("ولي الأمر")).toBe(packageName === "kids");
    }
    expect(subscriptionContent("technical", "activated", null, "en").text).toContain("TECH");
    expect(subscriptionContent("academic", "renewed", null, "en").text).toContain("Academic");
  });
});
