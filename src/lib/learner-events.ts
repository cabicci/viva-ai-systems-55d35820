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
  | "difficulty_feedback"
  | "wow_completed"
  | "wow_skipped";

export const WOW_EXPERIENCE_SEEN_KEY = "wow-experience-seen";

export function isWowExperienceSeen(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(WOW_EXPERIENCE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWowExperienceSeen(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(WOW_EXPERIENCE_SEEN_KEY, "1");
  } catch {
    // intentionally silent
  }
}

export interface LearnerEventInput {
  type: LearnerEventType;
  pathId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  missionId?: string | null;
  metadata?: Record<string, unknown>;
}

/* -------------------------------------------------------------- */
/*  Cached userId — avoids a getSession() round-trip per event.    */
/* -------------------------------------------------------------- */
let cachedUserId: string | null = null;
let cacheInitialized = false;

function initCache() {
  if (cacheInitialized || typeof window === "undefined") return;
  cacheInitialized = true;
  supabase.auth.getSession().then(({ data }) => {
    cachedUserId = data.session?.user?.id ?? null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
  });
}

/**
 * Fire-and-forget learner event logger.
 * Silent on failure (telemetry must never break the UX).
 * Skips when user is not signed in (RLS would reject anyway).
 */
export async function logLearnerEvent(input: LearnerEventInput): Promise<void> {
  try {
    initCache();
    let userId = cachedUserId;
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
      cachedUserId = userId;
    }
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