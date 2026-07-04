import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getDueReviews } from "@/lib/spaced-repetition.functions";
import { getLesson } from "@/lib/unified-lessons";
import { LessonLink } from "@/components/lesson/LessonLink";
import { PATHS } from "@/lib/curriculum-data";
import { useLocale } from "@/lib/locale/locale-context";
import { getCurriculumLessonLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { useUiString } from "@/lib/locale/use-ui-strings";

/**
 * Dashboard widget: shows lessons whose spaced-repetition next_review_at
 * has come due. Empty state → hidden. Click takes the learner straight
 * to the lesson; finishing its quiz auto-reschedules via DB trigger.
 */
export function ReviewsDueCard() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const t = useUiString();
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

  const subtitleKey =
    due.length === 1
      ? "dashboard.reviews.subtitle.one"
      : "dashboard.reviews.subtitle.other";
  const subtitle = t(subtitleKey).replace("{count}", String(due.length));

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
            <RefreshCw className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold leading-tight">{t("dashboard.reviews.title")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {top.map((r) => {
          const lessonData = getLesson(r.lessonId);
          const lessonRef = findLessonRef(r.lessonId);
          if (!lessonData || !lessonRef) return null;
          const lessonTitle = getCurriculumLessonLabel(locale, r.lessonId);
          const overdue = overdueDays(r.nextReviewAt);
          const reviewMeta =
            overdue === 0
              ? t("dashboard.reviews.itemToday").replace("{n}", String(r.reviews + 1))
              : t("dashboard.reviews.itemOverdue")
                  .replace("{days}", String(overdue))
                  .replace("{n}", String(r.reviews + 1));
          return (
            <LessonLink
              key={r.lessonId}
              lesson={lessonRef}
              from="dashboard"
              className="glass rounded-lg p-3 flex items-center gap-3 hover:border-accent/40 transition group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  {lessonTitle}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{reviewMeta}</p>
              </div>
              <ArrowLeft className="h-4 w-4 text-accent shrink-0 group-hover:-translate-x-1 transition-transform" />
            </LessonLink>
          );
        })}
      </div>
    </div>
  );
}
