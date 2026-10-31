import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const question = z.object({
  expectedAccountId: z.string().min(1).max(128),
  courseId: z.string().regex(/^AC-[A-Z0-9]+$/),
  lessonId: z.string().regex(/^AC-[A-Z0-9]+-M[0-9]{2}-L[0-9]{2}$/),
  locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
  query: z.string().trim().min(2).max(1500),
  requestId: z.string().uuid(),
  history: z.array(z.object({ question: z.string().trim().min(1).max(500),
    answer: z.string().max(1200) }).strict()).max(3).optional(),
}).strict().refine((data) => data.lessonId.startsWith(`${data.courseId}-`), {
  message: "ACADEMIC_INVALID_LESSON", path: ["lessonId"],
});

export const askAcademicAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => question.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedAccountId !== context.userId) return { status: 403, error: "ACADEMIC_REQUESTER_CHANGED" };
    const { runAcademicAssistant } = await import("./assistant.server");
    return runAcademicAssistant(data, context);
  });

// Owner-operated indexing through Lovable; never exposed in the learner UI.
export const indexAcademicAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ courseId: z.string().regex(/^AC-[A-Z0-9]+$/),
    offset: z.number().int().min(0).max(100000),
    batchSize: z.number().int().min(1).max(4).default(2) }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { indexAcademicBatch } = await import("./assistant.server");
    return indexAcademicBatch(data, context);
  });
