import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { parseAuthIntentSearch } from "@/lib/kids/auth-intent";
import { parsePaymentLoginSearch } from "@/lib/commerce/payment-links";
import { loginErrorPresentation } from "@/lib/login-error";

export const Route = createFileRoute("/login")({
  validateSearch: (raw) => ({ ...parseAuthIntentSearch(raw), ...parsePaymentLoginSearch(raw) }),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return buildLocalizedPublicMeta(locale, "login");
  },
  component: LoginPage,
});

function LoginPage() {
  const t = useUiString();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ReturnType<typeof loginErrorPresentation> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      const presentation = loginErrorPresentation(error);
      setFailure(presentation);
      toast.error(t(presentation.key));
      return;
    } finally {
      setLoading(false);
    }
    toast.success(t("auth.login.toast.success"));
    if (search.intent === "kids") {
      navigate({ to: "/kids/family", search: { locale: search.locale }, replace: true });
    } else if (search.paymentView && search.order) {
      navigate({
        to: search.paymentView === "admin" ? "/admin/commerce" : "/payments",
        search: { order: search.order, locale: search.locale },
        replace: true,
      });
    } else {
      navigate({ to: "/dashboard", replace: true });
    }
  }

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      showLanguageSelector
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{t("auth.field.email")}</Label>
          <Input
            id="login-email"
            name="email"
            autoComplete="username"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">{t("auth.field.password")}</Label>
          <Input
            id="login-password"
            name="password"
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            t("auth.login.submitting")
          ) : (
            <>
              {t("auth.login.submit")} <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      {failure && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-center"
        >
          <p className="mb-2">{t(failure.key)}</p>
          {failure.canReset && (
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">
              {t("auth.link.resetPassword")}
            </Link>
          )}
        </div>
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t("auth.login.footerNew")}{" "}
        <Link to="/signup" search={{ ...search }} className="text-primary hover:underline">
          {t("auth.link.signup")}
        </Link>
        <span className="mx-2">·</span>
        <Link to="/forgot-password" className="text-primary hover:underline">
          {t("auth.link.forgotPassword")}
        </Link>
      </p>
    </AuthShell>
  );
}
