import { Brain, Workflow, Rocket, Database, Bot, Layers } from "lucide-react";

const pillars = [
  { icon: Brain, title: "تعلم عملي", desc: "كل درس وراه مهمة بسيطة تطبقها بنفسك.", color: "var(--pastel-mint)", anim: "animate-pulse-glow" },
  { icon: Workflow, title: "تفكير منظم", desc: "هتفهم الصورة الكبيرة، مش مجرد معلومات متفرقة.", color: "var(--pastel-blue)", anim: "animate-float" },
  { icon: Bot, title: "AI معاك في كل درس", desc: "مساعد ذكي يشرحلك ويساعدك لما تتوه.", color: "var(--pastel-pink)", anim: "animate-tilt" },
  { icon: Layers, title: "5 مسارات متصلة", desc: "اختار المسار اللي يناسب هدفك وابدأ منه.", color: "var(--pastel-yellow)", anim: "animate-twinkle" },
  { icon: Database, title: "ابني حاجة حقيقية", desc: "هتبني تطبيقات، أتمتة، تحليلات، وأفكار قابلة للتنفيذ.", color: "var(--pastel-mint)", anim: "animate-chart-bounce" },
  { icon: Rocket, title: "إطلاق فعلي", desc: "من مجرد فكرة لمنتج أو نظام تقدر استخدمه.", color: "var(--pastel-blue)", anim: "animate-flame" },
];

const categories = [
  { label: "Builder", desc: "ابني تطبيقات وأدوات باستخدام الـ AI.", color: "var(--pastel-blue)" },
  { label: "Creator", desc: "اعمل محتوى وتصميمات مدعومة بالـ AI.", color: "var(--pastel-pink)" },
  { label: "Automator", desc: "اعمل أنظمة تشتغل لوحدها وتوفر وقتك.", color: "var(--pastel-mint)" },
  { label: "Analyst", desc: "حوّل البيانات لأرقام وقرارات واضحة.", color: "var(--pastel-yellow)" },
  { label: "Business", desc: "حوّل الفكرة لنظام عمل ومنتج وإيرادات.", color: "var(--pastel-lavender)" },
];

export function Ecosystem() {
  return (
    <section id="ecosystem" className="container mx-auto px-4 py-20 md:py-28">
      {/* Section heading */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          ليه المنصة دي مختلفة؟
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          مش مجرد دروس — <span className="text-foreground/70">دي رحلة تنفيذ كاملة</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed whitespace-pre-line">
          هنا مش هتتفرج على شرح وخلاص.
هتتعلم، تطبّق، تستخدم أدوات، وتسأل مساعد AI معاك في كل خطوة.
        </p>
      </div>

      {/* Features grid — white cards, round pastel icons, soft shadows */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="group rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
          >
            <div
              className="grid h-14 w-14 place-items-center rounded-full mb-5 transition-transform group-hover:scale-110"
              style={{ background: p.color }}
            >
              <p.icon className={`h-6 w-6 text-foreground/80 ${p.anim}`} strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold mb-1.5 text-foreground">{p.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Course categories — color-coded pastel tags */}
      <div className="mt-20 md:mt-28">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            المسارات
          </p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            خمسة مسارات. اطلّع على التفاصيل.
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {categories.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-border/60 bg-card p-5 text-center transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-foreground/80"
                style={{ background: c.color }}
              >
                {c.label}
              </span>
              <p className="mt-3 text-sm text-muted-foreground leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
