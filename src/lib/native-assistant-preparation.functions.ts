import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CARD_REGISTRY } from "@/lib/card-assistant/registry";

export type NativePreparationCard = {
  area: "kids" | "technical" | "academic";
  cardId: string;
  scopes: number;
};

/** Metadata only. Authorization is repeated by every existing indexing handler. */
export const getNativePreparationCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ operatorId: string; cards: NativePreparationCard[] }> => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || role.data !== true) throw new Error("FORBIDDEN");
    const cards: NativePreparationCard[] = [];
    const review = await context.supabase.rpc("card_assistant_review_allowed" as never, {} as never);
    if (review.error) throw new Error("PREPARATION_SERVICE_UNAVAILABLE");
    if (review.data === true) cards.push(...CARD_REGISTRY.map(card => ({
      area: card.area, cardId: card.id, scopes: card.steps.length * 4,
    })));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const courses = await supabaseAdmin.from("academic_courses" as never).select("id");
    if (courses.error || !Array.isArray(courses.data)) throw new Error("PREPARATION_SERVICE_UNAVAILABLE");
    for (const course of courses.data as unknown as { id: string }[]) {
      const allowed = await context.supabase.rpc("academic_review_allowed" as never, { p_course: course.id } as never);
      if (allowed.error) throw new Error("PREPARATION_SERVICE_UNAVAILABLE");
      if (allowed.data !== true) continue;
      const count = await supabaseAdmin.from("academic_lesson_content" as never)
        .select("lesson_id", { count: "exact", head: true }).eq("course_id", course.id);
      if (count.error || !Number.isSafeInteger(count.count) || (count.count ?? 0) < 1)
        throw new Error("PREPARATION_SOURCE_UNAVAILABLE");
      cards.push({ area: "academic", cardId: course.id, scopes: count.count! });
    }
    return { operatorId: context.userId, cards };
  });
