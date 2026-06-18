import type { Reviewer } from "../types.ts";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseReviewJson,
} from "./prompt.ts";

export function createAnthropicReviewer(): Reviewer {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const model =
    process.env.AI_REVIEW_MODEL ?? "claude-sonnet-4-6";

  return {
    name: "anthropic",
    model,
    async reviewLesson(input) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          temperature: 0.1,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(input) }],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${err.slice(0, 400)}`);
      }
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const content =
        data.content?.find((c) => c.type === "text")?.text ?? "";
      return parseReviewJson(content);
    },
  };
}
