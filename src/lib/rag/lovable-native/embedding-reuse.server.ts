import type { RagChunkRecord } from "../types";
import { validateReusableEmbeddingCandidate } from "../inactive-importer/embedding-reuse";
import type { ReusableEmbeddingRow } from "../inactive-importer/types";
import { LOCKED_EMBEDDING_DIMENSIONS, LOCKED_EMBEDDING_MODEL } from "./contracts";

type CacheClient = { rpc: (name: string, args: Record<string, unknown>) =>
  Promise<{ data: unknown; error: { message: string } | null }> };

/** Read-only reuse. New staging rows always retain the current corpus metadata. */
export async function loadNativeReusableEmbeddings(admin: CacheClient, chunks: RagChunkRecord[]) {
  const { data, error } = await admin.rpc("rag_reusable_embeddings", {
    p_requests: chunks.map(chunk => ({ chunkId: chunk.chunkId, pathId: chunk.trackId,
      lessonId: chunk.lessonId, locale: chunk.locale, checksum: chunk.textChecksum })),
  });
  // A missing migration must not silently turn an incremental update into full paid reindexing.
  if (error || !Array.isArray(data)) throw new Error("EMBEDDING_REUSE_UNAVAILABLE");
  const vectors = new Map<string, number[]>();
  for (const chunk of chunks) {
    for (const candidate of data) {
      if (!candidate || candidate.chunkId !== chunk.chunkId || candidate.pathId !== chunk.trackId ||
        candidate.lessonId !== chunk.lessonId) continue;
      const vector = validateReusableEmbeddingCandidate({ content: chunk.displayText,
        checksum: chunk.textChecksum, locale: chunk.locale }, candidate as ReusableEmbeddingRow,
        { model: LOCKED_EMBEDDING_MODEL, dimensions: LOCKED_EMBEDDING_DIMENSIONS });
      if (vector) { vectors.set(chunk.chunkId, vector); break; }
    }
  }
  return vectors;
}
