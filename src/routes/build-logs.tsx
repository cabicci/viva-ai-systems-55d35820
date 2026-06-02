import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ScrollText,
  Rocket,
  CheckCircle2,
  Trophy,
  Lightbulb,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  useBuildLogs,
  type BuildLog,
  type BuildLogType,
} from "@/lib/build-logs";
import { findLessonRoute } from "@/lib/curriculum-data";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";

export const Route = createFileRoute("/build-logs")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({
    meta: [
      { title: "سجل البناء — Build Logs" },
      {
        name: "description",
        content:
          "سجل تحوّلك من متعلم إلى Builder يبني أنظمة حقيقية داخل المنصة.",
      },
    ],
  }),
  component: BuildLogsPage,
});

const TYPE_META: Record<
  BuildLogType,
  { label: string; icon: LucideIcon; tone: string; chip: string }
> = {
  mission_started: {
    label: "MISSION STARTED",
    icon: Rocket,
    tone: "text-accent",
    chip: "border-accent/30 bg-accent/5",
  },
  mission_completed: {
    label: "MISSION COMPLETED",
    icon: CheckCircle2,
    tone: "text-accent",
    chip: "border-accent/30 bg-accent/10",
  },
  lesson_completed: {
    label: "LESSON COMPLETED",
    icon: CheckCircle2,
    tone: "text-primary",
    chip: "border-primary/30 bg-primary/10",
  },
  milestone: {
    label: "MILESTONE",
    icon: Trophy,
    tone: "text-primary",
    chip: "border-primary/30 bg-primary/10",
  },
  runtime_realization: {
    label: "RUNTIME REALIZATION",
    icon: Lightbulb,
    tone: "text-accent",
    chip: "border-accent/30 bg-accent/5",
  },
};

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDay(ts: number) {
  return new Date(ts).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDay(logs: BuildLog[]) {
  const groups: { key: string; ts: number; items: BuildLog[] }[] = [];
  for (const log of logs) {
    const key = dayKey(log.timestamp);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, ts: log.timestamp, items: [] };
      groups.push(g);
    }
    g.items.push(log);
  }
  return groups;
}

function BuildLogsPage() {
  const logs = useBuildLogs();
  const groups = React.useMemo(() => groupByDay(logs), [logs]);

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto w-full p-6 md:p-10 space-y-8">
          {/* Header */}
          <header className="glass rounded-3xl p-7 md:p-9 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)]">
                  <ScrollText className="h-6 w-6 text-primary-foreground" />
                </span>
                <p className="text-primary font-mono text-xs tracking-[0.2em]">
                  BUILD LOGS RUNTIME
                </p>
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">
                سجل البناء
              </h1>
              <p className="text-muted-foreground mt-3 max-w-2xl leading-loose">
                هذا ليس سجل دراسة فقط — بل سجل تحولك من متعلم إلى Builder يبني
                أنظمة حقيقية.
              </p>
            </div>
          </header>

          {/* Empty state */}
          {logs.length === 0 ? (
            <section className="glass rounded-2xl p-8 md:p-10 text-center border border-white/5">
              <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                رحلة البناء لم تبدأ بعد
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-loose mb-6">
                كل خطوة بناء، تجربة، أو مهمة ستتحول لاحقًا إلى سجل حي لتطورك
                داخل المنصة.
              </p>
              <Button asChild variant="hero">
                <Link to="/curriculum">
                  ابدأ من المنهج <ArrowRight className="h-4 w-4 rotate-180" />
                </Link>
              </Button>
            </section>
          ) : (
            /* Timeline */
            <section className="space-y-8">
              {groups.map((group) => (
                <div key={group.key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground tracking-[0.2em]">
                      {formatDay(group.ts)}
                    </span>
                    <span className="flex-1 h-px bg-white/5" />
                  </div>
                  <ol className="relative space-y-4 pe-5 border-e border-white/5">
                    {group.items.map((log) => (
                      <TimelineItem key={log.id} log={log} />
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function TimelineItem({ log }: { log: BuildLog }) {
  const meta = TYPE_META[log.type];
  const Icon = meta.icon;
  return (
    <li className="relative">
      <span
        className={`absolute -end-[26px] top-2 grid h-4 w-4 place-items-center rounded-full border ${meta.chip}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full bg-current ${meta.tone}`} />
      </span>
      <div className="glass rounded-xl p-4 md:p-5 border border-white/5">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.18em] px-2 py-1 rounded-full border ${meta.chip} ${meta.tone}`}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {log.moduleId ? `${log.moduleId} · ` : ""}
            {formatTime(log.timestamp)}
          </span>
        </div>
        <h3 className="text-base md:text-lg font-bold mb-1">{log.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {log.shortDescription}
        </p>
        {log.lessonId && (() => {
          const r = findLessonRoute(log.lessonId);
          if (!r) return null;
          return (
            <Link
              to="/learn/$pathId/$lessonId"
              params={{ pathId: r.pathId, lessonId: r.slug }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
            >
              افتح الدرس <ArrowRight className="h-3 w-3 rotate-180" />
            </Link>
          );
        })()}
      </div>
    </li>
  );
}
