import { inputFingerprint, assertRequestIdentity } from "../lib/input-identity.ts";
import { ReviewUncertainError, ReviewRejectedError, reviewHttpError } from "../lib/retry.ts";
import type { Reviewer, ReviewInput } from "../types.ts";
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

  const requestBody = (input: ReviewInput) => ({
          model,
          max_tokens: 4096,
          temperature: 0.1,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(input) }],
        });
  const requestDigest = (payload: unknown) => inputFingerprint({
    provider: "anthropic", model, endpoint: "https://api.anthropic.com/v1/messages", method: "POST", apiVersion: "2023-06-01",
    payload, parser: parseReviewJson.toString(),
  });

  return {
    name: "anthropic",
    model,
    requestIdentity(input) { return requestDigest(requestBody(input)); },
    async reviewLesson(input, signal, expectedRequestIdentity) {
      const payload = requestBody(input);
      assertRequestIdentity(requestDigest(payload), expectedRequestIdentity);
      signal?.throwIfAborted();
      try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw reviewHttpError(res.status);
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const content =
        data.content?.find((c) => c.type === "text")?.text ?? "";
      signal?.throwIfAborted();
      return parseReviewJson(content);
      } catch (error) {
        if (error instanceof ReviewRejectedError || error instanceof ReviewUncertainError) throw error;
        throw new ReviewUncertainError();
      }
    },
  };
}
