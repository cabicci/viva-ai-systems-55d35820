import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  ArrowLeft,
  ChevronDown,
  Brain,
  Sparkles,
  Target,
  Activity,
  TrendingUp,
  Search,
  ScrollText,
  Workflow,
  Network,
  Film,
  Hammer,
  AlertTriangle,
  PlayCircle,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";

export const Route = createFileRoute("/behavior-architecture")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({
    meta: [
      { title: "Behavior Architecture — AI Ecosystem" },
      {
        name: "description",
        content:
          "خريطة سلوك المنصة الداخلية — كيف يعمل الـ AI Ecosystem كنظام حي يتفاعل مع المتعلم.",
      },
    ],
  }),
  component: () => (
    <AdminGate>
      <BehaviorArchitecturePage />
    </AdminGate>
  ),
});

/* ---------- Small reusable bits (page-local, no redesign) ---------- */

function FlowStep({ label, last }: { label: string; last?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass rounded-xl px-5 py-3 border border-border/40 text-sm md:text-base font-medium text-foreground min-w-[220px] text-center">
        {label}
      </div>
      {!last && (
        <ChevronDown className="h-4 w-4 text-muted-foreground my-2" />
      )}
    </div>
  );
}

function BehaviorCard({
  icon: Icon,
  no,
  title,
  body,
  tone,
}: {
  icon: LucideIcon;
  no: string;
  title: string;
  body: string;
  tone: "primary" | "accent";
}) {
  const isPrimary = tone === "primary";
  const ring = isPrimary ? "border-primary/25" : "border-accent/25";
  const iconBg = isPrimary
    ? "bg-primary/15 text-primary"
    : "bg-accent/15 text-accent";
  return (
    <div className={`glass rounded-2xl p-6 border ${ring} h-full`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
          {no}
        </p>
      </div>
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-loose">{body}</p>
    </div>
  );
}

/* ---------- Section data ---------- */

const ENTRY_FLOW = [
  "Discovery Content",
  "Landing Page",
  "Cinematic Introduction",
  "Journey Reveal",
  "First AI Interaction",
  "First Mission",
  "Visible Progress",
  "System Participation",
];

const BEHAVIORS: {
  icon: LucideIcon;
  no: string;
  title: string;
  body: string;
  tone: "primary" | "accent";
}[] = [
  {
    icon: Brain,
    no: "01",
    title: "Context-Aware Platform",
    body: "المنصة تفهم المرحلة الحالية والتقدم الحالي.",
    tone: "primary",
  },
  {
    icon: Sparkles,
    no: "02",
    title: "AI-Aware Experience",
    body: "الـ AI يظهر كمساعد حقيقي داخل الرحلة.",
    tone: "accent",
  },
  {
    icon: Target,
    no: "03",
    title: "Mission-Driven Learning",
    body: "كل مرحلة تتحول لتنفيذ حقيقي.",
    tone: "primary",
  },
  {
    icon: Activity,
    no: "04",
    title: "Live Ecosystem",
    body: "المنصة نفسها تتطور علنًا أمام المتعلم.",
    tone: "accent",
  },
  {
    icon: TrendingUp,
    no: "05",
    title: "Visible Transformation",
    body: "المستخدم يرى تطوره خطوة بخطوة.",
    tone: "primary",
  },
];

const LAYERS: {
  no: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  felt: string;
  tone: "primary" | "accent";
}[] = [
  {
    no: "01",
    icon: Brain,
    title: "Context Layer",
    desc: "بتتبع موقع المتعلم، المرحلة، والمهام الجارية.",
    felt: "المتعلم يحس إن المنصة فاهماه ومش بتبدأ معاه من الصفر كل مرة.",
    tone: "primary",
  },
  {
    no: "02",
    icon: Search,
    title: "Retrieval Layer",
    desc: "بتبحث في دروس ومهام ومستندات المنصة قبل أي رد.",
    felt: "الإجابات بتيجي من معرفة المنصة نفسها، مش من مكان عام.",
    tone: "accent",
  },
  {
    no: "03",
    icon: Sparkles,
    title: "AI Assistant Layer",
    desc: "مساعد ذكي متصل بسياق المتعلم وتقدّمه.",
    felt: "المساعد يرد بطريقة تخص رحلتك إنت تحديدًا.",
    tone: "primary",
  },
  {
    no: "04",
    icon: Target,
    title: "Mission Layer",
    desc: "نظام تعلّم قائم على تنفيذ مهام حقيقية.",
    felt: "بتطلع من الدرس وعندك حاجة منفّذة فعلًا.",
    tone: "accent",
  },
  {
    no: "05",
    icon: TrendingUp,
    title: "Progression Layer",
    desc: "بتتحكم في الـ Unlocks والـ Milestones والتحوّل.",
    felt: "كل خطوة بتفتح اللي بعدها بشكل واضح وملموس.",
    tone: "primary",
  },
  {
    no: "06",
    icon: ScrollText,
    title: "Build Logs Layer",
    desc: "تطوّر حقيقي للمنصة، الأخطاء، والإصلاحات بشكل علني.",
    felt: "بتشوف المنصة وهي بتتبني، مش منتج جامد.",
    tone: "accent",
  },
  {
    no: "07",
    icon: Workflow,
    title: "Workflow Layer",
    desc: "أتمتة مستقبلية وعمليات AI متصلة ببعضها.",
    felt: "الأنظمة بتشتغل لوحدها وراء الكواليس بدون عبء يدوي.",
    tone: "primary",
  },
  {
    no: "08",
    icon: Network,
    title: "Ecosystem Awareness Layer",
    desc: "بتربط الدروس والمهام والأنظمة و الـ Business Logic.",
    felt: "كل حاجة بتحس إنها جزء من نفس الكيان الواحد.",
    tone: "accent",
  },
];

const VIDEOS: {
  no: string;
  icon: LucideIcon;
  title: string;
  purpose: string;
  tone: "primary" | "accent";
}[] = [
  {
    no: "01",
    icon: Film,
    title: "Cinematic Intro Videos",
    purpose: "Immersion + emotional entry",
    tone: "primary",
  },
  {
    no: "02",
    icon: Hammer,
    title: "Build Videos",
    purpose: "Show real platform evolution",
    tone: "accent",
  },
  {
    no: "03",
    icon: AlertTriangle,
    title: "Failure Videos",
    purpose: "Teach debugging and realism",
    tone: "primary",
  },
  {
    no: "04",
    icon: Target,
    title: "Mission Videos",
    purpose: "Guide execution",
    tone: "accent",
  },
  {
    no: "05",
    icon: PlayCircle,
    title: "System Videos",
    purpose: "Explain ecosystem connections",
    tone: "primary",
  },
];

const SYNC_FLOW = [
  "Book",
  "Lesson",
  "Mission",
  "Video",
  "Build Log",
  "Social Clip",
  "Platform Feature",
  "Real User Experience",
];

const PHASES: { no: string; title: string; tone: "primary" | "accent" }[] = [
  { no: "Phase 1", title: "Static Educational Experience", tone: "accent" },
  { no: "Phase 2", title: "Context-Aware Learning", tone: "primary" },
  { no: "Phase 3", title: "AI Retrieval Experience", tone: "accent" },
  { no: "Phase 4", title: "Interactive AI Assistant", tone: "primary" },
  { no: "Phase 5", title: "Agentic Ecosystem Behavior", tone: "accent" },
  {
    no: "Phase 6",
    title: "Full AI-Native Operational Environment",
    tone: "primary",
  },
];

/* ---------- Section wrapper ---------- */

function Section({
  no,
  label,
  title,
  children,
}: {
  no: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[11px] tracking-widest text-primary">
          {no}
        </span>
        <span className="h-px flex-1 bg-border/40" />
        <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl font-black mb-6 leading-[1.4]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ---------- Page ---------- */

function BehaviorArchitecturePage() {
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
        <header className="glass rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden border border-border/30">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-widest text-primary mb-4">
              INTERNAL · BEHAVIOR MAP
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.3] mb-5">
              Behavior Architecture
            </h1>
            <p className="text-muted-foreground leading-loose max-w-2xl text-[15px] md:text-base whitespace-pre-line">
              {`المنصة ليست مجموعة صفحات ودروس.\nالمنصة نفسها AI-Native Ecosystem حي يتفاعل ويتطور أمام المتعلم.`}
            </p>
          </div>
        </header>

        {/* SECTION 1 — User Entry Flow */}
        <Section no="01" label="USER ENTRY FLOW" title="رحلة دخول المستخدم">
          <div className="glass rounded-2xl p-6 md:p-10 border border-border/30">
            <div className="flex flex-col items-center">
              {ENTRY_FLOW.map((s, i) => (
                <FlowStep
                  key={s}
                  label={s}
                  last={i === ENTRY_FLOW.length - 1}
                />
              ))}
            </div>
            <p className="text-muted-foreground leading-loose text-center mt-8 max-w-xl mx-auto">
              المستخدم لا يدخل لقراءة كورس. هو يدخل للمشاركة داخل Ecosystem حي.
            </p>
          </div>
        </Section>

        {/* SECTION 2 — Runtime Behavior */}
        <Section no="02" label="RUNTIME BEHAVIOR" title="سلوك المنصة وقت التشغيل">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BEHAVIORS.map((b) => (
              <BehaviorCard key={b.no} {...b} />
            ))}
          </div>
        </Section>

        {/* SECTION 3 — AI Operational Layers */}
        <Section
          no="03"
          label="AI OPERATIONAL LAYERS"
          title="الطبقات التشغيلية للـ AI"
        >
          <div className="relative">
            <div className="absolute right-6 md:right-9 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border/40 to-accent/40 hidden md:block" />
            <div className="space-y-4">
              {LAYERS.map((l) => {
                const isPrimary = l.tone === "primary";
                const ring = isPrimary
                  ? "border-primary/25"
                  : "border-accent/25";
                const iconBg = isPrimary
                  ? "bg-primary/15 text-primary"
                  : "bg-accent/15 text-accent";
                const dot = isPrimary ? "bg-primary" : "bg-accent";
                const Icon = l.icon;
                return (
                  <div
                    key={l.no}
                    className={`relative glass rounded-2xl p-6 border ${ring} md:mr-20`}
                  >
                    <span
                      className={`hidden md:block absolute top-8 -right-[3.4rem] h-3 w-3 rounded-full ${dot} shadow-[0_0_14px] shadow-current`}
                    />
                    <div className="flex items-start gap-4">
                      <span
                        className={`grid h-12 w-12 place-items-center rounded-xl ${iconBg} shrink-0`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                            LAYER {l.no}
                          </p>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2">
                          {l.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-loose mb-3">
                          {l.desc}
                        </p>
                        <div className="glass rounded-lg p-3 border border-border/30">
                          <p className="text-[10px] font-mono text-muted-foreground mb-1">
                            تجربة المتعلم
                          </p>
                          <p className="text-sm text-foreground/90 leading-loose">
                            {l.felt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* SECTION 4 — Video Behavior Layer */}
        <Section
          no="04"
          label="VIDEO BEHAVIOR LAYER"
          title="طبقة سلوك الفيديو"
        >
          <p className="text-muted-foreground leading-loose mb-6 max-w-2xl">
            الفيديوهات ليست محتوى منفصل. هي جزء من التجربة الحية للمنصة.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIDEOS.map((v) => {
              const isPrimary = v.tone === "primary";
              const ring = isPrimary
                ? "border-primary/25"
                : "border-accent/25";
              const iconBg = isPrimary
                ? "bg-primary/15 text-primary"
                : "bg-accent/15 text-accent";
              const Icon = v.icon;
              return (
                <div
                  key={v.no}
                  className={`glass rounded-2xl p-6 border ${ring} h-full`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      {v.no}
                    </p>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground mb-1">
                    PURPOSE
                  </p>
                  <p className="text-sm text-muted-foreground leading-loose">
                    {v.purpose}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="glass rounded-xl p-5 mt-6 border border-primary/25">
            <p className="text-sm leading-loose text-foreground/90">
              <span className="font-bold">ملاحظة: </span>
              كل فيديو يجب أن يرتبط بـ{" "}
              <span className="font-mono text-primary">Lesson</span> +{" "}
              <span className="font-mono text-primary">Mission</span> +{" "}
              <span className="font-mono text-primary">
                Real Platform Context
              </span>
              .
            </p>
          </div>
        </Section>

        {/* SECTION 5 — Ecosystem Synchronization */}
        <Section
          no="05"
          label="ECOSYSTEM SYNCHRONIZATION"
          title="تزامن الـ Ecosystem"
        >
          <div className="glass rounded-2xl p-6 md:p-10 border border-border/30">
            <div className="flex flex-col items-center">
              {SYNC_FLOW.map((s, i) => (
                <FlowStep
                  key={s}
                  label={s}
                  last={i === SYNC_FLOW.length - 1}
                />
              ))}
            </div>
            <p className="text-muted-foreground leading-loose text-center mt-8 max-w-xl mx-auto">
              كل شيء داخل المنصة يجب أن يكون متصلًا بنفس الـ Ecosystem.
            </p>
          </div>
        </Section>

        {/* SECTION 6 — Final Core Principle */}
        <section className="relative rounded-3xl overflow-hidden glow-primary mb-12">
          <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-95" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
          <div className="relative p-10 md:p-16 text-center">
            <p className="font-mono text-[11px] tracking-widest text-primary-foreground/70 mb-5">
              CORE PRINCIPLE
            </p>
            <h2 className="text-2xl md:text-4xl font-black text-primary-foreground leading-[1.4] whitespace-pre-line">
              {`المتعلم لا يدرس الـ Ecosystem...\nهو يعيش داخله.`}
            </h2>
          </div>
        </section>

        {/* SECTION 7 — Future Runtime Evolution */}
        <Section
          no="07"
          label="FUTURE RUNTIME EVOLUTION"
          title="تطوّر المنصة Layer by Layer"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHASES.map((p, i) => {
              const isPrimary = p.tone === "primary";
              const ring = isPrimary
                ? "border-primary/25"
                : "border-accent/25";
              const iconBg = isPrimary
                ? "bg-primary/15 text-primary"
                : "bg-accent/15 text-accent";
              return (
                <div
                  key={p.no}
                  className={`glass rounded-2xl p-6 border ${ring} relative`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}
                    >
                      <Layers className="h-5 w-5" />
                    </span>
                    <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      {p.no}
                    </p>
                  </div>
                  <h3 className="font-bold text-foreground leading-relaxed">
                    {p.title}
                  </h3>
                  <span className="absolute top-4 left-4 font-mono text-[10px] text-muted-foreground/60">
                    0{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground leading-loose text-center mt-8 max-w-xl mx-auto">
            المنصة تتطور Layer by Layer أمام المتعلم نفسه.
          </p>
        </Section>
      </main>
    </div>
  );
}
