import { describe, expect, it, vi } from "vitest";
import type { AdaptedLessonPackage } from "@/lib/locale-lessons/types";
import {
  buildQualityRetryUserPrompt,
  QUALITY_RETRY_FORBIDDEN_PHRASES,
  QUALITY_RETRY_QUIZ_RULES,
} from "../../../scripts/locale-lessons/lib/adaptation-retry-prompt.ts";
import { AdaptedLessonQualityError } from "../../../scripts/locale-lessons/lib/adaptation-quality-error.ts";
import {
  detectQuizIntegrityWarnings,
  validateAdaptedLessonWarnings,
} from "../../../scripts/locale-lessons/lib/quality-warnings.ts";
import {
  finalizeAdaptedPackage,
  validateAdaptedLessonPackage,
} from "../../../scripts/locale-lessons/lib/validate-adapted-lesson.ts";
import { adaptLessonFromAnthropicResponse } from "../../../scripts/locale-lessons/providers/anthropic-adaptation.ts";
import { adaptLessonWithOpenAiRetries } from "../../../scripts/locale-lessons/providers/openai-adaptation.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";

const TEST_API_KEY = "sk-test-openai-key-not-real";

function mockAdaptedSections(
  source: Awaited<ReturnType<typeof loadMsaLessonPackage>>,
  quizOptions: string[],
  correctIndex: number,
  targetLocale: "en" | "ar-Gulf",
) {
  return source.sections.map((section) => {
    if (section.role !== "Quiz" || !section.quiz) return section;

    return {
      ...section,
      quiz: {
        question:
          targetLocale === "en"
            ? "What is the best first data question to ask?"
            : section.quiz.question ?? "وش أفضل سؤال بيانات تبدأ فيه؟",
        correctIndex,
        options: quizOptions,
        explanation:
          section.quiz.explanation ??
          (targetLocale === "en"
            ? "A specific question beats vague totals."
            : "سؤال محدد أهم من أرقام عامة."),
      },
    };
  });
}

function minimalAdaptedJson(
  source: Awaited<ReturnType<typeof loadMsaLessonPackage>>,
  targetLocale: "en" | "ar-Gulf",
  quizOptions: string[],
  correctIndex: number,
): string {
  return JSON.stringify({
    locale: targetLocale,
    lessonId: source.lessonId,
    canonicalVersion: source.canonicalVersion,
    pathId: source.pathId,
    moduleId: source.moduleId,
    productionRoute: source.productionRoute,
    titleEn: source.titleEn,
    title: targetLocale === "en" ? source.titleEn : "عنوان الدرس",
    summary: "Sample summary",
    estimatedMinutes: source.estimatedMinutes,
    nextLessonId: source.nextLessonId,
    sections: mockAdaptedSections(source, quizOptions, correctIndex, targetLocale),
    generatedAt: "2026-06-20T00:00:00.000Z",
  });
}

function mockFetchWithResponses(responses: string[]): typeof fetch {
  let callCount = 0;
  return vi.fn(async () => {
    const text = responses[callCount] ?? responses[responses.length - 1];
    callCount += 1;
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: text } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
}

describe("locale-lessons quality retry", () => {
  it("flags correctIndex out of range when only two options exist for index 2", async () => {
    const source = await loadMsaLessonPackage(
      "analyst-m1-l1-from-automation-to-insight",
    );
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");

    const invalid: AdaptedLessonPackage = {
      locale: "ar-Gulf",
      lessonId: source.lessonId,
      canonicalVersion: source.canonicalVersion,
      pathId: source.pathId,
      moduleId: source.moduleId,
      productionRoute: source.productionRoute,
      titleEn: source.titleEn,
      title: "من الأتمتة إلى البصيرة",
      summary: "summary",
      estimatedMinutes: source.estimatedMinutes,
      nextLessonId: source.nextLessonId,
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex || !section.quiz) return section;
        return {
          ...section,
          quiz: {
            question: "وش أفضل سؤال بيانات تبدأ فيه؟",
            correctIndex: 2,
            options: ["خيار 1", "خيار 2"],
            explanation: "تفسير",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    };

    const warnings = detectQuizIntegrityWarnings(source, invalid);
    expect(
      warnings.some((warning) => warning.includes("expected exactly 3 quiz options")),
    ).toBe(true);
    expect(
      warnings.some((warning) =>
        warning.includes("correctIndex 2 is out of range") ||
          warning.includes("correct option at index 2 is missing"),
      ),
    ).toBe(true);
  });

  it("builds quality retry feedback with quiz and forbidden phrase rules", () => {
    const prompt = buildQualityRetryUserPrompt({
      baseUserPrompt: "Adapt this lesson.",
      qualityErrors: [
        "analyst-m1-l1-from-automation-to-insight quiz section: correctIndex 2 is out of range for 2 options",
      ],
      attempt: 2,
      maxAttempts: 3,
    });

    expect(prompt).toContain("QUALITY CORRECTION REQUIRED");
    expect(prompt).toContain("Regenerate valid JSON only");
    expect(prompt).toContain("correctIndex 2 is out of range for 2 options");
    expect(prompt).toContain(QUALITY_RETRY_QUIZ_RULES);
    expect(prompt).toContain(QUALITY_RETRY_FORBIDDEN_PHRASES);
    expect(prompt).toContain("localize quiz.options[i] text only");
    expect(prompt).toContain("Egyptian production");
  });

  it("rejects invalid quiz during finalization without silent repair", async () => {
    const source = await loadMsaLessonPackage(
      "analyst-m1-l1-from-automation-to-insight",
    );
    const invalidJson = minimalAdaptedJson(
      source,
      "ar-Gulf",
      ["خيار 1", "خيار 2"],
      2,
    );

    await expect(
      adaptLessonFromAnthropicResponse({
        source,
        targetLocale: "ar-Gulf",
        content: invalidJson,
      }),
    ).rejects.toBeInstanceOf(AdaptedLessonQualityError);
  });

  it("retries OpenAI adaptation with quality feedback and accepts a repaired quiz", async () => {
    const source = await loadMsaLessonPackage(
      "analyst-m1-l1-from-automation-to-insight",
    );
    const invalidJson = minimalAdaptedJson(
      source,
      "ar-Gulf",
      ["خيار ١: خيار خاطئ أول", "خيار ٢: خيار خاطئ ثاني"],
      2,
    );
    const validJson = minimalAdaptedJson(
      source,
      "ar-Gulf",
      [
        "خيار ١: خيار خاطئ أول",
        "خيار ٢: خيار خاطئ ثاني",
        "أين بالضبط يترك الزبائن عملية الشراء؟",
      ],
      2,
    );
    const fetchFn = mockFetchWithResponses([invalidJson, validJson]);

    const result = await adaptLessonWithOpenAiRetries(
      { source, targetLocale: "ar-Gulf" },
      { apiKey: TEST_API_KEY, fetchFn },
    );

    expect(result.lessonId).toBe(source.lessonId);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    const secondCallBody = JSON.parse(
      String((fetchFn.mock.calls[1]?.[1] as RequestInit | undefined)?.body),
    ) as {
      messages: Array<{ content: string }>;
    };
    expect(secondCallBody.messages[1]?.content).toContain("QUALITY CORRECTION REQUIRED");
    expect(secondCallBody.messages[1]?.content).toMatch(
      /expected exactly 3 quiz options|correct option at index 2 is missing|quiz options must not be empty/,
    );

    const warnings = validateAdaptedLessonWarnings(source, result, "ar-Gulf");
    expect(warnings).toEqual([]);
  });

  it("passes a valid repaired analyst-m4 quiz after finalization", async () => {
    const source = await loadMsaLessonPackage("analyst-m4-automated-dashboard");
    const quizIndex = source.sections.findIndex((section) => section.role === "Quiz");

    const broken = {
      ...source,
      locale: "ar-Gulf",
      title: "لوحة أوتوماتيك",
      titleEn: source.titleEn,
      sections: source.sections.map((section, index) => {
        if (index !== quizIndex) return section;
        return {
          ...section,
          bullets: [
            "تؤتمت الرقم اللي تقراه كل أسبوع وتاخذ عليه قرار — بعد ما جمعته يدوي أسبوعين.",
            "تؤتمت الـ ٤ أرقام مرة واحدة قبل ما تجرب يدوي.",
            "تبني ١٠ رسوم إضافية في Looker Studio.",
          ],
          quiz: {
            correctIndex: 0,
            options: [
              "تؤتمت الـ ٤ أرقام مرة واحدة قبل ما تجرب يدوي.",
              "تبني ١٠ رسوم إضافية في Looker Studio.",
            ],
            explanation: "تفسير",
          },
        };
      }),
      adaptedFrom: {
        locale: "ar-MSA",
        lessonId: source.lessonId,
        canonicalVersion: source.canonicalVersion,
        sourcePackagePath: "x",
      },
      generatedAt: "2026-06-20T00:00:00.000Z",
    } as AdaptedLessonPackage;

    const finalized = finalizeAdaptedPackage(
      source,
      broken,
      "ar-Gulf",
      "x",
      "2026-06-20T00:00:00.000Z",
    );

    expect(validateAdaptedLessonPackage(source, finalized, "ar-Gulf")).toEqual([]);
    expect(validateAdaptedLessonWarnings(source, finalized, "ar-Gulf")).toEqual([]);
    expect(finalized.sections.find((section) => section.role === "Quiz")?.quiz?.options).toHaveLength(
      3,
    );
  });
});
