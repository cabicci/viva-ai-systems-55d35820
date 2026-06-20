import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { buildAdaptationPrompt } from "../prompts/build-prompt.ts";
import {
  finalizeAdaptedPackage,
  parseAdaptedLessonJson,
  validateAdaptedLessonPackage,
  validateAdaptedLessonWarnings,
} from "../lib/validate-adapted-lesson.ts";
import {
  adaptationModel,
  requireAnthropicApiKey,
  type ContextualAdaptationInput,
  type ContextualAdaptationProvider,
} from "./types.ts";

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

export function createAnthropicAdaptationProvider(): ContextualAdaptationProvider {
  const apiKey = requireAnthropicApiKey();
  const model = adaptationModel();

  return {
    name: "anthropic",
    model,
    async adaptLesson(input: ContextualAdaptationInput): Promise<AdaptedLessonPackage> {
      const { source, targetLocale } = input;
      const prompt = buildAdaptationPrompt(targetLocale, source);
      const system = `${prompt.systemPrompt}\n\n${OUTPUT_SCHEMA}`;
      const sourcePackagePath = `src/lib/locale-lessons/ar-MSA/lessons/${source.lessonId}.json`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 16384,
          temperature: 0.2,
          system,
          messages: [{ role: "user", content: prompt.userPrompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(
          `Anthropic adaptation API ${res.status}: ${err.slice(0, 400)}`,
        );
      }

      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const content =
        data.content?.find((block) => block.type === "text")?.text ?? "";

      const parsed = parseAdaptedLessonJson(content);
      const generatedAt = new Date().toISOString();
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
        throw new Error(
          `Adapted lesson validation failed for ${source.lessonId}:\n${validationErrors.join("\n")}`,
        );
      }

      const qualityWarnings = validateAdaptedLessonWarnings(
        source,
        finalized,
        targetLocale,
      );
      if (qualityWarnings.length > 0) {
        console.warn(
          `Quality warnings for ${source.lessonId} (${targetLocale}):\n${qualityWarnings.map((warning) => `  - ${warning}`).join("\n")}`,
        );
      }

      return finalized;
    },
  };
}
