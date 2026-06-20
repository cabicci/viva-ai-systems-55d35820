import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";

export interface ContextualAdaptationInput {
  source: LocalizedLessonPackage;
  targetLocale: AdaptationTargetLocale;
}

export interface ContextualAdaptationProvider {
  name: string;
  model: string;
  adaptLesson(input: ContextualAdaptationInput): Promise<AdaptedLessonPackage>;
}

export function requireAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Set it in your environment to generate localized lesson samples. " +
        "This script never reads or writes API keys from files.",
    );
  }
  return apiKey;
}

export function adaptationModel(): string {
  return process.env.LOCALE_ADAPTATION_MODEL?.trim() || "claude-sonnet-4-6";
}
