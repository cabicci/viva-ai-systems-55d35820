import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/login")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    return buildLocalizedPublicMeta(locale, "login");
  },
  component: LoginPage,
});

function LoginPage() {
  const t = useUiString();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setFailed(true);
      return toast.error(error.message);
    }
    toast.success(t("auth.login.toast.success"));
    window.location.assign("/dashboard");
  }

  return (
    <AuthShell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t("auth.field.email")}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.field.password")}</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
      {failed && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-center">
          <p className="mb-2">{t("auth.login.failedMessage")}</p>
          <Link to="/forgot-password" className="text-primary hover:underline font-medium">
            {t("auth.link.resetPassword")}
          </Link>
        </div>
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t("auth.login.footerNew")}{" "}
        <Link to="/signup" className="text-primary hover:underline">
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
