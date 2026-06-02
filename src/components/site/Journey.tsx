import { Hammer, Palette, Cog, BarChart3, Briefcase } from "lucide-react";

const stages = [
  { icon: Hammer, name: "Builder", title: "الباني", desc: "هتتعلم تبني تطبيقات وأدوات حقيقية بالـ AI.", color: "var(--pastel-blue)", anim: "animate-tilt" },
  { icon: Palette, name: "Creator", title: "المُبدع", desc: "هتتعلم تعمل محتوى وتصميمات باستخدام أدوات AI.", color: "var(--pastel-pink)", anim: "animate-twinkle" },
  { icon: Cog, name: "Automator", title: "المُؤتمت", desc: "هتتعلم تبني أنظمة تشتغل تلقائيًا بدل الشغل اليدوي.", color: "var(--pastel-mint)", anim: "animate-spin-slow" },
  { icon: BarChart3, name: "Analyst", title: "المحلّل", desc: "هتتعلم تستخدم البيانات عشان تفهم وتقرر صح.", color: "var(--pastel-yellow)", anim: "animate-chart-bounce" },
  { icon: Briefcase, name: "Business", title: "صاحب الأعمال", desc: "هتتعلم تحول الفكرة لنظام شغال، بعملاء وإيرادات.", color: "var(--pastel-lavender)", anim: "animate-float" },
];

export function Journey() {
  return (
    <section id="journey" className="relative container mx-auto px-4 py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-accent text-sm font-semibold mb-3">رحلة التطور</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          من <span className="text-gradient">باني</span> إلى <span className="text-gradient-accent">صاحب أعمال</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          خمس مراحل متصلة. كل مرحلة تفتح الأخرى. كل مهمة تبني المهارة التالية.
        </p>
      </div>

      <div className="relative">
        <div className="absolute right-8 left-8 top-1/2 -translate-y-1/2 h-px bg-gradient-to-l from-primary/60 via-accent/60 to-transparent hidden lg:block" />
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 relative">
          {stages.map((s, i) => (
            <div key={s.name} className="glass rounded-2xl p-5 relative group hover:border-primary/40 transition">
              <div className="absolute -top-3 right-4 text-xs font-bold text-muted-foreground glass px-2 py-0.5 rounded-full">
                المسار {i + 1}
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl mb-3" style={{ background: s.color }}>
                <s.icon className={`h-6 w-6 text-foreground/80 ${s.anim}`} />
              </div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-xs text-primary font-mono mb-2">{s.name}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
