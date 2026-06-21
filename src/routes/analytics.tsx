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

export const Route = createFileRoute("/analytics")({
  beforeLoad: requireAuthBeforeLoad,
  head: () => ({
    meta: [
      { title: "تحليلاتي — مسارات" },
      {
        name: "description",
        content: "إحصائيات رحلتك التعليمية: التقدم، الـ streak، والمهام.",
      },
    ],
  }),
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

function fmtMinutes(totalSeconds: number) {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins} د`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} س ${m ? `${m} د` : ""}`.trim();
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
  const { user } = useAuth();
  const userId = user!.id;

  const { data, isLoading } = useQuery({
    enabled: !!userId,
    queryKey: ["personal-analytics", userId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        eventsRes,
        lessonStatusRes,
        missionRes,
        quizRes,
        streakRes,
        timeRes,
      ] = await Promise.all([
        supabase
          .from("learner_events")
          .select("event_type, path_id, created_at")
          .gte("created_at", since),
        supabase.from("user_lesson_status").select("status, lesson_id"),
        supabase
          .from("mission_submissions")
          .select("status, mission_id, score"),
        supabase
          .from("lesson_quiz_attempts")
          .select("is_correct, bloom_level, attempted_at")
          .gte("attempted_at", since),
        supabase
          .from("user_streaks")
          .select("current_streak, longest_streak, last_activity_date")
          .maybeSingle(),
        supabase
          .from("user_activity_time")
          .select("total_seconds")
          .maybeSingle(),
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
        label: d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
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
  }, [data]);

  const currentStreak = data?.streak?.current_streak ?? 0;
  const longestStreak = data?.streak?.longest_streak ?? 0;
  const totalSeconds = Number(data?.time?.total_seconds ?? 0);

  return (
    <div className="min-h-dvh bg-background flex overflow-x-hidden" dir="rtl">
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full min-w-0">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> رجوع للوحة
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> تحليلاتي
          </h1>
          <p className="text-sm text-muted-foreground">
            صورة سريعة عن رحلتك آخر ٣٠ يوم.
          </p>
        </div>

        {isLoading || !stats ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            جارٍ تحميل تحليلاتك...
          </div>
        ) : (
          <>
            {/* Top KPIs */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={Flame}
                label="السلسلة الحالية"
                value={currentStreak}
                hint={`الأطول: ${longestStreak} يوم`}
              />
              <StatCard
                icon={Clock}
                label="وقت التعلّم"
                value={fmtMinutes(totalSeconds)}
                hint="إجمالي تراكمي"
              />
              <StatCard
                icon={BookCheck}
                label="دروس خلّصتها"
                value={stats.lessonCounts["completed"] ?? 0}
                hint={`قيد التقدّم: ${stats.lessonCounts["in_progress"] ?? 0}`}
              />
              <StatCard
                icon={Target}
                label="المهام المنجزة"
                value={stats.missionCounts["passed"] ?? 0}
                hint={`في التقييم: ${stats.missionCounts["submitted"] ?? 0}`}
              />
            </section>

            {/* Activity last 14 days */}
            <section className="glass rounded-2xl p-4 sm:p-5 border border-border/50 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">نشاطك آخر ١٤ يوم</h2>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {stats.days.map((d, i) => {
                  const h = (d.count / stats.dayMax) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-[image:var(--gradient-primary)] transition-all"
                        style={{ height: `${Math.max(h, 4)}%`, opacity: d.count ? 1 : 0.2 }}
                        title={`${d.label}: ${d.count} حدث`}
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
                  <h2 className="text-sm font-semibold">دقة الكويزات (٣٠ يوم)</h2>
                </div>
                {stats.quizTotal === 0 ? (
                  <p className="text-xs text-muted-foreground">لسه مفيش محاولات كويز.</p>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gradient mb-1">
                      {stats.quizAccuracy}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.quizCorrect} صح من {stats.quizTotal} محاولة
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
                  <h2 className="text-sm font-semibold">أكثر مسار نشّطت فيه</h2>
                </div>
                {Object.keys(stats.eventsByPath).length === 0 ? (
                  <p className="text-xs text-muted-foreground">لسه مفيش نشاط مرتبط بمسار.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(stats.eventsByPath)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([pathId, count]) => {
                        const total = Object.values(stats.eventsByPath).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                          <li key={pathId}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium capitalize">{pathId}</span>
                              <span className="text-muted-foreground">{count} حدث · {pct}%</span>
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
              <h2 className="text-sm font-semibold mb-3">تفصيل الأحداث (٣٠ يوم)</h2>
              {Object.keys(stats.eventCounts).length === 0 ? (
                <p className="text-xs text-muted-foreground">لسه مفيش أحداث مسجّلة.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(stats.eventCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between rounded-lg bg-white/5 px-3 py-2"
                      >
                        <span className="text-muted-foreground">{type}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <p className="text-[11px] text-muted-foreground text-center">
              الأرقام بتتحدّث تلقائي مع كل نشاط جديد. مفيش بيانات بتتشارك مع حد تاني.
            </p>
          </>
        )}
      </main>
    </div>
  );
}