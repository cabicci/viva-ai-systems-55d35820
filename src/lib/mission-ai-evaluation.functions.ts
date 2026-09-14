import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "./rate-limit.server";
import { callAI } from "./ai-providers.server";
import {
  buildMissionEvaluationPrompts,
  MISSION_AI_LOCALES,
} from "./mission-ai-prompts";

// Load supabaseAdmin dynamically inside handlers so its top-level import
// never reaches the client bundle.
async function loadSupabaseAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

/**
 * AI-powered mission evaluation.
 *
 * Server function calls Lovable AI Gateway with the rubric + learner
 * submission, then PERSISTS the structured grade directly into
 * `mission_submissions` using the service-role client (the table's BEFORE
 * UPDATE trigger blocks authenticated users from writing score / feedback /
 * status='passed|needs_revision'). The full grade is also returned to the
 * UI so it can render feedback without an extra round-trip.
 */

const InputSchema = z.object({
  submissionId: z.string().uuid(),
  missionId: z.string().min(1).max(200),
  locale: z.enum(MISSION_AI_LOCALES),
});

export type AIEvaluationResult = {
  overallScore: number; // 0-100
  passed: boolean;
  perCriterion: Array<{
    label: string;
    score: number; // 0-100
    feedback: string;
  }>;
  summary: string;
  nextStep: string;
  /**
   * One targeted Socratic question on the weakest criterion — gives the
   * learner direction to self-improve without breaking the loop. Omitted
   * (empty string) when the submission is strong (score >= 85).
   */
  socraticQuestion: string;
};

/** Single source of truth for the pass threshold. */
export const MISSION_PASS_THRESHOLD = 50;

export const evaluateMissionWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<AIEvaluationResult> => {
    const userId = context.userId;
    const supabaseAdmin = await loadSupabaseAdmin();

    const releaseSubmittedRow = async () => {
      // submit_mission_for_evaluation leaves status=submitted; on eval failure
      // flip back so the same row can be retried (RPC only accepts draft/needs_revision/failed).
      await supabaseAdmin
        .from("mission_submissions")
        .update({ status: "needs_revision" })
        .eq("id", data.submissionId)
        .eq("user_id", userId)
        .eq("status", "submitted");
    };

    try {
    // Rate limit: hourly + daily + monthly cost caps per user.
    // Hourly: burst protection. Daily/monthly: cost cap.
    await enforceRateLimit({ userId, bucketKey: "ai:evaluate-mission", maxCalls: 10, windowSeconds: 3600 });
    await enforceRateLimit({ userId, bucketKey: "ai:evaluate-mission:daily", maxCalls: 40, windowSeconds: 86400 });
    await enforceRateLimit({ userId, bucketKey: "ai:evaluate-mission:monthly", maxCalls: 500, windowSeconds: 2592000 });

    // Verify the submission belongs to the caller AND matches the claimed
    // missionId. Without the mission_id check an authed user could pair
    // their own submissionId with an attacker-controlled prompt (prompt-
    // injection vector into the AI evaluator).
    const { data: row, error: rowErr } = await supabaseAdmin
      .from("mission_submissions")
      .select("id, user_id, mission_id, lesson_id, submission_text")
      .eq("id", data.submissionId)
      .eq("user_id", userId)
      .eq("mission_id", data.missionId)
      .maybeSingle();
    if (rowErr) throw new Error("تعذّر التحقق من التسليم.");
    if (!row) {
      throw new Error("التسليم غير موجود.");
    }

    const lessonId = z.string().min(1).max(200).parse(row.lesson_id);
    const submissionText = z.string().min(1).max(8000).parse(row.submission_text);
    const { resolveCanonicalMissionEvaluationSource } = await import(
      "./mission-evaluation-source.server"
    );
    const source = await resolveCanonicalMissionEvaluationSource({
      locale: data.locale,
      lessonId,
      missionId: data.missionId,
    });

    const { systemPrompt, userPrompt } = buildMissionEvaluationPrompts({
      locale: data.locale,
      passThreshold: MISSION_PASS_THRESHOLD,
      lessonTitle: source.lessonTitle,
      missionPrompt: source.missionPrompt,
      rubric: source.rubric,
      submissionText,
    });

    const { content: raw } = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      responseFormat: { type: "json_object" },
      timeoutMs: 30_000,
    });

    let parsed: AIEvaluationResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[evaluateMissionWithAI] non-JSON content", raw);
      throw new Error("تعذّر قراءة نتيجة التقييم.");
    }

    // Sanitize / defensive defaults
    const result: AIEvaluationResult = {
      overallScore: clamp(Number(parsed.overallScore ?? 0), 0, 100),
      // Server is source of truth for the pass threshold — ignore the model's flag.
      passed: clamp(Number(parsed.overallScore ?? 0), 0, 100) >= MISSION_PASS_THRESHOLD,
      perCriterion: Array.isArray(parsed.perCriterion)
        ? parsed.perCriterion.slice(0, 6).map((c) => ({
            label: String(c?.label ?? ""),
            score: clamp(Number(c?.score ?? 0), 0, 100),
            feedback: String(c?.feedback ?? ""),
          }))
        : [],
      summary: String(parsed.summary ?? ""),
      nextStep: String(parsed.nextStep ?? ""),
      socraticQuestion: String((parsed as { socraticQuestion?: unknown }).socraticQuestion ?? "").slice(0, 400),
    };

    // Persist authoritative result with service-role (bypasses the
    // user-protection trigger that blocks writes to score/feedback/status).
    const { error: updErr } = await supabaseAdmin
      .from("mission_submissions")
      .update({
        status: result.passed ? "passed" : "needs_revision",
        score: result.overallScore,
        feedback: result.summary,
        evaluated_at: new Date().toISOString(),
        submission_metadata: {
          perCriterion: result.perCriterion,
          nextStep: result.nextStep,
          socraticQuestion: result.socraticQuestion,
        },
      })
      .eq("id", data.submissionId)
      .eq("user_id", userId);
    if (updErr) {
      console.error("[evaluateMissionWithAI] persist failed", updErr);
      throw new Error("تم التقييم لكن تعذّر حفظ النتيجة.");
    }

    return result;
    } catch (err) {
      await releaseSubmittedRow();
      throw err;
    }
  });

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// =============================================================
// Reveal model answer (escape hatch after 2 failed attempts)
// =============================================================

const RevealInputSchema = z.object({
  submissionId: z.string().uuid(),
  missionId: z.string().min(1).max(200),
  lessonTitle: z.string().min(1).max(200),
  missionPrompt: z.string().min(1).max(4000),
});

export type RevealAnswerResult = {
  modelAnswer: string;
  note: string;
};

export const revealModelMissionAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RevealInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<RevealAnswerResult> => {
    const userId = context.userId;
    const supabaseAdmin = await loadSupabaseAdmin();



    // Rate limit: hourly + daily + monthly caps for the escape-hatch reveal.
    await enforceRateLimit({ userId, bucketKey: "ai:reveal-answer", maxCalls: 30, windowSeconds: 3600 });
    await enforceRateLimit({ userId, bucketKey: "ai:reveal-answer:daily", maxCalls: 60, windowSeconds: 86400 });
    await enforceRateLimit({ userId, bucketKey: "ai:reveal-answer:monthly", maxCalls: 300, windowSeconds: 2592000 });

    const { data: row, error: rowErr } = await supabaseAdmin
      .from("mission_submissions")
      .select("id, user_id, mission_id, attempt_count, status, submission_metadata")
      .eq("id", data.submissionId)
      .eq("user_id", userId)
      .eq("mission_id", data.missionId)
      .maybeSingle();
    if (rowErr) throw new Error("تعذّر التحقق من التسليم.");
    if (!row) throw new Error("التسليم غير موجود.");

    const existingMeta =
      (row.submission_metadata as Record<string, unknown> | null) ?? {};

    // Legacy rows: passed + revealed still count as done — do not re-reveal.
    if (row.status === "passed") {
      throw new Error("المهمة دي تم اجتيازها بالفعل.");
    }
    if (row.status === "evaluating") {
      throw new Error("التسليم لسه بيتقيّم — استنّى ثواني وحاول تاني.");
    }

    // Idempotent: return stored model answer without re-unlocking or re-scoring.
    if (
      existingMeta.revealed === true &&
      typeof existingMeta.modelAnswer === "string"
    ) {
      return {
        modelAnswer: String(existingMeta.modelAnswer).slice(0, 4000),
        note: String(
          existingMeta.note ?? "ده نموذج للتعلّم — قارنه بمحاولتك.",
        ),
      };
    }

    // Server-side guard — escape hatch only after 2 real submit attempts.
    if ((row.attempt_count ?? 0) < 2) {
      throw new Error("لازم تحاول مرتين قبل ما تشوف نموذج الإجابة.");
    }

    const systemPrompt = `أنت مدرّس AI بالعربية المصرية البسيطة. الطالب اتعب وحاول مرتين على المهمة دي. هتديله نموذج إجابة كامل ومفيد عشان يفهم الشكل المطلوب — مش عشان يغش، عشان يتعلم. اكتب إجابة قصيرة، عملية، تتبع الـ structure المطلوب في المهمة بالظبط.

قواعد:
- ردّ JSON فقط.
- اللغة عربية مصرية بسيطة.
- مفيش مقدمات زي «طبعا» أو «بكل سرور» — ادخل في الإجابة على طول.`;

    const userPrompt = `الدرس: ${data.lessonTitle}

المهمة:
${data.missionPrompt}

ردّ بالـ JSON ده:
{
  "modelAnswer": "<نموذج إجابة كامل يتبع الـ structure المطلوب>",
  "note": "<جملة قصيرة بتفكّر الطالب إن ده نموذج للتعلّم، اقرأه وقارنه بمحاولتك>"
}`;

    const { content: raw } = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      responseFormat: { type: "json_object" },
      timeoutMs: 30_000,
    });

    let parsed: RevealAnswerResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("تعذّر قراءة نموذج الإجابة.");
    }

    const result: RevealAnswerResult = {
      modelAnswer: String(parsed.modelAnswer ?? "").slice(0, 4000),
      note: String(parsed.note ?? "ده نموذج للتعلّم — قارنه بمحاولتك."),
    };

    // Persist model answer only — do not pass/unlock; learner must resubmit.
    const { error: updErr } = await supabaseAdmin
      .from("mission_submissions")
      .update({
        submission_metadata: {
          ...existingMeta,
          revealed: true,
          modelAnswer: result.modelAnswer,
          note: result.note,
        },
      })
      .eq("id", data.submissionId)
      .eq("user_id", userId);
    if (updErr) {
      console.error("[revealModelMissionAnswer] persist failed", updErr);
      throw new Error("تم توليد النموذج لكن تعذّر حفظ النتيجة.");
    }

    return result;
  });