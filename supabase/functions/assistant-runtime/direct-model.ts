import type { LlmResult } from "./handler.ts";
import { ASSISTANT_ANSWER_FORMAT, parseAssistantAnswer } from "./answer-contract.ts";

/** Existing native OpenAI model/API with a strict grounded-answer output contract.
 * Credentials stay in the server environment. There is no retry or fallback.
 */
export async function callDirectAssistantModel(
  systemPrompt: string, userPrompt: string, key: string,
  request: typeof fetch = fetch,
): Promise<LlmResult> {
  if (!key) return { ok: false, status: 503, error: "ASSISTANT_PROVIDER_UNAVAILABLE" };
  try {
    const response = await request("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "gpt-4.1-mini-2025-04-14", temperature: 0.2,
        max_tokens: 1800, stream: false, response_format: ASSISTANT_ANSWER_FORMAT,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return { ok: false, status: response.status === 429 ? 429 : 502,
        error: "ASSISTANT_PROVIDER_UNAVAILABLE" };
    }
    const body = await response.json();
    const choice = body?.choices?.[0];
    const answer = choice?.message?.content;
    if (choice?.finish_reason !== "stop" || choice?.message?.refusal != null ||
      typeof answer !== "string" || !parseAssistantAnswer(answer))
      return { ok: false, status: 502, error: "ASSISTANT_PROVIDER_INVALID_RESPONSE" };
    return { ok: true, answer: answer.trim() };
  } catch {
    return { ok: false, status: 502, error: "ASSISTANT_PROVIDER_UNAVAILABLE" };
  }
}
