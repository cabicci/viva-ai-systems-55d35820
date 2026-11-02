import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { CircleHelp, CheckCircle2, XCircle, RotateCcw, Eye } from "lucide-react";
import { submitQuizAttempt } from "@/lib/quiz-attempt.functions";
import { useAuth } from "@/lib/auth-context";
import { logLearnerEvent } from "@/lib/learner-events";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString, type UiStringKey } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";
import type { AuthGeneration } from "@/lib/auth-context";

const SAVE_COPY: Record<
  SupportedLocale,
  { saving: string; saved: string; unconfirmed: string; retry: string }
> = {
  "ar-EG": {
    saving: "بنحفظ إجابتك…",
    saved: "إجابتك اتحفظت في سجلك.",
    unconfirmed: "ما قدرناش نأكد حفظ إجابتك. اختيارك موجود؛ حاول الحفظ تاني.",
    retry: "حاول حفظ الإجابة تاني",
  },
  "ar-MSA": {
    saving: "جارٍ حفظ إجابتك…",
    saved: "حُفظت إجابتك في سجلك.",
    unconfirmed: "تعذر تأكيد حفظ إجابتك. اختيارك باقٍ؛ أعد محاولة الحفظ.",
    retry: "إعادة حفظ الإجابة",
  },
  "ar-Gulf": {
    saving: "نحفظ إجابتك…",
    saved: "انحفظت إجابتك في سجلك.",
    unconfirmed: "ما قدرنا نأكد حفظ إجابتك. اختيارك موجود؛ حاول الحفظ مرة ثانية.",
    retry: "أعد حفظ الإجابة",
  },
  en: {
    saving: "Saving your answer…",
    saved: "Your answer is saved in your record.",
    unconfirmed:
      "We could not confirm your answer was saved. Your selection is retained; retry saving.",
    retry: "Retry saving answer",
  },
};

export type QuizItem = {
  id: string;
  bloom: "remember" | "understand" | "apply";
  question: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
};

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

const BLOOM_KEY: Record<QuizItem["bloom"], UiStringKey> = {
  remember: "intro.quiz.bloom.remember",
  understand: "intro.quiz.bloom.understand",
  apply: "intro.quiz.bloom.apply",
};

export function QuizBlock({ lessonId, items }: { lessonId: string; items: readonly QuizItem[] }) {
  const { locale } = useLocale();
  const { user, authGeneration } = useAuth();
  if (!items?.length) return null;

  const header =
    getUiString(locale, "intro.quiz.header") +
    (items.length > 1
      ? interpolate(getUiString(locale, "intro.quiz.headerWithCount"), {
          count: String(items.length),
        })
      : "");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
        <CircleHelp className="h-3.5 w-3.5" /> {header}
      </div>
      <div className="space-y-3">
        {items.map((q) => (
          <QuizQuestion
            key={JSON.stringify([
              user?.id ?? null,
              authGeneration.value,
              lessonId,
              q.id,
              locale,
              q.question,
              q.options,
              q.correctIndex,
              q.explanation,
              q.bloom,
            ])}
            lessonId={lessonId}
            item={q}
          />
        ))}
      </div>
    </div>
  );
}

function QuizQuestion({ lessonId, item }: { lessonId: string; item: QuizItem }) {
  const { locale } = useLocale();
  const auth = useAuth();
  const { user, authGeneration, loading } = auth;
  const liveAuth = React.useRef(auth);
  liveAuth.current = auth;
  const submitAttempt = useServerFn(submitQuizAttempt);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "unconfirmed">(
    "idle",
  );
  const [confirmedCorrect, setConfirmedCorrect] = React.useState<boolean | null>(null);
  const ticket = React.useRef<{
    requestId: string;
    selected: number;
    generation: AuthGeneration;
    userId: string;
    pending: boolean;
  } | null>(null);
  const mounted = React.useRef(false);
  React.useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ticket.current = null;
    };
  }, []);
  const copy = SAVE_COPY[locale];
  const submitted = picked !== null;
  const isCorrect = user ? confirmedCorrect : picked === item.correctIndex;
  const resultVisible = submitted && (!user || saveState === "saved");

  function current(expected: NonNullable<typeof ticket.current>) {
    const live = liveAuth.current;
    return (
      mounted.current &&
      ticket.current === expected &&
      !live.loading &&
      live.user?.id === expected.userId &&
      live.authGeneration === expected.generation &&
      live.isAuthGenerationCurrent(expected.generation)
    );
  }

  async function save(expected: NonNullable<typeof ticket.current>) {
    if (!current(expected) || expected.pending) return;
    expected.pending = true;
    setSaveState("saving");
    try {
      const result = await submitAttempt({
        data: {
          locale,
          lessonId,
          questionId: item.id,
          selectedIndex: expected.selected,
          requestId: expected.requestId,
        },
      });
      if (!current(expected)) return;
      if (
        !result ||
        typeof result.attemptId !== "string" ||
        !result.attemptId ||
        typeof result.isCorrect !== "boolean"
      )
        throw new Error("Unconfirmed quiz attempt");
      setConfirmedCorrect(result.isCorrect);
      setSaveState("saved");
      const [pathId, moduleId] = lessonId.split("-");
      void logLearnerEvent({
        type: "quiz_attempted",
        pathId: pathId ?? null,
        moduleId: moduleId ?? null,
        lessonId,
        metadata: {
          question_id: item.id,
          is_correct: result.isCorrect,
          bloom_level: result.bloomLevel,
        },
      });
    } catch {
      if (current(expected)) setSaveState("unconfirmed");
    } finally {
      expected.pending = false;
    }
  }

  async function choose(i: number) {
    if (submitted || ticket.current || loading) return;
    setPicked(i);
    if (!user) return;
    const expected = {
      requestId: crypto.randomUUID(),
      selected: i,
      generation: authGeneration,
      userId: user.id,
      pending: false,
    };
    ticket.current = expected;
    await save(expected);
  }

  function reset() {
    if (saveState === "saving" || saveState === "unconfirmed") return;
    ticket.current = null;
    setSaveState("idle");
    setConfirmedCorrect(null);
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
          {getUiString(locale, BLOOM_KEY[item.bloom])}
        </span>
      </div>

      {!revealed ? (
        <div className="rounded-lg border border-dashed border-accent/30 bg-accent/[0.03] p-4 text-center space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {getUiString(locale, "intro.quiz.thinkHint")}
          </p>
          <button
            type="button"
            onClick={reveal}
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 text-xs font-mono text-accent transition"
          >
            <Eye className="h-3.5 w-3.5" /> {getUiString(locale, "intro.quiz.revealCta")}
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {item.options.map((opt, i) => {
            const isPicked = picked === i;
            const isAnswer =
              resultVisible && (user ? isPicked && isCorrect === true : i === item.correctIndex);
            let cls =
              "w-full text-start rounded-lg border px-3 py-2 text-sm transition cursor-pointer";
            if (!submitted) {
              cls += " border-white/10 bg-white/[0.02] hover:border-accent/40";
            } else if (isAnswer) {
              cls += " border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-200";
            } else if (isPicked && resultVisible && isCorrect === false) {
              cls += " border-red-400/40 bg-red-400/[0.08] text-red-200";
            } else {
              cls += " border-white/10 bg-white/[0.01] text-muted-foreground";
            }
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  disabled={submitted || loading}
                  className={cls}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>{opt}</span>
                    {submitted && isAnswer && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    )}
                    {resultVisible && isPicked && isCorrect === false && (
                      <XCircle className="h-4 w-4 text-red-300 shrink-0" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {user && submitted && saveState !== "idle" && (
        <div className="space-y-2 border-t border-accent/15 pt-3">
          <p
            role={saveState === "unconfirmed" ? "alert" : "status"}
            aria-live="polite"
            className="text-sm"
          >
            {saveState === "saving"
              ? copy.saving
              : saveState === "saved"
                ? copy.saved
                : copy.unconfirmed}
          </p>
          {saveState === "unconfirmed" && (
            <button
              type="button"
              className="underline text-sm"
              onClick={() => {
                if (ticket.current) void save(ticket.current);
              }}
            >
              {copy.retry}
            </button>
          )}
        </div>
      )}
      {resultVisible && (
        <div className="space-y-2 border-t border-accent/15 pt-3">
          <p className={"text-xs font-mono " + (isCorrect ? "text-emerald-300" : "text-red-300")}>
            {getUiString(locale, isCorrect ? "intro.quiz.correct" : "intro.quiz.incorrect")}
          </p>
          {!user && (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.explanation}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-accent transition"
          >
            <RotateCcw className="h-3 w-3" /> {getUiString(locale, "intro.quiz.retry")}
          </button>
        </div>
      )}
    </div>
  );
}
