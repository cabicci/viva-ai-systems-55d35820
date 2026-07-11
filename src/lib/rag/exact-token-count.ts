import { getEncoding } from "js-tiktoken";
import type { RagChunkRecord } from "./types";

/** OpenAI text-embedding-3-small uses cl100k_base (same as GPT-3.5/4). */
export const EMBEDDING_TOKENIZER_LIBRARY = "js-tiktoken";
export const EMBEDDING_TOKENIZER_ENCODING = "cl100k_base";

export interface ExactTokenStats {
  total: number;
  min: number;
  max: number;
  avg: number;
  chunkCount: number;
}

let encoding: ReturnType<typeof getEncoding> | null = null;

function tokenizer() {
  if (!encoding) {
    encoding = getEncoding(EMBEDDING_TOKENIZER_ENCODING);
  }
  return encoding;
}

/** Count exact cl100k_base tokens for chunk embedding input (displayText). */
export function countChunkTokens(text: string): number {
  return tokenizer().encode(text).length;
}

/** Aggregate exact token stats for all chunks. */
export function computeExactTokenStats(chunks: RagChunkRecord[]): ExactTokenStats {
  if (chunks.length === 0) {
    return { total: 0, min: 0, max: 0, avg: 0, chunkCount: 0 };
  }

  let total = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const chunk of chunks) {
    const tokens = countChunkTokens(chunk.displayText);
    total += tokens;
    if (tokens < min) min = tokens;
    if (tokens > max) max = tokens;
  }

  return {
    total,
    min,
    max,
    avg: Number((total / chunks.length).toFixed(2)),
    chunkCount: chunks.length,
  };
}
