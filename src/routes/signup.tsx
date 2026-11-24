import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { useLocale } from "@/lib/locale/locale-context";
import { kidsSignupRedirect, parseAuthIntentSearch } from "@/lib/kids/auth-intent";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { rememberPendingRegistration } from "@/lib/registration-analytics";
import { authReturnNavigation } from "@/lib/auth-return";

export const Route = createFileRoute("/signup")({
  validateSearch: parseAuthIntentSearch,
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return buildLocalizedPublicMeta(locale, "signup");
  },
  component: SignupPage,
});

function SignupPage() {
  const t = useUiString();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [offerEmails, setOfferEmails] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (fullName.trim().length < 2) return toast.error(t("auth.signup.nameRequired"));
    submitting.current = true;
    setFailure(null);
    setLoading(true);
    const signupEmail = email.trim();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          emailRedirectTo: kidsSignupRedirect(window.location.origin, search),
          data: {
            full_name: fullName.trim(),
            preferred_locale: locale,
            ...(offerEmails ? { offer_email_consent: "signup-offer-email-v1" } : {}),
          },
        },
      });
      if (error) {
        setFailure(error.message);
        toast.error(error.message);
        return;
      }
      if (search.intent !== "kids") rememberPendingRegistration(data?.user);
      setPassword("");
      if (data?.session) {
        navigate(authReturnNavigation({ ...search, locale: search.locale ?? locale }));
      } else {
        setSubmittedEmail(signupEmail);
        toast.success(t("auth.signup.toast.success"));
      }
    } catch {
      const message = t("auth.signup.error.connection");
      setFailure(message);
      toast.error(message);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.subtitle")}
      showLanguageSelector
    >
      {submittedEmail !== null ? (
        <div className="space-y-4">
          <p role="status" className="rounded-lg border border-border p-4 text-sm leading-7">
            {t("auth.signup.toast.success")}
          </p>
          <Button asChild variant="hero" size="lg" className="w-full">
            <Link to="/login" search={{ ...search, locale, email: submittedEmail }}>
              {t("auth.link.login")}
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-full-name">{t("auth.field.fullName")}</Label>
            <Input
              id="signup-full-name"
              name="name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">{t("auth.field.email")}</Label>
            <Input
              id="signup-email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">{t("auth.field.password")}</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <label className="flex min-h-11 items-start gap-2 text-sm">
            <input
              className="mt-1"
              type="checkbox"
              checked={offerEmails}
              onChange={(event) => setOfferEmails(event.currentTarget.checked)}
            />
            <span>
              {t("auth.signup.offerEmails")}
              <small className="block text-muted-foreground">
                {t("auth.signup.offerEmailsHint")}
              </small>
            </span>
          </label>
          <nav
            aria-label={t("auth.signup.policies")}
            className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"
          >
            <a
              href={`/terms?locale=${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline focus-visible:outline focus-visible:outline-2"
            >
              {t("footer.terms")}
              <span className="sr-only"> — {t("auth.signup.policyNewTab")}</span>
            </a>
            <a
              href={`/privacy?locale=${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline focus-visible:outline focus-visible:outline-2"
            >
              {t("footer.privacy")}
              <span className="sr-only"> — {t("auth.signup.policyNewTab")}</span>
            </a>
          </nav>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              t("auth.signup.submitting")
            ) : (
              <>
                {t("auth.signup.submit")} <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </Button>
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t("auth.signup.footerHasAccount")}{" "}
        <Link to="/login" search={search} className="text-primary hover:underline">
          {t("auth.link.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
