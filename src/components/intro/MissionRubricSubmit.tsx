import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Loader2,
  Lightbulb,
  HelpCircle,
  Send,
  ClipboardCheck,
  FileText,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import {
  evaluateMissionWithAI,
  revealModelMissionAnswer,
  type AIEvaluationResult,
  type RevealAnswerResult,
} from "@/lib/mission-ai-evaluation.functions";
import { skipMissionServer } from "@/lib/mission-skip.functions";
import {
  getActiveSubmissionForMission,
  prepareSubmissionForAttempt,
  submitForEvaluation,
} from "@/lib/mission-evaluation";
import { useAuth } from "@/lib/auth-context";
import { emitMissionPassed } from "@/lib/mission-gate";
import { logLearnerEvent } from "@/lib/learner-events";

export type MissionRubric = readonly {
  label: string;
  weight: number;
  criteria: readonly string[];
}[];

type FeedbackState = {
  label: string;
  hint: string;
};

/** Learner-facing friendly state — internal score/pass logic unchanged. */
function getFeedbackState(result: AIEvaluationResult): FeedbackState {
  if (result.passed) {
    return {
      label: "واضح",
      hint: "واضح إنك فهمت الفكرة الأساسية. تقدر تكمل، ولو حبيت تطوّر إجابتك بعدين ارجع لها.",
    };
  }
  const scores =
    result.perCriterion.length > 0
      ? result.perCriterion.map((c) => c.score)
      : [result.overallScore];
  const weakest = Math.min(...scores);
  if (weakest < 40) {
    return {
      label: "محتاج توضيح بسيط",
      hint: "إجابتك ماشية في الاتجاه الصح، بس محتاجة توضيح بسيط.",
    };
  }
  return {
    label: "جرّب تضيف النقطة دي",
    hint: "جرّب تضيف مثال أو خطوة عملية واحدة عشان إجابتك تبقى أقوى.",
  };
}

/**
 * Build a fill-in-the-blank scaffold from a mission prompt that contains
 * numbered sections (Arabic ٠-٩ or ASCII 0-9 followed by `)`, `.`, or `-`
 * and ending with `:`). Each section becomes a labelled block with a
 * "[اكتب هنا]" placeholder so the learner can edit instead of writing
 * from scratch. Returns empty string when no numbered sections are detected.
 */
export function buildMissionTemplate(prompt: string): string {
  if (!prompt) return "";
  const lines = prompt.split(/\r?\n/);
  const sectionRegex = /^\s*([٠-٩\d]+)\s*[\)\.\-]\s*(.+?)\s*:\s*$/;
  const sections: string[] = [];
  for (const line of lines) {
    const m = line.match(sectionRegex);
    if (m) {
      const num = m[1];
      const label = m[2].trim();
      sections.push(`${num}) ${label}:\n   [اكتب هنا]`);
    }
  }
  if (sections.length < 2) return "";
  return sections.join("\n\n");
}

export function MissionRubricSection({
  rubric,
  lessonId,
  missionId,
  lessonTitle,
  missionPrompt,
  template,
}: {
  rubric: MissionRubric;
  lessonId: string;
  missionId: string;
  lessonTitle: string;
  missionPrompt: string;
  template?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<AIEvaluationResult | null>(null);
  // Server-backed attempt_count on the reused submission row.
  const [attemptCount, setAttemptCount] = React.useState(0);
  const [lastSubmissionId, setLastSubmissionId] = React.useState<string | null>(null);
  const [reveal, setReveal] = React.useState<RevealAnswerResult | null>(null);
  const [revealing, setRevealing] = React.useState(false);
  const { user } = useAuth();
  const evaluate = useServerFn(evaluateMissionWithAI);
  const revealAnswer = useServerFn(revealModelMissionAnswer);
  const skipServer = useServerFn(skipMissionServer);
  const [skipped, setSkipped] = React.useState(false);
  const [skipping, setSkipping] = React.useState(false);

  // Hydrate attempt_count, reveal state, and draft text from the server.
  React.useEffect(() => {
    let cancelled = false;
    if (!user) return;
    void getActiveSubmissionForMission(missionId, lessonId)
      .then((sub) => {
        if (cancelled || !sub) return;
        if (sub.status === "passed") {
          // Already passed (incl. skipped / legacy revealed) — gate handles unlock.
          return;
        }
        setAttemptCount(Number(sub.attempt_count ?? 0));
        setLastSubmissionId(sub.id);
        if (sub.submission_text) setText(sub.submission_text);

        const meta = sub.submission_metadata ?? {};
        if (meta.revealed === true && typeof meta.modelAnswer === "string") {
          setReveal({
            modelAnswer: String(meta.modelAnswer),
            note: String(
              meta.note ?? "ده نموذج للتعلّم — قارنه بمحاولتك.",
            ),
          });
        }
      })
      .catch(() => {
        /* silent — telemetry must not break the page */
      });
    return () => {
      cancelled = true;
    };
  }, [user, missionId, lessonId]);

  async function skipMission() {
    if (skipping) return;
    setSkipping(true);
    try {
      // Persist the skip server-side BEFORE invalidating the cache —
      // otherwise the refetch races and re-locks the gate.
      await skipServer({ data: { missionId, lessonId } });
      emitMissionPassed(missionId);
      setSkipped(true);
      void logLearnerEvent({
        type: "mission_skipped",
        pathId: lessonId.split("-")[0] ?? null,
        moduleId: lessonId.split("-")[1] ?? null,
        lessonId,
        missionId,
        metadata: { failed_attempts: attemptCount },
      });
      toast.success("كمّل براحتك — ترجع للمهمة وقت ما تحب.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر المتابعة دلوقتي. حاول تاني.");
    } finally {
      setSkipping(false);
    }
  }

  const templateText = React.useMemo(
    () => (template?.trim() ? template : buildMissionTemplate(missionPrompt)),
    [template, missionPrompt],
  );

  function loadTemplate() {
    if (!templateText) return;
    setText(templateText);
    toast.success("اتعبّى التيمبليت — عدّل النقاط بكلامك");
  }

  async function submit() {
    if (!user) return;
    if (text.trim().length < 20) {
      toast.error("التسليم قصير أوي. اكتب على الأقل ٢٠ حرف.");
      return;
    }
    setSubmitting(true);
    try {
      // 1) Reuse open row or create draft; 2) mark submitted + increment attempt_count.
      const submission = await prepareSubmissionForAttempt({
        missionId,
        lessonId,
        submissionText: text,
      });
      setLastSubmissionId(submission.id);
      const submitted = await submitForEvaluation(submission.id);
      setAttemptCount(submitted.attempt_count);

      const [pathId, moduleId] = lessonId.split("-");
      void logLearnerEvent({
        type: "mission_submitted",
        pathId: pathId ?? null,
        moduleId: moduleId ?? null,
        lessonId,
        missionId,
        metadata: {
          submission_id: submission.id,
          length: text.length,
          attempt_count: submitted.attempt_count,
        },
      });
      // 3) AI evaluator persists score/feedback/status server-side.
      const r = await evaluate({
        data: {
          submissionId: submission.id,
          missionId,
          lessonTitle,
          missionPrompt,
          submissionText: text,
          rubric: rubric.map((c) => ({
            label: c.label,
            weight: c.weight,
            criteria: [...c.criteria],
          })),
        },
      });
      setResult(r);
      const state = getFeedbackState(r);
      toast.success(
        r.passed
          ? "تمام — واضح إنك فهمت الفكرة الأساسية."
          : `${state.label} — شوف الـ Feedback تحت.`,
      );
      if (r.passed) {
        emitMissionPassed(missionId);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذّر الحصول على Feedback. حاول تاني.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onReveal() {
    if (!lastSubmissionId) return;
    setRevealing(true);
    try {
      const r = await revealAnswer({
        data: {
          submissionId: lastSubmissionId,
          missionId,
          lessonTitle,
          missionPrompt,
        },
      });
      setReveal(r);
      setResult(null);
      toast.success("اقرأ المثال، ثم حسّن إجابتك بكلامك وابعتها تاني.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذّر توليد المثال. حاول تاني.",
      );
    } finally {
      setRevealing(false);
    }
  }

  const checklistHints = React.useMemo(() => {
    const hints: string[] = [];
    for (const c of rubric) {
      for (const cr of c.criteria) {
        hints.push(cr);
      }
    }
    return hints;
  }, [rubric]);

  return (
    <div className="space-y-3 pt-3 border-t border-primary/15">
      {/* Simple checklist hints — no weights */}
      {checklistHints.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center justify-between w-full text-xs text-primary hover:opacity-80 transition"
          >
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> نقاط تساعدك ترتب إجابتك
            </span>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          {open && (
            <ul className="rounded-lg border border-primary/15 bg-primary/[0.03] p-3 space-y-2">
              {checklistHints.map((hint, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground leading-relaxed flex gap-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary/70 mt-0.5 shrink-0" />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {!skipped && !reveal && !result && attemptCount >= 2 && lastSubmissionId && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReveal}
            disabled={revealing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/25 transition disabled:opacity-50"
          >
            {revealing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> جاري التوليد...
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3" /> شوف مثال يساعدك
              </>
            )}
          </button>
        </div>
      )}

      {reveal && !skipped && (
        <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3 space-y-2">
          <p className="text-xs text-primary inline-flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> مثال يساعدك
          </p>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/90">
            {reveal.modelAnswer}
          </pre>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {reveal.note}
          </p>
          <p className="text-sm leading-relaxed text-foreground/90 border-t border-primary/15 pt-2">
            اقرأ المثال، ثم حسّن إجابتك بكلامك وابعتها تاني.
          </p>
        </div>
      )}

      {/* Submit form — stays open after reveal for post-reveal resubmit */}
      {!skipped && (!result || reveal) && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            إجابتك (اكتب ببساطة — مش لازم تكون مثالية)
          </label>
          {templateText && text.trim().length === 0 && (
            <button
              type="button"
              onClick={loadTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              ابدأ من تيمبليت جاهز
            </button>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              templateText
                ? "اكتب من الصفر، أو اضغط «ابدأ من تيمبليت جاهز» فوق."
                : "اكتب إجابتك هنا ببساطة… مش لازم تكون مثالية."
            }
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent/40"
            dir="rtl"
          />
          {!user && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 space-y-2">
              <p className="text-sm leading-relaxed text-foreground/85">
                علشان نحفظ تقدمك وتاخد Feedback، سجّل دخولك الأول.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition"
              >
                سجّل دخولك واحفظ تقدمي
              </Link>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري تجهيز الـ Feedback...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> ابعت وخد Feedback
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={skipMission}
                disabled={skipping}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                title="كمّل الدرس وارجع للمهمة وقت ما تحب"
              >
                {skipping ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> ثانية…</>
                ) : (
                  <><SkipForward className="h-3 w-3" /> مش جاهز دلوقتي — كمّل وارجع لها بعدين</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {result && !skipped && !reveal && (
        <EvaluationResultCard
          result={result}
          attemptCount={attemptCount}
          onRetry={() => setResult(null)}
          onReveal={onReveal}
          revealing={revealing}
          onSkip={skipMission}
        />
      )}

      {skipped && (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3 text-sm leading-relaxed text-foreground/90 inline-flex items-start gap-2">
          <SkipForward className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>
            مش جاهز دلوقتي — كمّل براحتك وارجع للمهمة وقت ما تحب.
          </span>
        </div>
      )}
    </div>
  );
}

function EvaluationResultCard({
  result,
  attemptCount,
  onRetry,
  onReveal,
  revealing,
  onSkip,
}: {
  result: AIEvaluationResult;
  attemptCount: number;
  onRetry: () => void;
  onReveal: () => void;
  revealing: boolean;
  onSkip: () => void;
}) {
  const feedbackState = getFeedbackState(result);
  const canReveal = !result.passed && attemptCount >= 2;
  const canSkip = !result.passed;
  return (
    <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-4 space-y-3">
      <div className="flex items-start gap-2">
        <ClipboardCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {feedbackState.label}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {feedbackState.hint}
          </p>
        </div>
      </div>

      {result.perCriterion.length > 0 && (
        <ul className="space-y-2 border-t border-accent/15 pt-3">
          {result.perCriterion.map((c, i) => (
            <li key={i} className="space-y-1">
              <p className="text-xs font-semibold">{c.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {c.feedback}
              </p>
            </li>
          ))}
        </ul>
      )}

      {result.summary && (
        <p className="text-sm leading-relaxed border-t border-accent/15 pt-3">
          {result.summary}
        </p>
      )}

      {result.nextStep && (
        <p className="text-xs text-primary leading-relaxed inline-flex items-start gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">الخطوة الجاية: </span>
            {result.nextStep}
          </span>
        </p>
      )}

      {result.socraticQuestion && result.socraticQuestion.trim().length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 space-y-1.5">
          <p className="text-[11px] text-primary inline-flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> فكّر في السؤال ده
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {result.socraticQuestion}
          </p>
          {!result.passed && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              مش لازم تردّ هنا — استخدمه عشان تحسّن إجابتك في المحاولة الجاية.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        {!result.passed && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[11px] text-muted-foreground hover:text-accent transition"
          >
            حسّن إجابتي
          </button>
        )}
        {canSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition"
            title="كمّل الدرس وارجع للمهمة وقت ما تحب"
          >
            <SkipForward className="h-3 w-3" /> مش جاهز دلوقتي — كمّل وارجع لها بعدين
          </button>
        )}
        {canReveal && (
          <button
            type="button"
            onClick={onReveal}
            disabled={revealing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/25 transition disabled:opacity-50"
          >
            {revealing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> جاري التوليد...
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3" /> شوف مثال يساعدك
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
