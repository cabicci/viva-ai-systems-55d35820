import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";
import { ADAPTATION_SYSTEM_RULES } from "../prompts/adaptation-system.ts";
import { AR_GULF_SYSTEM_PROMPT } from "../prompts/ar-gulf.ts";
import { EN_SYSTEM_PROMPT } from "../prompts/en.ts";
import { STRICT_JSON_RETRY_INSTRUCTION } from "./adaptation-retry-prompt.ts";
import type { LocalizedTextMap } from "./localized-text-map.ts";
import {
  openAiAdaptationModel,
  requireOpenAiApiKey,
} from "../providers/types.ts";
import { ADAPTATION_JSON_MAX_ATTEMPTS } from "../providers/anthropic-adaptation.ts";

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export type OpenAiFragmentAdapterOptions = {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
};

export type FragmentLocalizationResponse = {
  lessonId: string;
  fields: Array<{ fieldPath: string; localizedText: string }>;
};

export class OpenAiFragmentEmptyLocalizedTextError extends OpenAiFragmentParseError {
  readonly fieldPath: string;

  constructor(fieldPath: string) {
    super(`localizedText must be a non-empty string for ${fieldPath}`);
    this.name = "OpenAiFragmentEmptyLocalizedTextError";
    this.fieldPath = fieldPath;
  }
}

export class OpenAiFragmentParseError extends Error {
  readonly parseMessage: string;

  constructor(message: string) {
    super(message);
    this.name = "OpenAiFragmentParseError";
    this.parseMessage = message;
  }
}

function systemPromptForLocale(targetLocale: AdaptationTargetLocale): string {
  const localeRules =
    targetLocale === "en" ? EN_SYSTEM_PROMPT : AR_GULF_SYSTEM_PROMPT;

  return `${ADAPTATION_SYSTEM_RULES}

${localeRules}

FRAGMENT LOCALIZATION MODE:
- You receive a flat list of learner-facing text fields extracted from an ar-MSA lesson package.
- Return ONLY localized text for each fieldPath — never a full lesson JSON object.
- Do NOT generate quiz objects, section arrays, or any structural lesson data.
- Preserve pedagogical meaning; adapt naturally for the target locale (not literal translation).
- Quiz option text must stay clean — no numbering prefixes or letter labels.
- Keep product terms consistent (AI, ChatGPT, Gemini, etc.).`;
}

const OUTPUT_SCHEMA = `Return ONE JSON object only (no markdown fences):
{
  "lessonId": "<unchanged from input>",
  "fields": [
    { "fieldPath": "<exact path from input>", "localizedText": "<adapted learner text>" }
  ]
}

Rules:
- Include exactly one entry per input fieldPath — same paths, same count, no extras, no omissions.
- localizedText must be a non-empty string for every field.
- Do NOT return sourceText, fieldType, sections, quiz objects, or any keys outside lessonId and fields.`;

export function buildFragmentLocalizationPrompt(
  textMap: LocalizedTextMap,
  targetLocale: AdaptationTargetLocale,
): { system: string; userPrompt: string } {
  const inputPayload = {
    lessonId: textMap.lessonId,
    sourceLocale: textMap.sourceLocale,
    targetLocale,
    canonicalVersion: textMap.canonicalVersion,
    fields: textMap.fields.map((field) => ({
      fieldPath: field.fieldPath,
      sourceText: field.sourceText,
      fieldType: field.fieldType,
    })),
  };

  const userPrompt = `# Fragment text localization task

Adapt each sourceText below for target locale **${targetLocale}**.

## Input field map
${JSON.stringify(inputPayload, null, 2)}

## Required output shape
${OUTPUT_SCHEMA}`;

  return {
    system: systemPromptForLocale(targetLocale),
    userPrompt,
  };
}

export async function fetchOpenAiFragmentText(input: {
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
    throw new Error(`OpenAI fragment API ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as OpenAiChatResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

export function parseOpenAiFragmentResponse(
  content: string,
  input: LocalizedTextMap,
): LocalizedTextMap {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new OpenAiFragmentParseError(`JSON parse failed: ${message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new OpenAiFragmentParseError("response is not a JSON object");
  }

  const response = parsed as Partial<FragmentLocalizationResponse>;

  if (response.lessonId !== input.lessonId) {
    throw new OpenAiFragmentParseError(
      `lessonId mismatch: expected ${input.lessonId}, got ${String(response.lessonId)}`,
    );
  }

  if (!Array.isArray(response.fields)) {
    throw new OpenAiFragmentParseError("fields must be an array");
  }

  const inputPaths = input.fields.map((field) => field.fieldPath);
  const inputPathSet = new Set(inputPaths);
  const outputPaths = response.fields.map((field) => field?.fieldPath);
  const outputPathSet = new Set(outputPaths);

  for (const fieldPath of inputPaths) {
    if (!outputPathSet.has(fieldPath)) {
      throw new OpenAiFragmentParseError(`missing fieldPath in response: ${fieldPath}`);
    }
  }

  for (const fieldPath of outputPaths) {
    if (typeof fieldPath !== "string" || !inputPathSet.has(fieldPath)) {
      throw new OpenAiFragmentParseError(
        `unexpected extra fieldPath in response: ${String(fieldPath)}`,
      );
    }
  }

  if (response.fields.length !== input.fields.length) {
    throw new OpenAiFragmentParseError(
      `field count mismatch: expected ${input.fields.length}, got ${response.fields.length}`,
    );
  }

  const localizedByPath = new Map<string, string>();
  for (const field of response.fields) {
    if (!field || typeof field !== "object") {
      throw new OpenAiFragmentParseError("each fields entry must be an object");
    }
    if (typeof field.fieldPath !== "string") {
      throw new OpenAiFragmentParseError("fieldPath must be a string");
    }
    if (typeof field.localizedText !== "string" || field.localizedText.trim() === "") {
      throw new OpenAiFragmentEmptyLocalizedTextError(field.fieldPath);
    }
    localizedByPath.set(field.fieldPath, field.localizedText);
  }

  return {
    ...input,
    targetLocale: input.targetLocale,
    fields: input.fields.map((field) => ({
      ...field,
      localizedText: localizedByPath.get(field.fieldPath)!,
    })),
  };
}

function formatFragmentParseFailure(input: {
  targetLocale: AdaptationTargetLocale;
  lessonId: string;
  attempt: number;
  maxAttempts: number;
  parseError: string;
}): string {
  return (
    `OpenAI fragment JSON parse failed for locale=${input.targetLocale} ` +
    `lessonId=${input.lessonId} attempt=${input.attempt}/${input.maxAttempts}: ` +
    input.parseError
  );
}

function buildFragmentRetryUserPrompt(baseUserPrompt: string, parseError: string): string {
  return `${baseUserPrompt}

PREVIOUS ATTEMPT FAILED VALIDATION:
${parseError}

${STRICT_JSON_RETRY_INSTRUCTION}
- Return the exact same fieldPath keys as the input — one localizedText per fieldPath.`;
}

function buildSingleFieldRepairPrompt(input: {
  lessonId: string;
  targetLocale: AdaptationTargetLocale;
  fieldPath: string;
  fieldType: string;
  sourceText: string;
}): { system: string; userPrompt: string } {
  return {
    system: systemPromptForLocale(input.targetLocale),
    userPrompt: `# Isolated empty-field repair

The previous fragment response left exactly one learner-facing field empty.
Adapt ONLY this one sourceText for target locale **${input.targetLocale}**.
Do not return Arabic source text as English output.
Do not return a full lesson JSON object.

${JSON.stringify(input, null, 2)}

Return ONE JSON object only:
{
  "lessonId": "${input.lessonId}",
  "fields": [
    { "fieldPath": "${input.fieldPath}", "localizedText": "<non-empty adapted text>" }
  ]
}`,
  };
}

async function repairEmptyLocalizedTextField(input: {
  textMap: LocalizedTextMap;
  targetLocale: AdaptationTargetLocale;
  currentMap: LocalizedTextMap;
  emptyFieldPath: string;
  apiKey: string;
  model: string;
  fetchFn?: typeof fetch;
}): Promise<LocalizedTextMap> {
  const sourceField = input.textMap.fields.find(
    (field) => field.fieldPath === input.emptyFieldPath,
  );
  if (!sourceField) {
    throw new OpenAiFragmentParseError(
      `cannot repair unknown fieldPath: ${input.emptyFieldPath}`,
    );
  }

  const prompt = buildSingleFieldRepairPrompt({
    lessonId: input.textMap.lessonId,
    targetLocale: input.targetLocale,
    fieldPath: sourceField.fieldPath,
    fieldType: sourceField.fieldType,
    sourceText: sourceField.sourceText,
  });
  const content = await fetchOpenAiFragmentText({
    apiKey: input.apiKey,
    model: input.model,
    system: prompt.system,
    userPrompt: prompt.userPrompt,
    fetchFn: input.fetchFn,
  });
  const repairedSingleField = parseOpenAiFragmentResponse(content, {
    ...input.textMap,
    targetLocale: input.targetLocale,
    fields: [sourceField],
  });
  const repairedValue = repairedSingleField.fields[0]?.localizedText?.trim();
  if (!repairedValue) {
    throw new OpenAiFragmentEmptyLocalizedTextError(input.emptyFieldPath);
  }

  return {
    ...input.currentMap,
    fields: input.currentMap.fields.map((field) =>
      field.fieldPath === input.emptyFieldPath
        ? { ...field, localizedText: repairedValue }
        : field,
    ),
  };
}

export async function localizeTextMapWithOpenAi(
  textMap: LocalizedTextMap,
  targetLocale: AdaptationTargetLocale,
  options: OpenAiFragmentAdapterOptions = {},
): Promise<LocalizedTextMap> {
  const apiKey = options.apiKey ?? requireOpenAiApiKey();
  const model = options.model ?? openAiAdaptationModel();
  const fetchFn = options.fetchFn;
  const prompt = buildFragmentLocalizationPrompt(textMap, targetLocale);

  let lastParseError: string | null = null;

  for (let attempt = 1; attempt <= ADAPTATION_JSON_MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1
        ? prompt.userPrompt
        : buildFragmentRetryUserPrompt(prompt.userPrompt, lastParseError ?? "unknown parse error");

    const content = await fetchOpenAiFragmentText({
      apiKey,
      model,
      system: prompt.system,
      userPrompt,
      fetchFn,
    });

    try {
      return parseOpenAiFragmentResponse(content, { ...textMap, targetLocale });
    } catch (error) {
      if (error instanceof OpenAiFragmentParseError) {
        lastParseError = error.parseMessage;
      } else {
        throw error;
      }

      if (attempt === ADAPTATION_JSON_MAX_ATTEMPTS) {
        throw new Error(
          formatFragmentParseFailure({
            targetLocale,
            lessonId: textMap.lessonId,
            attempt,
            maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
            parseError: lastParseError ?? "unknown parse error",
          }),
        );
      }

      console.warn(
        `Fragment localization retry ${attempt}/${ADAPTATION_JSON_MAX_ATTEMPTS} for ${textMap.lessonId} (${targetLocale})`,
      );
    }
  }

  throw new Error(
    formatFragmentParseFailure({
      targetLocale,
      lessonId: textMap.lessonId,
      attempt: ADAPTATION_JSON_MAX_ATTEMPTS,
      maxAttempts: ADAPTATION_JSON_MAX_ATTEMPTS,
      parseError: lastParseError ?? "unknown parse error",
    }),
  );
}
