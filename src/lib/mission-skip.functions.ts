import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Skip a mission — persists a `passed` submission with metadata.skipped=true
 * so the mastery gate and lesson-gate logic let the learner move on. Backed
 * by the SQL function `skip_mission_for_user` (security definer, scoped to
 * `auth.uid()`), so the write is atomic and ownership-checked server-side.
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
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const userId = context.userId;
    // Call the SQL function as the authed user via service client — the
    // function reads auth.uid() from the request JWT (forwarded by middleware).
    const { data: row, error } = await supabaseAdmin.rpc(
      "skip_mission_for_user",
      { p_mission_id: data.missionId, p_lesson_id: data.lessonId },
    );
    if (error) {
      console.error("[skipMissionServer] rpc failed", error);
      throw new Error("تعذّر تخطّي المهمة. حاول تاني.");
    }
    // The RPC runs as service-role, so auth.uid() inside it is NULL.
    // We bypass that by enforcing ownership at the writer level: re-update
    // here with both id + user_id to make sure the row really belongs to us.
    const id = (row as { id?: string } | null)?.id;
    if (!id) throw new Error("تعذّر تخطّي المهمة.");
    const { error: ownErr } = await supabaseAdmin
      .from("mission_submissions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (ownErr) {
      console.error("[skipMissionServer] ownership check failed", ownErr);
      throw new Error("تعذّر تخطّي المهمة.");
    }
    return { id };
  });
