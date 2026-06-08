import * as React from "react";
import { Brain, CheckCircle2, XCircle, RotateCcw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { logLearnerEvent } from "@/lib/learner-events";

export type QuizItem = {
  id: string;
  bloom: "remember" | "understand" | "apply";
  question: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
};

const BLOOM_LABEL: Record<QuizItem["bloom"], string> = {
  remember: "تذكّر",
  understand: "افهم",
  apply: "طبّق",
};

export function QuizBlock({
  lessonId,
  items,
}: {
  lessonId: string;
  items: readonly QuizItem[];
}) {
  if (!items?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
        <Brain className="h-3.5 w-3.5" /> سؤال سريع — مش امتحان
        {items.length > 1 ? ` · ${items.length} أسئلة` : ""}
      </div>
      <div className="space-y-3">
        {items.map((q) => (
          <QuizQuestion key={q.id} lessonId={lessonId} item={q} />
        ))}
      </div>
    </div>
  );
}

function QuizQuestion({
  lessonId,
  item,
}: {
  lessonId: string;
  item: QuizItem;
}) {
  const { user } = useAuth();
  const [picked, setPicked] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const submitted = picked !== null;
  const isCorrect = picked === item.correctIndex;

  async function choose(i: number) {
    if (submitted) return;
    setPicked(i);
    if (!user) return;
    const correct = i === item.correctIndex;
    const [pathId, moduleId] = lessonId.split("-");
    // Best-effort log. Ignore errors so quiz UX never breaks.
    try {
      await supabase.from("lesson_quiz_attempts").insert({
        user_id: user.id,
        lesson_id: lessonId,
        question_id: item.id,
        selected_index: i,
        is_correct: correct,
        bloom_level: item.bloom,
      });
    } catch {
      /* ignore */
    }
    void logLearnerEvent({
      type: "quiz_attempted",
      pathId: pathId ?? null,
      moduleId: moduleId ?? null,
      lessonId,
      metadata: {
        question_id: item.id,
        is_correct: correct,
        bloom_level: item.bloom,
      },
    });
  }

  function reset() {
    setPicked(null);
    setRevealed(false);
  }

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    const [pathId, moduleId] = lessonId.split("-");
    void logLearnerEvent({
      type: "quiz_predicted",
      pathId: pathId ?? null,
      moduleId: moduleId ?? null,
      lessonId,
      metadata: { question_id: item.id, bloom_level: item.bloom },
    });
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-relaxed flex-1">{item.question}</p>
        <span className="text-[10px] font-mono rounded-md bg-accent/15 text-accent px-2 py-0.5 shrink-0">
          {BLOOM_LABEL[item.bloom]}
        </span>
      </div>

      {!revealed ? (
        <div className="rounded-lg border border-dashed border-accent/30 bg-accent/[0.03] p-4 text-center space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            فكّر في إجابتك الأول في دماغك — بعدين ورّي الخيارات
          </p>
          <button
            type="button"
            onClick={reveal}
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 text-xs font-mono text-accent transition"
          >
            <Eye className="h-3.5 w-3.5" /> فكّرت — ورّيني الخيارات
          </button>
        </div>
      ) : (
      <ul className="space-y-2">
        {item.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = i === item.correctIndex;
          let cls =
            "w-full text-right rounded-lg border px-3 py-2 text-sm transition cursor-pointer";
          if (!submitted) {
            cls += " border-white/10 bg-white/[0.02] hover:border-accent/40";
          } else if (isAnswer) {
            cls += " border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-200";
          } else if (isPicked) {
            cls += " border-red-400/40 bg-red-400/[0.08] text-red-200";
          } else {
            cls += " border-white/10 bg-white/[0.01] text-muted-foreground";
          }
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => choose(i)}
                disabled={submitted}
                className={cls}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{opt}</span>
                  {submitted && isAnswer && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                  )}
                  {submitted && isPicked && !isAnswer && (
                    <XCircle className="h-4 w-4 text-red-300 shrink-0" />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      )}

      {submitted && (
        <div className="space-y-2 border-t border-accent/15 pt-3">
          <p
            className={
              "text-xs font-mono " +
              (isCorrect ? "text-emerald-300" : "text-red-300")
            }
          >
            {isCorrect ? "إجابة صحيحة ✓" : "إجابة غلط ✗"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.explanation}
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-accent transition"
          >
            <RotateCcw className="h-3 w-3" /> جرّب تاني
          </button>
        </div>
      )}
    </div>
  );
}