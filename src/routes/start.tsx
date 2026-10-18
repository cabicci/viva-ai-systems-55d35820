import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Hammer,
  Palette,
  Cog,
  BarChart3,
  Briefcase,
  Compass,
  BookOpen,
  Check,
  ArrowLeft,
  Loader2,
  Trophy,
  Route as RouteIcon,
} from "lucide-react";
import { runWowPath } from "@/lib/wow-experience.functions";
import { logLearnerEvent, markWowExperienceSeen } from "@/lib/learner-events";
import { useAuth } from "@/lib/auth-context";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { getUiString } from "@/lib/locale/ui-strings";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";

export const Route = createFileRoute("/start")({
  beforeLoad: requireAuthBeforeLoad,
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return {
      meta: [
        { title: getUiString(locale, "start.meta.title") },
        { name: "description", content: getUiString(locale, "start.meta.description") },
      ],
    };
  },
  component: StartPage,
});

type Step = "welcome" | "input" | "running" | "before-after" | "victory";

// Order MUST follow the dashboard PATH_ORDER (single source of truth in curriculum-data).
// Dashboard order: Business → Creator → Analyst → Automator → Builder
const PATHS = [
  { id: "business" as const, icon: Briefcase },
  { id: "creator" as const, icon: Palette },
  { id: "analyst" as const, icon: BarChart3 },
  { id: "automator" as const, icon: Cog },
  { id: "builder" as const, icon: Hammer },
];

function StartPage() {
  return (
    <AuthSessionGate>
      <StartContent />
    </AuthSessionGate>
  );
}

function StartContent() {
  const t = useUiString();
  const { dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const runFn = useServerFn(runWowPath);

  const [step, setStep] = useState<Step>("welcome");
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<
    Record<
      string,
      { status: "pending" | "loading" | "done" | "error"; text: string; error?: string }
    >
  >(Object.fromEntries(PATHS.map((p) => [p.id, { status: "pending", text: "" }])) as never);

  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "";

  function skip() {
    markWowExperienceSeen();
    void logLearnerEvent({ type: "wow_skipped" });
    navigate({ to: "/dashboard", search: localeSearch() });
  }

  function finish() {
    markWowExperienceSeen();
    void logLearnerEvent({ type: "wow_completed", metadata: { idea } });
    navigate({ to: "/dashboard", search: localeSearch() });
  }

  async function startRunning() {
    if (idea.trim().length < 2) {
      toast.error(t("start.input.error"));
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
              ? { status: "error", text: "", error: t("start.error.noResponse") }
              : { status: "done", text: out.text },
          }));
        } catch (err) {
          console.error(p.id, err);
          setResults((prev) => ({
            ...prev,
            [p.id]: { status: "error", text: "", error: t("start.error.noResponse") },
          }));
        }
      }),
    );
  }

  const allDone = PATHS.every(
    (p) => results[p.id]?.status === "done" || results[p.id]?.status === "error",
  );
  const successCount = PATHS.filter((p) => results[p.id]?.status === "done").length;

  return (
    <div dir={dir} className="min-h-dvh grid-bg relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] animate-pulse-glow" />

      {/* Skip */}
      {step !== "victory" && (
        <button
          onClick={skip}
          className="absolute top-4 left-4 z-20 text-sm text-muted-foreground hover:text-foreground transition"
        >
          {t("start.skip")}
        </button>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        {step === "welcome" && <WelcomeStep name={userName} onContinue={() => setStep("input")} />}
        {step === "input" && <InputStep idea={idea} setIdea={setIdea} onContinue={startRunning} />}
        {step === "running" && (
          <RunningStep
            idea={idea}
            results={results}
            allDone={allDone}
            onNext={() => setStep("before-after")}
          />
        )}
        {step === "before-after" && <BeforeAfterStep onNext={() => setStep("victory")} />}
        {step === "victory" && <VictoryStep successCount={successCount} onFinish={finish} />}
      </div>
    </div>
  );
}

function WelcomeStep({ name, onContinue }: { name: string; onContinue: () => void }) {
  const t = useUiString();
  return (
    <div className="text-center py-12 md:py-24 animate-fade-up">
      <div className="inline-grid h-20 w-20 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] glow-primary mb-8">
        <Compass className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="text-4xl md:text-6xl font-black leading-tight">
        {t("start.welcome.greeting")}{" "}
        {name ? <span className="text-gradient">{name}</span> : t("start.welcome.fallback")} 👋
      </h1>
      <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {t("start.welcome.body")}
        <br />
        <span className="text-foreground font-semibold">{t("start.welcome.duration")}</span>
      </p>
      <Button variant="hero" size="xl" className="mt-10" onClick={onContinue}>
        {t("start.welcome.begin")} <ArrowLeft className="h-5 w-5" />
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">{t("start.welcome.optional")}</p>
    </div>
  );
}

function InputStep({
  idea,
  setIdea,
  onContinue,
}: {
  idea: string;
  setIdea: (v: string) => void;
  onContinue: () => void;
}) {
  const t = useUiString();
  const examples = [
    t("start.example.flowers"),
    t("start.example.course"),
    t("start.example.delivery"),
    t("start.example.travel"),
  ];
  return (
    <div className="py-12 md:py-20 animate-fade-up max-w-2xl mx-auto">
      <p className="text-primary text-sm font-bold tracking-widest text-center">
        {t("start.input.eyebrow")}
      </p>
      <h2 className="text-3xl md:text-5xl font-black text-center mt-3 leading-tight">
        {t("start.input.title")}
      </h2>
      <p className="text-center text-muted-foreground mt-4">{t("start.input.body")}</p>
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
          placeholder={t("start.input.placeholder")}
          aria-label={t("start.input.title")}
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
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full"
          disabled={idea.trim().length < 2}
        >
          {t("start.input.run")}
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
  results: Record<
    string,
    { status: "pending" | "loading" | "done" | "error"; text: string; error?: string }
  >;
  allDone: boolean;
  onNext: () => void;
}) {
  const t = useUiString();
  return (
    <div className="py-8 animate-fade-up">
      <div className="text-center mb-8">
        <p className="text-primary text-sm font-bold tracking-widest">
          {t("start.running.eyebrow")}
        </p>
        <h2 className="text-2xl md:text-4xl font-black mt-2">
          {t("start.running.title")} <span className="text-gradient">&quot;{idea}&quot;</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PATHS.map((p) => (
          <ResultCard key={p.id} path={p} result={results[p.id]} />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button variant="hero" size="xl" disabled={!allDone} onClick={onNext}>
          {allDone ? (
            <>
              {t("start.continue")} <ArrowLeft className="h-5 w-5" />
            </>
          ) : (
            t("start.running.processing")
          )}
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
  const t = useUiString();
  const { locale } = useLocale();
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
          <p className="font-bold text-sm">{getCurriculumPathLabel(locale, path.id, "title")}</p>
          <p className="text-xs text-muted-foreground truncate">
            {t(`start.path.${path.id}.label`)}
          </p>
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
          <p className="text-xs text-muted-foreground">
            {result.error || t("start.error.generic")}
          </p>
        )}
      </div>
      {result.status === "done" && (
        <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold">
            {t("start.result.manual")}: {t(`start.path.${path.id}.manual`)}
          </span>
          <span className="px-2 py-1 rounded-full bg-primary/15 text-primary font-bold">
            {t("start.result.platform")}: {t(`start.path.${path.id}.withAi`)}
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
  const t = useUiString();
  return (
    <div className="py-12 md:py-20 animate-fade-up text-center">
      <p className="text-primary text-sm font-bold tracking-widest">
        {t("start.comparison.eyebrow")}
      </p>
      <h2 className="text-3xl md:text-5xl font-black mt-3">{t("start.comparison.title")}</h2>
      <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-destructive/30">
          <p className="text-xs font-bold tracking-widest text-destructive">
            {t("start.result.manual")}
          </p>
          <p className="text-3xl md:text-4xl font-black mt-4">
            {t("start.comparison.manualTitle")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t("start.comparison.manualBody")}</p>
        </div>
        <div className="glass rounded-2xl p-8 border border-primary/50 glow-primary">
          <p className="text-xs font-bold tracking-widest text-primary">
            {t("start.result.platform")}
          </p>
          <p className="text-3xl md:text-4xl font-black mt-4 text-gradient">
            {t("start.comparison.platformTitle")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t("start.comparison.platformBody")}</p>
        </div>
      </div>
      <Button variant="hero" size="xl" className="mt-12" onClick={onNext}>
        {t("start.continue")} <ArrowLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}

function VictoryStep({ successCount, onFinish }: { successCount: number; onFinish: () => void }) {
  const t = useUiString();
  const localeSearch = useLocaleLinkSearch();
  return (
    <div className="py-12 md:py-24 text-center animate-fade-up">
      <div className="inline-grid h-28 w-28 place-items-center rounded-full bg-[image:var(--gradient-primary)] glow-primary mb-6 animate-pulse-glow">
        <Trophy className="h-14 w-14 text-primary-foreground" />
      </div>
      <p className="text-primary text-sm font-bold tracking-widest">{t("start.victory.eyebrow")}</p>
      <h1 className="text-4xl md:text-6xl font-black mt-3 leading-tight">
        {t("start.victory.title")}
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
        {successCount === 5
          ? t("start.victory.allDone")
          : t("start.victory.partial").replace("{count}", String(successCount))}{" "}
        {t("start.victory.body")}
      </p>

      <div className="grid sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-10">
        <Stat icon={RouteIcon} label={t("start.victory.paths")} value="5" />
        <Stat icon={BookOpen} label={t("start.victory.lessons")} value="100" />
        <Stat icon={Trophy} label={t("start.victory.next")} value="→" />
      </div>

      <Button variant="hero" size="xl" className="mt-12" onClick={onFinish}>
        {t("start.victory.dashboard")} <ArrowLeft className="h-5 w-5" />
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link to="/" search={localeSearch()} className="hover:text-foreground transition">
          {t("start.victory.home")}
        </Link>
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
