import type { PackageManifest, RagChunkRecord } from "../types";
import {
  EXPECTED_CHUNK_COUNT,
  EXPECTED_EMBEDDING_DIMENSIONS,
  EXPECTED_EMBEDDING_MODEL,
  EXPECTED_SOURCE_SHA,
  INDEX_STATE_STAGING,
  SOURCE_TYPE_LOCALE_LESSON,
} from "./constants";
import type { LocaleCountMap, SqlExecutor, StagingValidationResult } from "./types";

function emptyLocaleCounts(): LocaleCountMap {
  return { "ar-EG": 0, "ar-MSA": 0, "ar-Gulf": 0, en: 0 };
}

export function validateStagingVersion(
  sql: SqlExecutor,
  stagingVersionKey: string,
): StagingValidationResult {
  const errors: string[] = [];

  const registry = sql
    .query(
      `SELECT version_key, source_sha, status, package_count, chunk_count, embedding_model, chunk_manifest_checksum
       FROM public.rag_index_versions
       WHERE version_key = '${stagingVersionKey.replace(/'/g, "''")}'`,
    )
    .trim();

  if (!registry) {
    errors.push("staging version registry row missing");
    return {
      ok: false,
      stagingVersionKey,
      packageCount: 0,
      chunkCount: 0,
      stagingChunkCount: 0,
      activeChunkCountCreatedByImporter: 0,
      localeChunkCounts: emptyLocaleCounts(),
      vectorDimensionOk: false,
      nonFiniteVectors: 0,
      activeCorpusMutationCount: 0,
      errors,
    };
  }

  const parts = registry.split("|");
  const status = parts[2] ?? "";
  const packageCount = Number(parts[3] ?? 0);
  const chunkCount = Number(parts[4] ?? 0);
  const embeddingModel = parts[5] ?? "";
  const sourceSha = parts[1] ?? "";

  if (status !== INDEX_STATE_STAGING) {
    errors.push(`expected staging status, found ${status}`);
  }
  if (sourceSha !== EXPECTED_SOURCE_SHA) {
    errors.push("registry source_sha mismatch");
  }
  if (embeddingModel !== EXPECTED_EMBEDDING_MODEL) {
    errors.push("registry embedding_model mismatch");
  }
  if (chunkCount !== EXPECTED_CHUNK_COUNT) {
    errors.push(`registry chunk_count ${chunkCount} != ${EXPECTED_CHUNK_COUNT}`);
  }

  const stagingChunkCount = Number(
    sql
      .query(
        `SELECT count(*)::text FROM public.knowledge_chunks
         WHERE index_version = '${stagingVersionKey.replace(/'/g, "''")}'
           AND source_type = '${SOURCE_TYPE_LOCALE_LESSON}'
           AND index_state = '${INDEX_STATE_STAGING}'
           AND indexing_failed = false`,
      )
      .trim(),
  );

  if (stagingChunkCount !== EXPECTED_CHUNK_COUNT) {
    errors.push(`staging chunk count ${stagingChunkCount} != ${EXPECTED_CHUNK_COUNT}`);
  }

  const activeFromVersion = Number(
    sql
      .query(
        `SELECT count(*)::text FROM public.knowledge_chunks
         WHERE index_version = '${stagingVersionKey.replace(/'/g, "''")}'
           AND index_state = 'active'`,
      )
      .trim(),
  );
  if (activeFromVersion !== 0) {
    errors.push("importer must not create active chunks");
  }

  const dimBad = Number(
    sql
      .query(
        `SELECT count(*)::text FROM public.knowledge_chunks
         WHERE index_version = '${stagingVersionKey.replace(/'/g, "''")}'
           AND source_type = '${SOURCE_TYPE_LOCALE_LESSON}'
           AND (
             embedding IS NULL
             OR extensions.vector_dims(embedding) <> ${EXPECTED_EMBEDDING_DIMENSIONS}
           )`,
      )
      .trim(),
  );
  if (dimBad !== 0) {
    errors.push(`vector dimension failures: ${dimBad}`);
  }

  const localeRows = sql
    .query(
      `SELECT locale || '=' || count(*)::text
       FROM public.knowledge_chunks
       WHERE index_version = '${stagingVersionKey.replace(/'/g, "''")}'
         AND source_type = '${SOURCE_TYPE_LOCALE_LESSON}'
         AND index_state = '${INDEX_STATE_STAGING}'
       GROUP BY locale
       ORDER BY locale`,
    )
    .trim()
    .split("\n")
    .filter(Boolean);

  const localeChunkCounts = emptyLocaleCounts();
  for (const row of localeRows) {
    const [locale, countRaw] = row.split("=");
    if (locale && locale in localeChunkCounts) {
      localeChunkCounts[locale as keyof LocaleCountMap] = Number(countRaw);
    }
  }

  return {
    ok: errors.length === 0,
    stagingVersionKey,
    packageCount,
    chunkCount,
    stagingChunkCount,
    activeChunkCountCreatedByImporter: activeFromVersion,
    localeChunkCounts,
    vectorDimensionOk: dimBad === 0,
    nonFiniteVectors: 0,
    activeCorpusMutationCount: 0,
    errors,
  };
}

export function snapshotActiveCorpusFingerprint(sql: SqlExecutor): string {
  return sql
    .query(
      `SELECT coalesce((
           SELECT string_agg(version_key || ':' || status || ':' || chunk_count::text, ',' ORDER BY version_key)
           FROM public.rag_index_versions
           WHERE status = 'active'
         ), '')
         || '|' ||
       coalesce((
           SELECT count(*)::text FROM public.knowledge_chunks WHERE index_state = 'active'
         ), '0')
         || '|' ||
       coalesce((
           SELECT md5(string_agg(id::text || ':' || coalesce(index_version,'') || ':' || coalesce(index_state,''), ',' ORDER BY id::text))
           FROM public.knowledge_chunks WHERE index_state = 'active'
         ), '')`,
    )
    .trim();
}

export type LoadedCorpus = {
  packageManifest: PackageManifest;
  chunks: RagChunkRecord[];
};
