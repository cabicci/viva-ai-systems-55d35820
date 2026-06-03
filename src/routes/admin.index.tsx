import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import {
  getAdminOverview,
  getAdminActivity,
  getAdminInsights,
  listUsers,
} from "@/lib/admin.functions";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import {
  Users,
  Activity,
  GraduationCap,
  Target,
  Crown,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhaseRibbon } from "@/components/admin/PhaseRibbon";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — AI Ecosystem" }] }),
  beforeLoad: requireAdminBeforeLoad,
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, isLoaded } = useEntitlement();

  // Auth + admin role are already enforced server-side by requireAdminBeforeLoad.
  // We only show a defensive loading/blocked state for the brief window before
  // the client-side entitlement query resolves.
  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center max-w-md">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h1 className="text-xl font-bold mb-2">صفحة محظورة</h1>
          <p className="text-sm text-muted-foreground mb-4">
            دي صفحة للأدمن بس.
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard">رجوع للوحة</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}


function AdminDashboard() {
  const overviewFn = useServerFn(getAdminOverview);
  const activityFn = useServerFn(getAdminActivity);
  const insightsFn = useServerFn(getAdminInsights);
  const listUsersFn = useServerFn(listUsers);
  const [usersPage, setUsersPage] = useState(1);
  const usersPageSize = 25;

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overviewFn(),
    refetchInterval: 60_000,
  });
  const activity = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => activityFn(),
    refetchInterval: 60_000,
  });
  const insights = useQuery({
    queryKey: ["admin-insights"],
    queryFn: () => insightsFn(),
    refetchInterval: 120_000,
  });

  const users = useQuery({
    queryKey: ["admin-users", usersPage, usersPageSize],
    queryFn: () =>
      listUsersFn({ data: { page: usersPage, pageSize: usersPageSize } }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="min-h-screen bg-background">
      <PhaseRibbon />
      <header className="border-b border-border/60 bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Crown className="h-5 w-5 text-primary" />
            لوحة الإدارة
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 rotate-180 ml-1" />
              لوحتي
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Overview */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">
            نظرة عامة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              icon={Users}
              label="المستخدمين"
              value={overview.data?.totalUsers}
              loading={overview.isLoading}
            />
            <StatCard
              icon={TrendingUp}
              label="جداد (٧ أيام)"
              value={overview.data?.newUsers7d}
              loading={overview.isLoading}
            />
            <StatCard
              icon={Activity}
              label="نشطين النهارده"
              value={overview.data?.activeToday}
              loading={overview.isLoading}
            />
            <StatCard
              icon={GraduationCap}
              label="دروس مكتملة"
              value={overview.data?.lessonsCompleted}
              loading={overview.isLoading}
            />
            <StatCard
              icon={Target}
              label="Missions"
              value={overview.data?.missionsSubmitted}
              loading={overview.isLoading}
            />
            <StatCard
              icon={Crown}
              label="Pro users"
              value={overview.data?.proUsers}
              loading={overview.isLoading}
            />
          </div>
        </section>

        {/* Recent activity */}
        <section className="grid lg:grid-cols-2 gap-6">
          <Panel title="آخر التسجيلات">
            {activity.isLoading ? (
              <SkeletonRows />
            ) : (activity.data?.signups ?? []).length === 0 ? (
              <Empty>مفيش تسجيلات لسه.</Empty>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {activity.data?.signups.map((s) => (
                  <li key={s.id} className="py-2 flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-xs">
                      {s.email ?? s.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelative(s.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="آخر الدروس">
            {activity.isLoading ? (
              <SkeletonRows />
            ) : (activity.data?.lessons ?? []).length === 0 ? (
              <Empty>مفيش نشاط لسه.</Empty>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {activity.data?.lessons.map((l, i) => (
                  <li key={i} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs">{l.lessonId}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {l.userId.slice(0, 8)} · {l.status}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelative(l.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        {/* Missions */}
        <Panel title="آخر الـ Missions المقدّمة">
          {activity.isLoading ? (
            <SkeletonRows />
          ) : (activity.data?.missions ?? []).length === 0 ? (
            <Empty>مفيش submissions.</Empty>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {activity.data?.missions.map((m, i) => (
                <li key={i} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs">{m.missionId}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {m.userId.slice(0, 8)} · {m.status}
                      {m.score != null ? ` · ${m.score}/100` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelative(m.submittedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Insights */}
        <section className="grid lg:grid-cols-2 gap-6">
          <Panel title="توزيع المستخدمين على المسارات">
            {insights.isLoading ? (
              <SkeletonRows />
            ) : (insights.data?.pathDistribution ?? []).length === 0 ? (
              <Empty>مفيش بيانات بعد.</Empty>
            ) : (
              <ul className="space-y-2 text-sm">
                {insights.data?.pathDistribution.map((p) => (
                  <li key={p.pathId} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{p.pathId}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.activeUsers} مستخدم · {p.completedLessons} درس مكتمل
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="الدروس اللي الناس بتقف عندها (Top 10)">
            {insights.isLoading ? (
              <SkeletonRows />
            ) : (insights.data?.dropOffLessons ?? []).length === 0 ? (
              <Empty>مفيش بيانات بعد.</Empty>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {insights.data?.dropOffLessons.map((l) => (
                  <li key={l.lessonId} className="py-2 flex items-center justify-between">
                    <span className="font-mono text-xs truncate">{l.lessonId}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {l.startedCount} مستخدم
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        {/* Users (paginated) */}
        <Panel
          title={`كل المستخدمين${
            users.data?.total != null ? ` (${users.data.total.toLocaleString("ar-EG")})` : ""
          }`}
        >
          {users.isLoading && !users.data ? (
            <SkeletonRows />
          ) : (users.data?.users ?? []).length === 0 ? (
            <Empty>مفيش مستخدمين على الصفحة دي.</Empty>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {users.data?.users.map((u) => (
                <li key={u.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs">
                      {u.email ?? u.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      آخر دخول: {formatRelative(u.lastSignInAt)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelative(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={usersPage <= 1 || users.isFetching}
              onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight className="h-4 w-4 ml-1" />
              السابق
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              صفحة {usersPage.toLocaleString("ar-EG")}
              {users.data?.total != null
                ? ` / ${Math.max(
                    1,
                    Math.ceil(users.data.total / usersPageSize),
                  ).toLocaleString("ar-EG")}`
                : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!users.data?.hasMore || users.isFetching}
              onClick={() => setUsersPage((p) => p + 1)}
            >
              التالي
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </div>
        </Panel>

        <p className="text-[10px] text-center text-muted-foreground pb-8">
          البيانات بتتحدّث تلقائياً كل دقيقة.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-1.5">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-black tabular-nums">
        {loading ? (
          <span className="inline-block h-7 w-12 rounded bg-muted animate-pulse" />
        ) : (
          (value ?? 0).toLocaleString("ar-EG")
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>;
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "دلوقتي";
  if (min < 60) return `من ${min} د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `من ${hr} س`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `من ${day} يوم`;
  return d.toLocaleDateString("ar-EG");
}