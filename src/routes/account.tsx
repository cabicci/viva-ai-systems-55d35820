import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccountSubscriptions } from "@/lib/billing/subscription-display.functions";
import { currentSubscriptionData, subscriptionRefreshInterval, subscriptionCopy, sourceState, sourceTitle, paymentLabel, allowedPortalScope, type AccountSubscriptions, type DisplayLocale } from "@/lib/billing/subscription-display";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Flame,
  Clock,
  BookCheck,
  Shield,
  KeyRound,
  LogOut,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AuthSessionGate, requireAuthBeforeLoadWithIntent } from "@/lib/auth-route-guard";
import { useEntitlement, useStreak } from "@/lib/entitlements";
import { captureError } from "@/lib/error-capture";
import { LESSONS } from "@/lib/lesson-catalog";
import { PATHS } from "@/lib/curriculum-data";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { StripePortalButton } from "@/components/billing/StripePortalButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";
import { KidsConsentControl } from "@/components/kids/KidsConsentControl";
import { KidsAiConsentControl } from "@/components/kids/KidsAiConsentControl";
import { CommercialInvitations } from "@/components/billing/CommercialInvitations";
import { PhoneVerification } from "@/components/communications/PhoneVerification";

const DATE_LOCALE: Record<SupportedLocale, string> = {
  "ar-EG": "ar-EG",
  "ar-MSA": "ar",
  "ar-Gulf": "ar-AE",
  en: "en",
};

export const Route = createFileRoute("/account")({
  beforeLoad: ({ search }) =>
    requireAuthBeforeLoadWithIntent({ locale: search.locale, returnTo: "/account" }),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    return buildLocalizedLearnerMeta(locale, "account");
  },
  component: AccountPage,
});

function formatDate(iso: string | null | undefined, locale: SupportedLocale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE[locale], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDuration(totalSeconds: number, t: (key: UiStringKey) => string) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) {
    return t("account.stats.durationHoursMinutes")
      .replace("{hours}", String(h))
      .replace("{minutes}", String(m));
  }
  return t("account.stats.durationMinutes").replace("{minutes}", String(m));
}

function formatDays(count: number, t: (key: UiStringKey) => string) {
  return t(count === 1 ? "account.stats.daysUnitOne" : "account.stats.daysUnit").replace(
    "{count}",
    String(count),
  );
}

function AccountPage() {
  const { locale } = useLocale();
  return (
    <AuthSessionGate loginSearch={{ locale, returnTo: "/account" }}>
      <AccountContent />
    </AuthSessionGate>
  );
}

function AccountContent() {
  const t = useUiString();
  const { locale, dir } = useLocale();
  const { user, signOut } = useAuth();
  const ent = useEntitlement();
  const { streak } = useStreak();
  const [sendingReset, setSendingReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userId = user!.id;
  const email = user!.email ?? "";
  const admin = ent.isAdmin;

  const ALL_LESSON_IDS = (() => {
    const ids = new Set<string>(LESSONS.map((l) => l.id));
    for (const p of PATHS) {
      for (const m of p.modules) {
        for (const l of m.lessons) ids.add(l.id);
      }
    }
    return ids;
  })();
  const totalLessons = ALL_LESSON_IDS.size;

  const subscriptionFn = useServerFn(getAccountSubscriptions);
  const subscriptions = useQuery({
    queryKey: ["account-subscription-display", userId],
    queryFn: () => subscriptionFn({ data: { expectedAccountId: userId! } }),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => subscriptionRefreshInterval(query.state.data),
  });

  const { data: activitySec } = useQuery({
    queryKey: ["account-activity-time", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data } = await supabase
        .from("user_activity_time")
        .select("total_seconds")
        .eq("user_id", userId)
        .maybeSingle();
      return (data?.total_seconds as number | undefined) ?? 0;
    },
    enabled: !!userId,
  });

  const { data: completedCount } = useQuery({
    queryKey: ["account-completed-lessons", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("status", "completed");
      const unique = new Set(
        (data ?? []).map((r) => r.lesson_id as string).filter((id) => ALL_LESSON_IDS.has(id)),
      );
      return unique.size;
    },
    enabled: !!userId,
  });


  const handleSendReset = async () => {
    if (!email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t("auth.forgot.toast.success"));
    } catch (e) {
      toast.error(t("account.manage.toast.resetError"));
      captureError("account:reset-password", e);
    } finally {
      setSendingReset(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.rpc("request_account_deletion");
      if (error) throw error;
      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        data.status !== "pending_review"
      ) {
        throw new Error("ACCOUNT_DELETION_REQUEST_UNCONFIRMED");
      }
      toast.success(t("account.manage.toast.deleteSuccess"));
    } catch (e) {
      toast.error(t("account.manage.toast.deleteError"));
      captureError("account:delete-data", e);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const avatarLetter = (email[0] ?? "?").toUpperCase();
  const joinedLabel = t("account.profile.joinedOn").replace(
    "{date}",
    formatDate(user?.created_at, locale),
  );

  return (
    <div className="min-h-dvh flex flex-col" dir={dir}>
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-8 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("account.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("account.subtitle")}</p>
          </div>
          <Button asChild variant="glass" size="sm" className="shrink-0">
            <Link to="/dashboard">
              <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />{" "}
              {t("sidebar.dashboard")}
            </Link>
          </Button>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 mb-5">
          <section className="glass min-w-0 max-w-full rounded-2xl p-6 border border-border/50">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-2xl font-black text-primary-foreground glow-primary">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t("account.profile.label")}</p>
                <p className="text-lg font-bold truncate">{email || t("sidebar.guest")}</p>
                {admin && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                    <Shield className="h-3 w-3" /> {t("account.profile.adminBadge")}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{joinedLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 font-mono text-xs truncate">{userId ?? "—"}</span>
              </div>
            </div>
          </section>

          <section className="glass min-w-0 max-w-full break-words rounded-2xl p-6 border border-border/50 flex flex-col">
            {admin && <p className="mb-3 text-sm text-primary">{t("account.subscription.adminAccessNotice")}</p>}
            <SubscriptionSources data={subscriptions.data} accountId={userId} locale={locale}
              loading={subscriptions.isLoading} error={subscriptions.isError}
              retry={() => { void subscriptions.refetch(); }} />
            <Button asChild variant="outline" className="mt-5">
              <Link to="/pricing">{subscriptionCopy[locale].browse}</Link>
            </Button>
          </section>
        </div>

        <section className="glass rounded-2xl p-6 border border-border/50 mb-5">
          <p className="text-xs text-muted-foreground mb-4">{t("account.stats.title")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              label={t("account.stats.streakCurrent")}
              value={formatDays(streak.current_streak, t)}
            />
            <StatTile
              icon={<Flame className="h-4 w-4 text-amber-400" />}
              label={t("account.stats.streakLongest")}
              value={formatDays(streak.longest_streak, t)}
            />
            <StatTile
              icon={<Clock className="h-4 w-4 text-sky-400" />}
              label={t("account.stats.activityTime")}
              value={formatDuration(activitySec ?? 0, t)}
            />
            <StatTile
              icon={<BookCheck className="h-4 w-4 text-emerald-400" />}
              label={t("account.stats.lessonsCompleted")}
              value={`${completedCount ?? 0} / ${totalLessons}`}
            />
          </div>
        </section>

        <section className="glass rounded-2xl p-6 border border-border/50 mb-5">
          <KidsConsentControl />
        </section>

        <div className="mb-5"><KidsAiConsentControl hideWhenEmpty /></div>

        <PhoneVerification key={userId} />
        <CommercialInvitations userId={userId} locale={locale} />

        <section className="glass rounded-2xl p-6 border border-border/50">
          <p className="text-xs text-muted-foreground mb-4">{t("account.manage.title")}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="glass"
              size="lg"
              onClick={handleSendReset}
              disabled={sendingReset || !email}
              className="justify-start"
            >
              <KeyRound className="h-4 w-4" />
              {sendingReset
                ? t("account.manage.resetPasswordSending")
                : t("account.manage.resetPassword")}
            </Button>
            <Button variant="glass" size="lg" onClick={() => signOut()} className="justify-start">
              <LogOut className="h-4 w-4" /> {t("sidebar.signOut")}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setConfirmDelete(true)}
              className="justify-start"
            >
              <Trash2 className="h-4 w-4" /> {t("account.manage.deleteAccount")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">{t("account.manage.deleteNote")}</p>
        </section>

        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent
            dir={dir}
            className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg"
          >
            <DialogHeader>
              <DialogTitle>{t("account.deleteDialog.title")}</DialogTitle>
              <DialogDescription>{t("account.deleteDialog.description")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="glass" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                {t("account.deleteDialog.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting
                  ? t("account.deleteDialog.confirming")
                  : t("account.deleteDialog.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

/** Exported presentation boundary: it never decides lesson or assistant rights. */
export function SubscriptionSources({
  data,
  accountId,
  locale,
  loading,
  error,
  retry,
}: {
  data?: AccountSubscriptions;
  accountId: string | null;
  locale: DisplayLocale;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const c = subscriptionCopy[locale];
  const current = currentSubscriptionData(data, accountId, error);
  return (
    <div aria-live="polite">
      <h2 className="mb-4 text-xl font-bold">{c.title}</h2>
      {loading ? (
        <p>{c.loading}</p>
      ) : !current ? (
        <div role="alert">
          <p>{c.unavailable}</p>
          <Button variant="outline" onClick={retry}>
            {c.retry}
          </Button>
        </div>
      ) : current.sources.length === 0 ? (
        <p>{c.empty}</p>
      ) : (
        <ul className="space-y-4">
          {current.sources.map((source) => (
            <li
              key={source.sourceKey}
              className="rounded-xl border border-border/50 p-3 text-sm space-y-2"
            >
              <h3 className="font-bold">{sourceTitle(source, locale)}</h3>
              {source.kind !== "lifetime" && source.kind !== "topup" && (
                <p className="text-muted-foreground">{c[source.kind]}</p>
              )}
              <p>{c[sourceState(source)]}</p>
              <p>
                {c.scope}:{" "}
                {source.targets.includes("all_published")
                  ? c.all
                  : source.targets.join("، ") || c[source.area]}
              </p>
              {source.beneficiary && (
                <p>
                  {c.beneficiary}: {source.beneficiary}
                </p>
              )}
              {source.startsAt && (
                <p>
                  {c.starts}: {formatDate(source.startsAt, locale)}
                </p>
              )}
              {source.kind !== "topup" && (
                <p>
                  {c.ends}:{" "}
                  {source.isLifetime
                    ? c.lifetime
                    : source.accessUntil
                      ? formatDate(source.accessUntil, locale)
                      : source.kind === "invitation" && source.startsAt
                        ? c.unlimited
                        : c.unknown}
                </p>
              )}
              {source.isLifetime && <p>{c.lifetimeQuestions}</p>}
              {source.termsUntil && (
                <p>
                  {c.terms}: {formatDate(source.termsUntil, locale)}
                </p>
              )}
              {source.paymentMethod && (
                <p>
                  {c.method}: {paymentLabel(source, locale)}
                </p>
              )}
              <p className="text-muted-foreground">
                {source.kind.endsWith("subscription") &&
                source.kind !== "manual_subscription" &&
                !source.cancelAtPeriodEnd
                  ? c.renewalUnknown
                  : c.noRenewal}
              </p>
              {allowedPortalScope(source) && (
                <StripePortalButton scope={source.portalScope === "kids" ? "kids" : "adult"} />
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">{c.note}</p>
    </div>
  );
}
