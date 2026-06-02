import * as React from "react";

/* --------------------------------------------------------------
 *  Shared section card used by every Introduction lesson body.
 *  Lightweight — no animations, no extra deps.
 * -------------------------------------------------------------- */

export type IntroSectionTone = "accent" | "primary" | "muted" | "warn";

const TONE_BORDER: Record<IntroSectionTone, string> = {
  accent: "border-accent/20 bg-accent/[0.03]",
  primary: "border-primary/20 bg-primary/[0.04]",
  muted: "border-muted-foreground/15 bg-muted/[0.05]",
  warn: "border-amber-400/25 bg-amber-400/[0.04]",
};

const TONE_ICON: Record<IntroSectionTone, string> = {
  accent: "bg-accent/15 text-accent border-accent/25",
  primary: "bg-primary/15 text-primary border-primary/25",
  muted: "bg-white/5 text-foreground border-white/10",
  warn: "bg-amber-400/15 text-amber-300 border-amber-400/25",
};

export function IntroSection({
  index,
  icon: Icon,
  eyebrow,
  title,
  tone = "accent",
  children,
}: {
  index: number;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  tone?: IntroSectionTone;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`glass rounded-2xl p-4 sm:p-5 md:p-7 border ${TONE_BORDER[tone]}`}
    >
      <header className="flex items-start gap-3 mb-4 md:mb-5 pb-3 md:pb-4 border-b border-white/5">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl border shrink-0 ${TONE_ICON[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">
            {String(index).padStart(2, "0")} · {eyebrow}
          </p>
          <h2 className="text-lg md:text-2xl font-extrabold leading-tight tracking-tight">
            {title}
          </h2>
        </div>
      </header>
      <div
        className="text-[15px] md:text-[17px] text-foreground/90 space-y-5 [&>p]:leading-[2] md:[&>p]:leading-[2.15] [&>p]:tracking-[0.005em] [&_ul]:space-y-3 [&_ol]:space-y-3 [&_li]:leading-[1.95]"
        style={{ textWrap: "pretty" as never }}
      >
        {children}
      </div>
    </section>
  );
}