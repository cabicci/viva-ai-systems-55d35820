import { getUiString } from "@/lib/locale/ui-strings";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { useEntitlement, decideLessonGate } from "@/lib/entitlements";
import { useLessonProgress } from "@/lib/lesson-progress";
import { PATHS } from "@/lib/curriculum-data";
import {
  getCurriculumLessonLabel,
  getCurriculumPathLabel,
} from "@/lib/locale-curriculum/resolve-curriculum-label";
import { getPathDefinition } from "@/lib/path-story";
import { getLineCopy, LINE_LOGOS, type LearningLine } from "@/lib/learning-lines";
import { getTechnicalCurriculumPreview } from "@/lib/technical-track-preview";
import {
  technicalCommand,
  technicalCompleted,
  type TechnicalProgress,
} from "@/lib/technical-education/client";
import {
  academicCatalogue,
  academicCommand,
  type AcademicProgress,
} from "@/lib/academic-education/client";
import { supabase } from "@/integrations/supabase/client";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { useKidsParentStateSource, type KidsProfile } from "@/lib/kids/parent-state";
import { setActiveKidsProfile } from "@/lib/kids/active-profile";
import { useJourneyVisits } from "@/lib/journey/client";
import { journeyCopy } from "@/lib/journey/copy";
import {
  summarizeJourney,
  scopedVisit,
  type JourneyStep,
  type JourneyVisit,
} from "@/lib/journey/model";
import type { SupportedLocale } from "@/lib/locale/types";

type PathView = {
  line: LearningLine;
  id: string;
  title: string;
  contents: string;
  steps: JourneyStep[];
  visit?: JourneyVisit;
  onOpen?: () => void;
};
const panel = "rounded-3xl border border-border bg-card p-6 md:p-8";
function State({
  loading,
  error,
  retry,
  title,
}: {
  title?: string;
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
}) {
  const { locale } = useLocale();
  const c = journeyCopy(locale);
  return (
    <div className={panel} role={error ? "alert" : "status"}>
      {title && <h3 className="mb-3 font-bold">{title}</h3>}
      <p>{loading ? c.loading : c.error}</p>
      {error && (
        <Button className="mt-3" variant="outline" onClick={retry}>
          {c.retry}
        </Button>
      )}
    </div>
  );
}
function PathCard({ path }: { path: PathView }) {
  const { locale } = useLocale();
  const c = journeyCopy(locale);
  const s = summarizeJourney(path.steps, path.visit);
  const target = s.resume ?? s.next;
  return (
    <article className={panel} data-journey-path={`${path.line}:${path.id}`}>
      <img
        src={LINE_LOGOS[path.line]}
        alt={getLineCopy(locale)[path.line]}
        className="mb-6 h-12 max-w-full object-contain object-start"
      />
      <h3 className="text-xl font-black leading-relaxed">{path.title}</h3>
      <div className="my-5 space-y-2">
        <p className="text-sm font-semibold">
          {s.completed} / {s.total} {c.completed}
        </p>
        <Progress value={s.percent} aria-label={`${path.title}: ${s.percent}%`} />
        <p className="text-xs text-muted-foreground">{c.available}</p>
      </div>
      {target && (
        <p className="mb-5 text-sm leading-relaxed">
          {target.station && <span className="block text-muted-foreground">{target.station}</span>}
          {target.title}
        </p>
      )}
      {s.total > 0 && s.completed === s.total && <p className="mb-4 text-sm">{c.allDone}</p>}
      <div className="flex flex-wrap gap-3">
        {target && (
          <a
            href={target.href}
            onClick={path.onOpen}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground"
          >
            {s.resume ? c.resume : s.completed ? c.next : c.start}
            <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
          </a>
        )}
        <a
          href={path.contents}
          onClick={path.onOpen}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 font-semibold"
        >
          <BookOpen className="h-4 w-4" />
          {c.contents}
        </a>
      </div>
      {path.line === "ai" && (
        <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-primary">
          <a href={`/ai-assistant?locale=${locale}`}>{getUiString(locale, "sidebar.assistant")}</a>
          <a href={`/analytics?locale=${locale}`}>{getUiString(locale, "sidebar.analytics")}</a>
        </div>
      )}
    </article>
  );
}
export function JourneyPage() {
  const { user } = useAuth();
  const { locale, dir } = useLocale();
  const c = journeyCopy(locale);
  const ent = useEntitlement();
  const ai = useLessonProgress();
  const visits = useJourneyVisits();
  const technical = useQuery({
    queryKey: ["journey-technical", user?.id, locale],
    enabled: !!user?.id,
    staleTime: 0,
    queryFn: () =>
      technicalCommand<{ paid: boolean; progress: Record<string, TechnicalProgress> }>("status"),
  });
  const academic = useQuery({
    queryKey: ["journey-academic", user?.id, locale],
    enabled: !!user?.id,
    staleTime: 0,
    queryFn: async () => {
      const courses = await academicCatalogue(locale);
      return Promise.all(
        courses.map(async (course) => {
          const sample = course.lessons.find((l) => !l.introductory);
          const [status, access] = await Promise.all([
            academicCommand<{ progress: Record<string, AcademicProgress> }>(
              "status",
              course.id,
              null,
              locale,
            ),
            sample
              ? supabase.rpc(
                  "academic_can_access" as never,
                  { p_course: course.id, p_lesson: sample.id, p_locale: locale } as never,
                )
              : Promise.resolve({ data: false, error: null }),
          ]);
          if (access.error) throw access.error;
          return { course, progress: status.progress, paid: access.data === true };
        }),
      );
    },
  });
  const intro = PATHS.find((p) => p.id === "intro")!
    .modules.flatMap((m) => m.lessons)
    .filter((l) => l.state === "available");
  const introDone = intro.filter((l) => ai.getStatus(l.id) === "completed").length;
  const paths: PathView[] = [];
  if (ai.isLoaded && !ai.isError && ent.isLoaded)
    paths.push({
      line: "ai",
      id: "ai",
      title: getPathDefinition("ai", locale).title,
      contents: `/curriculum?locale=${locale}`,
      visit: scopedVisit(visits.data ?? [], "ai", "ai", user!.id),
      steps: PATHS.flatMap((path) =>
        path.modules.flatMap((module) =>
          module.lessons
            .filter((l) => l.state === "available")
            .map((l) => ({
              id: l.id,
              title: getCurriculumLessonLabel(locale, l.id) ?? l.title,
              station: getCurriculumPathLabel(locale, path.id, "title"),
              href: `${l.route ?? `/learn/${path.id}/${l.id}`}?locale=${locale}`,
              completed: ai.getStatus(l.id) === "completed",
              available:
                decideLessonGate({
                  lessonId: l.id,
                  tier: ent.tier,
                  isAdmin: ent.isAdmin,
                  introCompletedCount: introDone,
                  introTotal: intro.length,
                }).kind === "open",
            })),
        ),
      ),
    });
  if (technical.data && !technical.isError)
    paths.push({
      line: "technical",
      id: "furniture",
      title: getPathDefinition("technical", locale).title,
      contents: `/technical/courses/furniture/contents?locale=${locale}`,
      visit: scopedVisit(visits.data ?? [], "technical", "furniture", user!.id),
      steps: getTechnicalCurriculumPreview(locale).flatMap((s) =>
        s.modules.flatMap((m) =>
          m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            station: m.title,
            href: `/technical/learn/${l.id}?locale=${locale}`,
            completed: technicalCompleted(technical.data.progress[l.id]) === 3,
            available: technical.data.paid || l.id === "M01-L01",
          })),
        ),
      ),
    });
  if (academic.data && !academic.isError)
    paths.push(
      ...academic.data.map(({ course, progress, paid }) => ({
        line: "academic" as const,
        id: course.id,
        title: course.title,
        contents: `/academic/courses/${course.id}/contents?locale=${locale}`,
        visit: scopedVisit(visits.data ?? [], "academic", course.id, user!.id),
        steps: course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          href: `/academic/learn/${l.id}?locale=${locale}`,
          completed: !!(
            progress[l.id]?.read &&
            progress[l.id]?.quizPassed &&
            progress[l.id]?.practiceSubmitted
          ),
          available: paid || l.introductory,
        })),
      })),
    );
  const latest = paths
    .map((path) => ({ path, ...summarizeJourney(path.steps, path.visit) }))
    .filter((s) => s.resume && s.visitedAt)
    .sort((a, b) => Date.parse(b.visitedAt!) - Date.parse(a.visitedAt!))[0];
  return (
    <div className="min-h-dvh" dir={dir}>
      <Navbar variant="account" />
      <main id="main-content" className="container mx-auto max-w-6xl space-y-8 px-4 py-10 md:py-14">
        <header>
          <h1 className="text-3xl font-black md:text-4xl">{c.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{c.progress}</p>
        </header>
        {visits.isError && <State error retry={() => void visits.refetch()} />}
        {visits.isSuccess &&
          ai.isLoaded &&
          ent.isLoaded &&
          !technical.isPending &&
          !academic.isPending &&
          latest && (
            <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h2 className="text-xl font-bold">{c.resume}</h2>
              <p className="my-3">
                {latest.path.title} · {latest.resume!.title}
              </p>
              <a
                href={latest.resume!.href}
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-bold text-primary-foreground"
              >
                {c.resume}
              </a>
            </section>
          )}
        <section className="grid gap-6 md:grid-cols-2" aria-label={c.progress}>
          {(!ai.isLoaded || !ent.isLoaded) && <State loading title={getLineCopy(locale).ai} />}
          {ai.isError && (
            <State error title={getLineCopy(locale).ai} retry={() => void ai.refetch()} />
          )}
          {technical.isPending && <State loading title={getLineCopy(locale).technical} />}
          {technical.isError && (
            <State
              error
              title={getLineCopy(locale).technical}
              retry={() => void technical.refetch()}
            />
          )}
          {academic.isPending && <State loading title={getLineCopy(locale).academic} />}
          {academic.isError && (
            <State
              error
              title={getLineCopy(locale).academic}
              retry={() => void academic.refetch()}
            />
          )}
          {paths.map((path) => (
            <PathCard key={`${path.line}:${path.id}`} path={path} />
          ))}
        </section>
        <KidsJourneys locale={locale} visits={visits.data ?? []} admin={ent.isAdmin} />
      </main>
      <Footer />
    </div>
  );
}
function KidsJourneys({
  locale,
  visits,
  admin,
}: {
  locale: SupportedLocale;
  visits: JourneyVisit[];
  admin: boolean;
}) {
  const parent = useKidsParentStateSource();
  const c = journeyCopy(locale);
  return (
    <section className="space-y-5" aria-label={c.family}>
      <h2 className="text-2xl font-black">{c.family}</h2>
      <p className="text-muted-foreground">{c.familyNote}</p>
      {parent.state === "checking" && !admin && <State loading />}
      {parent.state === "unavailable" && <State error retry={parent.refresh} />}
      {parent.state === "ready" &&
        parent.profiles.map((profile) => (
          <ChildPath key={profile.id} profile={profile} visits={visits} locale={locale} />
        ))}
      {parent.state !== "checking" &&
        parent.state !== "unavailable" &&
        parent.profiles.length === 0 &&
        !admin && <p>{c.noChild}</p>}
      <a
        className="inline-flex min-h-11 items-center font-bold text-primary underline"
        href={`/kids/family?locale=${locale}`}
      >
        {c.familyLink}
      </a>
      {admin && (
        <div className="grid gap-5 md:grid-cols-3">
          {KIDS_LEVELS.map((level) => (
            <article key={level.id} className={panel}>
              <h3 className="font-bold">{getPathDefinition("kids", locale, level.ages).title}</h3>
              <p className="my-3 text-sm">{c.previewNote}</p>
              <a
                className="inline-flex min-h-11 items-center font-bold text-primary underline"
                href={`/kids/${level.id}/contents?locale=${locale}`}
              >
                {c.preview}
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
function ChildPath({
  profile,
  locale,
  visits,
}: {
  profile: KidsProfile;
  locale: SupportedLocale;
  visits: JourneyVisit[];
}) {
  const { user } = useAuth();
  const result = useQuery({
    queryKey: ["kids-journey", user?.id, profile.id, locale],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "kids_journey" as never,
        { p_profile: profile.id, p_locale: locale } as never,
      );
      if (error) throw error;
      return data as unknown as { allowed: number[]; completed: number[] };
    },
  });
  if (result.isPending) return <State loading />;
  if (result.isError) return <State error retry={() => void result.refetch()} />;
  const level = KIDS_LEVELS.find((l) => l.id === profile.level_id)!;
  return (
    <PathCard
      path={{
        line: "kids",
        id: profile.id,
        title: `${profile.display_name} · ${getPathDefinition("kids", locale, level.ages).title}`,
        contents: `/kids/${level.id}/contents?locale=${locale}`,
        visit: scopedVisit(visits, "kids", level.id, profile.id),
        onOpen: () => setActiveKidsProfile(user!.id, profile.id),
        steps: Array.from({ length: level.lessonCount }, (_, i) => ({
          id: String(i + 1),
          title: `${getLineCopy(locale).lessonLabel} ${i + 1}`,
          href: `/kids/${level.id}/${i + 1}?locale=${locale}`,
          completed: result.data.completed.includes(i + 1),
          available: result.data.allowed.includes(i + 1),
        })),
      }}
    />
  );
}
