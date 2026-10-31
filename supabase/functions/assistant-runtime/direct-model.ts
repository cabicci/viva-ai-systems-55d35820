import type { LlmResult } from "./handler.ts";

/** Existing model through the owner's direct provider; never a credit gateway.
 * Credentials stay in the server environment. There is no retry or fallback.
 */
export async function callDirectAssistantModel(
  systemPrompt: string, userPrompt: string, key: string,
  request: typeof fetch = fetch,
): Promise<LlmResult> {
  if (!key) return { ok: false, status: 503, error: "ASSISTANT_PROVIDER_UNAVAILABLE" };
  try {
    const response = await request("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", temperature: 0.3,
        max_tokens: 1800, stream: false,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return { ok: false, status: response.status === 429 ? 429 : 502,
        error: "ASSISTANT_PROVIDER_UNAVAILABLE" };
    }
    const body = await response.json();
    const answer = body?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim() || answer.length > 16_000)
      return { ok: false, status: 502, error: "ASSISTANT_PROVIDER_INVALID_RESPONSE" };
    return { ok: true, answer: answer.trim() };
  } catch {
    return { ok: false, status: 502, error: "ASSISTANT_PROVIDER_UNAVAILABLE" };
  }
}
