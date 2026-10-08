import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PhoneVerification } from "@/components/communications/PhoneVerification";
import { phoneVerificationTitle } from "@/lib/communications/phone-copy";
import { LanguageSelector } from "@/components/locale/LanguageSelector";
import { useAuth } from "@/lib/auth-context";
import { AuthSessionGate, isRedirect, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/verify-phone")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: async ({ search }) => {
    try {
      await requireAuthBeforeLoad();
    } catch (error) {
      if (!isRedirect(error)) throw error;
      throw redirect({
        to: "/login",
        search: { locale: search.locale, returnTo: "/verify-phone" },
        replace: true,
      });
    }
  },
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return {
      meta: [
        { title: `${phoneVerificationTitle(locale)} | Masaarat` },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: VerifyPhonePage,
});

function VerifyPhonePage() {
  const { locale } = useLocale();
  return (
    <AuthSessionGate loginSearch={{ locale, returnTo: "/verify-phone" }}>
      <VerifyPhoneContent />
    </AuthSessionGate>
  );
}

function VerifyPhoneContent() {
  const { user } = useAuth();
  const { locale, dir } = useLocale();
  const t = useUiString();
  return (
    <main className="min-h-dvh px-4 py-8 sm:py-12" dir={dir}>
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" search={{ locale }} aria-label={t("nav.brand")}>
            <img
              src="/brand/masaarat-logo-lockup.png"
              alt={t("nav.brand")}
              className="h-9 w-auto"
            />
          </Link>
          <LanguageSelector />
        </div>
        <p className="mb-3 break-all text-sm text-muted-foreground">
          <bdi dir="ltr">{user?.email}</bdi>
        </p>
        <PhoneVerification key={user?.id} standalone />
        <Link to="/account" search={{ locale }} className="text-sm text-primary underline">
          {t("account.title")}
        </Link>
      </div>
    </main>
  );
}
