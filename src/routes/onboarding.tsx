import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hammer, Palette, Cog, BarChart3, Briefcase, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "ابدأ — AI Ecosystem" }] }),
  component: Onboarding,
});

const paths = [
  { id: "builder", icon: Hammer, name: "Builder", title: "الباني", desc: "ابدأ ببناء التطبيقات والأنظمة." },
  { id: "creator", icon: Palette, name: "Creator", title: "المُبدع", desc: "محتوى وتصميم بالـ AI." },
  { id: "automator", icon: Cog, name: "Automator", title: "المُؤتمت", desc: "أنظمة أتمتة عمليّة." },
  { id: "analyst", icon: BarChart3, name: "Analyst", title: "المحلّل", desc: "بيانات وقرارات." },
  { id: "business", icon: Briefcase, name: "Business", title: "الأعمال", desc: "أطلق منتجك الخاص." },
];

function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("builder");

  return (
    <div className="min-h-screen container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <p className="text-primary text-sm font-semibold mb-2">خطوة ١ من ١</p>
        <h1 className="text-4xl md:text-5xl font-black">اختر <span className="text-gradient">مسارك الأول</span></h1>
        <p className="text-muted-foreground mt-3">يمكنك تغييره أو إضافة مسارات أخرى لاحقًا.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paths.map((p) => {
          const isSel = selected === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`glass rounded-2xl p-5 text-right relative transition-all hover:-translate-y-1 ${isSel ? "border-primary glow-primary" : "hover:border-primary/40"}`}
            >
              {isSel && (
                <span className="absolute top-3 left-3 grid h-6 w-6 place-items-center rounded-full bg-primary">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </span>
              )}
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] mb-3">
                <p.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="text-xs text-primary font-mono mb-1">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Button variant="hero" size="xl" onClick={() => { toast.success("بدأت رحلتك!"); navigate({ to: "/dashboard" }); }}>
          ابدأ المنظومة <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
