import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getDueReviews } from "@/lib/spaced-repetition.functions";
import { getLesson } from "@/lib/unified-lessons";
import { LessonLink } from "@/components/lesson/LessonLink";
import { PATHS } from "@/lib/curriculum-data";

/**
 * Dashboard widget: shows lessons whose spaced-repetition next_review_at
 * has come due. Empty state → hidden. Click takes the learner straight
 * to the lesson; finishing its quiz auto-reschedules via DB trigger.
 */
export function ReviewsDueCard() {
  const { user } = useAuth();
  const fetchDue = useServerFn(getDueReviews);
  const { data, isLoading } = useQuery({
    queryKey: ["reviews-due", user?.id],
    queryFn: async () => {
      try {
        return await fetchDue();
      } catch {
        // Session may be expiring; fail silently instead of crashing the dashboard.
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!user || isLoading) return null;
  const due = data ?? [];
  if (due.length === 0) return null;

  const top = due.slice(0, 5);
  const overdueDays = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Locate the lesson object (for LessonLink routing).
  const findLessonRef = (lessonId: string) => {
    for (const p of PATHS) {
      for (const m of p.modules) {
        const l = m.lessons.find((x) => x.id === lessonId);
        if (l) return l;
      }
    }
    return null;
  };

  return (
    <div className="mb-8 rounded-2xl border border-accent/30 bg-accent/[0.04] p-5 animate-fade-up">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent shrink-0">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold leading-tight">مراجعات النهارده</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {due.length} {due.length === 1 ? "درس" : "دروس"} وقتها المراجعة — يخلّيك فاكر ٢٠٠٪ أكتر
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {top.map((r) => {
          const lessonData = getLesson(r.lessonId);
          const lessonRef = findLessonRef(r.lessonId);
          if (!lessonData || !lessonRef) return null;
          const overdue = overdueDays(r.nextReviewAt);
          return (
            <LessonLink
              key={r.lessonId}
              lesson={lessonRef}
              from="dashboard"
              className="glass rounded-lg p-3 flex items-center gap-3 hover:border-accent/40 transition group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  {lessonData.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {overdue === 0
                    ? `النهارده · مراجعة #${r.reviews + 1}`
                    : `متأخرة ${overdue} يوم · مراجعة #${r.reviews + 1}`}
                </p>
              </div>
              <ArrowLeft className="h-4 w-4 text-accent shrink-0 group-hover:-translate-x-1 transition-transform" />
            </LessonLink>
          );
        })}
      </div>
    </div>
  );
}