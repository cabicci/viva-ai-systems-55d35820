/**
 * Cloud Sync Adapter
 * ------------------
 * Best-effort, fire-and-forget mirroring of the Builder runtime
 * (lesson status, mission state, build logs) into Supabase.
 *
 * Design rules:
 *  - Preserves existing public APIs of `lesson-progress`,
 *    `mission-runtime`, `build-logs` — they keep working from
 *    localStorage exactly as before.
 *  - Authenticated users get an additional persistent write to
 *    Supabase. Anonymous users are no-ops.
 *  - Never throws. Errors are swallowed (logged to console only)
 *    so a network/RLS failure never breaks the local UX.
 *  - No reads here yet (no behavior change). This is the first
 *    persistence foundation; reads will be wired in a follow-up.
 */

import { supabase } from "@/integrations/supabase/client";

import type { MissionState } from "@/lib/mission-runtime";
import type { BuildLog } from "@/lib/build-logs";
import { captureWarn } from "@/lib/error-capture";

/* ---------------------------------------------------------------- */
/*  auth helper                                                      */
/* ---------------------------------------------------------------- */

/**
 * Cached user id. Avoids a round-trip to `supabase.auth.getSession()` on
 * every fire-and-forget mirror write. Kept in sync via the auth state
 * change listener below.
 */
let cachedUserId: string | null = null;
let cacheInitialized = false;

function initCache() {
  if (cacheInitialized) return;
  if (typeof window === "undefined") return; // SSR guard — mirror learner-events
  cacheInitialized = true;
  // Seed from existing session (async, but writes that happen before
  // it resolves simply skip — same behaviour as a freshly-loaded tab).
  supabase.auth.getSession().then(({ data }) => {
    cachedUserId = data.session?.user?.id ?? null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
  });
}

async function currentUserId(explicit?: string | null): Promise<string | null> {
  if (explicit) return explicit;
  if (typeof window === "undefined") return null;
  initCache();
  if (cachedUserId) return cachedUserId;
  // Cache cold — fall back to a one-time fetch.
  try {
    const { data } = await supabase.auth.getSession();
    cachedUserId = data.session?.user?.id ?? null;
    return cachedUserId;
  } catch {
    return null;
  }
}

function swallow(scope: string, err: unknown) {
  captureWarn(`cloud-sync:${scope}`, err);
}

/* ---------------------------------------------------------------- */
/*  lesson status                                                    */
/* ---------------------------------------------------------------- */

// `syncLessonStatus` removed — `user_lesson_status` is mirrored
// automatically by the DB trigger `sync_lesson_status_mirror` on every
// write to `lesson_progress`. See cleanup history for context.

/* ---------------------------------------------------------------- */
/*  mission state                                                    */
/* ---------------------------------------------------------------- */

export async function syncMissionState(
  missionId: string,
  state: Extract<MissionState, "started" | "completed">,
  userIdHint?: string | null,
): Promise<void> {
  const userId = await currentUserId(userIdHint);
  if (!userId) return;
  try {
    const { error } = await supabase
      .from("user_mission_state")
      .upsert(
        { user_id: userId, mission_id: missionId, state },
        { onConflict: "user_id,mission_id" },
      );
    if (error) throw error;
  } catch (e) {
    swallow("mission-state", e);
  }
}

/* ---------------------------------------------------------------- */
/*  build logs                                                       */
/* ---------------------------------------------------------------- */

export async function syncBuildLog(
  log: BuildLog,
  missionId?: string | null,
  userIdHint?: string | null,
): Promise<void> {
  const userId = await currentUserId(userIdHint);
  if (!userId) return;
  try {
    const { error } = await supabase.from("build_logs").insert({
      user_id: userId,
      type: log.type,
      lesson_id: log.lessonId,
      mission_id: missionId ?? null,
      title: log.title,
      short_description: log.shortDescription,
      metadata: {
        local_id: log.id,
        module_id: log.moduleId,
        local_timestamp: log.timestamp,
      },
    });
    if (error) throw error;
  } catch (e) {
    swallow("build-log", e);
  }
}