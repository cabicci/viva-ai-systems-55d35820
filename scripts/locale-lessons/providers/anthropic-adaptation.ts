import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { AdaptedLessonQualityError } from "../lib/adaptation-quality-error.ts";
import { buildAdaptationPrompt } from "../prompts/build-prompt.ts";
import {
  AdaptedLessonJsonParseError,
  formatAdaptationJsonParseFailure,
  parseAdaptedLessonJson,
} from "../lib/parse-adapted-json.ts";
import {
  finalizeAdaptedPackage,
  validateAdaptedLessonPackage,
  validateAdaptedLessonWarnings,
} from "../lib/validate-adapted-lesson.ts";
import {
  adaptationModel,
  requireAnthropicApiKey,
  type ContextualAdaptationInput,
  type ContextualAdaptationProvider,
} from "./types.ts";

export const ADAPTATION_JSON_MAX_ATTEMPTS = 3;

export { STRICT_JSON_RETRY_INSTRUCTION } from "../lib/adaptation-retry-prompt.ts";

const OUTPUT_SCHEMA = `Return ONE JSON object only (no markdown fences) matching AdaptedLessonPackage:
{
  "locale": "ar-Gulf" | "en",
  "lessonId": "<unchanged>",
  "canonicalVersion": "<unchanged>",
  "pathId": "<unchanged>",
  "moduleId": "<unchanged>",
  "productionRoute": "<unchanged>",
  "titleEn": "<unchanged from source when present>",
  "title": "<catalog topic title from titleEn/lesson topic — NOT Orientation heading>",
  "summary": "<adapted one-line summary>",
  "estimatedMinutes": <number>,
  "nextLessonId": "<unchanged>",
  "sections": [
    {
      "role": "<unchanged role>",
      "heading": "<adapted heading>",
      "subtitle": "<adapted subtitle if present>",
      "contentMarkdown": "<adapted body>",
      "bullets": ["<adapted bullets>"],
      "tables": [{ "headers": [], "rows": [] }],
      "quiz": { "question": "", "correctIndex": <unchanged>, "options": [], "explanation": "" },
      "mission": { "intro": "", "delivery": [], "rubric": [{ "dimension": "", "weight": <unchanged>, "criteria": "" }] }
    }
  ],
  "generatedAt": "<ISO timestamp>"
}`;

type AnthropicMessagesResponse = {
  content?: Array<{ type: string; text?: string }>;
};

export type AnthropicAdaptationProviderOptions = {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
};

import {
  buildQualityRetryUserPrompt,
  buildStrictJsonRetryUserPrompt,
  STRICT_JSON_RETRY_INSTRUCTION,
} from "../lib/adaptation-retry-prompt.ts";

export function buildAdaptationSystemPrompt(
  systemPrompt: string,
  attempt: number,
): string {
  const base = `${systemPrompt}\n\n${OUTPUT_SCHEMA}`;
  if (attempt <= 1) return base;
  return `${base}\n\n${STRICT_JSON_RETRY_INSTRUCTION}`;
}

export async function fetchAnthropicAdaptationText(input: {
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  fetchFn?: typeof fetch;
}): Promise<string> {
  const fetchImpl = input.fetchFn ?? fetch;
  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 16384,
      temperature: 0.2,
      system: input.system,
      messages: [{ role: "user", content: input.userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Anthropic adaptation API ${res.status}: ${err.slice(0, 400)}`,
    );
  }

  const data = (await res.json()) as AnthropicMessagesResponse;
  return data.content?.find((block) => block.type === "text")?.text ?? "";
}

export async function adaptLessonFromAnthropicResponse(input: {
  source: LocalizedLessonPackage;
  targetLocale: AdaptationTargetLocale;
  content: string;
  generatedAt?: string;
}): Promise<AdaptedLessonPackage> {
  const { source, targetLocale, content } = input;
  const sourcePackagePath = `src/lib/locale-lessons/ar-MSA/lessons/${source.lessonId}.json`;
  const parsed = parseAdaptedLessonJson(content);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const finalized = finalizeAdaptedPackage(
    source,
    parsed,
    targetLocale,
    sourcePackagePath,
    generatedAt,
  );

  const validationErrors = validateAdaptedLessonPackage(
    source,
    finalized,
    targetLocale,
  );
  if (validationErrors.length > 0) {
    throw new AdaptedLessonQualityError({
      lessonId: source.lessonId,
      targetLocale,
      issues: validationErrors,
      kind: "validation",
    });
  }

  const qualityWarnings = validateAdaptedLessonWarnings(
    source,
    finalized,
    targetLocale,
  );
  if (qualityWarnings.length > 0) {
    throw new AdaptedLessonQualityError({
      lessonId: source.lessonId,
      targetLocale,
      issues: qualityWarnings,
      kind: "quality",
    });
  }

  return finalized;
}

export async function adaptLessonWithAnthropicRetries(
  input: ContextualAdaptationInput,
  options: AnthropicAdaptationProviderOptions = {},
): Promise<AdaptedLessonPackage> {
  const { source, targetLocale } = input;
  const apiKey = options.apiKey ?? requireAnthropicApiKey();
  const model = options.model ?? adaptationModel();
  const fetchFn = options.fetchFn;
  const prompt = buildAdaptationPrompt(targetLocale, source);

  let lastParseError: string | null = null;
  let lastQualityErrors: string[] = [];

  for (let attempt = 1; attempt <= ADAPTATION_JSON_MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1
        ? prompt.userPrompt
        : lastQualityErrors.length > 0
          ? buildQualityRetryUserPrompt({
              baseUserPrompt: prompt.userPrompt,
              qualityErrors: lastQualityErrors,
              attempt,
              maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
              parseError: lastParseError,
            })
          : buildStrictJsonRetryUserPrompt(prompt.userPrompt);
    const system = buildAdaptationSystemPrompt(prompt.systemPrompt, attempt);

    const content = await fetchAnthropicAdaptationText({
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
      if (error instanceof AdaptedLessonJsonParseError) {
        lastParseError = error.parseMessage;
        lastQualityErrors = [];
      } else if (error instanceof AdaptedLessonQualityError) {
        lastQualityErrors = error.issues;
        lastParseError = null;
      } else {
        throw error;
      }

      if (attempt === ADAPTATION_JSON_MAX_ATTEMPTS) {
        if (lastQualityErrors.length > 0) {
          throw new AdaptedLessonQualityError({
            lessonId: source.lessonId,
            targetLocale,
            issues: lastQualityErrors,
            kind: "quality",
          });
        }

        throw new Error(
          formatAdaptationJsonParseFailure({
            targetLocale,
            lessonId: source.lessonId,
            attempt,
            maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
            parseError: lastParseError ?? "unknown parse error",
          }),
        );
      }

      console.warn(
        `Adaptation retry ${attempt}/${ADAPTATION_JSON_MAX_ATTEMPTS} for ${source.lessonId} (${targetLocale})`,
      );
    }
  }

  throw new Error(
    formatAdaptationJsonParseFailure({
      targetLocale,
      lessonId: source.lessonId,
      attempt: ADAPTATION_JSON_MAX_ATTEMPTS,
      maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
      parseError: lastParseError ?? "unknown parse error",
    }),
  );
}

export function createAnthropicAdaptationProvider(
  options: AnthropicAdaptationProviderOptions = {},
): ContextualAdaptationProvider {
  const model = options.model ?? adaptationModel();

  return {
    name: "anthropic",
    model,
    async adaptLesson(input: ContextualAdaptationInput): Promise<AdaptedLessonPackage> {
      return adaptLessonWithAnthropicRetries(input, options);
    },
  };
}
