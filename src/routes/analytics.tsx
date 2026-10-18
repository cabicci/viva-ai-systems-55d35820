import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart3,
  Flame,
  Clock,
  BookCheck,
  Target,
  CalendarDays,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { getUiString, type UiStringKey } from "@/lib/locale/ui-strings";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import type { PathId } from "@/lib/curriculum-data";
import type { SupportedLocale } from "@/lib/locale/types";

export const Route = createFileRoute("/analytics")({
  beforeLoad: requireAuthBeforeLoad,
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return {
      meta: [
        { title: getUiString(locale, "analytics.meta.title") },
        { name: "description", content: getUiString(locale, "analytics.meta.description") },
      ],
    };
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AuthSessionGate>
      <AnalyticsContent />
    </AuthSessionGate>
  );
}

type CountMap = Record<string, number>;

function fmtMinutes(totalSeconds: number, t: (key: UiStringKey) => string) {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return t("account.stats.durationMinutes").replace("{minutes}", String(mins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return t("account.stats.durationHoursMinutes")
    .replace("{hours}", String(h))
    .replace("{minutes}", String(m));
}

const DISPLAY_PATHS = new Set(["intro", "business", "creator", "analyst", "automator", "builder"]);

const EVENT_DISPLAY_LABELS: Record<string, UiStringKey> = {
  lesson_opened: "analytics.event.lessonOpened",
  lesson_completed: "analytics.event.lessonCompleted",
  mission_submitted: "analytics.event.missionSubmitted",
  mission_skipped: "analytics.event.missionSkipped",
  quiz_predicted: "analytics.event.quizPredicted",
};

function pathDisplayLabel(pathId: string, locale: SupportedLocale) {
  return DISPLAY_PATHS.has(pathId)
    ? getCurriculumPathLabel(locale, pathId as PathId, "title")
    : pathId;
}

function eventDisplayLabel(eventType: string, t: (key: UiStringKey) => string) {
  return EVENT_DISPLAY_LABELS[eventType] ? t(EVENT_DISPLAY_LABELS[eventType]) : eventType;
}
function eventCount(count: number, t: (key: UiStringKey) => string) {
  return t(count === 1 ? "analytics.eventCountOne" : "analytics.eventCount").replace(
    "{count}",
    String(count),
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 border border-border/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold text-gradient">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function AnalyticsContent() {
  const { locale, dir } = useLocale();
  const t = useUiString();
  const localeSearch = useLocaleLinkSearch();
  const { user } = useAuth();
  const userId = user!.id;

  const { data, isLoading } = useQuery({
    enabled: !!userId,
    queryKey: ["personal-analytics", userId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [eventsRes, lessonStatusRes, missionRes, quizRes, streakRes, timeRes] =
        await Promise.all([
          supabase
            .from("learner_events")
            .select("event_type, path_id, created_at")
            .gte("created_at", since),
          supabase.from("user_lesson_status").select("status, lesson_id"),
          supabase.from("mission_submissions").select("status, mission_id, score"),
          supabase
            .from("lesson_quiz_attempts")
            .select("is_correct, bloom_level, attempted_at")
            .gte("attempted_at", since),
          supabase
            .from("user_streaks")
            .select("current_streak, longest_streak, last_activity_date")
            .maybeSingle(),
          supabase.from("user_activity_time").select("total_seconds").maybeSingle(),
        ]);

      return {
        events: eventsRes.data ?? [],
        lessonStatus: lessonStatusRes.data ?? [],
        missions: missionRes.data ?? [],
        quizzes: quizRes.data ?? [],
        streak: streakRes.data,
        time: timeRes.data,
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;

    const lessonCounts: CountMap = {};
    for (const r of data.lessonStatus) {
      lessonCounts[r.status] = (lessonCounts[r.status] ?? 0) + 1;
    }

    const missionCounts: CountMap = {};
    for (const r of data.missions) {
      missionCounts[r.status] = (missionCounts[r.status] ?? 0) + 1;
    }

    const eventCounts: CountMap = {};
    const eventsByPath: CountMap = {};
    for (const r of data.events) {
      eventCounts[r.event_type] = (eventCounts[r.event_type] ?? 0) + 1;
      if (r.path_id) {
        eventsByPath[r.path_id] = (eventsByPath[r.path_id] ?? 0) + 1;
      }
    }

    const quizTotal = data.quizzes.length;
    const quizCorrect = data.quizzes.filter((q) => q.is_correct).length;
    const quizAccuracy = quizTotal ? Math.round((quizCorrect / quizTotal) * 100) : 0;

    // Last 14 days activity buckets
    const days: { label: string; count: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      const count = data.events.filter((e) => e.created_at?.slice(0, 10) === key).length;
      days.push({
        label: d.toLocaleDateString(
          locale === "ar-MSA" ? "ar" : locale === "ar-Gulf" ? "ar-AE" : locale,
          { day: "numeric", month: "short" },
        ),
        count,
      });
    }
    const dayMax = Math.max(1, ...days.map((d) => d.count));

    return {
      lessonCounts,
      missionCounts,
      eventCounts,
      eventsByPath,
      quizAccuracy,
      quizTotal,
      quizCorrect,
      days,
      dayMax,
    };
  }, [data, locale]);

  const currentStreak = data?.streak?.current_streak ?? 0;
  const longestStreak = data?.streak?.longest_streak ?? 0;
  const totalSeconds = Number(data?.time?.total_seconds ?? 0);

  return (
    <div className="min-h-dvh bg-background flex flex-col overflow-x-clip" dir={dir}>
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full min-w-0">
        <div className="mb-6">
          <Link
            to="/dashboard"
            search={localeSearch()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("analytics.back")}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> {t("analytics.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("analytics.intro")}</p>
        </div>

        {isLoading || !stats ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            {t("analytics.loading")}
          </div>
        ) : (
          <>
            {/* Top KPIs */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={Flame}
                label={t("analytics.currentStreak")}
                value={currentStreak}
                hint={t("analytics.longestStreak").replace(
                  "{duration}",
                  t(
                    longestStreak === 1 ? "account.stats.daysUnitOne" : "account.stats.daysUnit",
                  ).replace("{count}", String(longestStreak)),
                )}
              />
              <StatCard
                icon={Clock}
                label={t("analytics.learningTime")}
                value={fmtMinutes(totalSeconds, t)}
                hint={t("analytics.cumulative")}
              />
              <StatCard
                icon={BookCheck}
                label={t("analytics.completedLessons")}
                value={stats.lessonCounts["completed"] ?? 0}
                hint={t("analytics.inProgress").replace(
                  "{count}",
                  String(stats.lessonCounts["in_progress"] ?? 0),
                )}
              />
              <StatCard
                icon={Target}
                label={t("analytics.completedMissions")}
                value={stats.missionCounts["passed"] ?? 0}
                hint={t("analytics.evaluating").replace(
                  "{count}",
                  String(stats.missionCounts["submitted"] ?? 0),
                )}
              />
            </section>

            {/* Activity last 14 days */}
            <section className="glass rounded-2xl p-4 sm:p-5 border border-border/50 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{t("analytics.activityTitle")}</h2>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {stats.days.map((d, i) => {
                  const h = (d.count / stats.dayMax) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-[image:var(--gradient-primary)] transition-all"
                        style={{ height: `${Math.max(h, 4)}%`, opacity: d.count ? 1 : 0.2 }}
                        title={t("analytics.activityTooltip")
                          .replace("{date}", d.label)
                          .replace("{events}", eventCount(d.count, t))}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>{stats.days[0]?.label}</span>
                <span>{stats.days[stats.days.length - 1]?.label}</span>
              </div>
            </section>

            {/* Two columns */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* Quizzes */}
              <section className="glass rounded-2xl p-4 sm:p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">{t("analytics.quizTitle")}</h2>
                </div>
                {stats.quizTotal === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("analytics.noQuizzes")}</p>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gradient mb-1">
                      {stats.quizAccuracy}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t(stats.quizTotal === 1 ? "analytics.quizResultOne" : "analytics.quizResult")
                        .replace("{correct}", String(stats.quizCorrect))
                        .replace("{total}", String(stats.quizTotal))}
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[image:var(--gradient-primary)]"
                        style={{ width: `${stats.quizAccuracy}%` }}
                      />
                    </div>
                  </>
                )}
              </section>

              {/* Path focus */}
              <section className="glass rounded-2xl p-4 sm:p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">{t("analytics.pathTitle")}</h2>
                </div>
                {Object.keys(stats.eventsByPath).length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("analytics.noPathActivity")}</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(stats.eventsByPath)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([pathId, count]) => {
                        const total = Object.values(stats.eventsByPath).reduce((a, b) => a + b, 0);
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <li key={pathId}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium">
                                {pathDisplayLabel(pathId, locale)}
                              </span>
                              <span className="text-muted-foreground">
                                {eventCount(count, t)} · {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full bg-[image:var(--gradient-primary)]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </section>
            </div>

            {/* Event breakdown */}
            <section className="glass rounded-2xl p-4 sm:p-5 border border-border/50 mb-6">
              <h2 className="text-sm font-semibold mb-3">{t("analytics.eventTitle")}</h2>
              {Object.keys(stats.eventCounts).length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("analytics.noEvents")}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(stats.eventCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between rounded-lg bg-white/5 px-3 py-2"
                      >
                        <span className="text-muted-foreground">{eventDisplayLabel(type, t)}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <p className="text-[11px] text-muted-foreground text-center">{t("analytics.footer")}</p>
          </>
        )}
      </main>
    </div>
  );
}
