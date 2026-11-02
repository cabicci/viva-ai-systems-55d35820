import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const createLearningReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        requestId: z.string().uuid(),
        sourceKey: z.string().min(1).max(240),
        subjectId: z.string().uuid(),
        locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { runLearningReport } = await import("./reports.server");
    const { callAI } = await import("@/lib/ai-providers.server");
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return runLearningReport(data.locale, {
      reserve: async () => {
        const result = await context.supabase.rpc(
          "learning_reports" as never,
          { p_action: "reserve", p_data: data } as never,
        );
        if (result.error) throw new Error(result.error.message);
        return result.data as never;
      },
      generate: async (system, user) => {
        // Bound failed provider attempts independently of the two successful
        // monthly reports. Replaying a ready report never reaches this branch.
        await enforceRateLimit({
          userId: context.userId,
          bucketKey: "learning-report:generate",
          maxCalls: 6,
          windowSeconds: 3600,
        });
        return (
          await callAI({
            model: "openai/gpt-4.1-mini-2025-04-14",
            temperature: 0.2,
            maxTokens: 1800,
            timeoutMs: 60000,
            responseFormat: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          })
        ).content;
      },
      finish: async (token, report) => {
        const result = await supabaseAdmin.rpc(
          "finish_learning_report" as never,
          {
            p_user: context.userId,
            p_request: data.requestId,
            p_token: token,
            p_report: report,
          } as never,
        );
        if (result.error) throw new Error("LEARNING_REPORT_CONFIRMATION_UNAVAILABLE");
        return result.data === true;
      },
    });
  });
