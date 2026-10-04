import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import {
  getLineCopy,
  LEARNING_LINES,
  LINE_LOGOS,
  LINE_ROUTES,
  LINE_PRICING,
  LINE_CURRICULUM,
  type LearningLine,
} from "@/lib/learning-lines";

export function LineLogo({ line, className = "" }: { line: LearningLine; className?: string }) {
  const { locale } = useLocale();
  return (
    <img
      src={LINE_LOGOS[line]}
      alt={`Masaarat ${line === "technical" ? "TECH" : line.toUpperCase()}`}
      width={2048}
      height={line === "ai" ? 602 : line === "kids" ? 497 : 483}
      className={`h-auto w-full object-contain ${className}`}
      draggable={false}
      aria-label={getLineCopy(locale)[line]}
    />
  );
}

export function LearningLineCards({ learning = false }: { learning?: boolean }) {
  const { locale } = useLocale();
  const search = useLocaleLinkSearch();
  const c = getLineCopy(locale);
  return (
    <section id="learning-lines" aria-label={c.choose} className="grid gap-6 lg:grid-cols-3">
      {LEARNING_LINES.map((line) => (
        <Link
          key={line}
          to={
            learning && line === "ai"
              ? "/dashboard"
              : learning && line === "kids"
                ? "/kids/family"
                : LINE_ROUTES[line]
          }
          search={search()}
          className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <div className="flex h-32 items-center px-5 sm:h-36">
            <LineLogo line={line} />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h2 className="text-center text-2xl font-black">{c[line]}</h2>
            <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{c[`${line}Intro`]}</p>
            {line === "technical" && (
              <p className="mt-4 text-xs font-semibold text-primary">{c.preparing}</p>
            )}
            <span className="mt-6 flex items-center justify-between gap-2 font-bold text-primary">
              {learning && line === "ai"
                ? c.continueAI
                : learning && line === "kids"
                  ? c.family
                  : c.enter}
              <ArrowUpRight className="h-5 w-5 shrink-0 rtl:-scale-x-100" aria-hidden />
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}

export function LineIntroduction({ line }: { line: LearningLine }) {
  const { locale } = useLocale();
  const search = useLocaleLinkSearch();
  const c = getLineCopy(locale);
  return (
    <section
      className="relative overflow-hidden border-b border-border/50"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-20">
        <Link
          to="/"
          search={search()}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {c.home}
        </Link>
        <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-primary">{c.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">{c[line]}</h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">{c[`${line}Intro`]}</p>
            <Link
              to={LINE_PRICING[line]}
              search={search()}
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
            >
              {c.plans}
            </Link>
            <Link
              to={LINE_CURRICULUM[line]}
              search={search()}
              className="ms-4 mt-6 inline-flex min-h-11 items-center text-sm font-bold text-primary underline underline-offset-4"
            >
              {c.paths}
            </Link>
          </div>
          <div className="rounded-2xl p-6">
            <LineLogo line={line} />
          </div>
        </div>
      </div>
    </section>
  );
}
