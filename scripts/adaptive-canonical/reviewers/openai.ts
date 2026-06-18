import type { Reviewer } from "../types.ts";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseReviewJson,
} from "./prompt.ts";

export function createOpenAiReviewer(): Reviewer {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const model = process.env.AI_REVIEW_MODEL ?? "gpt-4o-mini";

  return {
    name: "openai",
    model,
    async reviewLesson(input) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(input) },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API ${res.status}: ${err.slice(0, 400)}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      return parseReviewJson(content);
    },
  };
}
