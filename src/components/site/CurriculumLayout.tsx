import type { ReactNode } from "react";
import { Map as MapIcon } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineLogo } from "./LearningLines";
import { getLineCopy, type LearningLine } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";

export const CURRICULUM_MODULE_CLASS =
  "rounded-2xl p-5 flex flex-col gap-4 transition border border-border/40 bg-background/40";
export const CURRICULUM_ROW_CLASS =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition border border-transparent";

export function CurriculumLayout({
  line,
  subtitle,
  summary,
  children,
}: {
  line: LearningLine;
  subtitle: string;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const { locale, dir } = useLocale();
  const c = getLineCopy(locale);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip" dir={dir}>
      <Navbar variant="account" />
      <main
        id="main-content"
        className="mx-auto w-full min-w-0 max-w-6xl flex-1 p-4 sm:p-6 md:p-10"
      >
        <div className="glass relative mb-10 overflow-hidden rounded-3xl p-5 sm:p-8 md:p-10">
          <div
            aria-hidden
            className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent/30 blur-3xl"
          />
          <div className="relative grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="glow-primary grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)]">
                  <MapIcon aria-hidden className="h-6 w-6 text-primary-foreground" />
                </span>
                <p className="text-sm font-semibold text-primary">{c[line]}</p>
              </div>
              <h1 className="break-words text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                {c.paths} <span className="text-gradient">— {c[line]}</span>
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
              {summary && <div className="mt-6">{summary}</div>}
            </div>
            <LineLogo line={line} className="max-w-[240px] self-center" />
          </div>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function CurriculumSectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/40 pb-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold tracking-widest text-primary">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-black md:text-3xl">
          <span className="text-gradient">{title}</span>
        </h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
