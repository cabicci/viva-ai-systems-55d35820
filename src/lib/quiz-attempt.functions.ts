import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QUIZ_ATTEMPT_LOCALES = [
  "ar-EG",
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const;

const InputSchema = z
  .object({
    locale: z.enum(QUIZ_ATTEMPT_LOCALES),
    lessonId: z.string().trim().min(1).max(200),
    questionId: z.string().trim().min(1).max(300),
    selectedIndex: z.number().int().nonnegative(),
  })
  .strict();

export type QuizAttemptResult = {
  attemptId: string;
  isCorrect: boolean;
  bloomLevel: "remember" | "understand" | "apply";
};
async function loadSupabaseAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<QuizAttemptResult> => {
    const { resolveCanonicalQuizQuestion } = await import(
      "./quiz-attempt-source.server"
    );
    const question = await resolveCanonicalQuizQuestion({
      locale: data.locale,
      lessonId: data.lessonId,
      questionId: data.questionId,
    });
    if (data.selectedIndex >= question.optionCount) {
      throw new Error("quiz-attempt: selected index is out of range");
    }

    const isCorrect = data.selectedIndex === question.correctIndex;
    const supabaseAdmin = await loadSupabaseAdmin();
    const { data: inserted, error } = await supabaseAdmin
      .from("lesson_quiz_attempts")
      .insert({
        user_id: context.userId,
        lesson_id: question.lessonId,
        question_id: question.questionId,
        selected_index: data.selectedIndex,
        is_correct: isCorrect,
        bloom_level: question.bloomLevel,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error("quiz-attempt: unable to persist attempt");
    }

    return {
      attemptId: inserted.id,
      isCorrect,
      bloomLevel: question.bloomLevel,
    };
  });
