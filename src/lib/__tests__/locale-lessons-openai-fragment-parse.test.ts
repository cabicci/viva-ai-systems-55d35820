import { describe, expect, it, vi } from "vitest";
import type { AdaptationTargetLocale } from "@/lib/locale-lessons/types";
import { ADAPTATION_JSON_MAX_ATTEMPTS } from "../../../scripts/locale-lessons/providers/anthropic-adaptation.ts";
import {
  buildFragmentLocalizationPrompt,
  chunkTextMapByFieldCount,
  fetchOpenAiFragmentText,
  localizeTextMapWithOpenAi,
  mergeLocalizedChunkResults,
  OPENAI_FRAGMENT_MAX_FIELDS_PER_CHUNK,
  OpenAiFragmentParseError,
  parseOpenAiFragmentResponse,
} from "../../../scripts/locale-lessons/lib/openai-fragment-adapter.ts";
import type { LocalizedTextMap } from "../../../scripts/locale-lessons/lib/localized-text-map.ts";
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

function countFieldsInFetchRequest(fetchFn: ReturnType<typeof vi.fn>, index: number): number {
  const call = fetchFn.mock.calls[index];
  if (!call) return 0;
  const body = JSON.parse(String(call[1]?.body ?? "{}")) as {
    messages?: Array<{ content?: string }>;
  };
  const userContent = body.messages?.[1]?.content ?? "";
  const payloadText = userContent.match(/## Input field map\n([\s\S]*?)\n\n## Required output shape/)?.[1];
  if (!payloadText) return 0;
  const payload = JSON.parse(payloadText) as { fields?: unknown[] };
  return payload.fields?.length ?? 0;
}

function buildSyntheticTextMap(fieldCount: number): LocalizedTextMap {
  return {
    lessonId: "synthetic-large-lesson",
    sourceLocale: "ar-MSA",
    targetLocale: "en",
    canonicalVersion: "test",
    fields: Array.from({ length: fieldCount }, (_, index) => ({
      fieldPath: `sections[${index}].contentMarkdown`,
      sourceText: `Source text ${index}`,
      fieldType: "section.contentMarkdown",
    })),
  };
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
    const textMap = buildSyntheticTextMap(5);
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
    const textMap = buildSyntheticTextMap(3);
    const emptyPath = textMap.fields[1]!.fieldPath;
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

  it("localizeTextMapWithOpenAi throws after max parse retries for a single chunk", async () => {
    const textMap = buildSyntheticTextMap(5);
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

  it("chunks large maps into bounded OpenAI requests and merges in original order", async () => {
    const textMap = buildSyntheticTextMap(82);
    const chunks = chunkTextMapByFieldCount(textMap, "en");
    expect(chunks).toHaveLength(4);
    expect(chunks.every((chunk) => chunk.fields.length <= OPENAI_FRAGMENT_MAX_FIELDS_PER_CHUNK)).toBe(
      true,
    );

    const fetchFn = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        messages?: Array<{ content?: string }>;
      };
      const userContent = body.messages?.[1]?.content ?? "";
      const payload = JSON.parse(
        userContent.match(/## Input field map\n([\s\S]*?)\n\n## Required output shape/)?.[1] ?? "{}",
      ) as { lessonId: string; fields: Array<{ fieldPath: string }> };
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  lessonId: payload.lessonId,
                  fields: payload.fields.map((field) => ({
                    fieldPath: field.fieldPath,
                    localizedText: `Localized ${field.fieldPath}`,
                  })),
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const localized = await localizeTextMapWithOpenAi(textMap, "en", {
      apiKey: TEST_API_KEY,
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledTimes(4);
    for (let index = 0; index < (fetchFn as ReturnType<typeof vi.fn>).mock.calls.length; index++) {
      expect(countFieldsInFetchRequest(fetchFn as ReturnType<typeof vi.fn>, index)).toBeLessThanOrEqual(
        OPENAI_FRAGMENT_MAX_FIELDS_PER_CHUNK,
      );
    }
    expect(localized.fields).toHaveLength(82);
    expect(localized.fields.map((field) => field.fieldPath)).toEqual(
      textMap.fields.map((field) => field.fieldPath),
    );
    expect(new Set(localized.fields.map((field) => field.fieldPath)).size).toBe(82);
  });

  it("retries only the failing chunk before merging successfully", async () => {
    const textMap = buildSyntheticTextMap(50);
    const chunks = chunkTextMapByFieldCount(textMap, "en");
    expect(chunks).toHaveLength(2);

    let callIndex = 0;
    const fetchFn = vi.fn(async (_url, init) => {
      callIndex += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        messages?: Array<{ content?: string }>;
      };
      const userContent = body.messages?.[1]?.content ?? "";
      const payload = JSON.parse(
        userContent.match(/## Input field map\n([\s\S]*?)\n\n## Required output shape/)?.[1] ?? "{}",
      ) as { lessonId: string; fields: Array<{ fieldPath: string }> };

      if (callIndex === 2) {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"lessonId":"' } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  lessonId: payload.lessonId,
                  fields: payload.fields.map((field) => ({
                    fieldPath: field.fieldPath,
                    localizedText: `Localized ${field.fieldPath}`,
                  })),
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const localized = await localizeTextMapWithOpenAi(textMap, "en", {
      apiKey: TEST_API_KEY,
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(localized.fields).toHaveLength(50);
    expect(localized.fields.map((field) => field.fieldPath)).toEqual(
      textMap.fields.map((field) => field.fieldPath),
    );
  });

  it("rejects duplicate field paths after chunk merge", () => {
    const textMap = buildSyntheticTextMap(30);
    const chunks = chunkTextMapByFieldCount(textMap, "en");
    const duplicated: LocalizedTextMap[] = [
      chunks[0]!,
      {
        ...chunks[1]!,
        fields: chunks[1]!.fields.map((field, index) =>
          index === 0
            ? { ...field, fieldPath: chunks[0]!.fields[0]!.fieldPath }
            : field,
        ),
      },
    ];

    expect(() => mergeLocalizedChunkResults(textMap, "en", duplicated)).toThrow(
      /duplicate fieldPath after chunk merge/,
    );
  });

  it("keeps small maps on a single OpenAI request", async () => {
    const textMap = buildSyntheticTextMap(12);
    expect(textMap.fields.length).toBeLessThanOrEqual(OPENAI_FRAGMENT_MAX_FIELDS_PER_CHUNK);

    const fetchFn = mockFetchWithResponses([mockFragmentResponse(textMap)]);
    await localizeTextMapWithOpenAi(textMap, "en", { apiKey: TEST_API_KEY, fetchFn });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(countFieldsInFetchRequest(fetchFn as ReturnType<typeof vi.fn>, 0)).toBe(textMap.fields.length);
  });
});
