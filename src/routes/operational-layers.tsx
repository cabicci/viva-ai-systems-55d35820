import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  ArrowLeft,
  Brain,
  Search,
  Sparkles,
  Target,
  ScrollText,
  TrendingUp,
  Workflow,
  Network,
  type LucideIcon,
} from "lucide-react";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";

export const Route = createFileRoute("/operational-layers")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({
    meta: [
      { title: "Operational Layers — AI Ecosystem" },
      {
        name: "description",
        content: "خريطة الطبقات التشغيلية الحقيقية لمنصة الـ AI Ecosystem.",
      },
    ],
  }),
  component: () => (
    <AdminGate>
      <OperationalLayersPage />
    </AdminGate>
  ),
});

type Layer = {
  no: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  tone: "primary" | "accent";
};

const LAYERS: Layer[] = [
  {
    no: "01",
    icon: Brain,
    title: "Context Layer",
    subtitle: "طبقة السياق",
    description:
      "بتتبع موقع المتعلم، المرحلة الحالية، الدروس المكتملة، وسياق المهمة الجارية.",
    tone: "primary",
  },
  {
    no: "02",
    icon: Search,
    title: "Retrieval Layer",
    subtitle: "طبقة الاسترجاع",
    description:
      "بتبحث في دروس المنصة، المهام، المستندات، ومعرفة الـ Ecosystem قبل أي رد من الـ AI.",
    tone: "accent",
  },
  {
    no: "03",
    icon: Sparkles,
    title: "AI Assistant Layer",
    subtitle: "طبقة المساعد الذكي",
    description:
      "مساعد واعي بالمشروع ومتصل بسياق المنصة وتقدّم المتعلم خطوة بخطوة.",
    tone: "primary",
  },
  {
    no: "04",
    icon: Target,
    title: "Mission Layer",
    subtitle: "طبقة المهام",
    description:
      "نظام تعلّم قائم على التنفيذ وإكمال مهام حقيقية، مش مجرد قراءة محتوى.",
    tone: "accent",
  },
  {
    no: "05",
    icon: ScrollText,
    title: "Build Logs Layer",
    subtitle: "طبقة سجلات البناء",
    description:
      "تطوّر حقيقي للمنصة، الأخطاء، الإصلاحات، وسجلات بناء عامة وشفافة.",
    tone: "primary",
  },
  {
    no: "06",
    icon: TrendingUp,
    title: "Progression Intelligence Layer",
    subtitle: "طبقة ذكاء التقدّم",
    description: "بتتحكم في الـ Unlocks، الـ Milestones، وتتبع تحوّل المتعلم.",
    tone: "accent",
  },
  {
    no: "07",
    icon: Workflow,
    title: "Workflow Layer",
    subtitle: "طبقة الـ Workflows",
    description: "أتمتة مستقبلية، عمليات AI، وأنظمة متصلة ببعضها.",
    tone: "primary",
  },
  {
    no: "08",
    icon: Network,
    title: "Ecosystem Awareness Layer",
    subtitle: "طبقة وعي الـ Ecosystem",
    description:
      "بتربط الدروس، المهام، الأنظمة، الـ Business Logic، وتطوّر المنصة في كيان واحد.",
    tone: "accent",
  },
];

function OperationalLayersPage() {
  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5 rotate-180" /> العودة للوحة
        </Link>

        {/* Hero */}
        <header className="glass rounded-3xl p-8 md:p-12 mb-10 relative overflow-hidden border border-border/30">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-widest text-primary mb-4">
              INTERNAL · ECOSYSTEM MAP
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.3] mb-5">
              الطبقات التشغيلية للمنصة
            </h1>
            <p className="text-muted-foreground leading-loose max-w-2xl text-[15px] md:text-base whitespace-pre-line">
              {`المنصة ليست مجرد كورسات AI.\nالمنصة نفسها هي نظام AI حي يتطور تدريجيًا أمام المتعلم.`}
            </p>
          </div>
        </header>

        {/* Architecture stack */}
        <section className="relative">
          {/* vertical spine */}
          <div className="absolute right-6 md:right-9 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border/40 to-accent/40 hidden md:block" />

          <div className="space-y-5">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isPrimary = layer.tone === "primary";
              const ring = isPrimary ? "border-primary/25" : "border-accent/25";
              const iconBg = isPrimary
                ? "bg-primary/15 text-primary"
                : "bg-accent/15 text-accent";
              const dotColor = isPrimary ? "bg-primary" : "bg-accent";
              return (
                <div
                  key={layer.no}
                  className={`relative glass rounded-2xl p-6 md:p-7 border ${ring} hover:border-primary/40 transition-colors md:mr-20`}
                >
                  {/* spine dot */}
                  <span
                    className={`hidden md:block absolute top-8 -right-[3.4rem] h-3 w-3 rounded-full ${dotColor} shadow-[0_0_14px] shadow-current`}
                  />
                  <div className="flex items-start gap-4">
                    <span
                      className={`grid h-12 w-12 md:h-14 md:w-14 place-items-center rounded-xl ${iconBg} shrink-0`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                          LAYER {layer.no}
                        </p>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">
                          {layer.subtitle}
                        </p>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold mb-2">
                        {layer.title}
                      </h2>
                      <p className="text-muted-foreground leading-loose text-[15px]">
                        {layer.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer note */}
        <section className="relative rounded-3xl overflow-hidden glow-primary mt-10">
          <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-95" />
          <div className="relative p-8 md:p-10 text-center">
            <p className="font-mono text-[11px] tracking-widest text-primary-foreground/70 mb-3">
              READ-ONLY · VISUALIZATION
            </p>
            <h2 className="text-xl md:text-2xl font-black text-primary-foreground leading-[1.4]">
              كل طبقة بتعمل لوحدها — وكلهم مع بعض بيكوّنوا الـ Ecosystem
            </h2>
          </div>
        </section>
      </main>
    </div>
  );
}
