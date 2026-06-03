import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
  Lightbulb,
  HelpCircle,
  Send,
  Sparkles,
  FileText,
  XCircle,
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
import { createSubmission } from "@/lib/mission-evaluation";
import { useAuth } from "@/lib/auth-context";
import { emitMissionPassed } from "@/lib/mission-gate";
import { logLearnerEvent } from "@/lib/learner-events";

export type MissionRubric = readonly {
  label: string;
  weight: number;
  criteria: readonly string[];
}[];

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
  // Count of failed attempts on this lesson page (resets on reload).
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [lastSubmissionId, setLastSubmissionId] = React.useState<string | null>(null);
  const [reveal, setReveal] = React.useState<RevealAnswerResult | null>(null);
  const [revealing, setRevealing] = React.useState(false);
  const { user } = useAuth();
  const evaluate = useServerFn(evaluateMissionWithAI);
  const revealAnswer = useServerFn(revealModelMissionAnswer);
  const [skipped, setSkipped] = React.useState(false);

  function skipMission() {
    emitMissionPassed(missionId);
    setSkipped(true);
    void logLearnerEvent({
      type: "mission_skipped",
      pathId: lessonId.split("-")[0] ?? null,
      moduleId: lessonId.split("-")[1] ?? null,
      lessonId,
      missionId,
      metadata: { failed_attempts: failedAttempts },
    });
    toast.success("تخطّيت المهمة — الدرس الجاي اتفتح. ترجعلها وقت ما تحب.");
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
    if (!user) {
      toast.error("لازم تسجّل الدخول قبل ما تبعت المهمة.");
      return;
    }
    if (text.trim().length < 20) {
      toast.error("التسليم قصير أوي. اكتب على الأقل ٢٠ حرف.");
      return;
    }
    setSubmitting(true);
    try {
      // 1) Create the submission row (server triggers force status='draft').
      const submission = await createSubmission({
        missionId,
        lessonId,
        submissionText: text,
      });
      setLastSubmissionId(submission.id);
      const [pathId, moduleId] = lessonId.split("-");
      void logLearnerEvent({
        type: "mission_submitted",
        pathId: pathId ?? null,
        moduleId: moduleId ?? null,
        lessonId,
        missionId,
        metadata: { submission_id: submission.id, length: text.length },
      });
      // 2) Call AI evaluator — it persists score/feedback/status server-side.
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
      toast.success(
        r.passed ? "ممتاز! المهمة عدّت ✓" : "محتاج تحسين بسيط — شوف الـ feedback",
      );
      if (r.passed) {
        emitMissionPassed(missionId);
      } else {
        setFailedAttempts((n) => n + 1);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "فشل التقييم. حاول تاني.",
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
      emitMissionPassed(missionId);
      toast.success("اتفتح الدرس التالي — اقرأ النموذج وقارنه بمحاولتك");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذّر توليد النموذج. حاول تاني.",
      );
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div className="space-y-3 pt-3 border-t border-primary/15">
      {/* Rubric accordion */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-xs font-mono text-primary hover:opacity-80 transition"
      >
        <span className="inline-flex items-center gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5" /> إزاي هاتقيّم نفسك؟
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {open && (
        <div className="rounded-lg border border-primary/15 bg-primary/[0.03] p-3 space-y-3">
          {rubric.map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{c.label}</p>
                <span className="text-[10px] font-mono text-primary">
                  {c.weight}%
                </span>
              </div>
              <ul className="space-y-1 pr-3">
                {c.criteria.map((cr, j) => (
                  <li
                    key={j}
                    className="text-xs text-muted-foreground leading-relaxed flex gap-1.5"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{cr}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Submit form */}
      {!result && !skipped && (
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">
            تسليمك (الصق إجابتك أو لينك)
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
                : "اكتب أو الصق هنا..."
            }
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent/40"
            dir="rtl"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري التقييم...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> ابعت للمراجعة بالـ AI
                </>
              )}
            </button>
            <button
              type="button"
              onClick={skipMission}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition"
              title="افتح الدرس الجاي من غير ما تسلّم — تقدر ترجع للمهمة وقت ما تحب"
            >
              <SkipForward className="h-3 w-3" /> تخطّي المهمة دلوقتي
            </button>
          </div>
        </div>
      )}

      {result && !skipped && (
        <EvaluationResultCard
          result={result}
          failedAttempts={failedAttempts}
          onRetry={() => setResult(null)}
          onReveal={onReveal}
          revealing={revealing}
          reveal={reveal}
          onSkip={skipMission}
        />
      )}

      {skipped && (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3 text-sm leading-relaxed text-foreground/90 inline-flex items-start gap-2">
          <SkipForward className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>
            تخطّيت المهمة. الدرس الجاي اتفتح — لما تحب ترجع وتجرّبها.
          </span>
        </div>
      )}
    </div>
  );
}

function EvaluationResultCard({
  result,
  failedAttempts,
  onRetry,
  onReveal,
  revealing,
  reveal,
  onSkip,
}: {
  result: AIEvaluationResult;
  failedAttempts: number;
  onRetry: () => void;
  onReveal: () => void;
  revealing: boolean;
  reveal: RevealAnswerResult | null;
  onSkip: () => void;
}) {
  const canReveal = !result.passed && failedAttempts >= 2 && !reveal;
  const canSkip = !result.passed && !reveal;
  return (
    <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-mono inline-flex items-center gap-1.5">
          {result.passed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-amber-400" />
          )}
          {result.passed ? "عدّيت ✓" : "محتاج تحسين"}
        </p>
        <span className="text-lg font-bold tabular-nums">
          {result.overallScore}
          <span className="text-xs text-muted-foreground">/100</span>
        </span>
      </div>

      {result.perCriterion.length > 0 && (
        <ul className="space-y-2 border-t border-accent/15 pt-3">
          {result.perCriterion.map((c, i) => (
            <li key={i} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">{c.label}</p>
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                  {c.score}/100
                </span>
              </div>
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
          <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">الخطوة الجاية: </span>
            {result.nextStep}
          </span>
        </p>
      )}

      {result.socraticQuestion && result.socraticQuestion.trim().length > 0 && (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-3 space-y-1.5">
          <p className="text-[11px] font-mono text-amber-300 inline-flex items-center gap-1.5">
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

      {reveal && (
        <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3 space-y-2 border-t border-primary/20">
          <p className="text-xs font-mono text-primary inline-flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> نموذج إجابة للتعلّم
          </p>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/90">
            {reveal.modelAnswer}
          </pre>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {reveal.note}
          </p>
        </div>
      )}

      {!reveal && (
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          {!result.passed && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[11px] font-mono text-muted-foreground hover:text-accent transition"
            >
              ابعت محاولة جديدة
            </button>
          )}
          {canSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition"
              title="افتح الدرس الجاي من غير ما تكمّل المحاولة"
            >
              <SkipForward className="h-3 w-3" /> تخطّي المهمة
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
                  <Lightbulb className="h-3 w-3" /> وريني نموذج إجابة وافتح الدرس
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}