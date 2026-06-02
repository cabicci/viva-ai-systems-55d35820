import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Spaced Repetition — read-only API for the learner.
 *
 * The schedule itself is maintained server-side by a trigger on
 * `lesson_quiz_attempts` (see migration). This server function just
 * returns the lessons that are due now (or overdue) for the caller.
 */

export type DueReview = {
  lessonId: string;
  nextReviewAt: string;
  intervalDays: number;
  reviews: number;
  lapses: number;
};

export const getDueReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DueReview[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("lesson_review_schedule")
      .select("lesson_id, next_review_at, interval_days, reviews, lapses")
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(20);
    if (error) {
      console.error("[getDueReviews] failed", error);
      return [];
    }
    return (data ?? []).map((r) => ({
      lessonId: r.lesson_id,
      nextReviewAt: r.next_review_at,
      intervalDays: r.interval_days,
      reviews: r.reviews,
      lapses: r.lapses,
    }));
  });