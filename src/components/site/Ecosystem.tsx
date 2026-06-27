import { Route, Workflow, Flag, Database, MessageCircle, Layers } from "lucide-react";
import { useUiString } from "@/lib/locale/use-ui-strings";

const pillarDefs = [
  { icon: Route, titleKey: "ecosystem.pillar1.title", descKey: "ecosystem.pillar1.desc", color: "var(--pastel-mint)", anim: "animate-float" },
  { icon: Workflow, titleKey: "ecosystem.pillar2.title", descKey: "ecosystem.pillar2.desc", color: "var(--pastel-blue)", anim: "animate-float" },
  { icon: MessageCircle, titleKey: "ecosystem.pillar3.title", descKey: "ecosystem.pillar3.desc", color: "var(--pastel-pink)", anim: "animate-float" },
  { icon: Layers, titleKey: "ecosystem.pillar4.title", descKey: "ecosystem.pillar4.desc", color: "var(--pastel-yellow)", anim: "animate-float" },
  { icon: Database, titleKey: "ecosystem.pillar5.title", descKey: "ecosystem.pillar5.desc", color: "var(--pastel-mint)", anim: "animate-chart-bounce" },
  { icon: Flag, titleKey: "ecosystem.pillar6.title", descKey: "ecosystem.pillar6.desc", color: "var(--pastel-blue)", anim: "animate-flame" },
] as const;

const tierDefs = [
  {
    eyebrow: "STAGE 00",
    titleKey: "ecosystem.tier1.title",
    descKey: "ecosystem.tier1.desc",
    paths: [{ label: "Intro", color: "var(--pastel-cream)" }],
  },
  {
    eyebrow: "LEVEL 1 · AI USER",
    titleKey: "ecosystem.tier2.title",
    descKey: "ecosystem.tier2.desc",
    paths: [
      { label: "Business", color: "var(--pastel-lavender)" },
      { label: "Creator", color: "var(--pastel-pink)" },
      { label: "Analyst", color: "var(--pastel-yellow)" },
    ],
  },
  {
    eyebrow: "LEVEL 2 · AI OPERATOR",
    titleKey: "ecosystem.tier3.title",
    descKey: "ecosystem.tier3.desc",
    paths: [{ label: "Automator", color: "var(--pastel-mint)" }],
  },
  {
    eyebrow: "LEVEL 3 · AI BUILDER",
    titleKey: "ecosystem.tier4.title",
    descKey: "ecosystem.tier4.desc",
    paths: [{ label: "Builder", color: "var(--pastel-blue)" }],
  },
] as const;

export function Ecosystem() {
  const t = useUiString();

  return (
    <section id="ecosystem" className="container mx-auto px-4 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("ecosystem.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          {t("ecosystem.title1")}{" "}
          <span className="text-foreground/70">{t("ecosystem.title2")}</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed whitespace-pre-line">
          {t("ecosystem.subtitle")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pillarDefs.map((p) => (
          <div
            key={p.titleKey}
            className="group rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
          >
            <div
              className="grid h-14 w-14 place-items-center rounded-full mb-5 transition-transform group-hover:scale-110"
              style={{ background: p.color }}
            >
              <p.icon className={`h-6 w-6 text-foreground/80 ${p.anim}`} strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold mb-1.5 text-foreground">{t(p.titleKey)}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t(p.descKey)}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 md:mt-28">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {t("ecosystem.tiers.eyebrow")}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {t("ecosystem.tiers.title")}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("ecosystem.tiers.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tierDefs.map((tier) => (
            <div
              key={tier.eyebrow}
              className="rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {tier.eyebrow}
              </p>
              <h4 className="mt-1 text-lg font-bold text-foreground">{t(tier.titleKey)}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {t(tier.descKey)}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tier.paths.map((path) => (
                  <span
                    key={path.label}
                    className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold text-foreground/80"
                    style={{ background: path.color }}
                  >
                    {path.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
