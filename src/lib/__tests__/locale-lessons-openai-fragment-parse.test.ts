import { describe, expect, it, vi } from "vitest";
import type { AdaptationTargetLocale } from "@/lib/locale-lessons/types";
import { ADAPTATION_JSON_MAX_ATTEMPTS } from "../../../scripts/locale-lessons/providers/anthropic-adaptation.ts";
import {
  buildFragmentLocalizationPrompt,
  fetchOpenAiFragmentText,
  localizeTextMapWithOpenAi,
  OpenAiFragmentParseError,
  parseOpenAiFragmentResponse,
} from "../../../scripts/locale-lessons/lib/openai-fragment-adapter.ts";
import { extractLocalizableFields } from "../../../scripts/locale-lessons/lib/extract-localizable-fields.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";

const TEST_API_KEY = "sk-test-openai-key-not-real";

function mockFragmentResponse(
  textMap: ReturnType<typeof extractLocalizableFields>,
  overrides?: Partial<Record<string, string>>,
): string {
  return JSON.stringify({
    lessonId: textMap.lessonId,
    fields: textMap.fields.map((field) => ({
      fieldPath: field.fieldPath,
      localizedText:
        overrides?.[field.fieldPath] ?? `Localized: ${field.sourceText.slice(0, 40)}`,
    })),
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

describe("openai fragment adapter", () => {
  it("buildFragmentLocalizationPrompt includes field map and forbids full lesson JSON", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const prompt = buildFragmentLocalizationPrompt(textMap, "en");

    expect(prompt.system).toContain("FRAGMENT LOCALIZATION MODE");
    expect(prompt.userPrompt).toContain(textMap.lessonId);
    expect(prompt.userPrompt).toContain("fieldPath");
    expect(prompt.userPrompt).toContain("quiz objects");
  });

  it("parseOpenAiFragmentResponse accepts valid mock JSON", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const content = mockFragmentResponse(textMap);

    const localized = parseOpenAiFragmentResponse(content, textMap);

    expect(localized.lessonId).toBe(textMap.lessonId);
    expect(localized.fields).toHaveLength(textMap.fields.length);
    expect(localized.fields.every((field) => field.localizedText?.trim())).toBe(true);
  });

  it("parseOpenAiFragmentResponse rejects missing fieldPath", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const missingPath = textMap.fields[0]!.fieldPath;
    const partialFields = textMap.fields
      .filter((field) => field.fieldPath !== missingPath)
      .map((field) => ({
        fieldPath: field.fieldPath,
        localizedText: "Localized text",
      }));

    expect(() =>
      parseOpenAiFragmentResponse(
        JSON.stringify({ lessonId: textMap.lessonId, fields: partialFields }),
        textMap,
      ),
    ).toThrow(OpenAiFragmentParseError);

    expect(() =>
      parseOpenAiFragmentResponse(
        JSON.stringify({ lessonId: textMap.lessonId, fields: partialFields }),
        textMap,
      ),
    ).toThrow(/missing fieldPath/);
  });

  it("parseOpenAiFragmentResponse rejects extra fieldPath", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const fields = textMap.fields.map((field) => ({
      fieldPath: field.fieldPath,
      localizedText: "Localized text",
    }));
    fields.push({ fieldPath: "extra.unexpected.path", localizedText: "Extra" });

    expect(() =>
      parseOpenAiFragmentResponse(
        JSON.stringify({ lessonId: textMap.lessonId, fields }),
        textMap,
      ),
    ).toThrow(/unexpected extra fieldPath/);
  });

  it("parseOpenAiFragmentResponse rejects empty localizedText", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const emptyPath = textMap.fields[0]!.fieldPath;

    expect(() =>
      parseOpenAiFragmentResponse(
        mockFragmentResponse(textMap, { [emptyPath]: "   " }),
        textMap,
      ),
    ).toThrow(/localizedText must be a non-empty string/);
  });

  it("localizeTextMapWithOpenAi retries after malformed output", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const validJson = mockFragmentResponse(textMap);
    const fetchFn = mockFetchWithResponses(['{"lessonId":', validJson]);

    const localized = await localizeTextMapWithOpenAi(textMap, "en" as AdaptationTargetLocale, {
      apiKey: TEST_API_KEY,
      fetchFn,
    });

    expect(localized.fields).toHaveLength(textMap.fields.length);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("repairs an empty English localizedText by retrying only that field", async () => {
    const source = await loadMsaLessonPackage("analyst-m5-l2-weekly-review-ritual");
    const textMap = extractLocalizableFields(source);
    const emptyPath = "sections[2].subtitle";
    const fetchFn = mockFetchWithResponses([
      mockFragmentResponse(textMap, { [emptyPath]: "   " }),
      JSON.stringify({
        lessonId: textMap.lessonId,
        fields: [{ fieldPath: emptyPath, localizedText: "Review the week before acting." }],
      }),
    ]);

    const localized = await localizeTextMapWithOpenAi(textMap, "en", {
      apiKey: TEST_API_KEY,
      fetchFn,
    });

    expect(localized.fields.find((field) => field.fieldPath === emptyPath)?.localizedText).toBe(
      "Review the week before acting.",
    );
    expect(localized.fields.every((field) => field.localizedText?.trim())).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("localizeTextMapWithOpenAi throws after max parse retries", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const textMap = extractLocalizableFields(source);
    const fetchFn = mockFetchWithResponses([
      '{"lessonId":',
      '{"fields":',
      '{"fields":[]',
    ]);

    await expect(
      localizeTextMapWithOpenAi(textMap, "en", { apiKey: TEST_API_KEY, fetchFn }),
    ).rejects.toThrow(
      `OpenAI fragment JSON parse failed for locale=en lessonId=${textMap.lessonId} attempt=${ADAPTATION_JSON_MAX_ATTEMPTS}/${ADAPTATION_JSON_MAX_ATTEMPTS}:`,
    );

    expect(fetchFn).toHaveBeenCalledTimes(ADAPTATION_JSON_MAX_ATTEMPTS);
  });

  it("fetchOpenAiFragmentText never includes the API key in thrown API errors", async () => {
    const fetchFn = vi.fn(async () =>
      new Response("provider failure", { status: 500 }),
    ) as typeof fetch;

    await expect(
      fetchOpenAiFragmentText({
        apiKey: TEST_API_KEY,
        model: "gpt-4o-mini",
        system: "system",
        userPrompt: "user",
        fetchFn,
      }),
    ).rejects.toThrow(/OpenAI fragment API 500/);

    try {
      await fetchOpenAiFragmentText({
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
