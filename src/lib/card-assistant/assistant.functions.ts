import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { registeredStep, registeredCard } from "./registry";

const locale = z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);
export const cardQuestionSchema = z.object({
  expectedAccountId: z.string().min(1).max(128),
  scope: z.object({ area: z.enum(["kids", "technical"]), cardId: z.string().min(1).max(80),
    stepId: z.string().min(1).max(80), locale, profileId: z.string().uuid().optional() }).strict(),
  query: z.string().trim().min(2).max(1500), requestId: z.string().uuid(),
  history: z.array(z.object({ question: z.string().max(500), answer: z.string().max(1200) }).strict()).max(3).optional(),
}).strict().superRefine((value, ctx) => {
  try { registeredStep(value.scope.area, value.scope.cardId, value.scope.stepId); }
  catch { ctx.addIssue({ code: "custom", message: "CARD_SCOPE_INVALID" }); }
  if ((value.scope.area === "kids") !== !!value.scope.profileId) ctx.addIssue({ code: "custom", message: "CARD_PROFILE_INVALID" });
});
export const askCardAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => cardQuestionSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedAccountId !== context.userId) return { status: 403, error: "CARD_REQUESTER_CHANGED" };
    const { runCardAssistant } = await import("./assistant.server");
    return runCardAssistant(data, context);
  });

// Owner-operated preparation only; learner mounts never trigger indexing.
export const indexCardAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const data = z.object({ area: z.enum(["kids", "technical"]), cardId: z.string().max(80),
      offset: z.number().int().min(0).max(100000), batchSize: z.number().int().min(1).max(2).default(1) }).strict().parse(input);
    registeredCard(data.area, data.cardId);
    return data;
  })
  .handler(async ({ data, context }) => {
    const { indexCardBatch } = await import("./assistant.server");
    return indexCardBatch(data, context);
  });
