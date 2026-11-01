import type { LlmResult } from "./handler.ts";
import { buildAssistantAnswerFormat, parseAssistantAnswer } from "./answer-contract.ts";

/** Enumerated, content-free failure categories for safe diagnostics. */
export type AssistantModelFailureDetail =
  | `upstream_http_${number}` | "timeout" | "network" | "body_unreadable"
  | `finish_${string}` | "refusal_present" | "content_missing" | "schema_invalid";

const FINISH_REASONS = new Set(["length", "content_filter", "tool_calls", "function_call"]);

/** Existing native OpenAI model/API with a strict grounded-answer output contract.
 * Credentials stay in the server environment. There is no retry or fallback.
 */
export async function callDirectAssistantModel(
  systemPrompt: string, userPrompt: string, key: string,
  request: typeof fetch = fetch,
  admittedSourceIds: readonly string[] = [],
): Promise<LlmResult> {
  if (!key) return { ok: false, status: 503, error: "ASSISTANT_PROVIDER_UNAVAILABLE", detail: "key_missing" };
  let response: Response;
  try {
    response = await request("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "gpt-4.1-mini-2025-04-14", temperature: 0.2,
        max_tokens: 1800, stream: false, response_format: buildAssistantAnswerFormat(admittedSourceIds),
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const name = (error as { name?: string })?.name;
    return { ok: false, status: 502, error: "ASSISTANT_PROVIDER_UNAVAILABLE",
      detail: name === "TimeoutError" || name === "AbortError" ? "timeout" : "network" };
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    const code = Number.isInteger(response.status) && response.status >= 100 && response.status < 600 ? response.status : 0;
    return { ok: false, status: response.status === 429 ? 429 : 502,
      error: "ASSISTANT_PROVIDER_UNAVAILABLE", detail: `upstream_http_${code}` };
  }
  let body: any;
  try { body = await response.json(); } catch (error) {
    const name = (error as { name?: string })?.name;
    return { ok: false, status: 502, error: "ASSISTANT_PROVIDER_UNAVAILABLE",
      detail: name === "TimeoutError" || name === "AbortError" ? "timeout" : "body_unreadable" };
  }
  const choice = body?.choices?.[0];
  const answer = choice?.message?.content;
  const invalid = (detail: string): LlmResult =>
    ({ ok: false, status: 502, error: "ASSISTANT_PROVIDER_INVALID_RESPONSE", detail });
  if (choice?.finish_reason !== "stop") {
    const reason = typeof choice?.finish_reason === "string" && FINISH_REASONS.has(choice.finish_reason)
      ? choice.finish_reason : "other";
    return invalid(`finish_${reason}`);
  }
  if (choice?.message?.refusal != null) return invalid("refusal_present");
  if (typeof answer !== "string") return invalid("content_missing");
  if (!parseAssistantAnswer(answer)) return invalid("schema_invalid");
  return { ok: true, answer: answer.trim() };
}
