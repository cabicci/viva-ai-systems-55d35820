import { Compass, User, Cog, Hammer, ArrowLeft } from "lucide-react";
import { useUiString } from "@/lib/locale/use-ui-strings";

const stageDefs = [
  {
    level: "STAGE 00",
    titleKey: "journey.stage1.title",
    subtitleKey: "journey.stage1.subtitle",
    descKey: "journey.stage1.desc",
    paths: ["Intro"],
    icon: Compass,
    color: "var(--pastel-cream)",
    anim: "animate-float",
  },
  {
    level: "LEVEL 1 · AI USER",
    titleKey: "journey.stage2.title",
    subtitleKey: "journey.stage2.subtitle",
    descKey: "journey.stage2.desc",
    paths: ["Business", "Creator", "Analyst"],
    icon: User,
    color: "var(--pastel-pink)",
    anim: "animate-float",
  },
  {
    level: "LEVEL 2 · AI OPERATOR",
    titleKey: "journey.stage3.title",
    subtitleKey: "journey.stage3.subtitle",
    descKey: "journey.stage3.desc",
    paths: ["Automator"],
    icon: Cog,
    color: "var(--pastel-mint)",
    anim: "animate-spin-slow",
  },
  {
    level: "LEVEL 3 · AI BUILDER",
    titleKey: "journey.stage4.title",
    subtitleKey: "journey.stage4.subtitle",
    descKey: "journey.stage4.desc",
    paths: ["Builder"],
    icon: Hammer,
    color: "var(--pastel-blue)",
    anim: "animate-tilt",
  },
] as const;

export function Journey() {
  const t = useUiString();

  return (
    <section id="journey" className="relative container mx-auto px-4 py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("journey.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          {t("journey.title1")}{" "}
          <span className="text-foreground/70">{t("journey.title2")}</span>{" "}
          {t("journey.title3")}
          <br />
          <span className="relative inline-block">
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 h-3 md:h-4 rounded-full -z-0"
              style={{ background: "var(--pastel-yellow)" }}
            />
            <span className="relative">{t("journey.titleHighlight")}</span>
          </span>
        </h2>
        <p className="mt-4 text-muted-foreground text-base md:text-lg">
          {t("journey.subtitle")}
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <div
          aria-hidden
          className="absolute right-7 md:right-9 top-4 bottom-4 w-px bg-border/70 hidden sm:block"
        />

        <ol className="space-y-5">
          {stageDefs.map((stage, i) => (
            <li
              key={stage.level}
              className="relative rounded-3xl border border-border/60 bg-card p-5 md:p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-4">
                <div
                  className="grid h-14 w-14 md:h-16 md:w-16 place-items-center rounded-2xl shrink-0 relative z-10"
                  style={{ background: stage.color }}
                >
                  <stage.icon
                    className={`h-6 w-6 md:h-7 md:w-7 text-foreground/80 ${stage.anim}`}
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] md:text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      {stage.level}
                    </p>
                    {i < stageDefs.length - 1 && (
                      <ArrowLeft className="h-3 w-3 text-muted-foreground/60 hidden md:inline" />
                    )}
                  </div>
                  <h3 className="mt-1 text-lg md:text-xl font-bold text-foreground">
                    {t(stage.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(stage.subtitleKey)}</p>
                  <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                    {t(stage.descKey)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stage.paths.map((path) => (
                      <span
                        key={path}
                        className="rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-[11px] font-medium text-foreground/80"
                      >
                        {path}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
