import { useEffect, useMemo, useState } from "react";
import { Flame, CheckCircle2, Trophy, X } from "lucide-react";
import { useStreak } from "@/lib/entitlements";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString, type UiStringKey } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

const XP_PER_LESSON = 10;

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function getMilestoneMessage(
  locale: SupportedLocale,
  streak: number,
  completedCount: number,
): string | null {
  let key: UiStringKey | null = null;
  if (streak === 3) key = "learn.completion.milestone.streak3";
  else if (streak === 7) key = "learn.completion.milestone.streak7";
  else if (streak === 30) key = "learn.completion.milestone.streak30";
  else if (completedCount === 1) key = "learn.completion.milestone.lessons1";
  else if (completedCount === 5) key = "learn.completion.milestone.lessons5";
  else if (completedCount === 10) key = "learn.completion.milestone.lessons10";
  else if (completedCount === 25) key = "learn.completion.milestone.lessons25";
  return key ? getUiString(locale, key) : null;
}

/**
 * Toast-style celebration that fires once the lesson transitions to completed.
 * Telemetry-free: `lesson_completed` is logged by the lesson route's
 * `markCompleted` handler (single source of truth) to avoid double-counting.
 */
export function CompletionReward({
  lessonId,
  isCompleted,
  completedCount,
}: {
  lessonId: string;
  isCompleted: boolean;
  completedCount: number;
}) {
  const { locale } = useLocale();
  const { streak } = useStreak();
  const [show, setShow] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    streak: number;
    milestone: string | null;
  } | null>(null);

  const defaultMessage = useMemo(
    () => getUiString(locale, "learn.completion.default"),
    [locale],
  );
  const xpLabel = useMemo(
    () =>
      interpolate(getUiString(locale, "learn.completion.xp"), {
        xp: String(XP_PER_LESSON),
      }),
    [locale],
  );
  const closeLabel = useMemo(
    () => getUiString(locale, "learn.completion.close"),
    [locale],
  );

  useEffect(() => {
    if (!isCompleted) return;
    const key = `lovable.reward.${lessonId}`;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    const milestone = getMilestoneMessage(locale, streak.current_streak, completedCount);
    setSnapshot({ streak: streak.current_streak, milestone });
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 6000);
    return () => window.clearTimeout(t);
  }, [isCompleted, lessonId, locale, streak.current_streak, completedCount]);

  if (!show || !snapshot) return null;

  const streakLabel =
    snapshot.streak > 0
      ? interpolate(getUiString(locale, "learn.completion.streakDays"), {
          count: String(snapshot.streak),
        })
      : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md"
    >
      <div className="glass rounded-2xl border border-primary/40 shadow-2xl p-4 flex items-start gap-3 animate-fade-up">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shrink-0">
          <Trophy className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {xpLabel}
            {streakLabel ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 mr-2">
                <Flame className="h-3 w-3" /> {streakLabel}
              </span>
            ) : null}
          </p>
          <p className="text-[13px] text-foreground/85 mt-1 leading-relaxed">
            {snapshot.milestone ?? defaultMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label={closeLabel}
          className="text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
