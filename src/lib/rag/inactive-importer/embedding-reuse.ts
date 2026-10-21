import { sha256CanonicalHex } from "../canonical-checksum";
import type { RagChunkRecord } from "../types";
import { sqlLiteral } from "./sql";
import type { EmbeddingProvider, EmbeddingReuseRequest, ReusableEmbeddingRow, SqlExecutor } from "./types";

/** Shared admission for CLI/native readers; never copies source metadata. */
export function validateReusableEmbeddingCandidate(
  requested: { content: string; checksum: string; locale: string },
  row: ReusableEmbeddingRow,
  provider: Pick<EmbeddingProvider, "model" | "dimensions">,
): number[] | null {
  if (
    sha256CanonicalHex(requested.content) !== requested.checksum ||
    !row || typeof row.content !== "string" || row.locale !== requested.locale ||
    row.model !== provider.model || row.dimensions !== provider.dimensions ||
    row.indexState !== "active" || row.versionStatus !== "active" || row.indexingFailed !== false ||
    // Historical Git SHA-1 or a new independently approved content SHA-256.
    // Native/CLI execution locks are checked separately and remain unchanged.
    typeof row.sourceSha !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(row.sourceSha) ||
    row.sourceSha !== row.registrySourceSha || row.chunkChecksum !== requested.checksum ||
    row.content !== requested.content || sha256CanonicalHex(row.content) !== row.chunkChecksum
  ) return null;
  let embedding: unknown = row.embedding;
  if (typeof embedding === "string") {
    try { embedding = JSON.parse(embedding); } catch { return null; }
  }
  if (!Array.isArray(embedding) || embedding.length !== provider.dimensions ||
    embedding.some((value) => typeof value !== "number" || !Number.isFinite(value))) return null;
  return [...embedding];
}

function readRows(sql: SqlExecutor, request: EmbeddingReuseRequest): ReusableEmbeddingRow[] {
  if (sql.readReusableEmbeddingRows) return sql.readReusableEmbeddingRows(request);
  const raw = sql.query(`SELECT COALESCE(json_agg(json_build_object(
      'content', kc.content, 'chunkChecksum', kc.chunk_checksum,
      'embedding', kc.embedding::text, 'locale', kc.locale,
      'model', version.embedding_model, 'dimensions', extensions.vector_dims(kc.embedding),
      'sourceSha', kc.source_sha, 'registrySourceSha', version.source_sha,
      'indexState', kc.index_state, 'versionStatus', version.status,
      'indexingFailed', kc.indexing_failed
    ) ORDER BY kc.index_version, kc.source_id), '[]'::json)::text
    FROM public.knowledge_chunks kc
    JOIN public.rag_index_versions version ON version.version_key = kc.index_version
    WHERE kc.source_type = 'locale_lesson'
      AND kc.locale = ${sqlLiteral(request.locale)}
      AND kc.chunk_checksum IN (${request.checksums.map(sqlLiteral).join(",")})
      AND kc.index_state = 'active' AND version.status = 'active'
      AND kc.indexing_failed = false AND kc.embedding IS NOT NULL
      AND kc.source_sha = version.source_sha
      AND version.embedding_model = ${sqlLiteral(request.model)}
      AND extensions.vector_dims(kc.embedding) = ${request.dimensions}`);
  const rows: unknown = JSON.parse(raw.trim() || "[]");
  if (!Array.isArray(rows)) throw new Error("Invalid embedding reuse query response");
  return rows as ReusableEmbeddingRow[];
}

/** Reuse only identical provider inputs with approved model/dimension provenance.
 * The caller inserts current authoritative metadata; no old source row is copied.
 */
export function loadReusableEmbeddings(
  sql: SqlExecutor,
  chunks: RagChunkRecord[],
  provider: Pick<EmbeddingProvider, "model" | "dimensions">,
): Map<string, number[]> {
  const vectors = new Map<string, number[]>();
  const byLocale = new Map<string, RagChunkRecord[]>();
  for (const chunk of chunks) {
    if (sha256CanonicalHex(chunk.displayText) !== chunk.textChecksum) {
      throw new Error(`Current chunk checksum mismatch: ${chunk.chunkId}`);
    }
    const group = byLocale.get(chunk.locale) ?? [];
    group.push(chunk);
    byLocale.set(chunk.locale, group);
  }
  for (const [locale, group] of byLocale) {
    const rows = readRows(sql, {
      locale,
      checksums: [...new Set(group.map((c) => c.textChecksum))],
      model: provider.model,
      dimensions: provider.dimensions,
    });
    for (const row of rows) {
      for (const chunk of group) {
        if (vectors.has(chunk.chunkId)) continue;
        const vector = validateReusableEmbeddingCandidate(
          { content: chunk.displayText, checksum: chunk.textChecksum, locale: chunk.locale }, row, provider,
        );
        if (vector) vectors.set(chunk.chunkId, vector);
      }
    }
  }
  return vectors;
}
