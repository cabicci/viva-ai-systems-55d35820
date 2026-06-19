import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hammer, Palette, Cog, BarChart3, Briefcase, Compass, BookOpen, Check, ArrowLeft, Loader2, Trophy, Zap } from "lucide-react";
import { runWowPath } from "@/lib/wow-experience.functions";
import {
  logLearnerEvent,
  markWowExperienceSeen,
} from "@/lib/learner-events";
import { useAuth } from "@/lib/auth-context";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { toast } from "sonner";

export const Route = createFileRoute("/start")({
  beforeLoad: requireAuthBeforeLoad,
  head: () => ({
    meta: [
      { title: "ابدأ — تجربة سريعة | مسارات" },
      {
        name: "description",
        content:
          "تجربة اختيارية: اكتشف ما تستطيع المنصة فعله في دقيقتين قبل أن تبدأ التعلّم.",
      },
    ],
  }),
  component: StartPage,
});

type Step = "welcome" | "input" | "running" | "before-after" | "victory";

// Order MUST follow the dashboard PATH_ORDER (single source of truth in curriculum-data).
// Dashboard order: Business → Creator → Analyst → Automator → Builder
const PATHS = [
  { id: "business" as const,  name: "Business",  icon: Briefcase, label: "قرار + Breakdown",     manual: "أسابيع بحث", withAi: "ساعات" },
  { id: "creator" as const,   name: "Creator",   icon: Palette,   label: "٣ Hooks ريلز",         manual: "٣–٤ أسابيع", withAi: "يوم واحد" },
  { id: "analyst" as const,   name: "Analyst",   icon: BarChart3, label: "Insight + تقرير",      manual: "٢–٣ أسابيع", withAi: "ساعات" },
  { id: "automator" as const, name: "Automator", icon: Cog,       label: "Workflow أتمتة",        manual: "شهر شغل",    withAi: "يومين" },
  { id: "builder" as const,   name: "Builder",   icon: Hammer,    label: "Mini App / موقع",      manual: "٢–٣ شهور", withAi: "أيام قليلة" },
];

function StartPage() {
  return (
    <AuthSessionGate>
      <StartContent />
    </AuthSessionGate>
  );
}

function StartContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const runFn = useServerFn(runWowPath);

  const [step, setStep] = useState<Step>("welcome");
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<Record<string, { status: "pending" | "loading" | "done" | "error"; text: string; error?: string }>>(
    Object.fromEntries(PATHS.map((p) => [p.id, { status: "pending", text: "" }])) as never,
  );

  const userName = (user?.user_metadata?.full_name as string) || (user?.email?.split("@")[0]) || "";

  function skip() {
    markWowExperienceSeen();
    void logLearnerEvent({ type: "wow_skipped" });
    navigate({ to: "/dashboard" });
  }

  function finish() {
    markWowExperienceSeen();
    void logLearnerEvent({ type: "wow_completed", metadata: { idea } });
    navigate({ to: "/dashboard" });
  }

  async function startRunning() {
    if (idea.trim().length < 2) {
      toast.error("اكتب فكرة قصيرة أولاً (مثال: محل ورد).");
      return;
    }
    setStep("running");
    setResults(
      Object.fromEntries(PATHS.map((p) => [p.id, { status: "loading", text: "" }])) as never,
    );
    // Fire all 5 in parallel
    await Promise.all(
      PATHS.map(async (p) => {
        try {
          const out = await runFn({ data: { pathId: p.id, idea: idea.trim() } });
          setResults((prev) => ({
            ...prev,
            [p.id]: out.error
              ? { status: "error", text: "", error: out.error }
              : { status: "done", text: out.text },
          }));
        } catch (err) {
          console.error(p.id, err);
          setResults((prev) => ({
            ...prev,
            [p.id]: { status: "error", text: "", error: "لم يصل رد من المساعد." },
          }));
        }
      }),
    );
  }

  const allDone = PATHS.every((p) => results[p.id]?.status === "done" || results[p.id]?.status === "error");
  const successCount = PATHS.filter((p) => results[p.id]?.status === "done").length;

  return (
    <div dir="rtl" className="min-h-dvh grid-bg relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] animate-pulse-glow" />

      {/* Skip */}
      {step !== "victory" && (
        <button
          onClick={skip}
          className="absolute top-4 left-4 z-20 text-sm text-muted-foreground hover:text-foreground transition"
        >
          تخطّى →
        </button>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        {step === "welcome" && (
          <WelcomeStep name={userName} onContinue={() => setStep("input")} />
        )}
        {step === "input" && (
          <InputStep idea={idea} setIdea={setIdea} onContinue={startRunning} />
        )}
        {step === "running" && (
          <RunningStep idea={idea} results={results} allDone={allDone} onNext={() => setStep("before-after")} />
        )}
        {step === "before-after" && (
          <BeforeAfterStep onNext={() => setStep("victory")} />
        )}
        {step === "victory" && (
          <VictoryStep successCount={successCount} onFinish={finish} />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ name, onContinue }: { name: string; onContinue: () => void }) {
  return (
    <div className="text-center py-12 md:py-24 animate-fade-up">
      <div className="inline-grid h-20 w-20 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] glow-primary mb-8">
        <Compass className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="text-4xl md:text-6xl font-black leading-tight">
        أهلاً {name ? <span className="text-gradient">{name}</span> : "بك"} 👋
      </h1>
      <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        قبل أن تبدأ التعلّم، اعرض لك ما تفعله المنصة فعلاً.
        <br />
        <span className="text-foreground font-semibold">في أقل من دقيقتين.</span>
      </p>
      <Button variant="hero" size="xl" className="mt-10" onClick={onContinue}>
        لنبدأ <ArrowLeft className="h-5 w-5" />
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        تجربة اختيارية — المساعد يعمل فقط بعد ضغطك أنت.
      </p>
    </div>
  );
}

function InputStep({ idea, setIdea, onContinue }: { idea: string; setIdea: (v: string) => void; onContinue: () => void }) {
  const examples = ["محل ورد", "كورس انجليزي اونلاين", "تطبيق توصيل أكل", "قناة يوتيوب عن السفر"];
  return (
    <div className="py-12 md:py-20 animate-fade-up max-w-2xl mx-auto">
      <p className="text-primary text-sm font-bold tracking-widest text-center">السؤال الوحيد</p>
      <h2 className="text-3xl md:text-5xl font-black text-center mt-3 leading-tight">
        ما المشروع الذي يدور في ذهنك؟
      </h2>
      <p className="text-center text-muted-foreground mt-4">
        اكتب فكرة في سطر واحد — ثم شغّل المسارات الخمسة عندما تكون جاهزاً.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onContinue();
        }}
        className="mt-10 space-y-4"
      >
        <Input
          autoFocus
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="مثال: محل ورد"
          className="h-16 text-lg text-center"
          maxLength={200}
        />
        <div className="flex flex-wrap gap-2 justify-center">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setIdea(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/30 hover:bg-muted/60 transition"
            >
              {ex}
            </button>
          ))}
        </div>
        <Button type="submit" variant="hero" size="xl" className="w-full" disabled={idea.trim().length < 2}>
          شغّل المسارات الخمسة
        </Button>
      </form>
    </div>
  );
}

function RunningStep({
  idea,
  results,
  allDone,
  onNext,
}: {
  idea: string;
  results: Record<string, { status: "pending" | "loading" | "done" | "error"; text: string; error?: string }>;
  allDone: boolean;
  onNext: () => void;
}) {
  return (
    <div className="py-8 animate-fade-up">
      <div className="text-center mb-8">
        <p className="text-primary text-sm font-bold tracking-widest">جاري التنفيذ</p>
        <h2 className="text-2xl md:text-4xl font-black mt-2">
          المسارات الخمسة تعمل على{" "}
          <span className="text-gradient">&quot;{idea}&quot;</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PATHS.map((p) => (
          <ResultCard key={p.id} path={p} result={results[p.id]} />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button variant="hero" size="xl" disabled={!allDone} onClick={onNext}>
          {allDone ? <>متابعة <ArrowLeft className="h-5 w-5" /></> : "جاري المعالجة..."}
        </Button>
      </div>
    </div>
  );
}

function ResultCard({
  path,
  result,
}: {
  path: (typeof PATHS)[number];
  result: { status: "pending" | "loading" | "done" | "error"; text: string; error?: string };
}) {
  const Icon = path.icon;
  const text = useTypewriter(result.status === "done" ? result.text : "", 12);
  return (
    <div
      className={`glass rounded-2xl p-5 transition-all ${
        result.status === "done" ? "border-primary/50 glow-primary" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)]">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{path.name}</p>
          <p className="text-xs text-muted-foreground truncate">{path.label}</p>
        </div>
        <div className="shrink-0">
          {result.status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {result.status === "done" && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary animate-fade-up">
              <Check className="h-4 w-4 text-primary-foreground" />
            </span>
          )}
          {result.status === "error" && <span className="text-xs text-destructive">!</span>}
        </div>
      </div>
      <div className="text-sm leading-relaxed min-h-[120px] whitespace-pre-wrap text-foreground/90">
        {result.status === "loading" && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-muted/50 w-full" />
            <div className="h-3 rounded bg-muted/50 w-5/6" />
            <div className="h-3 rounded bg-muted/50 w-4/6" />
          </div>
        )}
        {result.status === "done" && text}
        {result.status === "error" && (
          <p className="text-xs text-muted-foreground">{result.error || "حصلت مشكلة."}</p>
        )}
      </div>
      {result.status === "done" && (
        <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold">
            يدوي: {path.manual}
          </span>
          <span className="px-2 py-1 rounded-full bg-primary/15 text-primary font-bold">
            بالمنصة: {path.withAi}
          </span>
        </div>
      )}
    </div>
  );
}

function useTypewriter(target: string, msPerChar: number) {
  const [shown, setShown] = useState("");
  const ref = useRef<number>(0);
  useEffect(() => {
    setShown("");
    ref.current = 0;
    if (!target) return;
    const id = setInterval(() => {
      ref.current += 1;
      setShown(target.slice(0, ref.current));
      if (ref.current >= target.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [target, msPerChar]);
  return shown;
}

function BeforeAfterStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="py-12 md:py-20 animate-fade-up text-center">
      <p className="text-primary text-sm font-bold tracking-widest">مقارنة توضيحية</p>
      <h2 className="text-3xl md:text-5xl font-black mt-3">
        ما شاهدته يختصر خطواتاً كثيرة
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-destructive/30">
          <p className="text-xs font-bold tracking-widest text-destructive">يدوياً</p>
          <p className="text-3xl md:text-4xl font-black mt-4">أسابيع من التنسيق</p>
          <p className="mt-3 text-sm text-muted-foreground">
            قرار، محتوى، أتمتة، تقارير — خطوات متتابعة بجهد أكبر.
          </p>
        </div>
        <div className="glass rounded-2xl p-8 border border-primary/50 glow-primary">
          <p className="text-xs font-bold tracking-widest text-primary">مع المنصة</p>
          <p className="text-3xl md:text-4xl font-black mt-4 text-gradient">مسودات أولى أسرع</p>
          <p className="mt-3 text-sm text-muted-foreground">
            خمسة اتجاهات على فكرتك — ثم تعمّق عبر 100 درساً نشطاً.
          </p>
        </div>
      </div>
      <Button variant="hero" size="xl" className="mt-12" onClick={onNext}>
        متابعة <ArrowLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}

function VictoryStep({ successCount, onFinish }: { successCount: number; onFinish: () => void }) {
  return (
    <div className="py-12 md:py-24 text-center animate-fade-up">
      <div className="inline-grid h-28 w-28 place-items-center rounded-full bg-[image:var(--gradient-primary)] glow-primary mb-6 animate-pulse-glow">
        <Trophy className="h-14 w-14 text-primary-foreground" />
      </div>
      <p className="text-primary text-sm font-bold tracking-widest">خطوتك الأولى</p>
      <h1 className="text-4xl md:text-6xl font-black mt-3 leading-tight">
        جرّبت <span className="text-gradient">المنصة</span> عملياً
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
        {successCount === 5
          ? "المسارات الخمسة أنتجت مخرجات أمامك."
          : `${successCount} من 5 مسارات أنتجت مخرجات.`}{" "}
        هذه لمحة سريعة — المنصة تضم 100 درساً نشطاً لتتعلّم وتطوّر بنفسك.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-10">
        <Stat icon={Zap} label="مسارات" value="5" />
        <Stat icon={BookOpen} label="دروس نشطة" value="100" />
        <Stat icon={Trophy} label="الخطوة التالية" value="→" />
      </div>

      <Button variant="hero" size="xl" className="mt-12" onClick={onFinish}>
        إلى لوحة التحكم <ArrowLeft className="h-5 w-5" />
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition">للصفحة الرئيسية</Link>
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <Icon className="h-5 w-5 text-primary mx-auto" />
      <p className="text-2xl font-black mt-2">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}