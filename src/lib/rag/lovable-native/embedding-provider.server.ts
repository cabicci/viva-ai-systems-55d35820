import { LOCKED_BATCH_SIZE, LOCKED_EMBEDDING_DIMENSIONS, LOCKED_EMBEDDING_MODEL } from "./contracts";

export interface EmbeddingFetchResult { vectors: number[][] }
export type EmbeddingFetcher = (texts: string[]) => Promise<EmbeddingFetchResult>;
export const EMBEDDING_REQUEST_TIMEOUT_MS = 45_000;

/** Lightweight shared transport: no corpus import and no automatic paid retry. */
export function createOpenAiEmbeddingFetcher(apiKey: string): EmbeddingFetcher {
  return async texts => {
    if (texts.length === 0) return { vectors: [] };
    if (texts.length > LOCKED_BATCH_SIZE) throw new Error("PROVIDER_RESPONSE_INVALID:batch_too_large");
    const signal = AbortSignal.timeout(EMBEDDING_REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: LOCKED_EMBEDDING_MODEL, input: texts }),
      });
    } catch {
      throw new Error(signal.aborted ? "PROVIDER_FAILED:TIMEOUT" : "PROVIDER_FAILED");
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`PROVIDER_FAILED:HTTP_${response.status}`);
    }
    let json: { data?: Array<{ index: number; embedding: number[] }> } | null;
    try { json = await response.json(); }
    catch { throw new Error(signal.aborted ? "PROVIDER_FAILED:TIMEOUT" : "PROVIDER_RESPONSE_INVALID:json"); }
    if (!json || !Array.isArray(json.data) || json.data.length !== texts.length)
      throw new Error("PROVIDER_RESPONSE_INVALID:count");
    if (json.data.some(row => !row || typeof row.index !== "number")) throw new Error("PROVIDER_RESPONSE_INVALID:index");
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    const vectors: number[][] = [];
    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i]!;
      if (row.index !== i) throw new Error("PROVIDER_RESPONSE_INVALID:index");
      const vector = row.embedding;
      if (!Array.isArray(vector) || vector.length !== LOCKED_EMBEDDING_DIMENSIONS)
        throw new Error("PROVIDER_RESPONSE_INVALID:dims");
      if (!vector.every(n => typeof n === "number" && Number.isFinite(n)))
        throw new Error("PROVIDER_RESPONSE_INVALID:non_finite");
      vectors.push(vector);
    }
    return { vectors };
  };
}
