import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Play, Lock, CheckCircle2, Clock, Trophy } from "lucide-react";
import { getPath, pathLessonIds, PATHS, type CurriculumPath } from "@/lib/curriculum-data";
import { useLessonProgress, type LessonStatus } from "@/lib/lesson-progress";
import type { CurriculumModule } from "@/lib/curriculum-data";
import { getLessonAccess, getModuleStatus } from "@/lib/builder-runtime";
import { useModulesMastery, type ModuleMastery } from "@/lib/mastery-gate";
import { LessonLink } from "@/components/lesson/LessonLink";
import { getLesson } from "@/lib/unified-lessons";
import { WelcomeHint } from "@/components/dashboard/WelcomeHint";
import { WelcomeChecklist } from "@/components/dashboard/WelcomeChecklist";
import { ReviewsDueCard } from "@/components/dashboard/ReviewsDueCard";
import { useCountUp } from "@/hooks/use-count-up";

import { StreakCard } from "@/components/dashboard/StreakCard";
import { useEntitlement, decideLessonGate } from "@/lib/entitlements";
import { PhaseRibbon } from "@/components/admin/PhaseRibbon";

type DashboardSearch = { path?: string; module?: string; lesson?: string };

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "اللوحة — مسارات" }] }),
  validateSearch: (raw: Record<string, unknown>): DashboardSearch => ({
    path: typeof raw.path === "string" ? raw.path : undefined,
    module: typeof raw.module === "string" ? raw.module : undefined,
    lesson: typeof raw.lesson === "string" ? raw.lesson : undefined,
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { store, getStatus } = useLessonProgress();
  const { isPro, isAdmin } = useEntitlement();
  const [openId, setOpenId] = useState<string | null>(search.module ?? null);
  const [openPathId, setOpenPathId] = useState<string | null>(search.path ?? null);

  // Restore expansion + scroll when arriving from a lesson back link.
  useEffect(() => {
    if (search.path) setOpenPathId(search.path);
    if (search.module) setOpenId(search.module);
    const target = search.lesson ?? search.module ?? search.path;
    if (!target) return;
    const id = search.lesson
      ? `lesson-${search.lesson}`
      : search.module
        ? `module-${search.module}`
        : `path-${search.path}`;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(t);
  }, [search.path, search.module, search.lesson]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) return null;
  const metadata = user.user_metadata as { full_name?: string } | null | undefined;
  const name = metadata?.full_name || user.email?.split("@")[0] || "حبيبنا";

  // Introduction (onboarding) progress
  const intro = getPath("intro")!;
  const introIds = pathLessonIds(intro);
  const introTotal = introIds.length;
  const introDone = introIds.filter((id) => getStatus(id) === "completed").length;
  const introPct = introTotal ? Math.round((introDone / introTotal) * 100) : 0;
  const introAllDone = introTotal > 0 && introDone === introTotal;

  // All paths — intro now renders as a regular PathCard like the others.
  const allPaths = PATHS;

  // Cross-path totals — every lesson with a real shipped route counts.
  const openPaths = PATHS.filter((p) => p.status === "open");
  const allAvailableLessons = openPaths.flatMap((p) =>
    p.modules.flatMap((m) => m.lessons.filter((l) => l.state === "available")),
  );
  const allAvailableTotal = allAvailableLessons.length;
  const allAvailableDone = allAvailableLessons.filter(
    (l) => getStatus(l.id) === "completed",
  ).length;

  const noProgress = introDone === 0 && allAvailableDone === 0;

  // Next unfinished lesson across all open paths (intro → builder → creator …).
  const nextLesson = (() => {
    for (const p of openPaths) {
      for (const m of p.modules) {
        for (const l of m.lessons) {
          if (l.state !== "available") continue;
          if (getStatus(l.id) !== "completed") return l;
        }
      }
    }
    return null;
  })();

  const overallPct = allAvailableTotal
    ? Math.round((allAvailableDone / allAvailableTotal) * 100)
    : 0;

  const nextLessonData = nextLesson ? getLesson(nextLesson.id) : null;
  const nextLessonPath = nextLesson
    ? openPaths.find((p) =>
        p.modules.some((m) => m.lessons.some((l) => l.id === nextLesson.id)),
      )
    : null;

  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <main className="flex-1 max-w-6xl mx-auto w-full">
        <PhaseRibbon />
        <div className="p-6 md:p-10">
        <WelcomeHint show={noProgress} />
        <WelcomeChecklist />
        <ReviewsDueCard />
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10 animate-fade-up">
          <div>
            <p className="text-primary text-sm font-semibold">أهلاً</p>
            <h1 className="text-3xl md:text-4xl font-black mt-1">مرحبًا، <span className="text-gradient">{name}</span></h1>
            <p className="text-muted-foreground mt-2">المنظومة جاهزة. اختر مهمة وابدأ التنفيذ.</p>
          </div>
          {nextLesson && (
            <Button asChild variant="hero" size="lg" className="group animate-glow-pulse">
              <LessonLink lesson={nextLesson} from="dashboard">
                <Play className="h-4 w-4 group-hover:scale-125 transition-transform" />
                كمّل آخر درس
              </LessonLink>
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <NextLessonCard
            lesson={nextLesson}
            lessonTitle={nextLessonData?.title ?? nextLesson?.title}
            duration={nextLessonData?.duration}
            pathTitle={nextLessonPath?.title}
            delay={0}
          />
          <OverallProgressCard
            pct={overallPct}
            done={allAvailableDone}
            total={allAvailableTotal}
            delay={100}
          />
          <StreakCard delay={200} />
        </div>

        {(() => {
          const intros = allPaths.filter((p) => p.kind === "intro");
          const userPaths = allPaths.filter((p) => p.kind !== "intro" && p.tier === "user");
          const operatorPaths = allPaths.filter((p) => p.tier === "operator");
          const builderPaths = allPaths.filter((p) => p.tier === "builder");

          let cardIndex = 0;
          const renderGroup = (paths: typeof allPaths) => (
            <div className="grid lg:grid-cols-3 gap-5">
              {paths.map((p) => {
                const i = cardIndex++;
                return (
                  <PathCard
                    key={p.id}
                    path={p}
                    index={i}
                    store={store}
                    getStatus={getStatus}
                    openId={openId}
                    onToggle={(id) => setOpenId(openId === id ? null : id)}
                    isExpanded={openPathId === p.id}
                    onToggleExpand={() =>
                      setOpenPathId(openPathId === p.id ? null : p.id)
                    }
                    isPro={isPro || isAdmin}
                    isAdmin={isAdmin}
                    introAllDone={introAllDone}
                    introIds={introIds}
                    introCompletedCount={introDone}
                  />
                );
              })}
            </div>
          );

          const TierHeader = ({
            eyebrow,
            title,
            subtitle,
          }: {
            eyebrow: string;
            title: string;
            subtitle: string;
          }) => (
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/40 pb-3">
              <div>
                <p className="text-[11px] font-mono text-primary tracking-widest mb-1">
                  {eyebrow}
                </p>
                <h2 className="text-xl md:text-2xl font-black">
                  <span className="text-gradient">{title}</span>
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
                  {subtitle}
                </p>
              </div>
            </div>
          );

          return (
            <div className="space-y-12">
              {intros.length > 0 && (
                <section>
                  <TierHeader
                    eyebrow="STAGE 00 · START"
                    title="ابدأ من هنا"
                    subtitle="الأساس اللي بيخلّيك تفهم باقي المنظومة قبل أي مسار."
                  />
                  {renderGroup(intros)}
                </section>
              )}
              {userPaths.length > 0 && (
                <section>
                  <TierHeader
                    eyebrow="LEVEL 1 · AI USER"
                    title="استخدم AI في شغلك"
                    subtitle="٨٠٪ من اللي محتاجه أي حد — محتوى، بيانات، وقرارات بدون كود."
                  />
                  {renderGroup(userPaths)}
                </section>
              )}
              {operatorPaths.length > 0 && (
                <section>
                  <TierHeader
                    eyebrow="LEVEL 2 · AI OPERATOR"
                    title="شغّل أنظمة وأتمتة"
                    subtitle="ابني workflows ذكية تشتغل لوحدها — برضو من غير كود."
                  />
                  {renderGroup(operatorPaths)}
                </section>
              )}
              {builderPaths.length > 0 && (
                <section>
                  <TierHeader
                    eyebrow="LEVEL 3 · AI BUILDER"
                    title="ابني منتجات AI بنفسك"
                    subtitle="مسار تقني للي قرر يبني SaaS وتطبيقات AI — اختياري."
                  />
                  {renderGroup(builderPaths)}
                </section>
              )}
            </div>
          );
        })()}

        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------- */
/*  Reusable module row (used by Builder + Creator)               */
/* -------------------------------------------------------------- */

function ModuleRow({
  module: m,
  prevModule,
  prevMastery,
  moduleIndex,
  orderedIds,
  store,
  getStatus,
  isExpanded,
  onToggle,
  pathId,
  isPro,
  isAdmin,
  introAllDone,
  introIds,
  introCompletedCount,
}: {
  module: CurriculumModule;
  prevModule: CurriculumModule | undefined;
  prevMastery: ModuleMastery | undefined;
  moduleIndex: number;
  orderedIds: string[];
  store: Record<string, LessonStatus>;
  getStatus: (id: string) => LessonStatus;
  isExpanded: boolean;
  onToggle: () => void;
  pathId: string;
  isPro: boolean;
  isAdmin: boolean;
  introAllDone: boolean;
  introIds: string[];
  introCompletedCount: number;
}) {
  const status = getModuleStatus(
    m,
    prevModule,
    getStatus,
    prevMastery,
    isPro, // bypassLocks for pro/admin — single source of truth
  );
  const {
    prevDone,
    hasAvailable,
    moduleCompleted: moduleDone,
    moduleLocked,
    soon,
    availableCount,
    doneCount,
    prevNotMastered,
    prevMissingMissionCount,
  } = status;

  return (
    <div
      id={`module-${m.id}`}
      className={`rounded-xl border overflow-hidden ${
        moduleDone
          ? "border-accent/40"
          : prevDone && hasAvailable
            ? "border-primary/40 bg-primary/5"
            : "border-border/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-right hover:bg-foreground/5 transition"
      >
        <span
          dir="ltr"
          className="grid h-8 min-w-10 px-2 place-items-center rounded-md shrink-0 bg-[image:var(--gradient-primary)] text-primary-foreground text-xs font-black tabular-nums"
        >
          M{m.order}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{m.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {moduleDone
              ? "مكتمل"
              : moduleLocked
                ? prevNotMastered
                  ? `مقفل · ${prevMissingMissionCount} مهمة لسه`
                  : "مقفل"
                : soon
                  ? "قريبًا"
                  : `${doneCount}/${availableCount} دروس`}
          </p>
        </div>
        {moduleDone && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-accent shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
        {!moduleDone && moduleLocked && (
          <span className="hover-shake grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0">
            <Lock className="lock-icon h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/40">
          {m.lessons.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              لا توجد دروس بعد.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
              {m.lessons.map((l) => {
                const lessonData = getLesson(l.id);
                const access = getLessonAccess(l, store, orderedIds, getStatus);
                const sequentialUnlocked = isPro ? l.state === "available" : access.isUnlocked;
                // Single source of truth — same gate the lesson page uses.
                const gate = decideLessonGate({
                  lessonId: l.id,
                  isPro,
                  isAdmin,
                  introCompletedCount,
                  introTotal: introIds.length,
                });
                const paid: "locked-intro" | "paywall" | null =
                  gate.kind === "complete-intro-first"
                    ? "locked-intro"
                    : gate.kind === "paywall"
                      ? "paywall"
                      : null;
                const lUnlocked = sequentialUnlocked && paid === null;
                const lDone = access.isCompleted;
                const lInProgress = access.isInProgress;
                const title = lessonData?.title ?? l.title;
                const badge = String(orderedIds.indexOf(l.id) + 1);

                return (
                  <div
                    key={l.id}
                    id={`lesson-${l.id}`}
                    className={`glass rounded-lg p-3 flex flex-col gap-2 ${
                      !lUnlocked
                        ? "opacity-60"
                        : lDone
                          ? "border-accent/30"
                          : "border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-md shrink-0 ${
                          lDone
                            ? "bg-[image:var(--gradient-accent)]"
                            : "bg-[image:var(--gradient-primary)]"
                        }`}
                      >
                        <span
                          dir="ltr"
                          className="text-xs font-black text-primary-foreground tabular-nums leading-none"
                        >
                          {badge}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight">{title}</h4>
                        {lessonData && (
                          <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {lessonData.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    {lUnlocked ? (
                      <Button
                        asChild
                        size="sm"
                        variant={lDone ? "glass" : "hero"}
                        className="w-full h-8 text-xs"
                      >
                        <LessonLink lesson={l} from="dashboard">
                          <Play className="h-3 w-3" />
                          {lDone ? "مراجعة" : lInProgress ? "متابعة" : "ابدأ"}
                        </LessonLink>
                      </Button>
                    ) : (
                      <Button size="sm" variant="glass" disabled className="w-full h-8 text-xs">
                        <Lock className="h-3 w-3" />{" "}
                        {l.state !== "available"
                          ? "قريبًا"
                          : paid === "paywall"
                            ? "Pro"
                            : paid === "locked-intro"
                              ? "اكمل المقدمة"
                              : "مقفل"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */
/*  Per-path card — one card per path, modules as dropdowns       */
/* -------------------------------------------------------------- */

function PathCard({
  path,
  index,
  store,
  getStatus,
  openId,
  onToggle,
  isExpanded,
  onToggleExpand,
  isPro,
  isAdmin,
  introAllDone,
  introIds,
  introCompletedCount,
}: {
  path: CurriculumPath;
  index: number;
  store: Record<string, LessonStatus>;
  getStatus: (id: string) => LessonStatus;
  openId: string | null;
  onToggle: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isPro: boolean;
  isAdmin: boolean;
  introAllDone: boolean;
  introIds: string[];
  introCompletedCount: number;
}) {
  const Icon = path.icon;
  const orderedIds = pathLessonIds(path);
  const allLessons = path.modules.flatMap((m) => m.lessons);
  const availableLessons = allLessons.filter((l) => l.state === "available");
  const total = availableLessons.length;
  const done = availableLessons.filter(
    (l) => getStatus(l.id) === "completed",
  ).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const animatedPct = useCountUp(pct, 1100);
  // One mastery query per path instead of one per module row.
  const { mastery: pathMastery } = useModulesMastery(path.modules);
  const isOpen = path.status === "open";
  // Per-path pastel color — matches the 5 path colors on the landing page
  // (Builder/Creator/Automator/Analyst/Business) + a distinct 6th for Intro.
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
    <div
      id={`path-${path.id}`}
      className={`lg:col-span-3 rounded-2xl p-6 card-lift animate-fade-up border border-border/60 ${
        !isOpen ? "opacity-70" : ""
      }`}
      style={{ animationDelay: `${index * 90}ms`, background: pastel }}
    >
      <button
        type="button"
        onClick={isOpen ? onToggleExpand : undefined}
        className={`group w-full text-right ${isOpen ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl shrink-0 transition-transform group-hover:scale-110"
              style={{ background: pastel }}
            >
              <Icon
                className={`h-5 w-5 text-foreground/80 ${isOpen ? "" : "opacity-60"} ${iconAnim}`}
                strokeWidth={1.75}
              />
            </span>
            {path.kind === 'intro' ? 'مقدمة' : 'مسار'} {path.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs text-muted-foreground glass px-3 py-1 rounded-full ${!isOpen ? "animate-pulse" : ""}`}>
              {isOpen ? path.tagline : "قريبًا"}
            </span>
            {isOpen && (
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
        </div>

        {isOpen && total > 0 && (
          <div className="mt-4">
            <Progress value={animatedPct} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {animatedPct}٪ — {done}/{total} درس متاح
            </p>
          </div>
        )}
      </button>

      {isOpen && isExpanded ? (
        <div className="mt-6 space-y-3 animate-fade-up">
          {path.id !== "intro" && !introAllDone && !isPro && (
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground/85 flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent shrink-0" />
              <span>المسارات المهنية هتفتح بعد إنهاء المقدمة — ٧ دروس قصيرة.</span>
            </div>
          )}
          {path.id !== "intro" && introAllDone && !isPro && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground/85 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <span>أول درس مجاني. باقي المسار يحتاج اشتراك Pro.</span>
            </div>
          )}
          {path.modules.map((m, i) => (
            <ModuleRow
              key={m.id}
              module={m}
              prevModule={path.modules[i - 1]}
              prevMastery={path.modules[i - 1] ? pathMastery[path.modules[i - 1].id] : undefined}
              moduleIndex={i}
              orderedIds={orderedIds}
              store={store}
              getStatus={getStatus}
              isExpanded={openId === m.id}
              onToggle={() => onToggle(m.id)}
              pathId={path.id}
              isPro={isPro}
              isAdmin={isAdmin}
              introAllDone={introAllDone}
              introIds={introIds}
              introCompletedCount={introCompletedCount}
            />
          ))}
        </div>
      ) : !isOpen ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {path.tagline}
        </p>
      ) : null}
    </div>
  );
}

const STAT_CARD_BASE =
  "group rounded-2xl p-5 card-lift animate-fade-up border border-border/60";
const STAT_CARD_STYLE = { background: "var(--gradient-hero)" as const };

function NextLessonCard({
  lesson,
  lessonTitle,
  duration,
  pathTitle,
  delay = 0,
}: {
  lesson: { id: string; route?: string; title?: string } | null;
  lessonTitle?: string;
  duration?: string;
  pathTitle?: string;
  delay?: number;
}) {
  const empty = !lesson;
  const content = (
    <div
      className={`${STAT_CARD_BASE} h-full min-h-[160px] flex items-center gap-4 ${!empty ? "cursor-pointer" : ""}`}
      style={{ ...STAT_CARD_STYLE, animationDelay: `${delay}ms` }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] group-hover:scale-110 transition-transform shrink-0">
        {empty ? (
          <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Play className="h-6 w-6 text-primary-foreground animate-glow-pulse" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">الدرس التالي</p>
        {empty ? (
          <p className="text-base font-black leading-tight mt-0.5">اكتملت كل الدروس 🎉</p>
        ) : (
          <>
            <p className="text-base font-black leading-tight mt-0.5 truncate">{lessonTitle}</p>
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-2">
              {duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span dir="ltr" className="tabular-nums">{duration}</span>
                </span>
              )}
              {pathTitle && <span className="opacity-70">· {pathTitle}</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
  if (empty) return content;
  return <LessonLink lesson={lesson} from="dashboard" className="block">{content}</LessonLink>;
}

function OverallProgressCard({
  pct,
  done,
  total,
  delay = 0,
}: {
  pct: number;
  done: number;
  total: number;
  delay?: number;
}) {
  const counted = useCountUp(pct, 1100);
  return (
    <div
      className={`${STAT_CARD_BASE} h-full min-h-[160px] flex flex-col justify-center gap-3`}
      style={{ ...STAT_CARD_STYLE, animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-accent)] group-hover:scale-110 transition-transform shrink-0">
          <Trophy className="h-6 w-6 text-accent-foreground animate-tilt" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">تقدّمك الكلي</p>
          <p className="text-2xl font-black">
            <span dir="ltr" className="tabular-nums">{counted}</span>٪
          </p>
        </div>
      </div>
      <Progress value={counted} className="h-2" />
      <p className="text-xs text-muted-foreground">
        <span dir="ltr" className="tabular-nums">{done}</span> من{" "}
        <span dir="ltr" className="tabular-nums">{total}</span> درس
      </p>
    </div>
  );
}

// `TimeOnPlatformCard` removed — was never rendered. If we bring back
// platform-time UI, restore from git history and re-import the hook.
