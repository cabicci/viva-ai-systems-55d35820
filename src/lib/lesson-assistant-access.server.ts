import { questionBalance } from "../../supabase/functions/assistant-runtime/question-metering";
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
    const access = await supabaseAdmin.rpc("assistant_question_balance" as never,
      { p_user_id: user.userId, p_area: "ai", p_course: "ai", p_child_id: null } as never);
    if (access.error) return { state: "unavailable" };
    const balance = questionBalance(access.data);
    if (!balance || typeof balance.access_allowed !== "boolean") return { state: "unavailable" };
    if (!balance.access_allowed) return { state: "denied", reason: "access" };
    return (scope?.admin_review === true && balance.admin_review === true) || balance.monthly_remaining + balance.purchased_remaining > 0
      ? { state: "allowed" } : { state: "denied", reason: "quota" };
  } catch { return { state: "unavailable" }; }
}
