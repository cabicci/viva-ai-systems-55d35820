import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { authReturnNavigation, parseRecoveryIntentSearch } from "@/lib/auth-return";

export const Route = createFileRoute("/reset-password")({
  validateSearch: parseRecoveryIntentSearch,
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return { meta: [{ title: getUiString(locale, "auth.reset.title") + " — Masaarat" }] };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useUiString();
  const { locale } = useLocale();
  const rawSearch = Route.useSearch();
  const search = parseRecoveryIntentSearch({ ...rawSearch, locale: rawSearch.locale ?? locale });
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error(t("auth.reset.toast.passwordShort"));
    if (password !== confirm) return toast.error(t("auth.reset.toast.passwordMismatch"));
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.reset.toast.success"));
    navigate(authReturnNavigation(search));
  }

  return (
    <AuthShell title={t("auth.reset.title")} subtitle={t("auth.reset.subtitle")}>
      {!ready ? (
        <p className="text-center text-sm text-muted-foreground">{t("auth.reset.verifyLink")}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("auth.field.passwordNew")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t("auth.field.passwordConfirm")}</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? t("auth.reset.submitting") : t("auth.reset.submit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
