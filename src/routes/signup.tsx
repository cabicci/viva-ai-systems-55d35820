import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { useLocale } from "@/lib/locale/locale-context";
import { kidsSignupRedirect, parseAuthIntentSearch } from "@/lib/kids/auth-intent";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast.error(t("auth.signup.nameRequired"));
    if (password !== confirmPassword) return toast.error(t("auth.reset.toast.passwordMismatch"));
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: kidsSignupRedirect(window.location.origin, search),
        data: { full_name: fullName.trim(), preferred_locale: locale },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.signup.toast.success"));
    navigate({ to: "/login", search, replace: true });
  }

  return (
    <AuthShell
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.subtitle")}
      showLanguageSelector
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-full-name">{t("auth.field.fullName")}</Label>
          <Input
            id="signup-full-name"
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
          <Label>{t("auth.field.email")}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">{t("auth.field.password")}</Label>
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password-confirm">{t("auth.field.passwordConfirm")}</Label>
          <PasswordInput
            id="signup-password-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            t("auth.signup.submitting")
          ) : (
            <>
              {t("auth.signup.submit")} <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t("auth.signup.footerHasAccount")}{" "}
        <Link to="/login" search={search} className="text-primary hover:underline">
          {t("auth.link.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
