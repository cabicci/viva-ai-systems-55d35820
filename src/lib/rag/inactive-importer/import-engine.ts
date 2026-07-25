import type { PackageManifest, RagChunkRecord } from "../types";
import {
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_CONCURRENCY,
  EXPECTED_CHUNK_COUNT,
  EXPECTED_EMBEDDING_DIMENSIONS,
  EXPECTED_EMBEDDING_MODEL,
  EXPECTED_PACKAGE_COUNT,
  EXPECTED_SOURCE_SHA,
  INDEX_STATE_STAGING,
  SOURCE_TYPE_LOCALE_LESSON,
} from "./constants";
import { assertProviderMatchesEnvironment } from "./embeddings";
import { formatVectorLiteral, sqlLiteral, sqlNullableText } from "./sql";
import type { EmbeddingProvider, RowProgress, SqlExecutor } from "./types";

export class ImportEngineError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ImportEngineError";
    this.code = code;
  }
}

function groupChunksByPackage(chunks: RagChunkRecord[]): Map<string, RagChunkRecord[]> {
  const map = new Map<string, RagChunkRecord[]>();
  for (const chunk of chunks) {
    const list = map.get(chunk.packagePath) ?? [];
    list.push(chunk);
    map.set(chunk.packagePath, list);
  }
  return map;
}

export function ensureStagingRegistry(options: {
  sql: SqlExecutor;
  versionKey: string;
  sourceSha: string;
  packageCount: number;
  chunkCount: number;
  chunkManifestChecksum: string;
  embeddingModel: string;
}): void {
  const existing = options.sql
    .query(
      `SELECT version_key || '|' || source_sha || '|' || status || '|' || package_count::text || '|' || chunk_count::text || '|' || chunk_manifest_checksum || '|' || embedding_model
       FROM public.rag_index_versions
       WHERE version_key = ${sqlLiteral(options.versionKey)}`,
    )
    .trim();

  if (!existing) {
    options.sql.query(
      `INSERT INTO public.rag_index_versions (
         version_key, source_sha, status, package_count, chunk_count,
         chunk_manifest_checksum, embedding_model
       ) VALUES (
         ${sqlLiteral(options.versionKey)},
         ${sqlLiteral(options.sourceSha)},
         ${sqlLiteral(INDEX_STATE_STAGING)},
         ${options.packageCount},
         ${options.chunkCount},
         ${sqlLiteral(options.chunkManifestChecksum)},
         ${sqlLiteral(options.embeddingModel)}
       )`,
    );
    return;
  }

  const [, sourceSha, status, packageCount, chunkCount, checksum, embeddingModel] =
    existing.split("|");
  if (sourceSha !== options.sourceSha) {
    throw new ImportEngineError(
      "SOURCE_SHA_CONFLICT",
      "Existing staging version has different source_sha",
    );
  }
  if (checksum !== options.chunkManifestChecksum) {
    throw new ImportEngineError(
      "MANIFEST_DIGEST_CONFLICT",
      "Existing staging version has different chunk_manifest_checksum",
    );
  }
  if (Number(packageCount) !== options.packageCount) {
    throw new ImportEngineError(
      "PACKAGE_COUNT_CONFLICT",
      "Existing staging version package_count mismatch",
    );
  }
  if (Number(chunkCount) !== options.chunkCount) {
    throw new ImportEngineError(
      "CHUNK_COUNT_CONFLICT",
      "Existing staging version chunk_count mismatch",
    );
  }
  if (embeddingModel !== options.embeddingModel) {
    throw new ImportEngineError(
      "MODEL_CONFLICT",
      "Existing staging version embedding_model mismatch",
    );
  }
  if (status !== INDEX_STATE_STAGING) {
    throw new ImportEngineError(
      "STATUS_CONFLICT",
      `Existing version status is ${status}, expected staging`,
    );
  }
}

function loadExistingChunkIndex(sql: SqlExecutor, versionKey: string): Map<string, string> {
  const raw = sql
    .query(
      `SELECT source_id || '|' || coalesce(chunk_checksum,'') || '|' || coalesce(package_checksum,'') || '|' || coalesce(source_sha,'') || '|' || coalesce(index_state,'') || '|' || coalesce(extensions.vector_dims(embedding)::text,'0') || '|' || coalesce(indexing_failed::text,'false')
       FROM public.knowledge_chunks
       WHERE index_version = ${sqlLiteral(versionKey)}
         AND source_type = ${sqlLiteral(SOURCE_TYPE_LOCALE_LESSON)}`,
    )
    .trim();
  const map = new Map<string, string>();
  if (!raw) return map;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const sourceId = line.split("|")[0]!;
    map.set(sourceId, line);
  }
  return map;
}

async function embedPackageChunks(
  provider: EmbeddingProvider,
  chunks: RagChunkRecord[],
  attemptState: { attempted: number; max: number },
): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const remaining = attemptState.max - attemptState.attempted;
    const { vectors, attemptsUsed } = await provider.embedBatch(
      batch.map((c) => c.displayText),
      { attemptBudgetRemaining: remaining },
    );
    attemptState.attempted += attemptsUsed;
    if (attemptState.attempted > attemptState.max) {
      throw new ImportEngineError(
        "REQUEST_CEILING",
        `Abort before request ${attemptState.max + 1}`,
      );
    }
    for (let j = 0; j < batch.length; j++) {
      const vec = vectors[j]!;
      if (vec.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
        throw new ImportEngineError("WRONG_DIMENSIONS", `Vector dims ${vec.length}`);
      }
      if (vec.some((n) => !Number.isFinite(n))) {
        throw new ImportEngineError("NON_FINITE_VECTOR", "Non-finite vector");
      }
      out.set(batch[j]!.chunkId, vec);
    }
  }
  return out;
}

/**
 * Import one package transactionally. Exact matching rows are skipped;
 * conflicts fail the package.
 */
export async function importPackageUnit(options: {
  sql: SqlExecutor;
  versionKey: string;
  pkg: PackageManifest["packages"][number];
  chunks: RagChunkRecord[];
  provider: EmbeddingProvider;
  attemptState: { attempted: number; max: number };
  progress: RowProgress;
  existingBySourceId: Map<string, string>;
}): Promise<void> {
  const { sql, versionKey, pkg, chunks, provider, attemptState, progress, existingBySourceId } =
    options;

  if (pkg.sourceSha !== EXPECTED_SOURCE_SHA) {
    throw new ImportEngineError("MIXED_SOURCE", "Package sourceSha mismatch");
  }

  const toEmbed: RagChunkRecord[] = [];
  for (const chunk of chunks) {
    if (chunk.packagePath !== pkg.packagePath) {
      throw new ImportEngineError("PACKAGE_IDENTITY", "Chunk packagePath mismatch");
    }
    if (chunk.locale !== pkg.locale || chunk.lessonId !== pkg.lessonId) {
      throw new ImportEngineError(
        "MIXED_LOCALE_IDENTITY",
        "Chunk locale/lesson mismatch vs package",
      );
    }
    const existing = existingBySourceId.get(chunk.chunkId) ?? null;
    if (!existing) {
      toEmbed.push(chunk);
      continue;
    }
    const [, chunkChecksum, packageChecksum, sourceSha, indexState, dims, failed] =
      existing.split("|");
    if (
      chunkChecksum === chunk.textChecksum &&
      packageChecksum === pkg.packageChecksum &&
      sourceSha === EXPECTED_SOURCE_SHA &&
      indexState === INDEX_STATE_STAGING &&
      Number(dims) === EXPECTED_EMBEDDING_DIMENSIONS &&
      failed === "false"
    ) {
      progress.skippedExact += 1;
      continue;
    }
    progress.conflicting += 1;
    throw new ImportEngineError("CONFLICTING_ROW", `Conflicting existing row for ${chunk.chunkId}`);
  }

  if (toEmbed.length === 0) return;

  const vectors = await embedPackageChunks(provider, toEmbed, attemptState);

  const useStructured = typeof sql.insertStagingChunk === "function";
  try {
    if (useStructured) {
      sql.begin?.();
      for (const chunk of toEmbed) {
        const vec = vectors.get(chunk.chunkId);
        if (!vec) {
          throw new ImportEngineError("MISSING_VECTOR", chunk.chunkId);
        }
        sql.insertStagingChunk!({
          sourceId: chunk.chunkId,
          pathId: chunk.trackId,
          moduleId: chunk.moduleId,
          lessonId: chunk.lessonId,
          title: chunk.sectionHeading.slice(0, 500),
          content: chunk.displayText,
          embedding: vec,
          locale: chunk.locale,
          packagePath: chunk.packagePath,
          sourceSha: EXPECTED_SOURCE_SHA,
          packageChecksum: pkg.packageChecksum,
          chunkChecksum: chunk.textChecksum,
          contentVersion: pkg.canonicalVersion,
          indexVersion: versionKey,
          indexState: INDEX_STATE_STAGING,
          sectionIndex: chunk.sectionIndex,
          sectionRole: chunk.sectionRole,
          chunkPosition: chunk.chunkIndex,
          contentType: chunk.contentType,
          productionRoute: chunk.productionRoute,
          indexingFailed: false,
        });
        existingBySourceId.set(
          chunk.chunkId,
          `${chunk.chunkId}|${chunk.textChecksum}|${pkg.packageChecksum}|${EXPECTED_SOURCE_SHA}|${INDEX_STATE_STAGING}|${EXPECTED_EMBEDDING_DIMENSIONS}|false`,
        );
      }
      sql.commit?.();
    } else {
      const statements: string[] = ["BEGIN"];
      for (const chunk of toEmbed) {
        const vec = vectors.get(chunk.chunkId);
        if (!vec) {
          throw new ImportEngineError("MISSING_VECTOR", chunk.chunkId);
        }
        statements.push(
          `INSERT INTO public.knowledge_chunks (
             source_type, source_id, path_id, module_id, lesson_id, title, content, embedding,
             locale, package_path, source_sha, package_checksum, chunk_checksum, content_version,
             index_version, index_state, section_index, section_role, chunk_position, content_type,
             production_route, indexing_failed
           ) VALUES (
             ${sqlLiteral(SOURCE_TYPE_LOCALE_LESSON)},
             ${sqlLiteral(chunk.chunkId)},
             ${sqlLiteral(chunk.trackId)},
             ${sqlLiteral(chunk.moduleId)},
             ${sqlLiteral(chunk.lessonId)},
             ${sqlLiteral(chunk.sectionHeading.slice(0, 500))},
             ${sqlLiteral(chunk.displayText)},
             ${sqlLiteral(formatVectorLiteral(vec))}::extensions.vector,
             ${sqlLiteral(chunk.locale)},
             ${sqlLiteral(chunk.packagePath)},
             ${sqlLiteral(EXPECTED_SOURCE_SHA)},
             ${sqlLiteral(pkg.packageChecksum)},
             ${sqlLiteral(chunk.textChecksum)},
             ${sqlNullableText(pkg.canonicalVersion)},
             ${sqlLiteral(versionKey)},
             ${sqlLiteral(INDEX_STATE_STAGING)},
             ${chunk.sectionIndex},
             ${sqlLiteral(chunk.sectionRole)},
             ${chunk.chunkIndex},
             ${sqlLiteral(chunk.contentType)},
             ${sqlNullableText(chunk.productionRoute)},
             false
           )`,
        );
        existingBySourceId.set(
          chunk.chunkId,
          `${chunk.chunkId}|${chunk.textChecksum}|${pkg.packageChecksum}|${EXPECTED_SOURCE_SHA}|${INDEX_STATE_STAGING}|${EXPECTED_EMBEDDING_DIMENSIONS}|false`,
        );
      }
      statements.push("COMMIT");
      sql.query(`${statements.join(";\n")};`);
    }
    progress.inserted += toEmbed.length;
  } catch (err) {
    try {
      if (useStructured) sql.rollback?.();
      else sql.query("ROLLBACK;");
    } catch {
      /* ignore */
    }
    progress.failed += toEmbed.length;
    throw err;
  }
}

export async function runInactiveImport(options: {
  sql: SqlExecutor;
  environment: "disposable" | "production";
  provider: EmbeddingProvider;
  versionKey: string;
  packageManifest: PackageManifest;
  chunks: RagChunkRecord[];
  chunkManifestChecksum: string;
  maxEmbeddingRequests: number;
  interruptAfterPackages?: number;
  initialAttemptedRequests?: number;
}): Promise<{
  progress: RowProgress;
  attemptedRequestCount: number;
  interrupted: boolean;
  packagesProcessed: number;
}> {
  assertProviderMatchesEnvironment(options.provider, options.environment);

  if (options.packageManifest.packageCount !== EXPECTED_PACKAGE_COUNT) {
    throw new ImportEngineError("PACKAGE_COUNT", "Unexpected package count");
  }
  if (options.chunks.length !== EXPECTED_CHUNK_COUNT) {
    throw new ImportEngineError("CHUNK_COUNT", "Unexpected chunk count");
  }

  ensureStagingRegistry({
    sql: options.sql,
    versionKey: options.versionKey,
    sourceSha: EXPECTED_SOURCE_SHA,
    packageCount: EXPECTED_PACKAGE_COUNT,
    chunkCount: EXPECTED_CHUNK_COUNT,
    chunkManifestChecksum: options.chunkManifestChecksum,
    embeddingModel: EXPECTED_EMBEDDING_MODEL,
  });

  const byPackage = groupChunksByPackage(options.chunks);
  const progress: RowProgress = {
    inserted: 0,
    skippedExact: 0,
    conflicting: 0,
    failed: 0,
  };
  const attemptState = {
    attempted: options.initialAttemptedRequests ?? 0,
    max: options.maxEmbeddingRequests,
  };
  const existingBySourceId = loadExistingChunkIndex(options.sql, options.versionKey);

  let packagesProcessed = 0;
  let interrupted = false;

  // Bound concurrency at package level conceptually; sequential packages keep
  // resumability simple and still respect EMBEDDING_CONCURRENCY inside batches.
  void EMBEDDING_CONCURRENCY;

  for (const pkg of options.packageManifest.packages) {
    if (
      options.interruptAfterPackages != null &&
      packagesProcessed >= options.interruptAfterPackages
    ) {
      interrupted = true;
      break;
    }
    const chunks = byPackage.get(pkg.packagePath) ?? [];
    if (chunks.length !== pkg.chunkCount) {
      throw new ImportEngineError(
        "PARTIAL_PACKAGE",
        `Package ${pkg.packagePath} chunk count mismatch`,
      );
    }
    await importPackageUnit({
      sql: options.sql,
      versionKey: options.versionKey,
      pkg,
      chunks,
      provider: options.provider,
      attemptState,
      progress,
      existingBySourceId,
    });
    packagesProcessed += 1;
  }

  return {
    progress,
    attemptedRequestCount: attemptState.attempted,
    interrupted,
    packagesProcessed,
  };
}
