import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const question = z.object({
  courseId: z.literal("AC-BUS"),
  lessonId: z.string().regex(/^AC-BUS-M[0-9]{2}-L[0-9]{2}$/),
  locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
  query: z.string().trim().min(2).max(1500),
  requestId: z.string().uuid(),
}).strict();

export const askAcademicAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => question.parse(input))
  .handler(async ({ data, context }) => {
    const { runAcademicAssistant } = await import("./assistant.server");
    return runAcademicAssistant(data, context);
  });

// Owner-operated indexing through Lovable; never exposed in the learner UI.
export const indexAcademicAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ offset: z.number().int().min(0).max(200),
    batchSize: z.number().int().min(1).max(4).default(2) }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { indexAcademicBatch } = await import("./assistant.server");
    return indexAcademicBatch(data, context);
  });
