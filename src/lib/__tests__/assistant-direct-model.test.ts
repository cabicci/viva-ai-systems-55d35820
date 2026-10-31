// @vitest-environment node
import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { callDirectAssistantModel } from "../../../supabase/functions/assistant-runtime/direct-model";

it("uses the established native OpenAI model and direct endpoint with a bounded response and no retry", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ message: { content: " Grounded explanation " } }],
  })));
  expect(await callDirectAssistantModel("approved source", "short question", "test-only", request))
    .toEqual({ ok: true, answer: "Grounded explanation" });
  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(options?.headers).toMatchObject({ Authorization: "Bearer test-only" });
  expect(options?.signal).toBeInstanceOf(AbortSignal);
  expect(url).toBe("https://api.openai.com/v1/chat/completions");
  expect(JSON.parse(String(options?.body))).toMatchObject({ max_tokens: 1800, stream: false,
    model: "gpt-4.1-mini-2025-04-14", temperature: 0.2 });
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

it("uses the model already selected by the native assistant, with no second provider binding", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const native = readFileSync(path.join(root, "src/lib/card-assistant/assistant.server.ts"), "utf8");
  expect(native).toContain('model: "openai/gpt-4.1-mini-2025-04-14", temperature: 0.2');
  const entry = readFileSync(path.join(root, "supabase/functions/assistant-runtime/index.ts"), "utf8");
  expect(entry).toContain('OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY")');
  expect(entry).not.toContain("OPENROUTER_API_KEY");
});

it("contains private network/JSON errors without retry or fallback", async () => {
  for (const request of [
    vi.fn<typeof fetch>().mockRejectedValue(new Error("PRIVATE_NETWORK_DIAGNOSTIC")),
    vi.fn<typeof fetch>().mockResolvedValue(new Response("invalid JSON")),
    vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: null } }] }))),
  ]) {
    expect(await callDirectAssistantModel("source", "question", "test-only", request))
      .toMatchObject({ ok: false, status: 502 });
    expect(request).toHaveBeenCalledTimes(1);
  }
});
