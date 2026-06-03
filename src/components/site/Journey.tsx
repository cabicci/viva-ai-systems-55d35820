import { Sparkles, User, Cog, Hammer, ArrowLeft } from "lucide-react";

type Stage = {
  level: string;
  title: string;
  subtitle: string;
  paths: string[];
  desc: string;
  icon: typeof Sparkles;
  color: string;
  anim: string;
};

const stages: Stage[] = [
  {
    level: "STAGE 00",
    title: "البداية",
    subtitle: "اتفهم الـ AI من أوله",
    paths: ["Intro"],
    desc: "أساسيات لازم تعرفها قبل أي مسار — تفكير، أدوات، عقلية.",
    icon: Sparkles,
    color: "var(--pastel-cream)",
    anim: "animate-twinkle",
  },
  {
    level: "LEVEL 1 · AI USER",
    title: "استخدم AI في شغلك",
    subtitle: "٨٠٪ من اللي محتاجه أي حد",
    paths: ["Business", "Creator", "Analyst"],
    desc: "محتوى، تحليل بيانات، قرارات شغل — كل ده من غير ما تكتب سطر كود.",
    icon: User,
    color: "var(--pastel-pink)",
    anim: "animate-float",
  },
  {
    level: "LEVEL 2 · AI OPERATOR",
    title: "شغّل أنظمة AI",
    subtitle: "أتمتة و workflows ذكية",
    paths: ["Automator"],
    desc: "اربط أدوات، ابني أنظمة تشتغل لوحدها، ووفّر وقتك — برضو من غير كود.",
    icon: Cog,
    color: "var(--pastel-mint)",
    anim: "animate-spin-slow",
  },
  {
    level: "LEVEL 3 · AI BUILDER",
    title: "ابني منتجات AI",
    subtitle: "للي عايز يبني SaaS و تطبيقات",
    paths: ["Builder"],
    desc: "مسار تقني للي قرر يبني منتجاته بنفسه — اختياري، مش المرحلة التالية.",
    icon: Hammer,
    color: "var(--pastel-blue)",
    anim: "animate-tilt",
  },
];

export function Journey() {
  return (
    <section id="journey" className="relative container mx-auto px-4 py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          رحلة واحدة متصلة
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          من <span className="text-foreground/70">الصفر</span> لحد ما
          <br />
          <span className="relative inline-block">
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 h-3 md:h-4 rounded-full -z-0"
              style={{ background: "var(--pastel-yellow)" }}
            />
            <span className="relative">تبني منتجاتك</span>
          </span>
        </h2>
        <p className="mt-4 text-muted-foreground text-base md:text-lg">
          ٤ مراحل واضحة. ابدأ من الأول، أو ادخل المرحلة اللي تناسب هدفك.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* vertical line */}
        <div
          aria-hidden
          className="absolute right-7 md:right-9 top-4 bottom-4 w-px bg-border/70 hidden sm:block"
        />

        <ol className="space-y-5">
          {stages.map((s, i) => (
            <li
              key={s.level}
              className="relative rounded-3xl border border-border/60 bg-card p-5 md:p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-4">
                <div
                  className="grid h-14 w-14 md:h-16 md:w-16 place-items-center rounded-2xl shrink-0 relative z-10"
                  style={{ background: s.color }}
                >
                  <s.icon
                    className={`h-6 w-6 md:h-7 md:w-7 text-foreground/80 ${s.anim}`}
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] md:text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      {s.level}
                    </p>
                    {i < stages.length - 1 && (
                      <ArrowLeft className="h-3 w-3 text-muted-foreground/60 hidden md:inline" />
                    )}
                  </div>
                  <h3 className="mt-1 text-lg md:text-xl font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
                  <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.paths.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-[11px] font-medium text-foreground/80"
                      >
                        {p}
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
