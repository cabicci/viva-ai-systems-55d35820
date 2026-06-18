import type { Reviewer } from "../types.ts";
import { createAnthropicReviewer } from "./anthropic.ts";
import { createGeminiReviewer } from "./gemini.ts";
import { createOpenAiReviewer } from "./openai.ts";

export function resolveReviewer(): Reviewer {
  const forced = process.env.AI_REVIEW_PROVIDER?.toLowerCase();
  const order =
    forced === "openai" || forced === "anthropic" || forced === "gemini"
      ? [forced]
      : ["anthropic", "openai", "gemini"];

  const errors: string[] = [];
  for (const provider of order) {
    try {
      if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        return createAnthropicReviewer();
      }
      if (provider === "openai" && process.env.OPENAI_API_KEY) {
        return createOpenAiReviewer();
      }
      if (
        provider === "gemini" &&
        (process.env.GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY_2 ||
          process.env.GEMINI_API_KEY_3 ||
          process.env.GEMINI_API_KEY_4)
      ) {
        return createGeminiReviewer();
      }
    } catch (e) {
      errors.push(String(e));
    }
  }

  throw new Error(
    `No AI review provider available. Set AI_REVIEW_PROVIDER and one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY. ${errors.join(" ")}`,
  );
}
