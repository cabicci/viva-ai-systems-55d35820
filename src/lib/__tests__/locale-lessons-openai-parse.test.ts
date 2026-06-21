import { describe, expect, it, vi } from "vitest";
import type { AdaptationTargetLocale } from "@/lib/locale-lessons/types";
import { ADAPTATION_JSON_MAX_ATTEMPTS } from "../../../scripts/locale-lessons/providers/anthropic-adaptation.ts";
import {
  adaptLessonWithOpenAiRetries,
  fetchOpenAiAdaptationText,
} from "../../../scripts/locale-lessons/providers/openai-adaptation.ts";
import { requireOpenAiApiKey } from "../../../scripts/locale-lessons/providers/types.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";

const TEST_API_KEY = "sk-test-openai-key-not-real";

function mockAdaptedSections(
  source: Awaited<ReturnType<typeof loadMsaLessonPackage>>,
  targetLocale: AdaptationTargetLocale,
) {
  return source.sections.map((section) => {
    if (section.role !== "Quiz" || !section.quiz) return section;

    const question =
      targetLocale === "en"
        ? "What is the best way to start understanding AI today?"
        : section.quiz.question ?? "وش أفضل طريقة تبدأ تفهم الـ AI اليوم؟";

    return {
      ...section,
      quiz: {
        question,
        correctIndex: section.quiz.correctIndex ?? 0,
        options: [
          "Read a long textbook chapter before trying anything.",
          "Open ChatGPT or Gemini and ask for something simple from your day.",
          "Memorize every AI model name first.",
        ],
        explanation:
          section.quiz.explanation ??
          "One small experiment teaches more than a long read.",
      },
    };
  });
}

function minimalAdaptedJson(
  source: Awaited<ReturnType<typeof loadMsaLessonPackage>>,
  targetLocale: AdaptationTargetLocale,
): string {
  return JSON.stringify({
    locale: targetLocale,
    lessonId: source.lessonId,
    canonicalVersion: source.canonicalVersion,
    pathId: source.pathId,
    moduleId: source.moduleId,
    productionRoute: source.productionRoute,
    titleEn: source.titleEn,
    title: targetLocale === "en" ? "What Is AI" : "وش هو الـ AI؟",
    summary: "Sample summary",
    estimatedMinutes: source.estimatedMinutes,
    nextLessonId: source.nextLessonId,
    sections: mockAdaptedSections(source, targetLocale),
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

describe("openai adaptation provider", () => {
  it("requires OPENAI_API_KEY with a clear error when missing", () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => requireOpenAiApiKey()).toThrow(/Missing OPENAI_API_KEY/);
    expect(() => requireOpenAiApiKey()).toThrow(/new_openai/);
    if (original) process.env.OPENAI_API_KEY = original;
  });

  it("retries with stricter JSON-only instruction after malformed output", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const validJson = minimalAdaptedJson(source, "en");
    const fetchFn = mockFetchWithResponses(['{"locale":"en","lessonId":', validJson]);

    const result = await adaptLessonWithOpenAiRetries(
      { source, targetLocale: "en" },
      { apiKey: TEST_API_KEY, fetchFn },
    );

    expect(result.lessonId).toBe(source.lessonId);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    const secondCallBody = JSON.parse(
      String((fetchFn.mock.calls[1]?.[1] as RequestInit | undefined)?.body),
    ) as {
      messages: Array<{ content: string }>;
    };
    expect(secondCallBody.messages[1]?.content).toContain("STRICT OUTPUT REMINDER");
  });

  it("throws a clean final error after max parse retries", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const fetchFn = mockFetchWithResponses([
      '{"locale":"en","lessonId":',
      '{"locale":"en","title":',
      '{"locale":"en","sections":',
    ]);

    await expect(
      adaptLessonWithOpenAiRetries(
        { source, targetLocale: "en" },
        { apiKey: TEST_API_KEY, fetchFn },
      ),
    ).rejects.toThrow(
      `OpenAI adaptation JSON parse failed for locale=en lessonId=${source.lessonId} attempt=${ADAPTATION_JSON_MAX_ATTEMPTS}/${ADAPTATION_JSON_MAX_ATTEMPTS}:`,
    );

    expect(fetchFn).toHaveBeenCalledTimes(ADAPTATION_JSON_MAX_ATTEMPTS);
  });

  it("fetchOpenAiAdaptationText never includes the API key in thrown API errors", async () => {
    const fetchFn = vi.fn(async () =>
      new Response("provider failure", { status: 500 }),
    ) as typeof fetch;

    await expect(
      fetchOpenAiAdaptationText({
        apiKey: TEST_API_KEY,
        model: "gpt-4o-mini",
        system: "system",
        userPrompt: "user",
        fetchFn,
      }),
    ).rejects.toThrow(/OpenAI adaptation API 500/);

    try {
      await fetchOpenAiAdaptationText({
        apiKey: TEST_API_KEY,
        model: "gpt-4o-mini",
        system: "system",
        userPrompt: "user",
        fetchFn,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(TEST_API_KEY);
    }
  });
});
