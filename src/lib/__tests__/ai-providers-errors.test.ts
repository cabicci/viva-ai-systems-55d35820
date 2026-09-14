import { afterEach, describe, expect, it, vi } from "vitest";
import { callAI } from "@/lib/ai-providers.server";

const UPSTREAM_SENTINEL =
  "upstream-secret=sk-provider-should-never-leak; prompt=private-user-prompt";

const providerErrors = [
  {
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    model: "openai/gpt-4o",
    status: 429,
    publicError: "OpenAI error (429)",
    cancelRejects: false,
  },
  {
    label: "Lovable gateway",
    envKey: "LOVABLE_API_KEY",
    model: "google/gemini-2.5-flash",
    status: 503,
    publicError: "AI Gateway error (503)",
    cancelRejects: true,
  },
] as const;

describe("AI provider error reporting", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(providerErrors)(
    "does not expose $label response bodies",
    async ({ envKey, model, status, publicError, cancelRejects }) => {
      vi.stubEnv(envKey, "test-api-key");
      const response = new Response(UPSTREAM_SENTINEL, { status });
      const textSpy = vi.spyOn(response, "text");
      const cancelSpy = vi.spyOn(response.body!, "cancel");
      if (cancelRejects) {
        cancelSpy.mockRejectedValue(new Error(`cancel failure: ${UPSTREAM_SENTINEL}`));
      }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
      const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      let thrown: unknown;
      try {
        await callAI({
          model,
          messages: [{ role: "user", content: "private request" }],
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toBe(publicError);
      expect(textSpy).not.toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalledOnce();

      const exposed = [(thrown as Error).message, ...logSpy.mock.calls.flat().map(String)].join(
        " ",
      );
      expect(exposed).toContain(String(status));
      expect(exposed).not.toContain(UPSTREAM_SENTINEL);
    },
  );

  it.each([
    {
      label: "OpenAI",
      envKey: "OPENAI_API_KEY",
      model: "openai/gpt-4o",
      url: "https://api.openai.com/v1/chat/completions",
    },
    {
      label: "default gateway",
      envKey: "LOVABLE_API_KEY",
      model: "google/gemini-2.5-flash",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    },
  ] as const)("keeps successful $label routing intact", async ({ envKey, model, url }) => {
    vi.stubEnv(envKey, "test-api-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "safe completion" } }],
        usage: { prompt_tokens: 7, completion_tokens: 3 },
      }),
    );

    await expect(
      callAI({
        model,
        messages: [{ role: "user", content: "hello" }],
      }),
    ).resolves.toEqual({
      content: "safe completion",
      usage: { promptTokens: 7, completionTokens: 3 },
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(url);
  });
});
