import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import {
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
  CurriculumSectionHeader,
} from "@/components/site/CurriculumLayout";
import { getPathStoryCopy } from "@/lib/path-story";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import type { SupportedLocale } from "@/lib/locale/types";

/** Shared learner presentation for admitted curricula, used by the public course page
 * and the admin review preview so both render the same introduction/contents/hero. */
type Station = { id: string; title: string; steps: { id: string; title: string }[] };
type Action = (id: string | null, className: string, children: ReactNode) => ReactNode;

const PRIMARY =
  "inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground";

export function CourseIntroduction({
  stations,
  locale,
  back,
  toContents,
}: {
  stations: Station[];
  locale: SupportedLocale;
  back?: ReactNode;
  /** Called with id null; renders the "explore steps" control. */
  toContents: Action;
}) {
  const c = intakeCopy(locale);
  const story = getPathStoryCopy(locale);
  const numbers = new Intl.NumberFormat(locale === "en" ? "en" : "ar");
  const steps = stations.reduce((n, s) => n + s.steps.length, 0);
  return (
    <>
      {back}
      <section className="mt-6 grid gap-5 sm:grid-cols-2" aria-label={story.aboutPath}>
        {[
          [c.stationsCount, numbers.format(stations.length)],
          [c.stepsCount, numbers.format(steps)],
        ].map(([heading, body]) => (
          <article key={heading} className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">{heading}</h2>
            <p className="mt-4 break-words text-2xl font-black text-primary">{body}</p>
          </article>
        ))}
      </section>
      <div className="mt-8 flex flex-wrap gap-4">{toContents(null, PRIMARY, story.content)}</div>
    </>
  );
}

export function CourseContents({
  stations,
  locale,
  back,
  openStep,
}: {
  stations: Station[];
  locale: SupportedLocale;
  back?: ReactNode;
  openStep: Action;
}) {
  const c = intakeCopy(locale);
  const story = getPathStoryCopy(locale);
  const numbers = new Intl.NumberFormat(locale === "en" ? "en" : "ar");
  return (
    <div className="space-y-6">
      {back}
      {stations.map((station, index) => (
        <section className={CURRICULUM_MODULE_CLASS} key={station.id}>
          <CurriculumSectionHeader
            title={`${story.station} ${numbers.format(index + 1)} — ${station.title}`}
          />
          {station.steps.map((s) => (
            <div key={s.id}>
              {openStep(
                s.id,
                `${CURRICULUM_ROW_CLASS} w-full text-start hover:border-primary/40`,
                <>
                  <BookOpen aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">{s.title}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary">
                    {c.openStep}
                    <ArrowUpRight aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
                  </span>
                </>,
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export function LessonHero({
  eyebrow,
  title,
  level = 1,
}: {
  eyebrow?: string;
  title: string;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header className="my-6 rounded-3xl border bg-accent/20 p-6">
      {eyebrow && <p className="text-sm font-bold text-primary">{eyebrow}</p>}
      <Heading className="my-3 text-3xl font-black">{title}</Heading>
    </header>
  );
}

export const PREVIOUS_CLASS =
  "inline-flex min-h-11 items-center rounded-full border border-primary px-6 py-3 font-bold text-primary";
export const NEXT_CLASS = PRIMARY;
