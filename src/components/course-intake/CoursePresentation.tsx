import type { ReactNode } from "react";
import {
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
  CurriculumSectionHeader,
} from "@/components/site/CurriculumLayout";
import { PathStory } from "@/components/site/PathStory";
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
  secondary,
}: {
  /** Optional outline action (e.g. plans), placed after the primary like PathIntroduction. */
  secondary?: ReactNode;
  stations: Station[];
  locale: SupportedLocale;
  back?: ReactNode;
  /** Called with id null; renders the "explore steps" control. */
  toContents: Action;
}) {
  const c = intakeCopy(locale);
  const story = getPathStoryCopy(locale);
  const numbers = new Intl.NumberFormat(locale === "en" ? "en" : "ar-EG");
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
            <p className="mt-4 leading-8 text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>
      <div className="mt-8 flex flex-wrap gap-4">
        {toContents(null, PRIMARY, story.content)}
        {secondary}
      </div>
      <PathStory />
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
  return (
    <div className="space-y-6">
      {back}
      {stations.map((station) => (
        <section className={CURRICULUM_MODULE_CLASS} key={station.id}>
          <CurriculumSectionHeader title={`${c.unit} — ${station.title}`} />
          {station.steps.map((s) => (
            <div key={s.id}>
              {openStep(
                s.id,
                `${CURRICULUM_ROW_CLASS} w-full text-start`,
                <>
                  <span className="min-w-0 flex-1">{s.title}</span>
                  <span>{c.openStep}</span>
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
      <Heading className="my-4 text-3xl font-black">{title}</Heading>
    </header>
  );
}

export const SECONDARY_CLASS =
  "inline-flex min-h-11 items-center rounded-full border border-primary px-6 py-3 font-bold text-primary";

/** Same card layout as AcademicAdjacentNavigation (direction label + step title). */
export function AdjacentSteps({
  previous,
  next,
  locale,
  render,
}: {
  previous?: { id: string; title: string };
  next?: { id: string; title: string };
  locale: SupportedLocale;
  render: (id: string, className: string, children: ReactNode) => ReactNode;
}) {
  const c = intakeCopy(locale);
  if (!previous && !next) return null;
  return (
    <nav
      aria-label={c.stations}
      dir={locale === "en" ? "ltr" : "rtl"}
      className="mt-8 grid min-w-0 gap-3 sm:grid-cols-2"
    >
      {(
        [
          [c.previousStep, previous],
          [c.nextStep, next],
        ] as const
      ).map(([label, item]) =>
        item ? (
          <div key={label} className="min-w-0">
            {render(
              item.id,
              "block w-full min-w-0 break-words rounded-xl border p-4 text-start hover:bg-muted",
              <>
                <span className="block font-bold">{label}</span>
                <span className="mt-1 block text-sm">{item.title}</span>
              </>,
            )}
          </div>
        ) : null,
      )}
    </nav>
  );
}
