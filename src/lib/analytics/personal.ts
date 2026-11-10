import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Personal projections stay user-scoped even when RLS permits admin aggregates. */
export async function loadPersonalAnalytics(
  client: Pick<SupabaseClient<Database>, "from">,
  userId: string,
  since: string,
) {
  if (!userId) throw new Error("PERSONAL_ANALYTICS_ACCOUNT_REQUIRED");
  const results = await Promise.all([
    client
      .from("learner_events")
      .select("event_type, path_id, created_at")
      .eq("user_id", userId)
      .gte("created_at", since),
    client.from("user_lesson_status").select("status, lesson_id").eq("user_id", userId),
    client
      .from("mission_submissions")
      .select("status, mission_id, score, skipped:submission_metadata->skipped")
      .eq("user_id", userId),
    client
      .from("lesson_quiz_attempts")
      .select("is_correct, bloom_level, attempted_at")
      .eq("user_id", userId)
      .gte("attempted_at", since),
    client
      .from("user_streaks")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", userId)
      .maybeSingle(),
    client.from("user_activity_time").select("total_seconds").eq("user_id", userId).maybeSingle(),
  ]);
  if (results.some((result) => result.error)) throw new Error("PERSONAL_ANALYTICS_UNAVAILABLE");
  const [events, lessonStatus, missions, quizzes, streak, time] = results;
  return {
    events: events.data ?? [],
    lessonStatus: lessonStatus.data ?? [],
    missions: (missions.data ?? []).map((row) => ({
      status: row.skipped === true ? "skipped" : row.status,
      mission_id: row.mission_id,
      score: row.skipped === true ? null : row.score,
    })),
    quizzes: quizzes.data ?? [],
    streak: streak.data,
    time: time.data,
  };
}
