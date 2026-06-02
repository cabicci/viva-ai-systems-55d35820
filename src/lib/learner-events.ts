import { supabase } from "@/integrations/supabase/client";

export type LearnerEventType =
  | "lesson_opened"
  | "lesson_completed"
  | "lesson_in_progress"
  | "mission_submitted"
  | "mission_skipped"
  | "quiz_attempted"
  | "quiz_predicted"
  | "path_selected"
  | "difficulty_feedback";

export interface LearnerEventInput {
  type: LearnerEventType;
  pathId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  missionId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget learner event logger.
 * Silent on failure (telemetry must never break the UX).
 * Skips when user is not signed in (RLS would reject anyway).
 */
export async function logLearnerEvent(input: LearnerEventInput): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    await supabase.from("learner_events").insert({
      user_id: userId,
      event_type: input.type,
      path_id: input.pathId ?? null,
      module_id: input.moduleId ?? null,
      lesson_id: input.lessonId ?? null,
      mission_id: input.missionId ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: (input.metadata ?? {}) as any,
    });
  } catch {
    // intentionally silent — telemetry failures must not affect users
  }
}