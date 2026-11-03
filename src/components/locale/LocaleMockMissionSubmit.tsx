import * as React from "react";
import { ClipboardCheck, Loader2, Lock, RotateCcw, Send } from "lucide-react";
import { IntroMissionPrompt } from "@/components/intro/IntroMission";
import type { LiveMissionShape } from "@/lib/locale-lessons/adapt-package-to-live-mission";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import type { LessonPackageLocale } from "@/lib/locale-lessons/types";

const MIN_ANSWER_CHARS = 20;

export type MockMissionFeedbackKind = "improve" | "weak";

export type MockMissionFeedback = {
  kind: MockMissionFeedbackKind;
  passed: false;
};

/** Deterministic mock feedback — never returns a passing result. */
export function deterministicMockMissionFeedback(
  missionId: string,
  answer: string,
): MockMissionFeedback {
  let hash = 0;
  const key = `${missionId}:${answer.trim()}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const kind: MockMissionFeedbackKind = Math.abs(hash) % 4 === 0 ? "weak" : "improve";
  return { kind, passed: false };
}

function feedbackKeys(kind: MockMissionFeedbackKind): {
  labelKey: "mission.feedback.improve.label" | "mission.feedback.weak.label";
  hintKey: "mission.feedback.improve.hint" | "mission.feedback.weak.hint";
} {
  if (kind === "weak") {
    return {
      labelKey: "mission.feedback.weak.label",
      hintKey: "mission.feedback.weak.hint",
    };
  }
  return {
    labelKey: "mission.feedback.improve.label",
    hintKey: "mission.feedback.improve.hint",
  };
}

export function LocaleMockMissionSubmit({
  liveMission,
  locale,
}: {
  liveMission: LiveMissionShape;
  locale: LessonPackageLocale;
}) {
  const t = (key: Parameters<typeof getUiString>[1]) => getUiString(locale, key);
  const [answer, setAnswer] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<MockMissionFeedback | null>(null);
  const [tooShort, setTooShort] = React.useState(false);
  const bodyDir = locale === "en" ? "ltr" : "rtl";

  async function handleSubmit() {
    setTooShort(false);
    if (answer.trim().length < MIN_ANSWER_CHARS) {
      setTooShort(true);
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    setFeedback(deterministicMockMissionFeedback(liveMission.missionId, answer));
    setSubmitting(false);
  }

  function handleRetry() {
    setFeedback(null);
    setTooShort(false);
    setAnswer("");
  }

  const feedbackState = feedback ? feedbackKeys(feedback.kind) : null;

  return (
    <div
      id="mission"
      className="space-y-4 scroll-mt-24"
      data-locale-mission="live"
      data-locale-mission-evaluation="mock-disabled"
    >
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100/90 space-y-1.5">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{t("safety.mission.banner")}</span>
        </div>
        <p className="text-xs text-amber-100/80 ps-6">{t("mission.reveal.defaultNote")}</p>
      </div>

      <LocaleProvider effectiveLocale={locale}>
        <IntroMissionPrompt
          intro={liveMission.intro}
          prompt={liveMission.prompt}
          buttonLabel=""
          copiedLabel=""
        />
      </LocaleProvider>

      {liveMission.rubric.length > 0 ? (
        <div
          className="rounded-xl border border-border/50 overflow-hidden"
          data-locale-mission-rubric="readonly"
        >
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2 text-[11px] font-mono text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>{t("safety.mission.rubric")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left">
                  <th className="px-4 py-2 font-medium">{t("safety.mission.dimension")}</th>
                  <th className="px-4 py-2 font-medium">{t("safety.mission.weight")}</th>
                  <th className="px-4 py-2 font-medium">{t("safety.mission.criteria")}</th>
                </tr>
              </thead>
              <tbody>
                {liveMission.rubric.map((row) => (
                  <tr key={row.label} className="border-b border-border/30 align-top">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.weight}%</td>
                    <td className="px-4 py-3 text-foreground/90">
                      {row.criteria.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div
        className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3"
        data-locale-mission-submit="mock"
      >
        {!feedback ? (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground" htmlFor="locale-mission-answer">
              {t("mission.answer.label")}
            </label>
            <textarea
              id="locale-mission-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={t("mission.placeholder.blank")}
              rows={5}
              dir={bodyDir}
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent/40"
            />
            {tooShort ? (
              <p className="text-xs text-amber-300/90" role="alert">
                {t("mission.submit.tooShort")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("mission.submit.generating")}
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {t("mission.submit.cta")}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3" data-locale-mission-feedback="mock">
            <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-4 space-y-2">
              <div className="flex items-start gap-2">
                <ClipboardCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t(feedbackState!.labelKey)}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(feedbackState!.hintKey)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground border-t border-accent/15 pt-2">
                {t("mission.result.socraticHint")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("mission.result.improveCta")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
