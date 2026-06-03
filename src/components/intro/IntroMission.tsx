import * as React from "react";
import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  MissionRubricSection,
  type MissionRubric,
} from "./MissionRubricSubmit";

/* --------------------------------------------------------------
 *  Mini-mission prompt with copy-to-clipboard fallback.
 *  Shared by every Introduction lesson body.
 * -------------------------------------------------------------- */

export function IntroMissionPrompt({
  intro,
  prompt,
  buttonLabel,
  copiedLabel,
  rubric,
  lessonId,
  missionId,
  lessonTitle,
  template,
}: {
  intro: string;
  prompt: string;
  buttonLabel: string;
  copiedLabel: string;
  rubric?: MissionRubric;
  lessonId?: string;
  missionId?: string;
  lessonTitle?: string;
  template?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  // Prefer the stable lessonId as the key (unique per mission). Fall back to
  // a hash of the prompt only when no lessonId is available — the prompt
  // hash can collide across different missions with similar shapes.
  const storageKey = React.useMemo(
    () => `mission-started:${lessonId ?? `prompt:${hashKey(prompt)}`}`,
    [lessonId, prompt],
  );
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(storageKey)) {
        setStarted(true);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  async function copyPrompt() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const ta = document.createElement("textarea");
        ta.value = prompt;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("تم النسخ");
      setStarted(true);
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("النسخ فشل، انسخ النص يدويًا");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="flex-1 min-w-0">{intro}</p>
        {started && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-mono text-accent shrink-0">
            <Sparkles className="h-3 w-3" /> بدأت المهمة
          </span>
        )}
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-sm leading-relaxed text-foreground/90">
        {prompt}
      </div>
      <button
        type="button"
        onClick={copyPrompt}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/25 transition"
      >
        {copied ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" /> {copiedLabel}
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> {buttonLabel}
          </>
        )}
      </button>

      {rubric && rubric.length > 0 && lessonId && (
        <MissionRubricSection
          rubric={rubric}
          lessonId={lessonId}
          missionId={missionId ?? `${lessonId}::mission`}
          lessonTitle={lessonTitle ?? lessonId}
          missionPrompt={prompt}
          template={template}
        />
      )}
    </div>
  );
}

function hashKey(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}