import type { Reviewer } from "../types.ts";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseReviewJson,
} from "./prompt.ts";

function resolveGeminiApiKey(): string {
  const names = [
    "GEMINI_API_KEY",
    ...Array.from({ length: 4 }, (_, i) => `GEMINI_API_KEY_${i + 2}`),
  ];
  for (const name of names) {
    const key = process.env[name];
    if (key) return key;
  }
  throw new Error("GEMINI_API_KEY is not set");
}

export function createGeminiReviewer(): Reviewer {
  const apiKey = resolveGeminiApiKey();
  const model = process.env.AI_REVIEW_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return {
    name: "gemini",
    model,
    async reviewLesson(input) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(input)}`,
                },
              ],
            },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API ${res.status}: ${err.slice(0, 400)}`);
      }
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const content =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return parseReviewJson(content);
    },
  };
}
