import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CourseContents,
  CourseIntroduction,
  courseSummary,
  LessonHero,
  AdjacentSteps,
  SECONDARY_CLASS,
} from "@/components/course-intake/CoursePresentation";
import { getPathStoryCopy } from "@/lib/path-story";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { scopedSearch } from "@/lib/course-system/intake/navigation";
import { getLineCopy, LINE_PRICING, LINE_ROUTES } from "@/lib/learning-lines";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import {
  useActivityDraft,
  type ActivityValues,
} from "@/lib/course-system/intake/use-activity-draft";
import { useLocale } from "@/lib/locale/locale-context";
import { COURSE_AREAS } from "@/lib/course-system/contract";
import { curriculumCatalogue, curriculumCommand } from "@/lib/course-system/intake/client";
import { askCurriculumAssistant, curriculumAsset } from "@/lib/course-system/intake/functions";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { useKidsParentStateSource } from "@/lib/kids/parent-state";
import {
  CurriculumContent,
  type LessonContent,
} from "@/components/course-intake/CurriculumContent";
import { CurriculumLayout } from "@/components/site/CurriculumLayout";
import { LearningLessonNotes } from "@/components/journey/LearningLessonNotes";
import { LearningReadingPosition } from "@/components/journey/LearningReadingPosition";
import { AssistantConversationPanel } from "@/components/assistant/AssistantConversationPanel";
import { FloatingAssistantLauncher } from "@/components/learn/FloatingAssistantLauncher";
import { getUiString } from "@/lib/locale/ui-strings";
import { Button } from "@/components/ui/button";
import { Activity, type Delivery } from "@/components/course-intake/CurriculumActivity";
import { lessonLead } from "@/lib/course-system/intake/presentation";
import { getAcademicCopy } from "@/lib/academic-education/copy";
import type { IntakeSection } from "@/lib/course-system/intake/package";

export const Route = createFileRoute("/courses/$area/$courseId")({
  params: {
    parse: (p) => ({
      area: z.enum(COURSE_AREAS).parse(p.area),
      courseId: z
        .string()
        .regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/)
        .parse(p.courseId),
    }),
  },
  validateSearch: z.object({
    locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]).optional(),
    lesson: z.string().max(80).optional(),
    view: z.enum(["contents"]).optional(),
    profileId: z.string().uuid().optional(),
  }),
  head: () => ({
    meta: [{ title: "Masaarat — Learning" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: NewCurriculumPage,
});
function NewCurriculumPage() {
  const { area, courseId } = Route.useParams();
  const search = Route.useSearch();
  const auth = useAuth();
  const entitlement = useEntitlement();
  const { locale, dir } = useLocale();
  const c = intakeCopy(locale);
  const parent = useKidsParentStateSource();
  const chosen = search.lesson ?? "";
  const mode = search.lesson ? "lesson" : search.view === "contents" ? "contents" : "intro";
  const story = getPathStoryCopy(locale);
  const [sectionId, selectSection] = useState("");
  const navigate = Route.useNavigate();
  const child = search.profileId ?? "";
  const setChild = (id: string) =>
    void navigate({ search: (prev) => ({ ...prev, profileId: id || undefined }), replace: true });
  const catalogue = useQuery({
    queryKey: ["added-curricula", area, locale],
    queryFn: () => curriculumCatalogue(area, locale),
  });
  const course = catalogue.data?.find((x) => x.id === courseId);
  const step =
    course?.stations.flatMap((s) => s.steps).find((s) => s.id === chosen) ??
    course?.stations[0].steps[0];
  const profileId =
    area === "kids" &&
    entitlement.isAdmin &&
    auth.user &&
    (child === auth.user.id || (!child && parent.profiles.length === 0))
      ? auth.user.id
      : area === "kids"
        ? (parent.profiles.find((p) => p.id === child)?.id ?? parent.profiles[0]?.id)
        : undefined;
  const keep = scopedSearch(locale, profileId);
  const scope = {
    area,
    course: courseId,
    lesson: step?.id ?? "",
    ...(profileId ? { profileId } : {}),
  };
  const key = JSON.stringify([
    auth.user?.id,
    auth.authGeneration.value,
    area,
    courseId,
    scope.lesson,
    locale,
    profileId,
  ]);
  const delivery = useQuery({
    queryKey: ["curriculum-lesson", key],
    enabled:
      mode === "lesson" &&
      !!auth.user &&
      !auth.loading &&
      !!step &&
      (area !== "kids" || !!profileId),
    queryFn: () => curriculumCommand<Delivery>("lesson", { ...scope, locale }),
    retry: false,
    refetchInterval: 30000,
    staleTime: 0,
  });
  const visible = !!auth.user && !auth.loading && !delivery.isError ? delivery.data : undefined;
  useEffect(() => {
    selectSection("");
  }, [key]);
  const steps = course?.stations.flatMap((s) => s.steps) ?? [];
  const at = steps.findIndex((s) => s.id === step?.id);
  const stepLink = (id: string) => scopedSearch(locale, profileId, { lesson: id });
  if (mode !== "lesson")
    return (
      <CurriculumLayout
        line={area}
        title={
          course
            ? mode === "contents"
              ? story.contents
              : `${story.path} ${course.title}`
            : undefined
        }
        subtitle={course ? (mode === "contents" ? course.title : courseSummary(course.id, locale)) : c.stations}
      >
        {catalogue.isPending && <p role="status">{c.loading}</p>}
        {catalogue.isError && (
          <div role="alert">
            <p>{c.error}</p>
            <button className="mt-3 underline" onClick={() => void catalogue.refetch()}>
              {story.retry}
            </button>
          </div>
        )}
        {!course && catalogue.isSuccess && <p>{c.courseUnavailable}</p>}
        {course && mode === "intro" && (
          <CourseIntroduction
            courseId={course.id}
            stations={course.stations}
            locale={locale}
            back={
              <a href={`${LINE_ROUTES[area]}?locale=${locale}`} className="font-bold text-primary">
                {story.back}
              </a>
            }
            secondary={
              <a href={`${LINE_PRICING[area]}?locale=${locale}`} className={SECONDARY_CLASS}>
                {locale === "en" ? "Plans" : "الباقات"}
              </a>
            }
            toContents={(_, className, children) => (
              <Link
                to="/courses/$area/$courseId"
                params={{ area, courseId }}
                search={scopedSearch(locale, profileId, { view: "contents" })}
                className={className}
              >
                {children}
              </Link>
            )}
          />
        )}
        {course && mode === "contents" && (
          <CourseContents
            stations={course.stations}
            locale={locale}
            back={
              <Link
                to="/courses/$area/$courseId"
                params={{ area, courseId }}
                search={keep}
                className="font-bold text-primary"
              >
                {story.backPath}
              </Link>
            }
            openStep={(id, className, children) => (
              <Link
                to="/courses/$area/$courseId"
                params={{ area, courseId }}
                search={stepLink(id!)}
                className={className}
              >
                {children}
              </Link>
            )}
          />
        )}
      </CurriculumLayout>
    );
  const current = visible?.progress.find((p) => p.lesson === step?.id);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip" dir={dir}>
      <Navbar variant="account" />
      <main id="main-content" className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-8">
        {catalogue.isPending && <p>{c.loading}</p>}
        {catalogue.isError && <p role="alert">{c.error}</p>}
        {visible && !visible.reviewOnly && step && (
          <div className="mb-4">
            <LearningReadingPosition scope={scope} />
          </div>
        )}
        <Link
          to="/courses/$area/$courseId"
          params={{ area, courseId }}
          search={scopedSearch(locale, profileId, { view: "contents" })}
          className="font-bold text-primary"
        >
          {c.backToContents}
        </Link>
        {area === "kids" && (
          <label className="mt-4 flex flex-wrap items-center gap-3">
            {c.child}
            <select
              className="min-h-11 rounded-xl border bg-card px-3"
              value={profileId ?? ""}
              onChange={(e) => setChild(e.target.value)}
            >
              {entitlement.isAdmin && auth.user && (
                <option value={auth.user.id}>{c.adminReview}</option>
              )}
              {parent.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
        )}
        {step && !visible && <LessonHero eyebrow={getLineCopy(locale)[area]} title={step.title} />}
        {course && !visible && !delivery.isFetching && (
          <p className="mt-6">
            {c.locked}{" "}
            <a className="text-primary underline" href={`/pricing?locale=${locale}`}>
              {c.packages}
            </a>
          </p>
        )}
        {!course && catalogue.isSuccess && <p>{c.courseUnavailable}</p>}
        {delivery.isPending && delivery.isFetching && <p role="status">{c.loading}</p>}
        {visible && step && (
          <LearnerStep
            key={`${key}:${visible.version}`}
            delivery={visible}
            scope={scope}
            sectionId={sectionId}
            selectSection={selectSection}
            progress={current}
            courseTitle={getLineCopy(locale)[area]}
          />
        )}
        {course && step && (
          <AdjacentSteps
            locale={locale}
            previous={at > 0 ? steps[at - 1] : undefined}
            next={at >= 0 && at < steps.length - 1 ? steps[at + 1] : undefined}
            render={(id, className, children) => (
              <Link
                to="/courses/$area/$courseId"
                params={{ area, courseId }}
                search={stepLink(id)}
                className={className}
              >
                {children}
              </Link>
            )}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
function LearnerStep({
  delivery,
  scope,
  sectionId,
  selectSection,
  progress,
  courseTitle,
}: {
  courseTitle?: string;
  progress?: { required: number; completed: number };
  delivery: Delivery;
  scope: {
    area: (typeof COURSE_AREAS)[number];
    course: string;
    lesson: string;
    profileId?: string;
  };
  sectionId: string;
  selectSection(id: string): void;
}) {
  const { locale } = useLocale();
  const c = intakeCopy(locale);
  const auth = useAuth();
  const ask = useServerFn(askCurriculumAssistant);
  const assetLink = useServerFn(curriculumAsset);
  const assistantScope = {
    admitted: true as const,
    area: scope.area,
    cardId: scope.course,
    stepId: scope.lesson,
    locale,
    ...(scope.profileId ? { profileId: scope.profileId } : {}),
  };
  return (
    <div className="space-y-8">
      <LessonHero
        eyebrow={courseTitle}
        title={delivery.lesson.title}
        intro={lessonLead(delivery.lesson.sections)?.text}
      />
      <CurriculumContent
        lesson={delivery.lesson}
        leadInHero
        activity={(s) =>
          delivery.reviewOnly ? null : (
            <Activity key={s.id} section={s} delivery={delivery} scope={scope} />
          )
        }
        resolveAsset={async (asset) => {
          if (!auth.user) throw new Error("CURRICULUM_ACCOUNT_REQUIRED");
          const generation = auth.authGeneration;
          const result = await assetLink({
            data: {
              ...scope,
              locale,
              asset,
              version: delivery.version,
              expectedAccountId: auth.user.id,
            },
          });
          if (!auth.isAuthGenerationCurrent(generation))
            throw new Error("CURRICULUM_ACCOUNT_CHANGED");
          return result.url;
        }}
        selected={sectionId}
        onSelect={selectSection}
        progressValue={
          progress && progress.required > 0
            ? Math.min(100, Math.max(0, (progress.completed / progress.required) * 100))
            : undefined
        }
        progressLabel={
          progress && progress.required > 0
            ? `${c.sectionsDone}: ${progress.completed} / ${progress.required}`
            : undefined
        }
        locale={locale}
      />
      {!delivery.reviewOnly && <LearningLessonNotes scope={scope} />}
      <FloatingAssistantLauncher
        fabLabel={getUiString(locale, "learn.assistant.fab")}
        fabAriaLabel={getUiString(locale, "learn.assistant.fabAria")}
        panelTitle={getUiString(locale, "sidebar.assistant")}
      >
        <AssistantConversationPanel
          accountId={auth.user?.id}
          scope={assistantScope}
          compact
          ask={async ({ query, requestId, history }) => {
            if (!auth.user?.id) return { status: 401 };
            const result = await ask({
              data: {
                ...scope,
                locale,
                query,
                requestId,
                history,
                expectedAccountId: auth.user.id,
              },
            });
            return result;
          }}
        />
      </FloatingAssistantLauncher>
      <a href={`/my-learning?locale=${locale}`} className="text-primary underline">
        {c.record}
      </a>
    </div>
  );
}
