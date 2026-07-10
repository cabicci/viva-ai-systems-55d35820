import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Map as MapIcon,
  Hammer,
  Palette,
  Workflow,
  BarChart3,
  Briefcase,
  Copy,
  Check,
  Milestone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLessonProgress } from "@/lib/lesson-progress";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import { getContinuityForLocale } from "@/lib/locale-curriculum/resolve-continuity";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import {
  getPath,
  type CurriculumLesson,
  type PathId,
} from "@/lib/curriculum-data";
import { useEntitlement, useLessonGate, useStreak } from "@/lib/entitlements";
import { PaywallCard, IntroGateCard } from "@/components/learn/PaywallCard";
import {
  isLessonNavigationMissionLocked,
  useMissionGate,
  useLessonMissionShape,
} from "@/lib/mission-gate";
import { Lock } from "lucide-react";
import { logLearnerEvent } from "@/lib/learner-events";
import { LessonNotes } from "@/components/learn/LessonNotes";
import { DifficultyPrompt } from "@/components/learn/DifficultyPrompt";
import { ReadingProgressBar } from "@/components/learn/ReadingProgressBar";
import { CompletionReward } from "@/components/learn/CompletionReward";
import { FloatingAssistantLauncher } from "@/components/learn/FloatingAssistantLauncher";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { LocalePackagePreviewRenderer } from "@/components/locale/LocalePackagePreviewRenderer";
import { LocaleAssistantUnavailable } from "@/components/locale/LocaleAssistantUnavailable";
import { LocaleLiveSafetyMarkers } from "@/components/locale/LocaleLiveSafetyMarkers";
import { loadLocalePackageLesson } from "@/lib/locale-lessons/load-locale-package-lesson";
import { readRequestCookieLocale } from "@/lib/locale/locale-cookie";
import { readRequestCountryCode } from "@/lib/locale/read-request-country";
import { useLocale } from "@/lib/locale/locale-context";
import {
  getCurriculumLessonLabel,
  getCurriculumModuleLabel,
} from "@/lib/locale-curriculum/resolve-curriculum-label";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { resolveLearnDisplayTitle } from "@/lib/locale/learn-display-title";
import { useUiString } from "@/lib/locale/use-ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";
import { resolveLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import {
  buildLessonLocaleSearch,
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
  type LessonPreviewSearch,
} from "@/lib/locale-lessons/lesson-preview-search";
import type { ResolvedLessonAccess } from "@/lib/locale-lessons/resolve-lesson-access";
import { isPackageLocale } from "@/lib/locale-lessons/registry";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

/* --------------------------------------------------------------
 *  Unified lesson runtime — one page for every path's lessons.
 *  Route: /learn/{pathId}/{lessonId}
 * -------------------------------------------------------------- */

const PATH_META: Record<
  PathId,
  { icon: LucideIcon; tone: "accent" | "primary" }
> = {
  intro: { icon: MapIcon, tone: "accent" },
  builder: { icon: Hammer, tone: "primary" },
  creator: { icon: Palette, tone: "accent" },
  automator: { icon: Workflow, tone: "primary" },
  analyst: { icon: BarChart3, tone: "accent" },
  business: { icon: Briefcase, tone: "primary" },
};

const LEARN_PATH_KEYS: Record<PathId, UiStringKey> = {
  intro: "learn.path.intro",
  builder: "learn.path.builder",
  creator: "learn.path.creator",
  automator: "learn.path.automator",
  analyst: "learn.path.analyst",
  business: "learn.path.business",
};

function learnPathLabel(t: (key: UiStringKey) => string, pathId: PathId): string {
  return t(LEARN_PATH_KEYS[pathId]);
}

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

type LessonLoaderData = {
  pathId: PathId;
  lesson: RuntimeLesson;
  lessonAccess: ResolvedLessonAccess;
  localizedPackage: LocalizedLessonPackage | null;
  cookieLocale?: string;
};

function preserveLocaleSearch(
  search: LessonPreviewSearch,
  cookieLocale?: string | null,
): ReturnType<typeof buildLessonLocaleSearch> {
  return buildLessonLocaleSearch(search, cookieLocale);
}

export const Route = createFileRoute("/learn/$pathId/$lessonId")({
  validateSearch: (raw: Record<string, unknown>) => parseLessonPreviewSearch(raw),
  head: async ({ params, match, loaderData }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    const pathId = params.pathId as PathId;
    if (!VALID_PATHS.includes(pathId)) {
      return buildLocalizedLearnerMeta(locale, "learn", { unknownPath: true });
    }
    const lesson = getPathLessons(pathId).find(
      (l) => l.slug === params.lessonId,
    );
    const data = loaderData as LessonLoaderData | undefined;
    return buildLocalizedLearnerMeta(locale, "learn", {
      pathId,
      lessonId: lesson?.id,
      packageTitle: data?.localizedPackage?.title,
    });
  },
  loaderDeps: ({ search }) => ({
    locale: search.locale,
    previewLocale: search.previewLocale,
    from: search.from,
  }),
  loader: async ({ params, deps }) => {
    const pathId = params.pathId as PathId;
    if (!VALID_PATHS.includes(pathId)) throw notFound();
    const lesson = getPathLessons(pathId).find(
      (l) => l.slug === params.lessonId,
    );
    if (!lesson) throw notFound();

    const previewSearch = parseLessonPreviewSearch(
      deps as Record<string, unknown>,
    );
    const cookieLocale = await readRequestCookieLocale();
    const countryCode = await readRequestCountryCode();
    let lessonAccess = resolveRouteLessonAccess(
      lesson.id,
      previewSearch,
      cookieLocale,
      countryCode,
    );

    let localizedPackage: LocalizedLessonPackage | null = null;
    if (
      lessonAccess.contentSource === "locale-package-json" &&
      isPackageLocale(lessonAccess.effectiveLocale)
    ) {
      localizedPackage = await loadLocalePackageLesson(
        lessonAccess.effectiveLocale,
        lesson.id,
      );
      if (!localizedPackage) {
        lessonAccess = resolveLessonAccess(lesson.id);
      }
    }

    return {
      pathId,
      lesson,
      lessonAccess,
      localizedPackage,
      cookieLocale,
    } satisfies LessonLoaderData;
  },
  component: UnifiedLessonPage,
  notFoundComponent: LearnLessonNotFound,
  errorComponent: LearnLessonError,
});

function LearnLessonError({ error }: { error: Error }) {
  const { dir } = useLocale();

  return (
    <div className="min-h-dvh grid place-items-center p-6" dir={dir}>
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  );
}

function LearnLessonNotFound() {
  const t = useUiString();
  const { dir, locale } = useLocale();

  return (
    <div className="min-h-dvh grid place-items-center" dir={dir}>
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">{t("learn.notFound.body")}</p>
        <Button asChild variant="glass">
          <Link to="/curriculum">{t("learn.notFound.backToMap")}</Link>
        </Button>
      </div>
    </div>
  );
}

function UnifiedLessonPage() {
  const { pathId, lesson, lessonAccess, localizedPackage, cookieLocale } =
    Route.useLoaderData() as LessonLoaderData;
  const previewSearch = Route.useSearch();
  const { from } = previewSearch;
  const localeNavSearch = preserveLocaleSearch(previewSearch, cookieLocale);
  const localeSearch = useLocaleLinkSearch();
  const { dir, locale } = useLocale();
  const t = useUiString();
  const moduleTitle = getCurriculumModuleLabel(locale, lesson.moduleId, "title");

  const effectiveAccess = lessonAccess;
  const isLocalizedPackagePage =
    effectiveAccess.contentSource === "locale-package-json" &&
    localizedPackage !== null;
  const showLocalePreview = isLocalizedPackagePage;
  const [egyptianContent, setEgyptianContent] = useState<
    Awaited<ReturnType<typeof loadIntroLessonContent>> | undefined
  >(undefined);

  useEffect(() => {
    if (showLocalePreview) {
      setEgyptianContent(null);
      return;
    }
    let cancelled = false;
    void loadIntroLessonContent(lesson.slug).then((loaded) => {
      if (!cancelled) setEgyptianContent(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.slug, showLocalePreview]);

  const content = showLocalePreview ? null : egyptianContent;
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
  const PreviousNavIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const NextNavIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const lessons = useMemo(() => getPathLessons(pathId), [pathId]);
  const idx = lessons.findIndex((l) => l.slug === lesson.slug);
  const next = lessons[idx + 1];
  const prev = lessons[idx - 1];
  const total = lessons.length;
  const completedCount = lessons.filter(
    (l) => getStatus(l.id) === "completed",
  ).length;
  const pct = total ? Math.round((completedCount / total) * 100) : 0;
  const pathLabel = learnPathLabel(t, pathId);
  const curriculumLessonTitle = getCurriculumLessonLabel(locale, lesson.id);
  const displayTitle = resolveLearnDisplayTitle(
    curriculumLessonTitle,
    localizedPackage,
  );
  const nextLessonTitle = next
    ? getCurriculumLessonLabel(locale, next.id)
    : undefined;
  const progressStats = t("learn.progress.stats")
    .replace("{completed}", String(completedCount))
    .replace("{total}", String(total))
    .replace("{pct}", String(pct));
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

  const missionShape = useLessonMissionShape(lesson.slug);
  const missionGate = useMissionGate(lesson.slug);
  const nextLocked = isLessonNavigationMissionLocked(missionGate, {
    localizedPackagePreview: isLocalizedPackagePage,
  });

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
    <div className="min-h-dvh flex" dir={dir}>
      <Sidebar />
      <ReadingProgressBar />
      <CompletionReward
        lessonId={lesson.id}
        isCompleted={isCompleted}
        completedCount={completedCount}
      />
      <main className="flex-1 max-w-[48rem] mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
        {isLocalizedPackagePage ? (
          <LocaleLiveSafetyMarkers locale={effectiveAccess.effectiveLocale} />
        ) : null}
        {from === "curriculum" ? (
          <Link
            to="/curriculum"
            search={{ module: lesson.moduleId, lesson: lesson.id }}
            aria-label={t("learn.backToMap")}
            className="fixed top-4 start-4 z-50 inline-flex items-center gap-2 rounded-full glass border border-primary/30 px-3 py-2 text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-foreground/5 transition shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("learn.backToMap")}</span>
          </Link>
        ) : (
          <Link
            to="/dashboard"
            search={localeSearch({
              path: pathId,
              module: lesson.moduleId,
              lesson: lesson.id,
            })}
            aria-label={t("learn.backToDashboard")}
            className="fixed top-4 start-4 z-50 inline-flex items-center gap-2 rounded-full glass border border-primary/30 px-3 py-2 text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-foreground/5 transition shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("learn.backToDashboard")}</span>
          </Link>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-widest ${toneClasses}`}
            >
              <Icon className="h-3 w-3" /> {pathLabel}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {`M${lesson.moduleOrder} · ${moduleTitle}`} ·{" "}
              {String(lesson.globalOrder).padStart(2, "0")}/
              {String(total).padStart(2, "0")}
            </span>
            {showLocalePreview ? (
              <span
                aria-hidden
                hidden
                data-locale-live-active={effectiveAccess.effectiveLocale}
              />
            ) : null}
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">
            {displayTitle}
          </h1>

          {isAdmin && (
            <button
              type="button"
              onClick={copyLessonId}
              aria-label={t("learn.admin.copyLessonId")}
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
              <span>
                {t("learn.progress.path").replace("{path}", pathLabel)}
              </span>
              <span>{progressStats}</span>
            </div>
            <Progress value={pct} />
          </div>
        </header>

        {!isGateReady ? (
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            {t("learn.loading.access")}
          </div>
        ) : gate.kind === "paywall" ? (
          <PaywallCard pathTitle={pathLabel} pathId={pathId} />
        ) : gate.kind === "complete-intro-first" ? (
          <IntroGateCard done={gate.introDone} total={gate.introTotal} />
        ) : showLocalePreview && localizedPackage ? (
          <LocalePackagePreviewRenderer pkg={localizedPackage} />
        ) : content === undefined ? (
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            {t("learn.loading.access")}
          </div>
        ) : content ? (
          <IntroLessonRenderer
            content={content}
            lessonId={lesson.slug}
            lessonTitle={curriculumLessonTitle}
          />
        ) : (
          <div className="rounded-2xl border border-accent-warning/40 bg-accent-warning/20 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-accent-warning-foreground">
              {t("learn.content.unavailable.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("learn.content.unavailable.body")}
            </p>
          </div>
        )}

        {isGateReady && gate.kind === "open" && (
        <>
        {!isLocalizedPackagePage ? (
          <LessonNotes lessonId={lesson.id} />
        ) : null}
        {!isLocalizedPackagePage ? (
        <DifficultyPrompt
          lessonId={lesson.id}
          pathId={pathId}
          moduleId={lesson.moduleId}
          completedCount={completedCount}
          isCompleted={isCompleted}
          nextLessonHref={next ? `/learn/${pathId}/${next.slug}` : undefined}
        />
        ) : null}
        {!isLocalizedPackagePage && nextLocked && missionShape?.hasRubric && (
          <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 flex items-start gap-3">
            <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-foreground mb-1">
                {t("learn.missionGate.title")}
              </p>
              <p className="text-foreground/80 text-[13px]">
                {t("learn.missionGate.body")}
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
            <Milestone className="h-3.5 w-3.5" />
            {next ? t("learn.continuity.next") : t("learn.continuity.lastInPath")}
          </p>
          <p className="text-[15px] leading-[1.9] text-foreground/90">
            {getContinuityForLocale(locale, lesson.id, {
              nextTitle: nextLessonTitle,
              pathTitle: pathLabel,
              hasNext: Boolean(next),
            })}
          </p>
          {next && nextLessonTitle && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              → {nextLessonTitle}
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
                  search={localeNavSearch}
                >
                  <PreviousNavIcon className="h-4 w-4" />
                  {t("learn.nav.previous")}
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
                    ? t("learn.missionGate.finishFirst")
                    : undefined
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("learn.nav.markComplete")}
              </Button>
            )}
            {next ? (
              <Button
                asChild
                variant="violet"
                size="sm"
                onClick={markCompleted}
                disabled={nextLocked}
                title={nextLocked ? t("learn.missionGate.finishFirst") : undefined}
              >
                {nextLocked ? (
                  <span className="inline-flex items-center gap-1.5 opacity-60 cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5" />
                    {t("learn.nav.next")}
                  </span>
                ) : (
                  <Link
                    to="/learn/$pathId/$lessonId"
                    params={{ pathId, lessonId: next.slug }}
                    search={localeNavSearch}
                  >
                    {t("learn.nav.next")}
                    <NextNavIcon className="h-4 w-4" />
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
                <Link to="/dashboard" search={localeSearch()}>
                  {t("learn.backToDashboard")}
                  <NextNavIcon className="h-4 w-4" />
                </Link>
              </Button>

            )}
          </div>
        </nav>
        <FloatingAssistantLauncher
          fabLabel={t("learn.assistant.fab")}
          fabAriaLabel={t("learn.assistant.fabAria")}
          panelTitle={t("learn.assistant.summary")}
        >
          {isLocalizedPackagePage ? (
            <LocaleAssistantUnavailable locale={effectiveAccess.effectiveLocale} />
          ) : (
            <AssistantPanel compact />
          )}
        </FloatingAssistantLauncher>
        </>
        )}
      </main>
    </div>
  );
}