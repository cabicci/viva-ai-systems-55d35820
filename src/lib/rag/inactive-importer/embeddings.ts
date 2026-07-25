import { createHash } from "node:crypto";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_PLACEHOLDER } from "../constants";
import {
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_MAX_ATTEMPTS_PER_BATCH,
  EMBEDDING_TIMEOUT_MS,
  MAX_EMBEDDING_REQUESTS,
} from "./constants";
import type { EmbeddingProvider } from "./types";

export class ProviderError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

/** Deterministic mock embeddings for disposable mode only. */
export function createMockEmbeddingProvider(dimensions = EMBEDDING_DIMENSIONS): EmbeddingProvider {
  return {
    kind: "mock",
    model: EMBEDDING_MODEL_PLACEHOLDER,
    dimensions,
    async embedBatch(texts) {
      const vectors = texts.map((text) => {
        const seed = createHash("sha256").update(text).digest();
        const out: number[] = [];
        for (let i = 0; i < dimensions; i++) {
          out.push((seed[i % seed.length]! / 255) * 2 - 1);
        }
        return out;
      });
      return { vectors, attemptsUsed: 0 };
    },
  };
}

/**
 * Real OpenAI provider — must never be constructed in disposable mode.
 * This task must not invoke it; Production execution requires separate auth.
 */
export function createOpenAIEmbeddingProvider(options: {
  apiKey: string;
  maxRequests: number;
  getAttempted: () => number;
  recordAttempts: (n: number) => void;
  fetchImpl?: typeof fetch;
}): EmbeddingProvider {
  if (!options.apiKey) {
    throw new ProviderError("MISSING_PROVIDER", "OPENAI API key required");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    kind: "openai",
    model: EMBEDDING_MODEL_PLACEHOLDER,
    dimensions: EMBEDDING_DIMENSIONS,
    async embedBatch(texts, meta) {
      if (texts.length === 0) return { vectors: [], attemptsUsed: 0 };
      if (texts.length > EMBEDDING_BATCH_SIZE) {
        throw new ProviderError(
          "BATCH_TOO_LARGE",
          `Batch size ${texts.length} exceeds ${EMBEDDING_BATCH_SIZE}`,
        );
      }
      let attemptsUsed = 0;
      let lastError: unknown;
      for (let attempt = 1; attempt <= EMBEDDING_MAX_ATTEMPTS_PER_BATCH; attempt++) {
        if (options.getAttempted() + 1 > options.maxRequests) {
          throw new ProviderError(
            "REQUEST_CEILING",
            `Abort before request ${MAX_EMBEDDING_REQUESTS + 1}: ceiling ${options.maxRequests}`,
          );
        }
        if (meta.attemptBudgetRemaining <= 0) {
          throw new ProviderError("REQUEST_CEILING", "Attempt budget exhausted");
        }
        attemptsUsed += 1;
        options.recordAttempts(1);
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);
          const resp = await fetchImpl("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${options.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: EMBEDDING_MODEL_PLACEHOLDER,
              input: texts,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (!resp.ok) {
            throw new ProviderError("PROVIDER_HTTP", `OpenAI embeddings failed (${resp.status})`);
          }
          const body = (await resp.json()) as {
            data: Array<{ index: number; embedding: number[] }>;
          };
          const vectors = new Array<number[]>(texts.length);
          for (const row of body.data) {
            if (row.embedding.length !== EMBEDDING_DIMENSIONS) {
              throw new ProviderError(
                "WRONG_DIMENSIONS",
                `Provider returned ${row.embedding.length} dims`,
              );
            }
            if (row.embedding.some((n) => !Number.isFinite(n))) {
              throw new ProviderError("NON_FINITE_VECTOR", "Non-finite embedding");
            }
            vectors[row.index] = row.embedding;
          }
          if (vectors.some((v) => !v)) {
            throw new ProviderError("INCOMPLETE_BATCH", "Missing embedding rows");
          }
          return { vectors: vectors as number[][], attemptsUsed };
        } catch (err) {
          lastError = err;
          if (attempt === EMBEDDING_MAX_ATTEMPTS_PER_BATCH) break;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new ProviderError("PROVIDER_FAILED", "Embedding batch failed");
    },
  };
}

export function assertProviderMatchesEnvironment(
  provider: EmbeddingProvider,
  environment: "disposable" | "production",
): void {
  if (environment === "disposable" && provider.kind !== "mock") {
    throw new ProviderError(
      "EXTERNAL_PROVIDER_FORBIDDEN",
      "Disposable mode rejects external provider calls",
    );
  }
  if (environment === "production" && provider.kind !== "openai") {
    throw new ProviderError(
      "MOCK_FORBIDDEN",
      "Production mode rejects deterministic/mock embeddings",
    );
  }
  if (provider.model !== EMBEDDING_MODEL_PLACEHOLDER) {
    throw new ProviderError("WRONG_MODEL", "Provider model mismatch");
  }
  if (provider.dimensions !== EMBEDDING_DIMENSIONS) {
    throw new ProviderError("WRONG_DIMENSIONS", "Provider dimension mismatch");
  }
}
