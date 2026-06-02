import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Circle, Sparkles, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useStreak } from "@/lib/entitlements";
import { useLessonProgress } from "@/lib/lesson-progress";

const DISMISS_KEY = "welcome-checklist-dismissed";
const FIRST_WEEK_DAYS = 7;

type Step = {
  id: string;
  label: string;
  done: boolean;
  cta?: { to: string; label: string };
};

export function WelcomeChecklist() {
  const { user } = useAuth();
  const { store } = useLessonProgress();
  const { streak } = useStreak();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) {
        setDismissed(true);
      }
    } catch {}
  }, []);

  const userId = user?.id ?? null;

  const { data: missions } = useQuery({
    enabled: !!userId,
    queryKey: ["welcome-checklist-missions", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("mission_submissions")
        .select("status")
        .limit(50);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  if (!user || dismissed) return null;

  // Only show in the first week after signup
  const createdAt = user.created_at ? new Date(user.created_at) : null;
  if (!createdAt) return null;
  const ageDays = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays > FIRST_WEEK_DAYS) return null;

  // Step computations from existing data — no logic changes
  const completedLessonIds = Object.entries(store)
    .filter(([, s]) => s === "completed")
    .map(([id]) => id);

  const hasOpenedAnyLesson = Object.keys(store).length > 0;
  const hasCompletedLesson = completedLessonIds.length > 0;
  const hasSubmittedMission =
    (missions ?? []).some((m) =>
      ["submitted", "evaluating", "passed", "failed", "needs_revision"].includes(m.status),
    ) || false;
  const hasStreak3 = (streak?.current_streak ?? 0) >= 3;

  const steps: Step[] = [
    {
      id: "open",
      label: "افتح أول درس وتعرّف على المنصة",
      done: hasOpenedAnyLesson,
      cta: { to: "/dashboard", label: "اختار درس" },
    },
    {
      id: "complete",
      label: "خلّص أول درس بالكامل",
      done: hasCompletedLesson,
    },
    {
      id: "mission",
      label: "سلّم أول مهمة",
      done: hasSubmittedMission,
    },
    {
      id: "streak",
      label: "اعمل ٣ أيام متواصلة نشاط",
      done: hasStreak3,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Auto-hide after all done (still dismissable manually)
  if (allDone) return null;

  const pct = Math.round((doneCount / steps.length) * 100);
  const daysLeft = Math.max(1, Math.ceil(FIRST_WEEK_DAYS - ageDays));

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <section
      className="glass rounded-2xl p-5 border border-primary/30 mb-8 animate-fade-up"
      style={{ background: "var(--gradient-hero)" }}
      aria-label="رحلة أول أسبوع"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <div>
            <h2 className="text-base font-bold">رحلة أول أسبوع</h2>
            <p className="text-xs text-muted-foreground">
              {doneCount}/{steps.length} خطوات · فاضل {daysLeft} يوم
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-[11px] text-muted-foreground hover:text-foreground transition"
          aria-label="إخفاء"
        >
          إخفاء
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
        <div
          className="h-full bg-[image:var(--gradient-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
              s.done ? "bg-white/[0.03]" : "bg-white/5"
            }`}
          >
            {s.done ? (
              <Check className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={`text-sm flex-1 ${
                s.done ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {s.label}
            </span>
            {!s.done && s.cta && (
              <Link
                to={s.cta.to}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              >
                {s.cta.label}
                <ArrowLeft className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}