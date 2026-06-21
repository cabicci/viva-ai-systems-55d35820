import { describe, expect, it, vi } from "vitest";
import type { AdaptationTargetLocale } from "@/lib/locale-lessons/types";
import {
  AdaptedLessonJsonParseError,
  extractAdaptedJsonText,
  formatAdaptationJsonParseFailure,
  parseAdaptedLessonJson,
} from "../../../scripts/locale-lessons/lib/parse-adapted-json.ts";
import {
  ADAPTATION_JSON_MAX_ATTEMPTS,
  adaptLessonWithAnthropicRetries,
  buildStrictJsonRetryUserPrompt,
  fetchAnthropicAdaptationText,
} from "../../../scripts/locale-lessons/providers/anthropic-adaptation.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";

const TEST_API_KEY = "sk-ant-test-key-not-real";

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
        content: [{ type: "text", text }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
}

describe("adapted lesson JSON parsing", () => {
  it("parses raw JSON objects", () => {
    const parsed = parseAdaptedLessonJson('{"locale":"en","lessonId":"intro-m1-l1-what-is-ai"}');
    expect(parsed.lessonId).toBe("intro-m1-l1-what-is-ai");
  });

  it("extracts JSON from ```json fences", () => {
    const raw = "Here is the package:\n```json\n{\"locale\":\"en\",\"lessonId\":\"x\"}\n```";
    expect(extractAdaptedJsonText(raw)).toBe('{"locale":"en","lessonId":"x"}');
    expect(parseAdaptedLessonJson(raw).lessonId).toBe("x");
  });

  it("extracts JSON from first { to last } when prose wraps the object", () => {
    const raw = 'Notes:\n{"locale":"en","lessonId":"x","title":"What Is AI"}\nDone.';
    expect(extractAdaptedJsonText(raw)).toBe(
      '{"locale":"en","lessonId":"x","title":"What Is AI"}',
    );
  });

  it("does not fake-repair incomplete JSON", () => {
    expect(() => parseAdaptedLessonJson('{"locale":"en","lessonId":}')).toThrow(
      AdaptedLessonJsonParseError,
    );
  });

  it("formats final parse failures with locale, lessonId, and attempt", () => {
    const message = formatAdaptationJsonParseFailure({
      targetLocale: "en",
      lessonId: "intro-m1-l1-what-is-ai",
      attempt: 3,
      maxAttempts: 3,
      parseError: "Expected '}'",
    });
    expect(message).toContain("locale=en");
    expect(message).toContain("lessonId=intro-m1-l1-what-is-ai");
    expect(message).toContain("attempt=3/3");
    expect(message).toContain("Expected '}'");
    expect(message).not.toContain(TEST_API_KEY);
    expect(message).not.toMatch(/x-api-key/i);
  });
});

describe("anthropic adaptation JSON retry", () => {
  it("retries with stricter JSON-only instruction after malformed output", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const validJson = minimalAdaptedJson(source, "en");
    const fetchFn = mockFetchWithResponses(['{"locale":"en","lessonId":', validJson]);

    const result = await adaptLessonWithAnthropicRetries(
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
    expect(secondCallBody.messages[0]?.content).toContain("STRICT OUTPUT REMINDER");
    expect(buildStrictJsonRetryUserPrompt("base")).toContain("STRICT OUTPUT REMINDER");
  });

  it("throws a clean final error after max parse retries", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const fetchFn = mockFetchWithResponses([
      '{"locale":"en","lessonId":',
      '{"locale":"en","title":',
      '{"locale":"en","sections":',
    ]);

    await expect(
      adaptLessonWithAnthropicRetries(
        { source, targetLocale: "en" },
        { apiKey: TEST_API_KEY, fetchFn },
      ),
    ).rejects.toThrow(
      `Anthropic adaptation JSON parse failed for locale=en lessonId=${source.lessonId} attempt=${ADAPTATION_JSON_MAX_ATTEMPTS}/${ADAPTATION_JSON_MAX_ATTEMPTS}:`,
    );

    expect(fetchFn).toHaveBeenCalledTimes(ADAPTATION_JSON_MAX_ATTEMPTS);

    try {
      await adaptLessonWithAnthropicRetries(
        { source, targetLocale: "en" },
        { apiKey: TEST_API_KEY, fetchFn: mockFetchWithResponses(['{"locale":']) },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(TEST_API_KEY);
      expect(message).not.toMatch(/sk-ant-api/i);
    }
  });

  it("fetchAnthropicAdaptationText never includes the API key in thrown API errors", async () => {
    const fetchFn = vi.fn(async () =>
      new Response("provider failure", { status: 500 }),
    ) as typeof fetch;

    await expect(
      fetchAnthropicAdaptationText({
        apiKey: TEST_API_KEY,
        model: "claude-sonnet-4-6",
        system: "system",
        userPrompt: "user",
        fetchFn,
      }),
    ).rejects.toThrow(/Anthropic adaptation API 500/);

    try {
      await fetchAnthropicAdaptationText({
        apiKey: TEST_API_KEY,
        model: "claude-sonnet-4-6",
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
