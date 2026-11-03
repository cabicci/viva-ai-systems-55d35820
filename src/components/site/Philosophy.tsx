import { useUiString } from "@/lib/locale/use-ui-strings";

const pointKeys = [
  { n: "01", titleKey: "philosophy.point1.title", descKey: "philosophy.point1.desc", color: "var(--pastel-blue)" },
  { n: "02", titleKey: "philosophy.point2.title", descKey: "philosophy.point2.desc", color: "var(--pastel-pink)" },
  { n: "03", titleKey: "philosophy.point3.title", descKey: "philosophy.point3.desc", color: "var(--pastel-mint)" },
  { n: "04", titleKey: "philosophy.point4.title", descKey: "philosophy.point4.desc", color: "var(--pastel-yellow)" },
] as const;

export function Philosophy() {
  const t = useUiString();

  return (
    <section id="philosophy" className="container mx-auto px-4 py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-primary text-sm font-semibold mb-3">{t("philosophy.eyebrow")}</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("philosophy.title1")} <br />
            {t("philosophy.title2")}{" "}
            <span className="text-gradient">{t("philosophy.titleHighlight")}</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            {t("philosophy.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {pointKeys.map((p) => (
            <div key={p.n} className="glass rounded-2xl p-6 flex gap-5 items-start hover:border-primary/30 transition">
              <span
                className="grid h-12 w-12 place-items-center rounded-xl text-xl font-black text-foreground/80 shrink-0"
                style={{ background: p.color }}
              >
                {p.n}
              </span>
              <div>
                <h3 className="font-bold text-xl mb-1">{t(p.titleKey)}</h3>
                <p className="text-muted-foreground">{t(p.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
