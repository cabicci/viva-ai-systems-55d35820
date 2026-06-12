import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleHelp, Target, Clock, ArrowLeft, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "خليني أعرفك — مسارات" },
      { name: "description", content: "٣ أسئلة بس عشان نوصّلك للدرس المناسب ليك." },
    ],
  }),
  component: TriagePage,
});

type Level = "zero" | "casual" | "advanced";
type Goal = "career" | "money" | "curiosity" | "skill" | "business";
type TimeAvail = "5min" | "15min" | "60min";
type Track = "beginner" | "builder" | "money" | "explorer";

const LEVELS: { id: Level; title: string; sub: string }[] = [
  { id: "zero", title: "صفر خبرة", sub: "مسمعتش غير اسم ChatGPT" },
  { id: "casual", title: "بستخدم بسيط", sub: "بكتب prompts بسيطة من فترة لفترة" },
  { id: "advanced", title: "محترف", sub: "بشتغل APIs / بنيت حاجات بـ AI" },
];

const GOALS: { id: Goal; title: string; sub: string }[] = [
  { id: "career", title: "تطوير مهني", sub: "أحسّن شغلي الحالي" },
  { id: "money", title: "كسب فلوس", sub: "عايز دخل إضافي / مشروع" },
  { id: "business", title: "أبني بزنس", sub: "عندي فكرة وعايز أنفّذها" },
  { id: "skill", title: "أتعلم مهارة", sub: "أبني شيء بنفسي بـ AI" },
  { id: "curiosity", title: "فضول بس", sub: "حابب أفهم AI بيعمل إيه" },
];

const TIMES: { id: TimeAvail; title: string; sub: string }[] = [
  { id: "5min", title: "٥ دقايق", sub: "وقتي ضيق" },
  { id: "15min", title: "١٥ دقيقة", sub: "ربع ساعة في اليوم" },
  { id: "60min", title: "ساعة+", sub: "جاد ومستعد" },
];

function classify(level: Level, goal: Goal): { track: Track; entry: string } {
  if (level === "zero") return { track: "beginner", entry: "intro-m1-l6-learn-without-fear" };
  if (goal === "money") return { track: "money", entry: "intro-m1-l7-choose-your-path" };
  if (goal === "business") return { track: "money", entry: "business-m1-l1-from-decisions-to-leadership" };
  if (level === "advanced") return { track: "builder", entry: "builder-m2-l1-prompt-layer" };
  if (goal === "skill" || goal === "career") return { track: "builder", entry: "builder-m1-l1-what-is-llm" };
  return { track: "explorer", entry: "intro-m1-l3-setup-your-ai" };
}

function TriagePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [timeAvail, setTimeAvail] = useState<TimeAvail | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function save() {
    if (!user || !level || !goal || !timeAvail) return;
    setSaving(true);
    const { track, entry } = classify(level, goal);
    const { error } = await supabase.from("learner_triage").upsert({
      user_id: user.id,
      level,
      goal,
      time_avail: timeAvail,
      track,
      entry_lesson_id: entry,
    });
    setSaving(false);
    if (error) {
      toast.error("حصل خطأ، حاول تاني");
      return;
    }
    toast.success("جاهز — يلا نبدأ");
    const pathId = entry.split("-")[0];
    navigate({ to: "/learn/$pathId/$lessonId", params: { pathId, lessonId: entry } });
  }

  const Pill = ({ active }: { active: boolean }) => (
    <span className={`h-1.5 w-8 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
  );

  const Card = <T extends string>({ id, title, sub, selected, onClick, icon: Icon }: {
    id: T; title: string; sub: string; selected: boolean; onClick: () => void; icon: React.ElementType;
  }) => (
    <button
      key={id}
      onClick={onClick}
      className={`relative w-full glass rounded-2xl p-5 text-right transition-all hover:-translate-y-0.5 ${
        selected ? "border-primary glow-primary" : "hover:border-primary/40"
      }`}
    >
      {selected && (
        <span className="absolute top-3 left-3 grid h-6 w-6 place-items-center rounded-full bg-primary">
          <Check className="h-4 w-4 text-primary-foreground" />
        </span>
      )}
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--gradient-primary)] mb-3">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </button>
  );

  if (loading) return null;

  return (
    <div className="min-h-screen container mx-auto px-4 py-12 max-w-3xl" dir="rtl">
      <div className="text-center mb-8">
        <p className="text-primary text-sm font-semibold mb-2">سؤال {step} من ٣</p>
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          {step === 1 && "إيه مستواك في AI؟"}
          {step === 2 && "هدفك إيه من التعلّم؟"}
          {step === 3 && "هتقدر تخصّص كام وقت في اليوم؟"}
        </h1>
        <p className="text-muted-foreground">إجاباتك بتحدّد الدرس الأول المناسب ليك.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Pill active={step >= 1} />
          <Pill active={step >= 2} />
          <Pill active={step >= 3} />
        </div>
      </div>

      {step === 1 && (
        <div className="grid md:grid-cols-3 gap-3">
          {LEVELS.map((l) => (
            <Card key={l.id} id={l.id} title={l.title} sub={l.sub} selected={level === l.id} onClick={() => setLevel(l.id)} icon={CircleHelp} />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-3">
          {GOALS.map((g) => (
            <Card key={g.id} id={g.id} title={g.title} sub={g.sub} selected={goal === g.id} onClick={() => setGoal(g.id)} icon={Target} />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="grid md:grid-cols-3 gap-3">
          {TIMES.map((t) => (
            <Card key={t.id} id={t.id} title={t.title} sub={t.sub} selected={timeAvail === t.id} onClick={() => setTimeAvail(t.id)} icon={Clock} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
          رجوع
        </Button>
        {step < 3 ? (
          <Button
            variant="hero"
            size="lg"
            disabled={(step === 1 && !level) || (step === 2 && !goal)}
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
          >
            التالي <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="hero" size="lg" disabled={!timeAvail || saving} onClick={save}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>يلا نبدأ <ArrowLeft className="h-4 w-4" /></>}
          </Button>
        )}
      </div>
    </div>
  );
}