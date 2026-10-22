// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { createOpenAiEmbeddingFetcher, EMBEDDING_REQUEST_TIMEOUT_MS } from "../rag/lovable-native/embedding-provider.server";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("bounds the provider request and response body with the same 45 second signal", async () => {
  const signal = new AbortController().signal;
  const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
  const vector = Array(1536).fill(0.25);
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ index: 0, embedding: vector }] })));
  vi.stubGlobal("fetch", fetcher);
  expect(await createOpenAiEmbeddingFetcher("synthetic-key")(["synthetic text"])).toEqual({ vectors: [vector] });
  expect(timeout).toHaveBeenCalledExactlyOnceWith(EMBEDDING_REQUEST_TIMEOUT_MS);
  expect(EMBEDDING_REQUEST_TIMEOUT_MS).toBe(45_000);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1]).toMatchObject({ signal, body: JSON.stringify({ model: "text-embedding-3-small", input: ["synthetic text"] }) });
});
it.each(["request", "body"])("stops an aborted %s with a closed timeout code and no retry", async phase => {
  const controller = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  const failure = () => { controller.abort(); throw new Error("private key and source text"); };
  const fetcher = vi.fn(phase === "request" ? failure : async () => ({ ok: true, json: failure }));
  vi.stubGlobal("fetch", fetcher);
  await expect(createOpenAiEmbeddingFetcher("synthetic-key")(["synthetic text"])).rejects.toThrow(/^PROVIDER_FAILED:TIMEOUT$/);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("redacts network errors and never retries an uncertain paid request", async () => {
  const fetcher = vi.fn().mockRejectedValue(new TypeError("private URL and key"));
  vi.stubGlobal("fetch", fetcher);
  await expect(createOpenAiEmbeddingFetcher("synthetic-key")(["synthetic text"])).rejects.toThrow(/^PROVIDER_FAILED$/);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("rejects malformed response JSON without returning provider text", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private non-JSON body")));
  await expect(createOpenAiEmbeddingFetcher("synthetic-key")(["synthetic text"])).rejects.toThrow(/^PROVIDER_RESPONSE_INVALID:json$/);
});
it("does not call the provider for empty or oversized input", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect(await createOpenAiEmbeddingFetcher("synthetic-key")([])).toEqual({ vectors: [] });
  await expect(createOpenAiEmbeddingFetcher("synthetic-key")(Array(65).fill("x"))).rejects.toThrow("PROVIDER_RESPONSE_INVALID:batch_too_large");
  expect(fetcher).not.toHaveBeenCalled();
});
