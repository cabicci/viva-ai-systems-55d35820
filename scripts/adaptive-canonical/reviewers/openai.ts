import { inputFingerprint, assertRequestIdentity } from "../lib/input-identity.ts";
import { ReviewUncertainError, ReviewRejectedError, reviewHttpError } from "../lib/retry.ts";
import type { Reviewer, ReviewInput } from "../types.ts";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseReviewJson,
} from "./prompt.ts";

export function createOpenAiReviewer(): Reviewer {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const model = process.env.AI_REVIEW_MODEL ?? "gpt-4o-mini";

  const requestBody = (input: ReviewInput) => ({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(input) },
          ],
        });
  const requestDigest = (payload: unknown) => inputFingerprint({
    provider: "openai", model, endpoint: "https://api.openai.com/v1/chat/completions", method: "POST",
    payload, parser: parseReviewJson.toString(),
  });

  return {
    name: "openai",
    model,
    requestIdentity(input) { return requestDigest(requestBody(input)); },
    async reviewLesson(input, signal, expectedRequestIdentity) {
      const payload = requestBody(input);
      assertRequestIdentity(requestDigest(payload), expectedRequestIdentity);
      signal?.throwIfAborted();
      try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw reviewHttpError(res.status);
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      signal?.throwIfAborted();
      return parseReviewJson(content);
      } catch (error) {
        if (error instanceof ReviewRejectedError || error instanceof ReviewUncertainError) throw error;
        throw new ReviewUncertainError();
      }
    },
  };
}
