import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QUIZ_ATTEMPT_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;

const InputSchema = z
  .object({
    locale: z.enum(QUIZ_ATTEMPT_LOCALES),
    lessonId: z.string().trim().min(1).max(200),
    questionId: z.string().trim().min(1).max(300),
    selectedIndex: z.number().int().nonnegative(),
    requestId: z.string().uuid().optional(),
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
    const supabaseAdmin = await loadSupabaseAdmin();
    type Stored = {
      id: string;
      user_id: string;
      lesson_id: string;
      question_id: string;
      selected_index: number;
      is_correct: boolean;
      bloom_level: QuizAttemptResult["bloomLevel"];
      locale: string | null;
    };
    const prior = async (): Promise<QuizAttemptResult | null> => {
      if (!data.requestId) return null;
      const result = await supabaseAdmin
        .from("lesson_quiz_attempts")
        .select("id,user_id,lesson_id,question_id,selected_index,is_correct,bloom_level,locale")
        .eq("id", data.requestId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (result.error) throw new Error("quiz-attempt: unable to read receipt");
      const row = result.data as unknown as Stored | null;
      if (!row) return null;
      if (
        row.lesson_id !== data.lessonId ||
        row.question_id !== data.questionId ||
        row.selected_index !== data.selectedIndex ||
        row.locale !== data.locale
      )
        throw new Error("quiz-attempt: request mismatch");
      return { attemptId: row.id, isCorrect: row.is_correct, bloomLevel: row.bloom_level };
    };
    const receipt = await prior();
    if (receipt) return receipt;
    const { resolveCanonicalQuizQuestion } = await import("./quiz-attempt-source.server");
    const question = await resolveCanonicalQuizQuestion({
      locale: data.locale,
      lessonId: data.lessonId,
      questionId: data.questionId,
    });
    if (data.selectedIndex >= question.optionCount) {
      throw new Error("quiz-attempt: selected index is out of range");
    }

    const isCorrect = data.selectedIndex === question.correctIndex;
    const snapshot = JSON.stringify({ locale: data.locale, question });
    let digest: string | undefined;
    if (data.requestId) {
      const { loadQuizSourceSnapshot } = await import("./quiz-attempt-source.server");
      const source = await loadQuizSourceSnapshot(data);
      digest = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(source))),
        ),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      const stored = await supabaseAdmin.rpc(
        "store_learning_content_version" as never,
        {
          p_user: context.userId,
          p_lesson: source.lessonId,
          p_locale: data.locale,
          p_version: digest,
          p_payload: source.source,
        } as never,
      );
      if (stored.error) throw new Error("quiz-attempt: unable to archive source");
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("lesson_quiz_attempts")
      .insert({
        ...(data.requestId
          ? {
              id: data.requestId,
              locale: data.locale,
              content_version: digest,
              source_snapshot: JSON.parse(snapshot),
            }
          : {}),
        user_id: context.userId,
        lesson_id: question.lessonId,
        question_id: question.questionId,
        selected_index: data.selectedIndex,
        is_correct: isCorrect,
        bloom_level: question.bloomLevel,
      } as never)
      .select("id")
      .single();

    if (error || !inserted) {
      if (error?.code === "23505") {
        const recovered = await prior();
        if (recovered) return recovered;
      }
      throw new Error("quiz-attempt: unable to persist attempt");
    }

    return {
      attemptId: inserted.id,
      isCorrect,
      bloomLevel: question.bloomLevel,
    };
  });
