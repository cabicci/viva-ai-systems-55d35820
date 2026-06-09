import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Map as MapIcon,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  PATHS,
  pathLessonIds,
  totalAvailableLessons,
  totalLessons,
  type CurriculumPath,
  type CurriculumLesson,
} from "@/lib/curriculum-data";
import { useLessonProgress, type LessonStatus } from "@/lib/lesson-progress";
import { getLessonAccess, getModuleStatus } from "@/lib/builder-runtime";
import { LessonLink } from "@/components/lesson/LessonLink";
import { useModulesMastery } from "@/lib/mastery-gate";
import type { ModuleMastery } from "@/lib/mastery-gate";
import { useEntitlement } from "@/lib/entitlements";

type CurriculumSearch = { module?: string; lesson?: string };

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "خريطة المنهج — AI Ecosystem" },
      {
        name: "description",
        content:
          "خريطة تعليمية شاملة للمنظومة — كل المسارات والوحدات والدروس وحالة التقدّم في مكان واحد.",
      },
      { property: "og:title", content: "خريطة المنهج — AI Ecosystem" },
      { property: "og:description", content: "خريطة تعليمية شاملة لكل المسارات والوحدات والدروس في منظومة التعلم التنفيذي." },
      { name: "twitter:title", content: "خريطة المنهج — AI Ecosystem" },
      { name: "twitter:description", content: "خريطة تعليمية شاملة لكل المسارات والوحدات والدروس في منظومة التعلم التنفيذي." },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): CurriculumSearch => ({
    module: typeof raw.module === "string" ? raw.module : undefined,
    lesson: typeof raw.lesson === "string" ? raw.lesson : undefined,
  }),
  component: CurriculumPage,
});

function CurriculumPage() {
  const { store, getStatus } = useLessonProgress();
  const { isPro } = useEntitlement();
  const search = Route.useSearch();
  const allModules = useMemo(
    () => PATHS.flatMap((p) => p.modules),
    [],
  );
  const { mastery } = useModulesMastery(allModules);

  useEffect(() => {
    const target = search.lesson ?? search.module;
    if (!target) return;
    const id = search.lesson ? `lesson-${search.lesson}` : `module-${search.module}`;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(t);
  }, [search.module, search.lesson]);

  const available = totalAvailableLessons();
  const total = totalLessons();
  const completedCount = PATHS.flatMap((p) => p.modules)
    .flatMap((m) => m.lessons)
    .filter((l) => l.state === "available" && getStatus(l.id) === "completed").length;
  const pct = available ? Math.round((completedCount / available) * 100) : 0;

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5 rotate-180" /> العودة للوحة
        </Link>

        {/* Hero */}
        <header className="glass rounded-3xl p-8 md:p-10 mb-10 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] glow-primary">
                <MapIcon className="h-6 w-6 text-primary-foreground" />
              </span>
              <p className="text-primary font-mono text-sm">CURRICULUM · MAP</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              خريطة <span className="text-gradient">المنظومة</span> الكاملة
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              ٥ مسارات تنفيذية، كل مسار مقسّم لوحدات ودروس متسلسلة. كل درس بيفتح اللي بعده،
              وكل وحدة بتبني على اللي قبلها.
            </p>

            <div className="mt-6 max-w-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-mono">
                <span>التقدّم العام</span>
                <span>
                  {completedCount}/{available} درس متاح · {pct}%
                </span>
              </div>
              <Progress value={pct} />
              <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                {available} درس متاح حالياً · {total - available} درس قادم
              </p>
            </div>
          </div>
        </header>

        {/* Three-tier sections (v14): User → Operator → Builder */}
        {(() => {
          const intros = PATHS.filter((p) => p.kind === "intro");
          const userPaths = PATHS.filter((p) => p.kind !== "intro" && p.tier === "user");
          const operatorPaths = PATHS.filter((p) => p.tier === "operator");
          const builderPaths = PATHS.filter((p) => p.tier === "builder");

          const renderPaths = (paths: typeof PATHS) =>
            paths.map((p) => (
              <PathBlock
                key={p.id}
                path={p}
                progress={store}
                getStatus={getStatus}
                mastery={mastery}
                isPro={isPro}
              />
            ));

          return (
            <div className="space-y-16">
              {intros.length > 0 && (
                <section>
                  <SectionHeader
                    eyebrow="STAGE 01 · START"
                    title="البداية"
                    subtitle="ابدأ من هنا قبل ما تدخل أي مسار — الأساس اللي بيخلّيك تفهم باقي المنظومة."
                  />
                  <div className="space-y-10">{renderPaths(intros)}</div>
                </section>
              )}

              {userPaths.length > 0 && (
                <section>
                  <SectionHeader
                    eyebrow="LEVEL 1 · AI USER"
                    title="استخدم AI في شغلك"
                    subtitle="80% من اللي محتاجه أي حد — تستخدم AI في شغلك من غير ما تتعلم برمجة. ابدأ هنا."
                  />
                  <div className="space-y-10">{renderPaths(userPaths)}</div>
                </section>
              )}

              {operatorPaths.length > 0 && (
                <section>
                  <SectionHeader
                    eyebrow="LEVEL 2 · AI OPERATOR"
                    title="ابني أنظمة وأتمتة متقدمة"
                    subtitle="للي عايز يبني systems وworkflows ذكية بـ AI من غير ما يكتب كود. الـ Automator m1+m2 لوحدهم مناسبين لـ Level 1، الـ m3+m4 متقدمين."
                  />
                  <div className="space-y-10">{renderPaths(operatorPaths)}</div>
                </section>
              )}

              {builderPaths.length > 0 && (
                <section>
                  <SectionHeader
                    eyebrow="LEVEL 3 · AI BUILDER · اختياري"
                    title="ابني منتجات AI بنفسك"
                    subtitle="مسار تقني للي عايز يبني SaaS وتطبيقات AI بنفسه. ⚠ مش المرحلة التالية الطبيعية — اختاره بس لو ده هدفك فعلًا."
                  />
                  <div className="space-y-10">{renderPaths(builderPaths)}</div>
                </section>
              )}
            </div>
          );
        })()}

      </main>
    </div>
  );
}

/* -------------------------------------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/40 pb-3">
      <div>
        <p className="text-[11px] font-mono text-primary tracking-widest mb-1">
          {eyebrow}
        </p>
        <h2 className="text-2xl md:text-3xl font-black">
          <span className="text-gradient">{title}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}

function PathBlock({
  path,
  progress,
  getStatus,
  mastery,
  isPro,
}: {
  path: CurriculumPath;
  progress: Record<string, LessonStatus>;
  getStatus: (id: string) => LessonStatus;
  mastery: Record<string, ModuleMastery>;
  isPro: boolean;
}) {
  const Icon = path.icon;
  const isOpen = path.status === "open";
  const isIntro = path.kind === "intro";
  const orderedIds = pathLessonIds(path);
  const totalIn = orderedIds.length;
  const completed = orderedIds.filter((id) => getStatus(id) === "completed").length;
  const pct = totalIn ? Math.round((completed / totalIn) * 100) : 0;
  // Per-path pastel color — same mapping used on the dashboard so colors stay
  // consistent across the whole product.
  const pastelByPath: Record<string, string> = {
    intro: "var(--pastel-cream)",
    builder: "var(--pastel-blue)",
    creator: "var(--pastel-pink)",
    automator: "var(--pastel-mint)",
    analyst: "var(--pastel-yellow)",
    business: "var(--pastel-lavender)",
  };
  const pastel = pastelByPath[path.id] ?? "var(--pastel-blue)";
  const iconAnim =
    path.kind === "intro"
      ? "animate-twinkle"
      : path.id === "builder"
        ? "animate-tilt"
        : path.id === "creator"
          ? "animate-flame"
          : path.id === "automator"
            ? "animate-spin-slow"
            : path.id === "analyst"
              ? "animate-chart-bounce"
              : "animate-float";

  return (
    <section
      className={`rounded-3xl p-6 md:p-8 border border-border/60 ${isOpen ? "" : "opacity-70"}`}
      style={{ background: pastel }}
    >
      {isIntro && (
        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full glass border border-foreground/10 px-3 py-1 text-[11px] font-mono text-foreground/70 uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Start Here
          </span>
          <span className="text-[11px] text-muted-foreground">
            ابدأ من هنا قبل ما تدخل المسارات.
          </span>
        </div>
      )}
      {/* Path header */}
      <div className="flex items-start gap-5 mb-6">
        <div
          className="grid h-14 w-14 place-items-center rounded-xl shrink-0"
          style={{ background: pastel }}
        >
          <Icon className={`h-7 w-7 text-foreground/80 ${iconAnim}`} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-muted-foreground">
            {isIntro ? "INTRODUCTION" : `PATH · ${path.title.toUpperCase()}`}
          </p>
          <h2 className="text-2xl md:text-3xl font-black">{path.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{path.tagline}</p>
        </div>
        {!isOpen && (
          <span className="text-xs glass rounded-full px-3 py-1 text-muted-foreground shrink-0">
            قريبًا
          </span>
        )}
      </div>

      {isOpen && totalIn > 0 && (
        <div className="mb-6 max-w-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-mono">
            <span>تقدّم المسار</span>
            <span>
              {completed}/{totalIn} · {pct}%
            </span>
          </div>
          <Progress value={pct} />
        </div>
      )}

      {/* Modules */}
      {path.modules.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">
          محتوى هذا المسار قيد البناء داخل المنظومة.
        </div>
      ) : (
        <div className={`grid gap-4 ${isIntro ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {path.modules.map((m, mi) => {
            const prev = path.modules[mi - 1];
            const status = getModuleStatus(
              m,
              prev,
              getStatus,
              prev ? mastery[prev.id] : undefined,
              isPro, // bypassLocks for pro/admin
            );
            const moduleUnlocked = !status.moduleLocked;
            const moduleCompleted = status.moduleCompleted;

            return (
              <article
                key={m.id}
                id={`module-${m.id}`}
                className={`rounded-2xl p-5 flex flex-col gap-4 transition border border-border/40 bg-background/40 ${
                  !moduleUnlocked
                    ? "opacity-60"
                    : moduleCompleted
                      ? "border-foreground/20"
                      : "hover:bg-background/60"
                }`}
              >
                <header className="flex items-start gap-3">
                  <span
                    dir="ltr"
                    className="grid h-9 min-w-11 px-2 place-items-center rounded-md shrink-0 bg-[image:var(--gradient-primary)] text-primary-foreground text-xs font-black tabular-nums"
                  >
                    M{mi + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-muted-foreground">
                      MODULE M{mi + 1}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg leading-tight">{m.title}</h3>
                      {m.level === "technical" && (
                        <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-accent-warning/40 text-accent-warning-foreground border border-accent-warning/40">
                          تقني — للمتقدمين
                        </span>
                      )}
                    </div>
                    {m.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{m.subtitle}</p>
                    )}
                  </div>
                  {!moduleUnlocked && (
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </header>

                {!isPro && status.moduleLocked && status.prevNotMastered && (
                  <p className="text-[11px] font-mono text-accent-warning-foreground bg-accent-warning/20 border border-accent-warning/30 rounded-md px-2.5 py-1.5">
                    لازم تعدّي {status.prevMissingMissionCount} مهمة في الـ module اللي قبل عشان ده يفتح
                  </p>
                )}

                <ul className="space-y-1.5">
                  {m.lessons.map((l) => (
                    <LessonRow
                      key={l.id}
                      lesson={l}
                      moduleUnlocked={moduleUnlocked}
                      orderedIds={orderedIds}
                      progress={progress}
                      getStatus={getStatus}
                    />
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      {isIntro && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
          <p className="text-sm text-muted-foreground">
            خلّصت Introduction؟ اللي بعده مسار <span className="text-foreground font-semibold">Builder</span>.
          </p>
          <Button asChild variant="violet" size="sm" className="shrink-0">
            <Link
              to="/learn/$pathId/$lessonId"
              params={{ pathId: "builder", lessonId: "builder-m1-l1-what-is-llm" }}
            >
              ابدأ Builder
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- */

function LessonRow({
  lesson,
  moduleUnlocked,
  orderedIds,
  progress,
  getStatus,
}: {
  lesson: CurriculumLesson;
  moduleUnlocked: boolean;
  orderedIds: string[];
  progress: Record<string, LessonStatus>;
  getStatus: (id: string) => LessonStatus;
}) {
  const access = getLessonAccess(
    lesson,
    progress,
    orderedIds,
    getStatus,
    moduleUnlocked,
  );
  const completed = access.isCompleted;
  const inProgress = access.isInProgress;
  const isAvailable = access.isAvailable;
  const accessible = access.isAccessible;
  const badge = String(orderedIds.indexOf(lesson.id) + 1);

  const baseClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition border border-transparent";

  const StateIcon = completed
    ? CheckCircle2
    : inProgress
      ? Clock
      : isAvailable
        ? Play
        : Lock;

  const content = (
    <>
      <span
        dir="ltr"
        className={`grid h-6 min-w-7 px-1.5 place-items-center rounded-md shrink-0 text-[11px] font-mono tabular-nums ${
          completed
            ? "bg-accent/20 text-accent"
            : inProgress
              ? "bg-primary/20 text-primary"
              : isAvailable
                ? "bg-foreground/5 text-foreground"
                : "bg-foreground/5 text-muted-foreground"
        }`}
      >
        {badge}
      </span>
      <span
        className={`flex-1 truncate ${
          accessible ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {lesson.title}
      </span>
      <StateIcon
        className={`h-3.5 w-3.5 shrink-0 ${
          completed
            ? "text-accent"
            : inProgress
              ? "text-primary"
              : "text-muted-foreground"
        }`}
      />
    </>
  );

  if (accessible && lesson.route) {
    const isIntroRoute = lesson.route.startsWith("/learn/intro/");
    return (
      <li id={`lesson-${lesson.id}`}>
        <LessonLink
          lesson={lesson}
          from="curriculum"
          className={`${baseClasses} ${
            isIntroRoute
              ? "hover:bg-foreground/5 hover:border-accent/30"
              : "hover:bg-foreground/5 hover:border-primary/20"
          }`}
        >
          {content}
        </LessonLink>
      </li>
    );
  }

  return (
    <li
      id={`lesson-${lesson.id}`}
      className={`${baseClasses} ${isAvailable ? "" : "opacity-60"} cursor-default`}
      aria-disabled
    >
      {content}
      {!isAvailable && (
        <span className="text-[10px] font-mono text-muted-foreground glass rounded-full px-1.5 py-0.5">
          قريبًا
        </span>
      )}
    </li>
  );
}