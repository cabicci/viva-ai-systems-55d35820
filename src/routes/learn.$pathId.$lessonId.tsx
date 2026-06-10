import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Hammer,
  Palette,
  Workflow,
  BarChart3,
  Briefcase,
  Copy,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLessonProgress } from "@/lib/lesson-progress";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import { getContinuity } from "@/components/intro/lesson-continuity";
import {
  getPath,
  type CurriculumLesson,
  type PathId,
} from "@/lib/curriculum-data";
import { useEntitlement, useLessonGate, useStreak } from "@/lib/entitlements";
import { PaywallCard, IntroGateCard } from "@/components/learn/PaywallCard";
import { useMissionGate, getLessonMission } from "@/lib/mission-gate";
import { Lock } from "lucide-react";
import { logLearnerEvent } from "@/lib/learner-events";
import { LessonNotes } from "@/components/learn/LessonNotes";
import { DifficultyPrompt } from "@/components/learn/DifficultyPrompt";
import { ReadingProgressBar } from "@/components/learn/ReadingProgressBar";
import { CompletionReward } from "@/components/learn/CompletionReward";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";

/* --------------------------------------------------------------
 *  Unified lesson runtime — one page for every path's lessons.
 *  Route: /learn/{pathId}/{lessonId}
 * -------------------------------------------------------------- */

const PATH_META: Record<
  PathId,
  { label: string; icon: LucideIcon; tone: "accent" | "primary" }
> = {
  intro: { label: "المقدمة", icon: Sparkles, tone: "accent" },
  builder: { label: "البناء", icon: Hammer, tone: "primary" },
  creator: { label: "المحتوى", icon: Palette, tone: "accent" },
  automator: { label: "الأتمتة", icon: Workflow, tone: "primary" },
  analyst: { label: "التحليل", icon: BarChart3, tone: "accent" },
  business: { label: "الأعمال", icon: Briefcase, tone: "primary" },
};

const VALID_PATHS = Object.keys(PATH_META) as PathId[];

type RuntimeLesson = CurriculumLesson & {
  slug: string;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  globalOrder: number;
};

function getPathLessons(pathId: PathId): RuntimeLesson[] {
  const p = getPath(pathId);
  if (!p) return [];
  const out: RuntimeLesson[] = [];
  let globalOrder = 0;
  for (const m of p.modules) {
    for (const l of m.lessons) {
      if (l.state !== "available" || !l.route) continue;
      const slug = l.route.replace(`/learn/${pathId}/`, "");
      globalOrder += 1;
      out.push({
        ...l,
        slug,
        moduleId: m.id,
        moduleTitle: m.title,
        moduleOrder: m.order,
        globalOrder,
      });
    }
  }
  return out;
}

export const Route = createFileRoute("/learn/$pathId/$lessonId")({
  validateSearch: (raw: Record<string, unknown>): { from?: "dashboard" | "curriculum" } => ({
    from: raw.from === "curriculum" || raw.from === "dashboard" ? raw.from : undefined,
  }),
  head: ({ params }) => {
    const pathId = params.pathId as PathId;
    const meta = (PATH_META as Record<string, typeof PATH_META[PathId]>)[pathId];
    if (!meta) return { meta: [{ title: "Lesson" }] };
    const lesson = getPathLessons(pathId).find(
      (l) => l.slug === params.lessonId,
    );
    const title = lesson ? `${lesson.title} — ${meta.label}` : meta.label;
    const description = lesson
      ? `${lesson.title} — درس من مسار ${meta.label} على مسارات (masaarat.ai).`
      : `درس من مسار ${meta.label} على مسارات (masaarat.ai).`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  loader: ({ params }) => {
    const pathId = params.pathId as PathId;
    if (!VALID_PATHS.includes(pathId)) throw notFound();
    const lesson = getPathLessons(pathId).find(
      (l) => l.slug === params.lessonId,
    );
    if (!lesson) throw notFound();
    return { pathId, lesson } as { pathId: PathId; lesson: RuntimeLesson };
  },
  component: UnifiedLessonPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center" dir="rtl">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">الدرس مش موجود.</p>
        <Button asChild variant="glass">
          <Link to="/curriculum">ارجع للخريطة</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-6" dir="rtl">
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  ),
});

function UnifiedLessonPage() {
  const data = Route.useLoaderData() as { pathId: PathId; lesson: RuntimeLesson };
  const { pathId, lesson } = data;
  const { from } = Route.useSearch();
  const { getStatus, setStatus, isLoaded: isProgressLoaded } = useLessonProgress();
  const { recordActivity } = useStreak();
  const { isAdmin } = useEntitlement();
  const meta = PATH_META[pathId];
  const Icon = meta.icon;
  const toneClasses =
    meta.tone === "primary"
      ? "bg-primary/15 border-primary/30 text-primary"
      : "bg-accent/15 border-accent/30 text-accent";
  const continuityClasses =
    meta.tone === "primary"
      ? "border-primary/25 bg-primary/[0.05]"
      : "border-accent/25 bg-accent/[0.05]";
  const continuityLabelClass =
    meta.tone === "primary" ? "text-primary" : "text-accent";

  const lessons = useMemo(() => getPathLessons(pathId), [pathId]);
  const idx = lessons.findIndex((l) => l.slug === lesson.slug);
  const next = lessons[idx + 1];
  const prev = lessons[idx - 1];
  const total = lessons.length;
  const completedCount = lessons.filter(
    (l) => getStatus(l.id) === "completed",
  ).length;
  const pct = total ? Math.round((completedCount / total) * 100) : 0;
  const isCompleted = getStatus(lesson.id) === "completed";

  const [copied, setCopied] = useState(false);
  const copyLessonId = async () => {
    try {
      await navigator.clipboard.writeText(lesson.slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const content = INTRO_LESSON_CONTENT[lesson.slug];
  const missionShape = getLessonMission(lesson.slug);
  const missionGate = useMissionGate(lesson.slug);
  const nextLocked =
    missionGate.kind === "needs-mission" || missionGate.kind === "loading";

  // Access gate: count Intro completions to decide whether to lock.
  const introIds = useMemo(
    () =>
      (getPath("intro")?.modules ?? [])
        .flatMap((m) => m.lessons)
        .filter((l) => l.state === "available")
        .map((l) => l.id),
    [],
  );
  const introDone = introIds.filter((id) => getStatus(id) === "completed").length;
  const { gate, isLoaded: isGateLoaded } = useLessonGate(lesson.id, introDone);
  const isGateReady = isProgressLoaded && isGateLoaded;

  const markCompleted = () => {
    if (isCompleted) return;
    // Mastery gate: if the lesson ships a gated mission, the user can't
    // self-mark complete until the mission is actually passed.
    if (missionShape?.hasRubric && nextLocked) return;
    setStatus(lesson.id, "completed");
    // Only record streak activity on the actual transition to completed,
    // not on every "Next" click of an already-completed lesson.
    recordActivity();
    logLearnerEvent({
      type: "lesson_completed",
      pathId,
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
    });
  };

  // Fire `lesson_opened` once per mount per lesson.
  const openedRef = useRef<string | null>(null);
  useEffect(() => {
    if (openedRef.current === lesson.id) return;
    openedRef.current = lesson.id;
    logLearnerEvent({
      type: "lesson_opened",
      pathId,
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
    });
  }, [lesson.id, lesson.moduleId, pathId]);

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <ReadingProgressBar />
      <CompletionReward
        lessonId={lesson.id}
        isCompleted={isCompleted}
        completedCount={completedCount}
      />
      <main className="flex-1 max-w-[48rem] mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
        {from === "curriculum" ? (
          <Link
            to="/curriculum"
            search={{ module: lesson.moduleId, lesson: lesson.id }}
            aria-label="رجوع للخريطة"
            className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 rounded-full glass border border-primary/30 px-3 py-2 text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-foreground/5 transition shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>رجوع للخريطة</span>
          </Link>
        ) : (
          <Link
            to="/dashboard"
            search={{
              path: pathId,
              module: lesson.moduleId,
              lesson: lesson.id,
            }}
            aria-label="رجوع للوحة"
            className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 rounded-full glass border border-primary/30 px-3 py-2 text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-foreground/5 transition shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>رجوع للوحة</span>
          </Link>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-widest ${toneClasses}`}
            >
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {`M${lesson.moduleOrder} · ${lesson.moduleTitle}`} ·{" "}
              {String(lesson.globalOrder).padStart(2, "0")}/
              {String(total).padStart(2, "0")}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">
            {lesson.title}
          </h1>

          {isAdmin && (
            <button
              type="button"
              onClick={copyLessonId}
              aria-label="نسخ معرّف الدرس"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-[12px] font-mono text-foreground/80 hover:bg-muted/50 hover:text-foreground transition"
            >
              <span className="select-all">{lesson.slug}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5 opacity-70" />
              )}
            </button>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-mono">
              <span>تقدّم {meta.label}</span>
              <span>
                {completedCount}/{total} · {pct}%
              </span>
            </div>
            <Progress value={pct} />
          </div>
        </header>

        {!isGateReady ? (
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            جاري تحميل حالة الوصول للدرس...
          </div>
        ) : gate.kind === "paywall" ? (
          <PaywallCard pathTitle={meta.label} pathId={pathId} />
        ) : gate.kind === "complete-intro-first" ? (
          <IntroGateCard done={gate.introDone} total={gate.introTotal} />
        ) : content ? (
          <IntroLessonRenderer
            content={content}
            lessonId={lesson.slug}
            lessonTitle={lesson.title}
          />
        ) : (
          <div className="rounded-2xl border border-accent-warning/40 bg-accent-warning/20 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-accent-warning-foreground">
              محتوى الدرس مش متوفر دلوقتي
            </p>
            <p className="text-xs text-muted-foreground">
              لو شفت الرسالة دي، تواصل مع الفريق علشان نضيف المحتوى.
            </p>
          </div>
        )}

        {isGateReady && gate.kind === "open" && (
        <>
        <LessonNotes lessonId={lesson.id} />
        <DifficultyPrompt
          lessonId={lesson.id}
          pathId={pathId}
          moduleId={lesson.moduleId}
          completedCount={completedCount}
          isCompleted={isCompleted}
          nextLessonHref={next ? `/learn/${pathId}/${next.slug}` : undefined}
        />
        <section className="mt-8 rounded-2xl border border-border/60 p-5">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">
            مساعد المنصة
          </h2>
          <AssistantPanel compact />
        </section>
        {nextLocked && missionShape?.hasRubric && (
          <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 flex items-start gap-3">
            <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-foreground mb-1">
                محتاجة محاولة بسيطة قبل الخطوة الجاية
              </p>
              <p className="text-foreground/80 text-[13px]">
                علشان تفتح الخطوة الجاية، ابعت محاولة حقيقية وخد Feedback بسيط.
              </p>
            </div>
          </div>
        )}
        <section
          className={`mt-8 rounded-2xl border p-5 ${continuityClasses}`}
        >
          <p
            className={`text-[11px] font-mono flex items-center gap-1.5 mb-2 ${continuityLabelClass}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {next ? "الدرس الجاي" : "آخر درس في المسار"}
          </p>
          <p className="text-[15px] leading-[1.9] text-foreground/90">
            {getContinuity(lesson.id, next?.title, meta.label)}
          </p>
          {next && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              → {next.title}
            </p>
          )}
        </section>

        <nav className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {prev ? (
              <Button asChild variant="glass" size="sm">
                <Link
                  to="/learn/$pathId/$lessonId"
                  params={{ pathId, lessonId: prev.slug }}
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </Link>
              </Button>
            ) : (
              <span />
            )}
          </div>

          <div className="flex gap-2">
            {!isCompleted && (
              <Button
                variant="glass"
                size="sm"
                onClick={markCompleted}
                disabled={nextLocked && !!missionShape?.hasRubric}
                title={
                  nextLocked && missionShape?.hasRubric
                    ? "خلّص المهمة الأول"
                    : undefined
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                خلّصت
              </Button>
            )}
            {next ? (
              <Button
                asChild
                variant="violet"
                size="sm"
                onClick={markCompleted}
                disabled={nextLocked}
                title={nextLocked ? "خلّص المهمة الأول" : undefined}
              >
                {nextLocked ? (
                  <span className="inline-flex items-center gap-1.5 opacity-60 cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5" />
                    الدرس التالي
                  </span>
                ) : (
                  <Link
                    to="/learn/$pathId/$lessonId"
                    params={{ pathId, lessonId: next.slug }}
                  >
                    الدرس التالي
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                )}
              </Button>
            ) : (
              <Button
                asChild
                variant="violet"
                size="sm"
                onClick={markCompleted}
              >
                <Link to="/dashboard">
                  ارجع للوحة
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

            )}
          </div>
        </nav>
        </>
        )}
      </main>
    </div>
  );
}