import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { buildAdaptationPrompt } from "../prompts/build-prompt.ts";
import {
  AdaptedLessonJsonParseError,
  formatAdaptationJsonParseFailure,
} from "../lib/parse-adapted-json.ts";
import {
  ADAPTATION_JSON_MAX_ATTEMPTS,
  adaptLessonFromAnthropicResponse,
  buildAdaptationSystemPrompt,
  buildStrictJsonRetryUserPrompt,
} from "./anthropic-adaptation.ts";
import {
  openAiAdaptationModel,
  requireOpenAiApiKey,
  type ContextualAdaptationInput,
  type ContextualAdaptationProvider,
} from "./types.ts";

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export type OpenAiAdaptationProviderOptions = {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
};

export async function fetchOpenAiAdaptationText(input: {
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const fetchImpl = input.fetchFn ?? fetch;
  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 16384,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI adaptation API ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as OpenAiChatResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

export async function adaptLessonWithOpenAiRetries(
  input: ContextualAdaptationInput,
  options: OpenAiAdaptationProviderOptions = {},
): Promise<AdaptedLessonPackage> {
  const { source, targetLocale } = input;
  const apiKey = options.apiKey ?? requireOpenAiApiKey();
  const model = options.model ?? openAiAdaptationModel();
  const fetchFn = options.fetchFn;
  const prompt = buildAdaptationPrompt(targetLocale, source);

  let lastParseError = "unknown parse error";

  for (let attempt = 1; attempt <= ADAPTATION_JSON_MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1
        ? prompt.userPrompt
        : buildStrictJsonRetryUserPrompt(prompt.userPrompt);
    const system = buildAdaptationSystemPrompt(prompt.systemPrompt, attempt);

    const content = await fetchOpenAiAdaptationText({
      apiKey,
      model,
      system,
      userPrompt,
      fetchFn,
    });

    try {
      return await adaptLessonFromAnthropicResponse({
        source,
        targetLocale,
        content,
      });
    } catch (error) {
      if (!(error instanceof AdaptedLessonJsonParseError)) {
        throw error;
      }

      lastParseError = error.parseMessage;
      if (attempt === ADAPTATION_JSON_MAX_ATTEMPTS) {
        throw new Error(
          formatAdaptationJsonParseFailure({
            provider: "OpenAI",
            targetLocale,
            lessonId: source.lessonId,
            attempt,
            maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
            parseError: lastParseError,
          }),
        );
      }
    }
  }

  throw new Error(
    formatAdaptationJsonParseFailure({
      provider: "OpenAI",
      targetLocale,
      lessonId: source.lessonId,
      attempt: ADAPTATION_JSON_MAX_ATTEMPTS,
      maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
      parseError: lastParseError,
    }),
  );
}

export function createOpenAiAdaptationProvider(
  options: OpenAiAdaptationProviderOptions = {},
): ContextualAdaptationProvider {
  const model = options.model ?? openAiAdaptationModel();

  return {
    name: "openai",
    model,
    async adaptLesson(input: ContextualAdaptationInput): Promise<AdaptedLessonPackage> {
      return adaptLessonWithOpenAiRetries(input, options);
    },
  };
}
