import { JourneyVisitRecorder } from "@/components/journey/JourneyVisitRecorder";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
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
import { useEffect, useLayoutEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthSessionGate } from "@/lib/auth-route-guard";
import { parseAuthIntentSearch } from "@/lib/kids/auth-intent";
import { requireLearnerBeforeLoad } from "@/lib/learner-route-guard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLessonProgress } from "@/lib/lesson-progress";
import { LessonProgressFeedback } from "@/components/learn/LessonProgressFeedback";
import { AiLessonCompletionAction, type AiCompletionContext } from "@/components/learn/AiLessonCompletionAction";
import { useAuth } from "@/lib/auth-context";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import { getContinuityForLocale } from "@/lib/locale-curriculum/resolve-continuity";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { getPath, type CurriculumLesson, type PathId } from "@/lib/curriculum-data";
import { useEntitlement, useLessonGate, useStreak } from "@/lib/entitlements";
import { PaywallCard, IntroGateCard } from "@/components/learn/PaywallCard";
import {
  isLessonNavigationMissionLocked,
  useMissionGateForPage,
  useLessonMissionShapeForPage,
} from "@/lib/mission-gate";
import { Lock } from "lucide-react";
import { logLearnerEvent } from "@/lib/learner-events";
import { LessonNotes } from "@/components/learn/LessonNotes";
import { DifficultyPrompt } from "@/components/learn/DifficultyPrompt";
import { ReadingProgressBar } from "@/components/learn/ReadingProgressBar";
import { CompletionReward } from "@/components/learn/CompletionReward";
import { CourseLessonAssistant } from "@/components/assistant/CourseLessonAssistant";
import { buildLocalizedAssistantContextOverride } from "@/lib/assistant/resolve-assistant-learner-context";
import { LocalePackageLessonRenderer } from "@/components/locale/LocalePackageLessonRenderer";
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

export const PATH_META: Record<PathId, { icon: LucideIcon; tone: "accent" | "primary" }> = {
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

export const VALID_PATHS = Object.keys(PATH_META) as PathId[];

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
  beforeLoad: requireLearnerBeforeLoad,
  validateSearch: (raw: Record<string, unknown>) => parseLessonPreviewSearch(raw),
  head: async ({ params, match, loaderData }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    const pathId = params.pathId as PathId;
    if (!VALID_PATHS.includes(pathId)) {
      return buildLocalizedLearnerMeta(locale, "learn", { unknownPath: true });
    }
    const lesson = getPathLessons(pathId).find((l) => l.slug === params.lessonId);
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
    const lesson = getPathLessons(pathId).find((l) => l.slug === params.lessonId);
    if (!lesson) throw notFound();

    const previewSearch = parseLessonPreviewSearch(deps as Record<string, unknown>);
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
      localizedPackage = await loadLocalePackageLesson(lessonAccess.effectiveLocale, lesson.id);
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
  component: LearnerLessonPage,
  notFoundComponent: LearnLessonNotFound,
  errorComponent: LearnLessonError,
});

function LearnerLessonPage() {
  const { locale } = useLocale();
  const search = Route.useSearch();
  const { pathId, lessonId } = Route.useParams();
  const loginSearch = parseAuthIntentSearch({
    locale: search.locale ?? locale,
    returnTo: `/learn/${pathId}/${lessonId}`,
  });
  return (
    <AuthSessionGate loginSearch={loginSearch}>
      <UnifiedLessonPage />
    </AuthSessionGate>
  );
}

function LearnLessonError({ error }: { error: unknown }) {
  const { dir } = useLocale();
  const t = useUiString();

  return (
    <div className="min-h-dvh grid place-items-center p-6" dir={dir}>
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : t("learn.error.load")}
      </p>
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
  const localeNavSearch = preserveLocaleSearch(previewSearch, cookieLocale);
  const localeSearch = useLocaleLinkSearch();
  const { dir, locale } = useLocale();
  const t = useUiString();
  const moduleTitle = getCurriculumModuleLabel(locale, lesson.moduleId, "title");

  const effectiveAccess = lessonAccess;
  const isLocalizedPackagePage =
    effectiveAccess.contentSource === "locale-package-json" && localizedPackage !== null;
  const [egyptianContent, setEgyptianContent] = useState<{
    lessonSlug: string;
    content: Awaited<ReturnType<typeof loadIntroLessonContent>>;
  } | null | undefined>(undefined);

  useEffect(() => {
    if (isLocalizedPackagePage) {
      setEgyptianContent(null);
      return;
    }
    let cancelled = false;
    const lessonSlug = lesson.slug;
    void loadIntroLessonContent(lessonSlug).then((loaded) => {
      if (!cancelled) setEgyptianContent({ lessonSlug, content: loaded });
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.slug, isLocalizedPackagePage]);

  const content = isLocalizedPackagePage
    ? null
    : egyptianContent?.lessonSlug === lesson.slug
      ? egyptianContent.content
      : undefined;
  const progress = useLessonProgress();
  const { getStatus, isLoaded: isProgressLoaded } = progress;
  const auth = useAuth();
  const navigate = useNavigate();
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
  const continuityLabelClass = meta.tone === "primary" ? "text-primary" : "text-accent";
  const PreviousNavIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const NextNavIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const lessons = useMemo(() => getPathLessons(pathId), [pathId]);
  const idx = lessons.findIndex((l) => l.slug === lesson.slug);
  const next = lessons[idx + 1];
  const prev = lessons[idx - 1];
  const total = lessons.length;
  const completedCount = lessons.filter((l) => getStatus(l.id) === "completed").length;
  const pct = total ? Math.round((completedCount / total) * 100) : 0;
  const pathLabel = learnPathLabel(t, pathId);
  const curriculumLessonTitle = getCurriculumLessonLabel(locale, lesson.id);
  const displayTitle = resolveLearnDisplayTitle(curriculumLessonTitle, localizedPackage);
  const nextLessonTitle = next ? getCurriculumLessonLabel(locale, next.id) : undefined;
  const progressStats = t("learn.progress.stats")
    .replace("{completed}", String(completedCount))
    .replace("{total}", String(total))
    .replace("{pct}", String(pct));
  const isCompleted = getStatus(lesson.id) === "completed";
  // Presentation ownership is independent of read success and optimistic progress.
  const completionViewKey = JSON.stringify([
    auth.user?.id ?? null, pathId, lesson.moduleId, lesson.id, locale,
  ]);
  const actionContextKey = JSON.stringify([
    completionViewKey, auth.authGeneration.value, next?.slug ?? "/dashboard",
  ]);
  const completionMode = useRef({ key: completionViewKey, explicitIntent: false });
  if (completionMode.current.key !== completionViewKey) {
    completionMode.current = { key: completionViewKey, explicitIntent: false };
  }
  const currentActionKey = useRef(actionContextKey);
  currentActionKey.current = actionContextKey;
  const capturedAuthGeneration = auth.authGeneration;
  const isCompletionCurrent = (context: AiCompletionContext) =>
    currentActionKey.current === context.actionContextKey &&
    context.actionContextKey === actionContextKey &&
    context.userId === auth.user?.id && context.lessonId === lesson.id &&
    auth.isAuthGenerationCurrent(capturedAuthGeneration) && context.isCurrent();
  const ownWritePending = progress.writeState?.lessonId === lesson.id &&
    progress.writeState.status === "pending";
  const ordinaryCompleted = isCompleted &&
    !completionMode.current.explicitIntent && !ownWritePending;
  const [completionReceipt, setCompletionReceipt] = useState<AiCompletionContext | null>(null);
  const confirmedCompletion = completionReceipt !== null && isCompletionCurrent(completionReceipt);
  const completionControlsRef = useRef<HTMLDivElement>(null);
  const pendingCompletionFocus = useRef<{
    actionContextKey: string;
    origin: HTMLButtonElement;
  } | null>(null);

  useLayoutEffect(() => {
    const request = pendingCompletionFocus.current;
    if (request === null) return;
    if (request.actionContextKey !== actionContextKey) {
      pendingCompletionFocus.current = null;
      return;
    }
    if (!completionReceipt || !isCompletionCurrent(completionReceipt)) return;
    pendingCompletionFocus.current = null;
    const buttons = completionControlsRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const target = buttons?.[1] ?? null;
    const doc = request.origin.ownerDocument;
    if (
      target === null || !target.isConnected || target.ownerDocument !== doc ||
      target.disabled || target.getAttribute("aria-disabled") === "true" ||
      target.tabIndex < 0 || target.getClientRects().length === 0
    ) return;
    const active = doc.activeElement;
    if (
      (active === request.origin || active === doc.body) &&
      isCompletionCurrent(completionReceipt)
    ) target.focus();
  });

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

  const missionShape = useLessonMissionShapeForPage(
    lesson.slug,
    localizedPackage,
    isLocalizedPackagePage,
  );
  const missionGate = useMissionGateForPage(lesson.slug, localizedPackage, isLocalizedPackagePage);
  const nextLocked = isLessonNavigationMissionLocked(missionGate);

  const assistantContextOverride = useMemo(() => {
    if (missionShape === undefined) {
      return null;
    }
    return buildLocalizedAssistantContextOverride({
      pathId,
      pathTitle: pathLabel,
      moduleId: lesson.moduleId,
      moduleTitle,
      lessonId: lesson.slug,
      lessonTitle: displayTitle,
      nextLessonTitle: nextLessonTitle ?? null,
      mission:
        missionShape?.intro && missionShape.prompt
          ? { intro: missionShape.intro, prompt: missionShape.prompt }
          : null,
    });
  }, [
    isLocalizedPackagePage,
    localizedPackage,
    missionShape,
    pathId,
    pathLabel,
    lesson.moduleId,
    moduleTitle,
    lesson.slug,
    displayTitle,
    nextLessonTitle,
  ]);

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

  // Best-effort effects are separate from the owned progress acknowledgement.
  // Actor transport and effect persistence are not acknowledged by these calls.
  const recordConfirmedActivity = (context: AiCompletionContext) => {
    if (isCompletionCurrent(context)) recordActivity(context);
  };
  const recordConfirmedLesson = (context: AiCompletionContext) => {
    if (!isCompletionCurrent(context)) return;
    void logLearnerEvent({
      type: "lesson_completed",
      pathId,
      moduleId: lesson.moduleId,
      lessonId: context.lessonId,
    }, context);
  };
  const continueConfirmedLesson = (context: AiCompletionContext) => {
    if (!isCompletionCurrent(context)) return;
    if (next) {
      void navigate({
        to: "/learn/$pathId/$lessonId",
        params: { pathId, lessonId: next.slug },
        search: localeNavSearch,
      });
    } else {
      void navigate({ to: "/dashboard", search: localeSearch() });
    }
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
    <div className="min-h-dvh flex flex-col overflow-x-clip" dir={dir}>
      <Sidebar />
      <ReadingProgressBar />
      {(ordinaryCompleted || confirmedCompletion) && (
        <CompletionReward
          key={actionContextKey}
          lessonId={lesson.id}
          isCompleted={true}
          completedCount={completedCount}
        />
      )}
      <main className="flex-1 min-w-0 max-w-[48rem] mx-auto w-full px-4 sm:px-6 pt-8 pb-28 md:pt-12 xl:pb-12">
        <Link
          to="/curriculum"
          search={localeSearch({ module: lesson.moduleId, lesson: lesson.id })}
          aria-label={t("learn.backToMap")}
          className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full glass border border-primary/30 px-3 py-2 text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-foreground/5 transition shadow-md"
        >
          <PreviousNavIcon className="h-4 w-4" />
          <span className="truncate">{t("learn.backToMap")}</span>
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-widest ${toneClasses}`}
            >
              <Icon className="h-3 w-3" /> {pathLabel}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {`M${lesson.moduleOrder} · ${moduleTitle}`} ·{" "}
              {String(lesson.globalOrder).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
            {isLocalizedPackagePage ? (
              <span aria-hidden hidden data-locale-live-active={effectiveAccess.effectiveLocale} />
            ) : null}
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">{displayTitle}</h1>

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
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[11px] text-muted-foreground mb-1.5 font-mono">
              <span className="min-w-0 truncate">
                {t("learn.progress.path").replace("{path}", pathLabel)}
              </span>
              <span className="text-end">{progressStats}</span>
            </div>
            <Progress
              value={pct}
              aria-label={t("learn.progress.path").replace("{path}", pathLabel)}
            />
          </div>
        </header>

        <LessonProgressFeedback
          progress={{
            isLoaded: progress.isLoaded,
            isError: progress.isError,
            isFetching: progress.isFetching,
            refetch: progress.refetch,
          }}
          lessonId={lesson.id}
        />

        {!isGateReady ? (
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            {t("learn.loading.access")}
          </div>
        ) : gate.kind === "paywall" ? (
          <PaywallCard pathTitle={pathLabel} pathId={pathId} />
        ) : gate.kind === "complete-intro-first" ? (
          <IntroGateCard done={gate.introDone} total={gate.introTotal} />
        ) : isLocalizedPackagePage && localizedPackage ? (
          <LocalePackageLessonRenderer pkg={localizedPackage} />
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
            <p className="text-xs text-muted-foreground">{t("learn.content.unavailable.body")}</p>
          </div>
        )}

        {isGateReady && gate.kind === "open" && (
          <>
            <JourneyVisitRecorder line="ai" course="ai" lesson={lesson.id} locale={locale} />
            <LessonNotes lessonId={lesson.id} />
            <DifficultyPrompt
              lessonId={lesson.id}
              pathId={pathId}
              moduleId={lesson.moduleId}
              completedCount={completedCount}
              isCompleted={isCompleted}
              nextLessonHref={next ? `/learn/${pathId}/${next.slug}` : undefined}
            />
            {nextLocked && missionShape?.hasRubric && (
              <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-foreground mb-1">
                    {t("learn.missionGate.title")}
                  </p>
                  <p className="text-foreground/80 text-[13px]">{t("learn.missionGate.body")}</p>
                </div>
              </div>
            )}
            <section className={`mt-8 rounded-2xl border p-5 ${continuityClasses}`}>
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
                <p className="text-xs text-muted-foreground mt-2 font-mono">{dir === "rtl" ? "←" : "→"} {nextLessonTitle}</p>
              )}
            </section>

            <nav className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap gap-2">
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
                {ordinaryCompleted ? (
                  next ? (
                    <Button
                      asChild variant="violet" size="sm" disabled={nextLocked}
                      title={nextLocked ? t("learn.missionGate.finishFirst") : undefined}
                    >
                      {nextLocked ? (
                        <span className="inline-flex items-center gap-1.5 opacity-60 cursor-not-allowed">
                          <Lock className="h-3.5 w-3.5" />{t("learn.nav.next")}
                        </span>
                      ) : (
                        <Link
                          to="/learn/$pathId/$lessonId"
                          params={{ pathId, lessonId: next.slug }}
                          search={localeNavSearch}
                        >
                          {t("learn.nav.next")}<NextNavIcon className="h-4 w-4" />
                        </Link>
                      )}
                    </Button>
                  ) : (
                    <Button asChild variant="violet" size="sm">
                      <Link to="/dashboard" search={localeSearch()}>
                        {t("learn.backToDashboard")}<NextNavIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  )
                ) : (
                  <div
                    ref={completionControlsRef}
                    onClickCapture={(event) => {
                      const button = event.target instanceof Element
                        ? event.target.closest<HTMLButtonElement>("button")
                        : null;
                      if (!button || button.disabled || !event.currentTarget.contains(button)) return;
                      completionMode.current.explicitIntent = true;
                      pendingCompletionFocus.current =
                        event.detail === 0 &&
                        event.currentTarget.querySelector("button") === button &&
                        button.ownerDocument.activeElement === button
                          ? { actionContextKey, origin: button }
                          : null;
                    }}
                  >
                    <AiLessonCompletionAction
                      progress={progress}
                      lessonId={lesson.id}
                      actionContextKey={actionContextKey}
                      completeLabel={t("learn.nav.markComplete")}
                      continueLabel={next ? t("learn.nav.next") : t("learn.backToDashboard")}
                      disabled={nextLocked && !!missionShape?.hasRubric}
                      onRecordActivity={recordConfirmedActivity}
                      onLessonCompleted={recordConfirmedLesson}
                      onConfirmed={(context) => {
                        if (isCompletionCurrent(context)) setCompletionReceipt(context);
                      }}
                      onContinue={nextLocked && (next || missionShape?.hasRubric)
                        ? undefined
                        : continueConfirmedLesson}
                    />
                    {!next && nextLocked && missionShape?.hasRubric && (
                      <Button asChild variant="violet" size="sm">
                        <Link to="/dashboard" search={localeSearch()}>
                          {t("learn.backToDashboard")}<NextNavIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {nextLocked && next && (
                      <Button variant="violet" size="sm" disabled
                        title={t("learn.missionGate.finishFirst")}>
                        <Lock className="h-3.5 w-3.5" />{t("learn.nav.next")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </nav>
            <CourseLessonAssistant area="ai" locale={locale} pathId={pathId} lessonId={lesson.slug} contextOverride={assistantContextOverride} />
          </>
        )}
      </main>
    </div>
  );
}
