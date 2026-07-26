/**
 * Lovable-native one-batch-per-invocation RAG import executor.
 * Server-only. No activation/rollback. No browser provenance authority.
 */
import type { PackageManifest, RagChunkRecord } from "../types";
import {
  LOCKED_ARTIFACT_DIGESTS,
  LOCKED_BATCH_SIZE,
  LOCKED_CHUNK_COUNT,
  LOCKED_EMBEDDING_DIMENSIONS,
  LOCKED_EMBEDDING_MODEL,
  LOCKED_INDEX_VERSION,
  LOCKED_MAX_PROVIDER_ATTEMPTS,
  LOCKED_PACKAGE_COUNT,
  LOCKED_PLANNED_BATCH_COUNT,
  LOCKED_SOURCE_SHA,
  type ClaimedBatch,
  type CommitRow,
  type RagImportStatusView,
  type SanitizedErrorCode,
} from "./contracts";
import { loadLockedCorpus } from "./corpus.server";

type AdminClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export interface EmbeddingFetchResult {
  vectors: number[][];
}

export type EmbeddingFetcher = (texts: string[]) => Promise<EmbeddingFetchResult>;

function sanitizeCode(raw: string | undefined, fallback: SanitizedErrorCode): SanitizedErrorCode {
  const code = (raw ?? fallback).split(":")[0]?.toUpperCase() ?? fallback;
  const allowed: SanitizedErrorCode[] = [
    "DIGEST_MISMATCH",
    "CORPUS_ADMISSION_FAILED",
    "MISSING_OPENAI_KEY",
    "NO_SESSION",
    "PROVIDER_ATTEMPT_CEILING",
    "PROVIDER_FAILED",
    "PROVIDER_RESPONSE_INVALID",
    "COMMIT_FAILED",
    "CLAIM_FAILED",
    "FORBIDDEN",
    "UNAUTHORIZED",
    "INTERNAL",
  ];
  return (allowed.includes(code as SanitizedErrorCode) ? code : fallback) as SanitizedErrorCode;
}

function lockedCorpusMeta(): RagImportStatusView["lockedCorpus"] {
  return {
    sourceSha: LOCKED_SOURCE_SHA,
    indexVersion: LOCKED_INDEX_VERSION,
    packageCount: LOCKED_PACKAGE_COUNT,
    chunkCount: LOCKED_CHUNK_COUNT,
    model: LOCKED_EMBEDDING_MODEL,
    dimensions: LOCKED_EMBEDDING_DIMENSIONS,
    digests: LOCKED_ARTIFACT_DIGESTS,
    executorContractVersion: "rag-lovable-native-resumable-v1",
  };
}

export function emptyStatusView(): RagImportStatusView {
  return {
    ok: true,
    executionId: null,
    stagingVersionKey: null,
    sessionState: null,
    completedBatchCount: 0,
    pendingBatchCount: 0,
    failedBatchCount: 0,
    acceptedChunkCount: 0,
    providerAttemptCount: 0,
    nextBatchOrdinal: null,
    currentActiveVersionKey: null,
    legacyLessonCount: null,
    localeLessonCount: null,
    lastErrorCode: null,
    plannedBatchCount: LOCKED_PLANNED_BATCH_COUNT,
    maxProviderAttempts: LOCKED_MAX_PROVIDER_ATTEMPTS,
    lockedCorpus: lockedCorpusMeta(),
    activationEnabled: false,
    rollbackEnabled: false,
  };
}

export function mapStatusRpc(data: Record<string, unknown> | null): RagImportStatusView {
  const base = emptyStatusView();
  if (!data || data.session === null) return base;
  return {
    ...base,
    ok: data.ok !== false,
    executionId: (data.executionId as string) ?? null,
    stagingVersionKey: (data.stagingVersionKey as string) ?? null,
    sessionState: (data.sessionState as string) ?? null,
    completedBatchCount: Number(data.completedBatchCount ?? 0),
    pendingBatchCount: Number(data.pendingBatchCount ?? 0),
    failedBatchCount: Number(data.failedBatchCount ?? 0),
    acceptedChunkCount: Number(data.acceptedChunkCount ?? 0),
    providerAttemptCount: Number(data.providerAttemptCount ?? 0),
    nextBatchOrdinal:
      data.nextBatchOrdinal === null || data.nextBatchOrdinal === undefined
        ? null
        : Number(data.nextBatchOrdinal),
    currentActiveVersionKey: (data.currentActiveVersionKey as string) ?? null,
    legacyLessonCount:
      data.legacyLessonCount === undefined || data.legacyLessonCount === null
        ? null
        : Number(data.legacyLessonCount),
    localeLessonCount:
      data.localeLessonCount === undefined || data.localeLessonCount === null
        ? null
        : Number(data.localeLessonCount),
    lastErrorCode: (data.lastErrorCode as string) ?? null,
    plannedBatchCount: Number(data.plannedBatchCount ?? LOCKED_PLANNED_BATCH_COUNT),
    maxProviderAttempts: Number(data.maxProviderAttempts ?? LOCKED_MAX_PROVIDER_ATTEMPTS),
  };
}

export function createOpenAiEmbeddingFetcher(apiKey: string): EmbeddingFetcher {
  return async (texts: string[]) => {
    if (texts.length === 0) return { vectors: [] };
    if (texts.length > LOCKED_BATCH_SIZE) {
      throw new Error("PROVIDER_RESPONSE_INVALID:batch_too_large");
    }
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCKED_EMBEDDING_MODEL,
        input: texts,
      }),
    });
    if (!resp.ok) {
      throw new Error("PROVIDER_FAILED");
    }
    const json = (await resp.json()) as {
      data?: Array<{ index: number; embedding: number[] }>;
    };
    if (!json.data || json.data.length !== texts.length) {
      throw new Error("PROVIDER_RESPONSE_INVALID:count");
    }
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    const vectors: number[][] = [];
    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i]!;
      if (row.index !== i) throw new Error("PROVIDER_RESPONSE_INVALID:index");
      const emb = row.embedding;
      if (!Array.isArray(emb) || emb.length !== LOCKED_EMBEDDING_DIMENSIONS) {
        throw new Error("PROVIDER_RESPONSE_INVALID:dims");
      }
      if (!emb.every((n) => typeof n === "number" && Number.isFinite(n))) {
        throw new Error("PROVIDER_RESPONSE_INVALID:non_finite");
      }
      vectors.push(emb);
    }
    return { vectors };
  };
}

export function buildCommitRows(input: {
  chunks: RagChunkRecord[];
  packageManifest: PackageManifest;
  versionKey: string;
  vectors: number[][];
}): CommitRow[] {
  const byPath = new Map(
    input.packageManifest.packages.map((pkg) => [pkg.packagePath, pkg] as const),
  );
  if (input.chunks.length !== input.vectors.length) {
    throw new Error("PROVIDER_RESPONSE_INVALID:count");
  }
  return input.chunks.map((chunk, i) => {
    const pkg = byPath.get(chunk.packagePath);
    if (!pkg) throw new Error("CORPUS_ADMISSION_FAILED:package_checksum");
    return {
      sourceId: chunk.chunkId,
      sourceType: "locale_lesson" as const,
      indexState: "staging" as const,
      indexVersion: input.versionKey,
      sourceSha: LOCKED_SOURCE_SHA,
      pathId: chunk.trackId,
      moduleId: chunk.moduleId,
      lessonId: chunk.lessonId,
      title: chunk.sectionHeading.slice(0, 500),
      content: chunk.displayText,
      locale: chunk.locale,
      packagePath: chunk.packagePath,
      packageChecksum: pkg.packageChecksum,
      chunkChecksum: chunk.textChecksum,
      contentVersion: pkg.canonicalVersion,
      sectionIndex: chunk.sectionIndex,
      sectionRole: chunk.sectionRole,
      chunkPosition: chunk.chunkIndex,
      contentType: chunk.contentType,
      productionRoute: chunk.productionRoute,
      embedding: input.vectors[i]!,
    };
  });
}

export async function getImportStatus(admin: AdminClient): Promise<RagImportStatusView> {
  await loadLockedCorpus();
  const { data, error } = await admin.rpc("rag_get_import_status");
  if (error) throw new Error(sanitizeCode(error.message, "INTERNAL"));
  return mapStatusRpc((data ?? null) as Record<string, unknown> | null);
}

export async function initializeOrResumeImport(admin: AdminClient) {
  await loadLockedCorpus();
  const { data, error } = await admin.rpc("rag_initialize_or_resume_import");
  if (error) throw new Error(sanitizeCode(error.message, "INTERNAL"));
  return data as Record<string, unknown>;
}

export async function validateStagingImport(admin: AdminClient) {
  await loadLockedCorpus();
  const { data, error } = await admin.rpc("rag_validate_staging_import");
  if (error) throw new Error(sanitizeCode(error.message, "INTERNAL"));
  return data as Record<string, unknown>;
}

export async function getImportEvidence(admin: AdminClient) {
  await loadLockedCorpus();
  const { data, error } = await admin.rpc("rag_get_import_evidence");
  if (error) throw new Error(sanitizeCode(error.message, "INTERNAL"));
  return data as Record<string, unknown>;
}

export async function executeNextImportBatch(options: {
  admin: AdminClient;
  embed?: EmbeddingFetcher;
}): Promise<Record<string, unknown>> {
  const corpus = await loadLockedCorpus();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !options.embed) {
    throw new Error("MISSING_OPENAI_KEY");
  }
  const embed = options.embed ?? createOpenAiEmbeddingFetcher(apiKey!);

  const claimRes = await options.admin.rpc("rag_claim_next_import_batch");
  if (claimRes.error) {
    throw new Error(sanitizeCode(claimRes.error.message, "CLAIM_FAILED"));
  }
  const claim = claimRes.data as ClaimedBatch & { ok?: boolean };
  if (claim.done) {
    return {
      ok: true,
      done: true,
      providerCalls: 0,
      executionId: claim.executionId,
      versionKey: claim.versionKey,
    };
  }

  const offset = claim.chunkOffset!;
  const count = claim.chunkCount!;
  const slice = corpus.chunks.slice(offset, offset + count);
  if (slice.length !== count) {
    await options.admin.rpc("rag_fail_import_batch", {
      p_lease_token: claim.leaseToken,
      p_error_code: "CORPUS_ADMISSION_FAILED",
    });
    throw new Error("CORPUS_ADMISSION_FAILED");
  }

  let vectors: number[][];
  try {
    const result = await embed(slice.map((c) => c.displayText));
    vectors = result.vectors;
  } catch (err) {
    const code = sanitizeCode(err instanceof Error ? err.message : undefined, "PROVIDER_FAILED");
    await options.admin.rpc("rag_fail_import_batch", {
      p_lease_token: claim.leaseToken,
      p_error_code: code,
    });
    throw new Error(code);
  }

  const rows = buildCommitRows({
    chunks: slice,
    packageManifest: corpus.packageManifest,
    versionKey: claim.versionKey,
    vectors,
  });

  const commitRes = await options.admin.rpc("rag_commit_import_batch", {
    p_lease_token: claim.leaseToken,
    p_rows: rows,
  });
  if (commitRes.error) {
    await options.admin.rpc("rag_fail_import_batch", {
      p_lease_token: claim.leaseToken,
      p_error_code: "COMMIT_FAILED",
    });
    throw new Error("COMMIT_FAILED");
  }

  return {
    ok: true,
    done: false,
    providerCalls: 1,
    batchOrdinal: claim.batchOrdinal,
    acceptedRowCount: count,
    executionId: claim.executionId,
    versionKey: claim.versionKey,
    ...(commitRes.data as object),
  };
}
