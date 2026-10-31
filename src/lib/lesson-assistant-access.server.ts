import { resolveVerifiedRequestUser } from "./ssr-request-auth.server";
import { PATHS } from "./curriculum-data";

export type LessonAssistantAccess = {
  state: "allowed" | "denied" | "unavailable" | "unauthenticated";
  reason?: "lesson" | "access" | "quota";
};

/** No identity input, subscription changes, quota reservations or provider calls. */
export async function readLessonAssistantAccess(input: { pathId: string; lessonId: string }): Promise<LessonAssistantAccess> {
  try {
    const user = await resolveVerifiedRequestUser();
    if (!user) return { state: "unauthenticated" };
    const path = PATHS.find((candidate) => candidate.id === input.pathId);
    if (!path?.modules.some((m) => m.lessons.some((l) => l.id === input.lessonId && l.state === "available")))
      return { state: "denied", reason: "lesson" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const content = await supabaseAdmin.rpc("assistant_card_content_access" as never,
      { p_user_id: user.userId, p_card_id: input.pathId } as never);
    if (content.error) return { state: "unavailable" };
    const scope = content.data as unknown as { card_id?: unknown; lessons?: { entitled_lesson_ids?: unknown }; admin_review?: unknown } | null;
    const ids = scope?.lessons?.entitled_lesson_ids;
    if (scope?.card_id !== input.pathId || (scope?.admin_review !== true &&
      (!Array.isArray(ids) || !ids.every((id) => typeof id === "string") || !ids.includes(input.lessonId))))
      return { state: "denied", reason: "lesson" };
    const access = await supabaseAdmin.rpc("evaluate_access" as never,
      { p_user_id: user.userId, p_resource_type: "assistant_runtime", p_resource_id: input.lessonId } as never);
    if (access.error) return { state: "unavailable" };
    const decision = access.data as unknown as { allowed?: unknown; denial_reason_code?: unknown } | null;
    if (decision?.allowed === true) return { state: "allowed" };
    if (decision?.allowed !== false) return { state: "unavailable" };
    if (decision.denial_reason_code === "ASSISTANT_QUOTA_EXCEEDED") return { state: "denied", reason: "quota" };
    return decision.denial_reason_code === "AI_ACCESS_DENIED"
      ? { state: "denied", reason: "access" } : { state: "unavailable" };
  } catch { return { state: "unavailable" }; }
}
