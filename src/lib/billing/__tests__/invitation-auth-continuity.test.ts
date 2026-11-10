import { describe, expect, it } from "vitest";
import { authReturnNavigation, recoveryRedirectUrl } from "@/lib/auth-return";
import { emailAccessInvitationContent } from "../../../../supabase/functions/_shared/masaarat-mail";
import { isSafeAuthReturn, kidsSignupRedirect, parseAuthIntentSearch } from "@/lib/kids/auth-intent";

// Pure generated mail + actual auth parser/redirect; no email, account or provider operation.
describe("INV01 invitation destination continuity", () => {
  for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
    it(`preserves verified-account invitation acceptance destination in ${locale}`, () => {
      const message = emailAccessInvitationContent({ locale, recipient_email: "Recipient+grant@example.invalid", grant_kind: "single_curriculum", scope_mode: "selected", catalogues: ["ai:pro_plus"], duration_days: 30 });
      const match = message.text.match(/https:\/\/masaarat\.ai\/signup\?[^\s<]+/);
      expect(match).not.toBeNull();
      const signup = new URL(match![0]);
      expect(signup.searchParams.get("returnTo")).toBe("/account");
      const parsed = parseAuthIntentSearch(Object.fromEntries(signup.searchParams));
      expect(parsed).toMatchObject({locale, email: "Recipient+grant@example.invalid", returnTo: "/account"});
      // Login keeps this same parsed search; account verification uses the existing redirect helper.
      expect(kidsSignupRedirect("https://masaarat.ai", parsed)).toBe(`https://masaarat.ai/account?locale=${locale}`);
      expect(message.text).toMatch(locale === "en" ? /then accept/ : /اقبل|قبول/);
    });
  }
  it("permits only the exact protected account destination", () => {
    expect(isSafeAuthReturn("/account")).toBe(true);
    for (const destination of ["https://evil.invalid/account", "//evil.invalid/account", "/account?next=https://evil.invalid", "/account#next", "/account/../admin", "/%61ccount", "/account/", "/account\n"]) {
      expect(isSafeAuthReturn(destination)).toBe(false);
      expect(parseAuthIntentSearch({returnTo: destination})).not.toHaveProperty("returnTo");
    }
  });
});

describe("direct invitation authentication return", () => {
  const invitationId = "11111111-1111-4111-8111-111111111111";
  const returnTo = `/invitations/${invitationId}`;

  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "preserves the same invitation in %s after login, confirmation and password recovery",
    (locale) => {
      const search = parseAuthIntentSearch({ locale, returnTo });
      expect(authReturnNavigation(search)).toEqual({
        to: "/invitations/$invitationId",
        params: { invitationId },
        search: { locale },
        replace: true,
      });
      expect(kidsSignupRedirect("https://example.test", search)).toBe(
        `https://example.test${returnTo}?locale=${locale}`,
      );
      const recovery = new URL(recoveryRedirectUrl("https://example.test", search));
      expect(recovery.searchParams.get("returnTo")).toBe(returnTo);
    },
  );

  it.each([
    "/invitations/not-an-id",
    `//example.test${returnTo}`,
    `${returnTo}/`,
    `${returnTo}?next=/admin`,
    `${returnTo}#next`,
    `${returnTo}\n`,
    `/invitations/%2e%2e/${invitationId}`,
  ])("rejects a manipulated invitation destination %j", (value) => {
    expect(parseAuthIntentSearch({ returnTo: value })).not.toHaveProperty("returnTo");
  });
});
