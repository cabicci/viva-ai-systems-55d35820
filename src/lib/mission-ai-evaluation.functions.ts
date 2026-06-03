import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enforceRateLimit } from "./rate-limit.server";

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

const RubricCriterionSchema = z.object({
  label: z.string().min(1).max(120),
  weight: z.number().min(0).max(100),
  criteria: z.array(z.string().min(1).max(400)).min(1).max(8),
});

const InputSchema = z.object({
  submissionId: z.string().uuid(),
  missionId: z.string().min(1).max(200),
  lessonTitle: z.string().min(1).max(200),
  missionPrompt: z.string().min(1).max(4000),
  submissionText: z.string().min(1).max(8000),
  rubric: z.array(RubricCriterionSchema).min(1).max(6),
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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
      .select("id, user_id, mission_id")
      .eq("id", data.submissionId)
      .eq("user_id", userId)
      .eq("mission_id", data.missionId)
      .maybeSingle();
    if (rowErr) throw new Error("تعذّر التحقق من التسليم.");
    if (!row) {
      throw new Error("التسليم غير موجود.");
    }

    const rubricText = data.rubric
      .map(
        (r, i) =>
          `${i + 1}. ${r.label} (الوزن: ${r.weight}%)\n   - ${r.criteria.join("\n   - ")}`,
      )
      .join("\n\n");

    const systemPrompt = `أنت مدرّب داعم بيقيّم مهام تعليمية للمبتدئين بالعربية المصرية. هدفك تشجّع التجربة وتفتح الباب للدرس اللي بعده، مش تمنع التقدم.

مهمتك:
1. تقيّم تسليم الطالب حسب الـ Rubric (٠-١٠٠ لكل معيار).
2. ابدأ feedback كل معيار بنقطة قوة واحدة (حاجة عملها صح)، بعدين نقطة تحسين واحدة محددة. سطر-سطرين بس.
3. احسب overall score = ∑(score × weight) / 100.
4. passed = overall ≥ ${MISSION_PASS_THRESHOLD}. لو الطالب ملا أغلب نقاط الـ rubric حتى لو ناقص تفصيلة، اعتبره pass. التسليم الفاضي أو اللي مالوش علاقة بالموضوع فقط هو اللي يفشل.
5. summary: ٢-٣ جمل مشجّعة بتلخّص اللي اتعمل صح + اللي يقدر يحسّنه.
6. nextStep: نصيحة عملية واحدة قابلة للتطبيق دلوقتي.
7. socraticQuestion: سؤال واحد بس على أضعف معيار يخلّيه يفكّر. لو الإجابة قوية (٨٠+)، سيب الحقل ده "".

قواعد:
- ردّ JSON فقط، مفيش أي نص خارج JSON.
- عربية مصرية بسيطة، مفيش مصطلحات معقدة.
- متبخلش في الدرجات لو الطالب اجتهد — درجات الـ ٧٠+ مسموحة وطبيعية لتسليم متوسط مكتمل.`;

    const userPrompt = `الدرس: ${data.lessonTitle}

المهمة:
${data.missionPrompt}

الـ Rubric:
${rubricText}

تسليم الطالب:
${data.submissionText}

ردّ بالـ JSON الشكل ده بالظبط:
{
  "overallScore": <رقم ٠-١٠٠>,
  "passed": <true|false>,
  "perCriterion": [
    {"label": "<اسم المعيار من الـ Rubric>", "score": <رقم ٠-١٠٠>, "feedback": "<سطر-سطرين>"}
  ],
  "summary": "<٢-٣ جمل>",
  "nextStep": "<نصيحة عملية واحدة>",
  "socraticQuestion": "<سؤال واحد محدد على أضعف معيار، أو نص فارغ لو الإجابة قوية>"
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
      // Fail-fast: never let a hung gateway block the server slot.
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[evaluateMissionWithAI] gateway error ${res.status}:`, text);
      throw new Error("تعذّر تقييم المهمة حاليًا. حاول مرة أخرى.");
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") {
      console.error("[evaluateMissionWithAI] empty content", json);
      throw new Error("تعذّر قراءة نتيجة التقييم.");
    }

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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // Rate limit: hourly + daily + monthly caps for the escape-hatch reveal.
    await enforceRateLimit({ userId, bucketKey: "ai:reveal-answer", maxCalls: 30, windowSeconds: 3600 });
    await enforceRateLimit({ userId, bucketKey: "ai:reveal-answer:daily", maxCalls: 60, windowSeconds: 86400 });
    await enforceRateLimit({ userId, bucketKey: "ai:reveal-answer:monthly", maxCalls: 300, windowSeconds: 2592000 });

    const { data: row, error: rowErr } = await supabaseAdmin
      .from("mission_submissions")
      .select("id, user_id, mission_id, attempt_count, status")
      .eq("id", data.submissionId)
      .eq("user_id", userId)
      .eq("mission_id", data.missionId)
      .maybeSingle();
    if (rowErr) throw new Error("تعذّر التحقق من التسليم.");
    if (!row) throw new Error("التسليم غير موجود.");

    // C5 fix: server-side guard — escape hatch is only valid AFTER 2 real
    // attempts and only when the submission isn't already passed. Without
    // this a client could call reveal directly on a fresh draft to skip
    // the mission entirely.
    if ((row.attempt_count ?? 0) < 2) {
      throw new Error("لازم تحاول مرتين قبل ما تشوف نموذج الإجابة.");
    }
    if (row.status === "passed") {
      throw new Error("المهمة دي تم اجتيازها بالفعل.");
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

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[revealModelMissionAnswer] gateway error ${res.status}:`, text);
      throw new Error("تعذّر توليد نموذج الإجابة. حاول مرة أخرى.");
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("تعذّر قراءة نموذج الإجابة.");

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

    // Mark the submission as passed (escape hatch — score = threshold).
    const { error: updErr } = await supabaseAdmin
      .from("mission_submissions")
      .update({
        status: "passed",
        score: MISSION_PASS_THRESHOLD,
        feedback: "تم فتح الدرس التالي بعد عرض نموذج الإجابة. ارجع للنموذج وقارنه بمحاولتك.",
        evaluated_at: new Date().toISOString(),
        submission_metadata: {
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