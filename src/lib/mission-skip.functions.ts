import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "./rate-limit.server";

/**
 * Skip a mission — persists an independent draft marker with metadata.skipped=true
 * so lesson navigation can continue without awarding mastery or a grade. Backed
 * by the SQL function `skip_mission_for_user` (security definer, scoped to
 * `auth.uid()`).
 *
 * Without this, `emitMissionPassed` alone only invalidated the client cache;
 * the next refetch would re-lock the mission since no DB row exists.
 */
const Input = z.object({
  missionId: z.string().min(1).max(200),
  lessonId: z.string().min(1).max(200),
});

export const skipMissionServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string; outcome: "skipped" | "already-passed" }> => {
    // Light per-user cap — skipping is cheap but should not be spammable.
    await enforceRateLimit({
      userId: context.userId,
      bucketKey: "mission:skip",
      maxCalls: 30,
      windowSeconds: 3600,
    });
    // Use the user-authed client so the SQL function sees auth.uid() = caller.
    const { data: row, error } = await context.supabase.rpc(
      "skip_mission_for_user",
      { p_mission_id: data.missionId, p_lesson_id: data.lessonId },
    );
    if (error) {
      console.error("[skipMissionServer] rpc failed", error);
      throw new Error("تعذّر تخطّي المهمة. حاول تاني.");
    }
    const result = row as { id?: string; user_id?: string; mission_id?: string; lesson_id?: string;
      status?: string; submission_metadata?: { skipped?: unknown } } | null;
    if (!result?.id || result.user_id !== context.userId || result.mission_id !== data.missionId || result.lesson_id !== data.lessonId) {
      throw new Error("تعذّر تخطّي المهمة.");
    }
    const skipped = result.submission_metadata?.skipped === true;
    if (!skipped && result.status !== "passed") throw new Error("تعذّر تخطّي المهمة.");
    return { id: result.id, outcome: skipped ? "skipped" : "already-passed" };
  });
