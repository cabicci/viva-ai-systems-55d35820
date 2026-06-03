import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const PATH_PROMPTS: Record<string, { system: string; user: (idea: string) => string }> = {
  builder: {
    system:
      "أنت مساعد Builder. ردك بالعربية المصرية البسيطة. لا تكتب مقدمات. أعطِ Mini Prompt جاهز لبناء MVP بسيط للمشروع.",
    user: (idea) =>
      `المشروع: ${idea}\n\nاكتبلي Mini Prompt من ٤-٦ سطور لبناء MVP بسيط (صفحة + form + قاعدة بيانات). اكتب الـ Prompt مباشرة بدون شرح، يبدأ بـ "ابني لي تطبيق بسيط لـ ${idea}...".`,
  },
  creator: {
    system:
      "أنت مساعد Creator. ردك بالعربية المصرية. لا تكتب مقدمات. أعطِ ٣ Hooks جاهزة لفيديو ريلز.",
    user: (idea) =>
      `المشروع: ${idea}\n\nاكتبلي ٣ Hooks (افتتاحيات) لفيديو ريلز قصير عن ${idea}. كل Hook في سطر واحد ومرقم ١. ٢. ٣. مباشرة بدون مقدمة.`,
  },
  automator: {
    system:
      "أنت مساعد Automator. ردك بالعربية المصرية. لا تكتب مقدمات. أعطِ Workflow أوتوماتيكي من ٤ خطوات.",
    user: (idea) =>
      `المشروع: ${idea}\n\nصمملي workflow أتمتة من ٤ خطوات لخدمة العملاء. كل خطوة في سطر بالشكل: "الخطوة X: [التريجر] → [الأكشن]". مباشرة بدون مقدمة.`,
  },
  analyst: {
    system:
      "أنت مساعد Analyst. ردك بالعربية المصرية. لا تكتب مقدمات. حلل البيانات وأعطِ insight.",
    user: (idea) =>
      `المشروع: ${idea}\n\nافترض إن المشروع ده عنده آخر شهر: ١٢٠٠ زيارة و ٤٨ عملية بيع. حللهم في ٣ نقاط مرقمة: ١) معدل التحويل ٢) أهم insight ٣) توصية واحدة. مباشرة بدون مقدمة.`,
  },
  business: {
    system:
      "أنت مساعد Business. ردك بالعربية المصرية. لا تكتب مقدمات. أعطِ Decision Breakdown.",
    user: (idea) =>
      `المشروع: ${idea}\n\nاعملي Decision Breakdown سريع: ٣ أولويات للشهر الأول و ٢ مخاطر لازم أتجنبهم. اكتبهم بالشكل:\nالأولويات:\n١. ...\n٢. ...\n٣. ...\nالمخاطر:\n١. ...\n٢. ...\nمباشرة بدون مقدمة.`,
  },
};

export const runWowPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pathId: string; idea: string }) =>
    z
      .object({
        pathId: z.enum(["business", "creator", "analyst", "automator", "builder"]),
        idea: z.string().min(2).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // C2 fix: gate the AI gateway behind auth + per-user rate limits
    // (hourly + daily) to prevent budget abuse and prompt-injection probing.
    await enforceRateLimit({
      userId: context.userId,
      bucketKey: "ai:wow-path",
      maxCalls: 10,
      windowSeconds: 3600,
    });
    await enforceRateLimit({
      userId: context.userId,
      bucketKey: "ai:wow-path:daily",
      maxCalls: 40,
      windowSeconds: 86400,
    });
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { text: "", error: "AI غير متاح حالياً." };
    }
    const cfg = PATH_PROMPTS[data.pathId];
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: cfg.system },
            { role: "user", content: cfg.user(data.idea) },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        if (res.status === 429) return { text: "", error: "في ضغط على الـ AI، جرب تاني بعد دقيقة." };
        if (res.status === 402) return { text: "", error: "خلصت رصيد الـ AI." };
        return { text: "", error: `حصلت مشكلة (${res.status}).` };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      return { text, error: null as string | null };
    } catch (err) {
      console.error("runWowPath failed", err);
      return { text: "", error: "حصل خطأ في الاتصال بالـ AI." };
    }
  });