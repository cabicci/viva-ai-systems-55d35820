// @vitest-environment node
import { expect, it, vi } from "vitest";
import { callDirectAssistantModel } from "../../../supabase/functions/assistant-runtime/direct-model";

it("uses the existing model through the direct owner provider with a bounded response and no retry", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ message: { content: " Grounded explanation " } }],
  })));
  expect(await callDirectAssistantModel("approved source", "short question", "test-only", request))
    .toEqual({ ok: true, answer: "Grounded explanation" });
  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(JSON.parse(String(options?.body))).toMatchObject({ max_tokens: 1800, stream: false,
    model: "google/gemini-3-flash-preview" });
});

it("fails closed without a configured direct key and never calls a fallback", async () => {
  const request = vi.fn<typeof fetch>();
  expect(await callDirectAssistantModel("source", "question", "", request)).toMatchObject({ ok: false, status: 503 });
  expect(request).not.toHaveBeenCalled();
});

it.each([402, 429, 500])("contains provider status %s without returning its private body or retrying", async status => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("PRIVATE_PROVIDER_BODY", { status }));
  const result = await callDirectAssistantModel("source", "question", "test-only", request);
  expect(result).toEqual({ ok: false, status: status === 429 ? 429 : 502, error: "ASSISTANT_PROVIDER_UNAVAILABLE" });
  expect(request).toHaveBeenCalledTimes(1);
});

it("rejects empty or oversized answers rather than inventing success", async () => {
  for (const content of ["", "x".repeat(16001)]) {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] })));
    expect(await callDirectAssistantModel("source", "question", "test-only", request)).toMatchObject({ ok: false, status: 502 });
  }
});
