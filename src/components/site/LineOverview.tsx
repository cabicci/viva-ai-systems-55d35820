import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Lightbulb,
  ListChecks,
  PencilRuler,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { getLineCopy, LINE_PRICING, LINE_CURRICULUM } from "@/lib/learning-lines";
import { getLineOverviewCopy } from "@/lib/line-overview-copy";
import { getTechnicalTrackOutline } from "@/lib/technical-track-preview";
import { getKidsCopy } from "@/lib/kids/copy";
import { getKidsPrivacyCopy } from "@/lib/kids/privacy-copy";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { KidsReleaseNotice } from "@/components/kids/KidsReleaseNotice";
import { Button } from "@/components/ui/button";

const icons = [Compass, PencilRuler, Lightbulb, BookOpen, ListChecks, Users];
const colors = [
  "var(--pastel-mint)",
  "var(--pastel-blue)",
  "var(--pastel-pink)",
  "var(--pastel-yellow)",
];

/** Same section order and visual language as the AI overview, with line-specific content. */
export function LineOverview({ line }: { line: "kids" | "technical" }) {
  const { locale } = useLocale();
  const search = useLocaleLinkSearch();
  const c = getLineOverviewCopy(locale, line);
  const shared = getLineCopy(locale);
  const kids = getKidsCopy(locale);
  const numbers = new Intl.NumberFormat(
    locale === "en" ? "en" : locale === "ar-EG" ? "ar-EG" : "ar",
  );

  return (
    <>
      <section id="ecosystem" className="container mx-auto px-4 py-20 md:py-28">
        {line === "kids" && (
          <KidsReleaseNotice className="mb-10 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm" />
        )}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {shared[line]}
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{c.ecosystemTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {c.ecosystemBody}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.pillars.map((point, i) => {
            const Icon = icons[i];
            return (
              <article
                key={point.title}
                className="group rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div
                  className="mb-5 grid h-14 w-14 place-items-center rounded-full transition-transform group-hover:scale-110"
                  style={{ background: colors[i % colors.length] }}
                >
                  <Icon
                    aria-hidden
                    className="h-6 w-6 animate-float text-foreground/80"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="mb-1.5 text-lg font-bold">{point.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{point.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-20 md:mt-28">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{c.levelsTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.levelsBody}</p>
          </div>
          {line === "kids" ? (
            <div className="grid gap-4 md:grid-cols-3">
              {KIDS_LEVELS.map((level, i) => (
                <article
                  key={level.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    {kids.level} {numbers.format(i + 1)}
                  </p>
                  <h4 className="mt-1 text-2xl font-bold" dir="ltr">
                    {level.ages}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">{kids.lessons}</p>
                  <span
                    className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: colors[i] }}
                  >
                    {kids.freeBadge}
                  </span>
                  <Link
                    to="/kids/$levelId"
                    params={{ levelId: level.id }}
                    search={search()}
                    className="mt-5 block min-h-11 rounded-full border border-primary px-5 py-3 text-center text-sm font-bold text-primary hover:bg-primary/10"
                  >
                    {kids.details}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {getTechnicalTrackOutline(locale).map((track) => (
                <article
                  key={track.id}
                  className="rounded-3xl border border-border/60 bg-card p-6 md:p-8"
                >
                  <p className="text-xs font-semibold text-primary">{shared.firstTechnicalTrack}</p>
                  <h4 className="mt-2 text-2xl font-bold md:text-3xl">{shared.furniture}</h4>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {shared.preparingIntro}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                    <span className="rounded-full bg-primary/10 px-3 py-1">
                      {numbers.format(track.lessonCount)} {shared.lessonLabel}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1">
                      {numbers.format(track.moduleCount)} {shared.moduleLabel}
                    </span>
                  </div>
                  <h5 className="mt-7 font-bold">{shared.trackOutline}</h5>
                  <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                    {track.sections.map((section, i) => (
                      <li
                        key={section.id}
                        className="flex items-start gap-3 rounded-xl border border-border/60 p-4 text-sm"
                      >
                        <span className="font-bold text-primary">{numbers.format(i + 1)}</span>
                        <span>{section.title}</span>
                      </li>
                    ))}
                  </ol>
                  <p
                    className="mt-5 rounded-xl bg-primary/10 p-4 text-sm font-semibold text-primary"
                    role="status"
                  >
                    {shared.preparing}
                  </p>
                </article>
              ))}
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {shared.futureTracks}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="journey" className="relative container mx-auto px-4 py-24">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{c.journeyTitle}</h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">{c.journeyBody}</p>
        </div>
        <ol className="mx-auto max-w-3xl space-y-5">
          {c.journey.map((stage, i) => (
            <li
              key={stage.title}
              className="rounded-3xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] md:p-6"
            >
              <div className="flex items-start gap-4">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black text-foreground/80 md:h-16 md:w-16"
                  style={{ background: colors[i] }}
                >
                  {numbers.format(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="mt-1 text-lg font-bold md:text-xl">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{stage.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="philosophy" className="container mx-auto px-4 py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">{shared[line]}</p>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{c.philosophyTitle}</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{c.philosophyBody}</p>
          </div>
          <div className="space-y-4">
            {c.principles.map((point, i) => (
              <article
                key={point.title}
                className="glass flex items-start gap-5 rounded-2xl p-6 transition hover:border-primary/30"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl font-black text-foreground/80"
                  style={{ background: colors[i] }}
                >
                  {numbers.format(i + 1)}
                </span>
                <div>
                  <h3 className="mb-1 text-xl font-bold">{point.title}</h3>
                  <p className="text-muted-foreground">{point.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="line-start" className="container mx-auto px-4 py-24">
        <div className="glass relative overflow-hidden rounded-3xl p-6 text-center md:p-16">
          <div aria-hidden className="grid-bg absolute inset-0 opacity-30" />
          <div
            aria-hidden
            className="absolute -top-20 right-1/3 h-60 w-60 rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 left-1/4 h-60 w-60 rounded-full bg-accent/30 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">{c.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {line === "kids" ? kids.parentNote : shared.preparingIntro}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {line === "kids" && (
                <Button
                  asChild
                  variant="hero"
                  size="xl"
                  className="h-auto min-h-12 max-w-full whitespace-normal text-center"
                >
                  <Link to="/kids/family" search={search()}>
                    {kids.startKids}
                    <ArrowUpRight aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant={line === "kids" ? "glass" : "hero"}
                size="xl"
                className="h-auto min-h-12 max-w-full whitespace-normal text-center"
              >
                <Link to={LINE_PRICING[line]} search={search()}>
                  {line === "kids" ? kids.viewPricing : shared.plans}
                  <ArrowUpRight aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="xl"
                className="h-auto min-h-12 max-w-full whitespace-normal text-center"
              >
                <Link to={LINE_CURRICULUM[line]} search={search()}>
                  {shared.paths}
                </Link>
              </Button>
            </div>
            {line === "kids" ? (
              <Link
                to="/kids/privacy"
                search={search()}
                className="mt-6 inline-block text-sm font-semibold text-muted-foreground underline underline-offset-4"
              >
                {getKidsPrivacyCopy(locale).link}
              </Link>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">{shared.unavailable}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
