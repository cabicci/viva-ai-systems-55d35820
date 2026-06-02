import { useEffect, useState } from "react";
import { Frown, Meh, Smile, X } from "lucide-react";
import { logLearnerEvent } from "@/lib/learner-events";
import { Button } from "@/components/ui/button";

type Rating = "hard" | "ok" | "easy";

interface Props {
  lessonId: string;
  pathId: string;
  moduleId: string;
  /** completed lessons count globally in the path (after this completion) */
  completedCount: number;
  /** whether the lesson itself is completed */
  isCompleted: boolean;
  /** next lesson slug for "skip" CTA */
  nextLessonHref?: string;
}

/**
 * Dynamic Difficulty Sensor — يظهر بعد كل ٣ دروس مكتملة.
 * هدفه يقيس وضوح الشرح ويفتح للمستخدم خيار يبسّط أو يقفز.
 */
export function DifficultyPrompt({
  lessonId,
  pathId,
  moduleId,
  completedCount,
  isCompleted,
  nextLessonHref,
}: Props) {
  const storageKey = `lovable.difficulty.${lessonId}`;
  const [answered, setAnswered] = useState<Rating | "dismissed" | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAnswered(raw as Rating | "dismissed");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const shouldShow =
    isCompleted && completedCount > 0 && completedCount % 3 === 0 && !answered;

  if (!shouldShow) return null;

  const pick = (rating: Rating) => {
    setAnswered(rating);
    try {
      localStorage.setItem(storageKey, rating);
    } catch {
      /* ignore */
    }
    logLearnerEvent({
      type: "difficulty_feedback",
      pathId,
      moduleId,
      lessonId,
      metadata: { rating, completedCount },
    });
  };

  const dismiss = () => {
    setAnswered("dismissed");
    try {
      localStorage.setItem(storageKey, "dismissed");
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      dir="rtl"
      className="mt-8 rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 relative"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="إغلاق"
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-[11px] font-mono text-primary mb-1">
        Checkpoint · بعد ٣ دروس
      </p>
      <p className="text-sm font-semibold mb-3">
        ٣ دروس خلصوا — الشرح كان عامل إزاي معاك؟
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="glass"
          size="sm"
          onClick={() => pick("hard")}
          className="border-rose-400/40 hover:bg-rose-400/10"
        >
          <Frown className="h-4 w-4" /> صعب
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => pick("ok")}
          className="border-amber-400/40 hover:bg-amber-400/10"
        >
          <Meh className="h-4 w-4" /> مناسب
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => pick("easy")}
          className="border-emerald-400/40 hover:bg-emerald-400/10"
        >
          <Smile className="h-4 w-4" /> سهل
        </Button>
      </div>

      {answered === "hard" && (
        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/[0.06] p-3 text-[13px] leading-relaxed">
          <p className="font-semibold text-rose-300 mb-1">
            تمام، هنبسّطها معاك
          </p>
          <p className="text-foreground/80">
            ارجع لأي مفهوم مش واضح واسأل عنه في الـ chat، أو راجع الملخّص فوق
            تاني. لو لسه صعب — قول لينا في الـ feedback.
          </p>
        </div>
      )}
      {answered === "easy" && nextLessonHref && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-3 text-[13px]">
          <p className="font-semibold text-emerald-300 mb-1">
            ممتاز — تقدر تقفز للتحدّي
          </p>
          <a
            href={nextLessonHref}
            className="underline underline-offset-4 text-emerald-200 hover:text-emerald-100"
          >
            افتح الدرس الجاي مباشرة ←
          </a>
        </div>
      )}
    </section>
  );
}