import { Link } from "@tanstack/react-router";
import { Lock, Play, Hammer, Users } from "lucide-react";
import {
  CurriculumLayout,
  CurriculumSectionHeader,
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
} from "./CurriculumLayout";
import { getLineCopy, LINE_PRICING } from "@/lib/learning-lines";
import {
  getTechnicalCurriculumPreview,
  TECHNICAL_TRACK_PREVIEWS,
} from "@/lib/technical-track-preview";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { getKidsCopy } from "@/lib/kids/copy";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import { useKidsParentState } from "@/lib/kids/parent-state";
import { useKidsCurriculumTitles } from "@/lib/kids/use-curriculum-titles";
import { KidsReleaseNotice } from "@/components/kids/KidsReleaseNotice";

const pastels = ["var(--pastel-lavender)", "var(--pastel-pink)", "var(--pastel-blue)"];

export function KidsCurriculum() {
  const { locale } = useLocale();
  const search = useLocaleLinkSearch();
  const c = getLineCopy(locale);
  const kids = getKidsCopy(locale);
  const journey = getKidsJourneyCopy(locale);
  const catalogue = useKidsCurriculumTitles(locale);
  const { state, profiles } = useKidsParentState();
  return (
    <CurriculumLayout
      line="kids"
      subtitle={kids.intro}
      summary={<KidsReleaseNotice className="text-sm" />}
    >
      <div className="mb-10 flex flex-wrap items-center gap-4 rounded-2xl border border-primary/20 bg-card p-5">
        <p className="flex-1 text-sm text-muted-foreground">{kids.parentNote}</p>
        <Link
          to="/kids/family"
          search={search()}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
        >
          {kids.startKids}
        </Link>
        <Link
          to={LINE_PRICING.kids}
          search={search()}
          className="text-sm font-semibold text-primary underline"
        >
          {kids.viewPricing}
        </Link>
      </div>
      <div className="space-y-16">
        {KIDS_LEVELS.map((level, index) => {
          const canOpen =
            state === "ready" && profiles.some((profile) => profile.level_id === level.id);
          return (
            <section key={level.id} id={`track-${level.id}`}>
              <CurriculumSectionHeader title={`${kids.level} ${index + 1}`} subtitle={level.ages} />
              <div
                className="rounded-3xl border border-border/60 p-6 md:p-8"
                style={{ background: pastels[index] }}
              >
                <div className="mb-6 flex items-start gap-3 sm:gap-5">
                  <Users aria-hidden className="h-7 w-7 shrink-0 text-foreground/80" />
                  <div>
                    <h3 className="text-2xl font-black">
                      {kids.level} {index + 1} <span dir="ltr">({level.ages})</span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {kids.lessons} · {kids.freeBadge}
                    </p>
                  </div>
                </div>
                <article className={CURRICULUM_MODULE_CLASS}>
                  <h4 className="text-lg font-bold">{c.paths}</h4>
                  <p className="text-xs text-muted-foreground" role="status">
                    {!catalogue
                      ? c.catalogLoading
                      : catalogue.unavailable.includes(level.id)
                        ? c.catalogUnavailable
                        : null}
                  </p>
                  <ul className="space-y-1.5">
                    {Array.from({ length: level.lessonCount }, (_, i) => {
                      const number = i + 1;
                      const title =
                        catalogue?.titles[level.id]?.[i] ?? `${journey.lesson} ${number}`;
                      const contents = (
                        <>
                          <span
                            dir="ltr"
                            className="grid h-6 min-w-7 shrink-0 place-items-center rounded-md bg-foreground/5 px-1.5 text-[11px] tabular-nums"
                          >
                            {number}
                          </span>
                          <span className="min-w-0 flex-1 break-words">{title}</span>
                          {canOpen ? (
                            <Play aria-hidden className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Lock aria-hidden className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </>
                      );
                      return (
                        <li key={number}>
                          {canOpen ? (
                            <Link
                              to="/kids/$levelId/$lessonNumber"
                              params={{ levelId: level.id, lessonNumber: String(number) }}
                              search={search()}
                              className={`${CURRICULUM_ROW_CLASS} hover:border-primary/20 hover:bg-foreground/5`}
                            >
                              {contents}
                            </Link>
                          ) : (
                            <div
                              className={`${CURRICULUM_ROW_CLASS} text-muted-foreground`}
                              aria-disabled="true"
                            >
                              {contents}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              </div>
            </section>
          );
        })}
      </div>
    </CurriculumLayout>
  );
}

export function TechnicalCurriculum() {
  const { locale } = useLocale();
  const search = useLocaleLinkSearch();
  const c = getLineCopy(locale);
  const numbers = new Intl.NumberFormat(
    locale === "en" ? "en" : locale === "ar-EG" ? "ar-EG" : "ar",
  );
  const track = TECHNICAL_TRACK_PREVIEWS[0];
  return (
    <CurriculumLayout
      line="technical"
      subtitle={c.preparingIntro}
      summary={
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <span>
            {numbers.format(track.lessonCount)} {c.lessonLabel}
          </span>
          <span>
            · {numbers.format(track.moduleCount)} {c.moduleLabel}
          </span>
        </div>
      }
    >
      <div id="track-furniture" className="mb-10 rounded-2xl border border-primary/20 bg-card p-5">
        <p className="text-xs font-semibold text-primary">{c.firstTechnicalTrack}</p>
        <h2 className="mt-2 flex items-center gap-3 text-2xl font-black">
          <Hammer aria-hidden className="h-6 w-6 shrink-0" />
          {c.furniture}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{c.futureTracks}</p>
        <p className="mt-3 text-sm font-semibold text-primary" role="status">
          {c.preparing}
        </p>
        <Link
          to={LINE_PRICING.technical}
          search={search()}
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary"
        >
          {c.plans}
        </Link>
      </div>
      <div className="space-y-16">
        {getTechnicalCurriculumPreview(locale).map((section, index) => (
          <section key={section.id}>
            <CurriculumSectionHeader title={section.title} />
            <div
              className="rounded-3xl border border-border/60 p-6 md:p-8"
              style={{ background: pastels[index % pastels.length] }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {section.modules.map((module) => (
                  <article
                    key={module.id}
                    id={`module-${module.id}`}
                    className={CURRICULUM_MODULE_CLASS}
                  >
                    <header className="flex items-start gap-3">
                      <span
                        dir="ltr"
                        className="grid h-9 min-w-11 shrink-0 place-items-center rounded-md bg-[image:var(--gradient-primary)] px-2 text-xs font-black text-primary-foreground"
                      >
                        {module.id}
                      </span>
                      <h3 className="min-w-0 flex-1 text-lg font-bold leading-tight">
                        {module.title}
                      </h3>
                    </header>
                    <ul className="space-y-1.5">
                      {module.lessons.map((lesson, i) => (
                        <li
                          key={lesson.id}
                          id={`lesson-${lesson.id}`}
                          className={`${CURRICULUM_ROW_CLASS} text-muted-foreground`}
                          aria-disabled="true"
                        >
                          <span className="grid h-6 min-w-7 shrink-0 place-items-center rounded-md bg-foreground/5 px-1.5 text-[11px] tabular-nums">
                            {numbers.format(i + 1)}
                          </span>
                          <span className="min-w-0 flex-1 break-words">{lesson.title}</span>
                          <Lock aria-hidden className="h-3.5 w-3.5 shrink-0" />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </CurriculumLayout>
  );
}
