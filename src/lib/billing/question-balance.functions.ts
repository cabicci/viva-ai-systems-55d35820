import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { questionBalance } from "../../../supabase/functions/assistant-runtime/question-metering";

export const getAssistantQuestionBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value: unknown) => z.object({
    expectedAccountId: z.string().min(1).max(128),
    area: z.enum(["ai", "academic", "technical", "kids"]),
    course: z.string().min(1).max(80),
    childId: z.string().uuid().nullable(),
  }).strict().refine(row => (row.area === "kids") === (row.childId !== null)).parse(value))
  .handler(async ({ data, context }) => {
    if (context.userId !== data.expectedAccountId) throw new Error("ASSISTANT_REQUESTER_CHANGED");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("assistant_question_balance" as never, {
      p_user_id: context.userId, p_area: data.area, p_course: data.course, p_child_id: data.childId,
    } as never);
    const balance = result.error ? null : questionBalance(result.data);
    if (!balance || typeof balance.access_allowed !== "boolean") throw new Error("ASSISTANT_BALANCE_UNAVAILABLE");
    // A verified sign-in identity, not an access token. Stable across token refreshes.
    const sessionId = context.claims.session_id;
    const sessionKey = typeof sessionId === "string" && sessionId.length > 0 && sessionId.length <= 128
      ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${context.userId}:${sessionId}`))),
        byte => byte.toString(16).padStart(2, "0")).join("") : null;
    return { ...balance, session_key: sessionKey };
  });
