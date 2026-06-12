import { useEffect, useState } from "react";
import { Flame, CheckCircle2, Trophy, X } from "lucide-react";
import { useStreak } from "@/lib/entitlements";

const XP_PER_LESSON = 10;

function getMilestoneMessage(streak: number, completedCount: number): string | null {
  if (streak === 3) return "٣ أيام متتالية 🔥 العادة بتتثبّت!";
  if (streak === 7) return "أسبوع كامل! إنت من ٥٪ بس اللي وصلوا هنا.";
  if (streak === 30) return "شهر كامل 🏆 إنت دلوقتي محترف.";
  if (completedCount === 1) return "أول درس خلّصته 🎉 الطريق بدأ.";
  if (completedCount === 5) return "٥ دروس! إنت بقيت في المسار جد.";
  if (completedCount === 10) return "١٠ دروس 🚀 ده مش هواية، ده commitment.";
  if (completedCount === 25) return "٢٥ درس! إنت في الـ top tier.";
  return null;
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
  const { streak } = useStreak();
  const [show, setShow] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    streak: number;
    milestone: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isCompleted) return;
    const key = `lovable.reward.${lessonId}`;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    const milestone = getMilestoneMessage(streak.current_streak, completedCount);
    setSnapshot({ streak: streak.current_streak, milestone });
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 6000);
    return () => window.clearTimeout(t);
  }, [isCompleted, lessonId, streak.current_streak, completedCount]);

  if (!show || !snapshot) return null;

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
            +{XP_PER_LESSON} XP
            {snapshot.streak > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 mr-2">
                <Flame className="h-3 w-3" /> {snapshot.streak} يوم
              </span>
            )}
          </p>
          <p className="text-[13px] text-foreground/85 mt-1 leading-relaxed">
            {snapshot.milestone ?? "خلّصت الدرس! استمر — كل درس بيقربك خطوة من الـ outcome."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label="إغلاق"
          className="text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}