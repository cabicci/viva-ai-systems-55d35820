import type { RagChunkRecord } from "./types";
import {
  CONTENT_FREEZE_SHA,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_PLACEHOLDER,
} from "./constants";

/** Conservative token estimate: ceil(char_count / 3.5) per chunk. */
export function estimateChunkTokens(charCount: number): number {
  return Math.ceil(charCount / 3.5);
}

export interface EmbeddingDryRunReport {
  embeddingModel: string;
  vectorDimensions: number;
  chunkCount: number;
  totalInputTokens: number;
  tokenEstimationMethod: string;
  batchSize: number;
  estimatedRequestCount: number;
  concurrency: number;
  timeoutSeconds: number;
  retryPolicy: string;
  retryOnlyFailedBehavior: string;
  estimatedBaseCostUsd: number;
  estimatedMaxRetryAdjustedCostUsd: number;
  stagingIndexVersionNaming: string;
  activationCriteria: string[];
  rollbackPlan: string[];
  failureHandling: string[];
  verificationQueries: string[];
  sourceSha: string;
}

const COST_PER_MILLION_TOKENS_USD = 0.02;

export function buildEmbeddingDryRunReport(
  chunks: RagChunkRecord[],
  options?: { batchSize?: number; concurrency?: number },
): EmbeddingDryRunReport {
  const batchSize = options?.batchSize ?? 64;
  const concurrency = options?.concurrency ?? 2;
  const totalInputTokens = chunks.reduce(
    (sum, c) => sum + estimateChunkTokens(c.charCount),
    0,
  );
  const estimatedRequestCount = Math.ceil(chunks.length / batchSize);
  const estimatedBaseCostUsd =
    (totalInputTokens / 1_000_000) * COST_PER_MILLION_TOKENS_USD;

  return {
    embeddingModel: EMBEDDING_MODEL_PLACEHOLDER,
    vectorDimensions: EMBEDDING_DIMENSIONS,
    chunkCount: chunks.length,
    totalInputTokens,
    tokenEstimationMethod: "ceil(char_count / 3.5) per chunk — conservative overestimate",
    batchSize,
    estimatedRequestCount,
    concurrency,
    timeoutSeconds: 60,
    retryPolicy: "Exponential backoff, max 3 attempts per batch; failed units recorded without duplicating successful rows",
    retryOnlyFailedBehavior:
      "Re-embed only packages in failedUnits list; skip unchanged package_checksum rows",
    estimatedBaseCostUsd: Number(estimatedBaseCostUsd.toFixed(4)),
    estimatedMaxRetryAdjustedCostUsd: Number(
      (estimatedBaseCostUsd * 1.15).toFixed(4),
    ),
    stagingIndexVersionNaming: `rag-index-v1-${CONTENT_FREEZE_SHA.slice(0, 8)}-{timestamp}`,
    activationCriteria: [
      "Staging chunk_count matches rag_index_versions.chunk_count",
      "Zero indexing_failed units in staging version",
      "All chunks have embeddings and chunk_checksum",
      "activate_rag_index_version RPC succeeds atomically",
    ],
    rollbackPlan: [
      "Call rollback_rag_index_version(previous_version_key)",
      "Verify single active version restored",
      "Plan superseded chunk cleanup from manifest diff",
    ],
    failureHandling: [
      "Mark package units indexing_failed=true without duplicating successful chunks",
      "Keep staging version in staging state until retry completes",
      "Deny activation when failed units remain",
    ],
    verificationQueries: [
      "SELECT status, chunk_count FROM rag_index_versions WHERE status='active'",
      "SELECT locale, count(*) FROM knowledge_chunks WHERE index_state='active' GROUP BY locale",
      "match_locale_knowledge_chunks smoke per locale",
    ],
    sourceSha: CONTENT_FREEZE_SHA,
  };
}
