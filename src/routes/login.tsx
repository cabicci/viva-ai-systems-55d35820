import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth, type AuthGeneration } from "@/lib/auth-context";
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
import { parseAuthIntentSearch, type AuthIntentSearch } from "@/lib/kids/auth-intent";
import { parsePaymentLoginSearch } from "@/lib/commerce/payment-links";
import { authReturnNavigation, parseRecoveryIntentSearch } from "@/lib/auth-return";
import { useLocale } from "@/lib/locale/locale-context";
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
  const { locale } = useLocale();
  const auth = useAuth();
  const search: AuthIntentSearch & ReturnType<typeof parsePaymentLoginSearch> = Route.useSearch();
  const isOrdinaryReturn = search.intent !== "kids" && !(search.paymentView && search.order);
  const returnKey = JSON.stringify({ ...search, locale: search.locale ?? locale });
  const liveReturnKey = useRef(returnKey);
  liveReturnKey.current = returnKey;
  const recoverySearch = parseRecoveryIntentSearch({ ...search, locale: search.locale ?? locale });
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ReturnType<typeof loginErrorPresentation> | null>(null);
  type ReturnIntent = {
    active: boolean;
    startedGeneration: AuthGeneration;
    expectedUserId: string | null;
    publishedUsers: Set<string | null>;
    search: typeof search;
    key: string;
  };
  const alive = useRef(false);
  const latestReturn = useRef<ReturnIntent | null>(null);
  const [pendingReturn, setPendingReturn] = useState<{ intent: ReturnIntent } | null>(null);
  const owns = (intent: ReturnIntent) =>
    alive.current && intent.active && latestReturn.current === intent &&
    liveReturnKey.current === intent.key;
  const retire = (intent: ReturnIntent | null) => {
    if (!intent) return;
    intent.active = false;
    if (latestReturn.current !== intent) return;
    latestReturn.current = null;
    if (alive.current) {
      setPendingReturn(null);
      setLoading(false);
    }
  };
  useLayoutEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      retire(latestReturn.current);
    };
  }, []);
  useLayoutEffect(() => {
    const intent = latestReturn.current;
    if (intent && intent.key !== returnKey) retire(intent);
  }, [returnKey]);
  useLayoutEffect(() => {
    const intent = latestReturn.current;
    if (!intent || !owns(intent) || auth.loading ||
      auth.authGeneration === intent.startedGeneration) return;
    intent.publishedUsers.add(auth.user?.id ?? null);
    if (intent.expectedUserId &&
      [...intent.publishedUsers].some(id => id !== intent.expectedUserId)) retire(intent);
  }, [auth.user?.id, auth.loading, auth.authGeneration]);
  useEffect(() => {
    const intent = pendingReturn?.intent;
    if (!isOrdinaryReturn || !intent || !owns(intent) || !intent.expectedUserId ||
      auth.loading || auth.authGeneration === intent.startedGeneration) return;
    if (
      auth.user?.id !== intent.expectedUserId ||
      [...intent.publishedUsers].some(id => id !== intent.expectedUserId) ||
      !auth.isAuthGenerationCurrent(auth.authGeneration)
    ) { retire(intent); return; }
    retire(intent);
    navigate(authReturnNavigation(intent.search));
  }, [pendingReturn, auth, navigate, isOrdinaryReturn]);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isOrdinaryReturn && (loading || pendingReturn)) return;
    let intent: ReturnIntent | null = null;
    if (isOrdinaryReturn) {
      retire(latestReturn.current);
      intent = {
        active: true,
        startedGeneration: auth.authGeneration,
        expectedUserId: null,
        publishedUsers: new Set(),
        search: { ...search, locale: search.locale ?? locale },
        key: returnKey,
      };
      latestReturn.current = intent;
      setPendingReturn({ intent });
    }
    setFailure(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (intent && !owns(intent)) return;
      if (error) throw error;
      if (intent) {
        intent.expectedUserId = data.user!.id;
        if ([...intent.publishedUsers].some(id => id !== intent!.expectedUserId)) {
          retire(intent);
          return;
        }
        setPendingReturn({ intent });
      }
    } catch (error) {
      if (intent && !owns(intent)) return;
      if (intent) retire(intent);
      const presentation = loginErrorPresentation(error);
      setFailure(presentation);
      toast.error(t(presentation.key));
      return;
    } finally {
      if (!intent || owns(intent)) setLoading(false);
    }
    if (intent && !owns(intent)) return;
    toast.success(t("auth.login.toast.success"));
    if (search.intent === "kids") {
      navigate({ to: "/kids/family", search: { locale: search.locale }, replace: true });
    } else if (search.paymentView && search.order) {
      navigate({
        to: search.paymentView === "admin" ? "/admin/commerce" : "/payments",
        search: { order: search.order, locale: search.locale },
        replace: true,
      });
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
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || (isOrdinaryReturn && pendingReturn !== null)}>
          {loading || (isOrdinaryReturn && pendingReturn !== null) ? (
            t("auth.login.submitting")
          ) : (
            <>
              {t("auth.login.submit")} <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
        {isOrdinaryReturn && pendingReturn && (
          <Button type="button" variant="glass" onClick={() => retire(pendingReturn.intent)}>
            {locale === "en" ? "Cancel continuation" : "إلغاء المتابعة"}
          </Button>
        )}
      </form>
      {failure && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-center"
        >
          <p className="mb-2">{t(failure.key)}</p>
          {failure.canReset && (
            <Link
              to="/forgot-password"
              search={recoverySearch}
              className="text-primary hover:underline font-medium"
            >
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
        <Link
          to="/forgot-password"
          search={recoverySearch}
          className="text-primary hover:underline"
        >
          {t("auth.link.forgotPassword")}
        </Link>
      </p>
    </AuthShell>
  );
}
