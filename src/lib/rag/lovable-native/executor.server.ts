/**
 * Lovable-native one-batch-per-invocation RAG import executor.
 * Server-only. No browser provenance authority.
 * First activation / reversal: CR-RAG-PRODUCTION-FIRST-ACTIVATION-20260727-01
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
import {
  ACTIVATION_CONFIRMATION,
  AUTHORIZED_BATCH_COUNT,
  AUTHORIZED_CHUNK_COUNT,
  AUTHORIZED_EXECUTION_ID,
  AUTHORIZED_MAX_PROVIDER_ATTEMPTS,
  AUTHORIZED_SOURCE_SHA,
  AUTHORIZED_STAGING_VERSION_KEY,
  ROLLBACK_CONFIRMATION,
} from "./public-ids";

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

export type LifecycleGateErrorCode =
  | SanitizedErrorCode
  | "WRONG_VERSION"
  | "WRONG_CONFIRMATION"
  | "EXECUTION_MISMATCH"
  | "SOURCE_MISMATCH"
  | "SESSION_NOT_COMPLETED"
  | "SESSION_ALREADY_COMPLETED"
  | "BATCH_COUNT_MISMATCH"
  | "CHUNK_COUNT_MISMATCH"
  | "STAGING_COUNT_MISMATCH"
  | "PROVIDER_ATTEMPT_CEILING_EXCEEDED"
  | "LAST_ERROR_PRESENT"
  | "VALIDATION_FAILED"
  | "ACTIVE_VERSION_EXISTS"
  | "ACTIVE_VERSION_COUNT_INVALID"
  | "ACTIVATION_RPC_FAILURE"
  | "ROLLBACK_UNAVAILABLE"
  | "ROLLBACK_CONFIRMATION_MISMATCH"
  | "ROLLBACK_RPC_FAILURE"
  | "MALFORMED_RPC_RESPONSE";

export class LifecycleGateError extends Error {
  readonly code: LifecycleGateErrorCode;
  constructor(code: LifecycleGateErrorCode) {
    super(code);
    this.name = "LifecycleGateError";
    this.code = code;
  }
}

function sanitizeCode(
  raw: string | undefined,
  fallback: SanitizedErrorCode | LifecycleGateErrorCode,
): LifecycleGateErrorCode {
  const code = (raw ?? fallback).split(":")[0]?.toUpperCase() ?? fallback;
  const allowed: LifecycleGateErrorCode[] = [
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
    "WRONG_VERSION",
    "WRONG_CONFIRMATION",
    "EXECUTION_MISMATCH",
    "SOURCE_MISMATCH",
    "SESSION_NOT_COMPLETED",
    "SESSION_ALREADY_COMPLETED",
    "BATCH_COUNT_MISMATCH",
    "CHUNK_COUNT_MISMATCH",
    "STAGING_COUNT_MISMATCH",
    "PROVIDER_ATTEMPT_CEILING_EXCEEDED",
    "LAST_ERROR_PRESENT",
    "VALIDATION_FAILED",
    "ACTIVE_VERSION_EXISTS",
    "ACTIVE_VERSION_COUNT_INVALID",
    "ACTIVATION_RPC_FAILURE",
    "ROLLBACK_UNAVAILABLE",
    "ROLLBACK_CONFIRMATION_MISMATCH",
    "ROLLBACK_RPC_FAILURE",
    "MALFORMED_RPC_RESPONSE",
  ];
  return (
    allowed.includes(code as LifecycleGateErrorCode) ? code : fallback
  ) as LifecycleGateErrorCode;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readErrorArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return value as string[];
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

/**
 * When the locked Production import is already completed, refuse init/batch
 * so SQL cannot open a second session (init) or attempt another claim.
 */
export async function assertImportMutationAllowed(
  admin: AdminClient,
): Promise<RagImportStatusView> {
  const status = await getImportStatus(admin);
  if (status.sessionState === "completed") {
    throw new LifecycleGateError("SESSION_ALREADY_COMPLETED");
  }
  return status;
}

export async function initializeOrResumeImport(admin: AdminClient) {
  await assertImportMutationAllowed(admin);
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
  await assertImportMutationAllowed(options.admin);
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

export type ActivationEvidence = {
  ok: true;
  activated: true;
  versionKey: typeof AUTHORIZED_STAGING_VERSION_KEY;
  executionId: typeof AUTHORIZED_EXECUTION_ID;
  sourceSha: typeof AUTHORIZED_SOURCE_SHA;
  activatedChunks: number;
  activeVersionCountAfter: number;
};

export type RollbackEvidence = {
  ok: true;
  rolledBack: true;
  versionKey: typeof AUTHORIZED_STAGING_VERSION_KEY;
  activeVersions: number;
};

function assertExactActivationInput(input: { versionKey: string; confirmation: string }) {
  if (input.versionKey !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("WRONG_VERSION");
  }
  if (input.confirmation !== ACTIVATION_CONFIRMATION) {
    throw new LifecycleGateError("WRONG_CONFIRMATION");
  }
}

function assertExactRollbackInput(input: { versionKey: string; confirmation: string }) {
  if (input.versionKey !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("WRONG_VERSION");
  }
  if (input.confirmation !== ROLLBACK_CONFIRMATION) {
    throw new LifecycleGateError("ROLLBACK_CONFIRMATION_MISMATCH");
  }
}

function assertPreActivationStatus(status: RagImportStatusView) {
  if (status.executionId !== AUTHORIZED_EXECUTION_ID) {
    throw new LifecycleGateError("EXECUTION_MISMATCH");
  }
  if (status.stagingVersionKey !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("WRONG_VERSION");
  }
  if (status.lockedCorpus.sourceSha !== AUTHORIZED_SOURCE_SHA) {
    throw new LifecycleGateError("SOURCE_MISMATCH");
  }
  if (status.sessionState !== "completed") {
    throw new LifecycleGateError("SESSION_NOT_COMPLETED");
  }
  if (status.completedBatchCount !== AUTHORIZED_BATCH_COUNT) {
    throw new LifecycleGateError("BATCH_COUNT_MISMATCH");
  }
  if (status.plannedBatchCount !== AUTHORIZED_BATCH_COUNT) {
    throw new LifecycleGateError("BATCH_COUNT_MISMATCH");
  }
  if (status.acceptedChunkCount !== AUTHORIZED_CHUNK_COUNT) {
    throw new LifecycleGateError("CHUNK_COUNT_MISMATCH");
  }
  if (status.providerAttemptCount < 0) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }
  if (status.providerAttemptCount > AUTHORIZED_MAX_PROVIDER_ATTEMPTS) {
    throw new LifecycleGateError("PROVIDER_ATTEMPT_CEILING_EXCEEDED");
  }
  if (status.lastErrorCode !== null) {
    throw new LifecycleGateError("LAST_ERROR_PRESENT");
  }
  if (status.currentActiveVersionKey !== null) {
    throw new LifecycleGateError("ACTIVE_VERSION_EXISTS");
  }
}

function assertPreActivationValidation(validation: Record<string, unknown>) {
  const ok = readBoolean(validation.ok);
  const errors = readErrorArray(validation.errors);
  if (ok !== true) throw new LifecycleGateError("VALIDATION_FAILED");
  if (errors === null) throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  if (errors.length !== 0) throw new LifecycleGateError("VALIDATION_FAILED");

  const versionKey = readString(validation.versionKey);
  if (versionKey !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("WRONG_VERSION");
  }
  const sourceSha = readString(validation.sourceSha);
  if (sourceSha !== AUTHORIZED_SOURCE_SHA) {
    throw new LifecycleGateError("SOURCE_MISMATCH");
  }
  const stagingChunkCount = readNumber(validation.stagingChunkCount);
  if (stagingChunkCount !== AUTHORIZED_CHUNK_COUNT) {
    throw new LifecycleGateError("STAGING_COUNT_MISMATCH");
  }
  const activeVersionCount = readNumber(validation.activeVersionCount);
  if (activeVersionCount === null) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }
  if (activeVersionCount !== 0) {
    throw new LifecycleGateError(
      activeVersionCount > 1 ? "ACTIVE_VERSION_COUNT_INVALID" : "ACTIVE_VERSION_EXISTS",
    );
  }
}

/**
 * Fail-closed first Production activation. Calls activate_rag_index_version exactly once
 * only after every trusted precheck passes.
 */
export async function activateAuthorizedRagIndexVersion(
  admin: AdminClient,
  input: { versionKey: string; confirmation: string },
): Promise<ActivationEvidence> {
  assertExactActivationInput(input);

  const status = await getImportStatus(admin);
  assertPreActivationStatus(status);

  const validationRaw = await validateStagingImport(admin);
  const validation = asRecord(validationRaw);
  if (!validation) throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  assertPreActivationValidation(validation);

  // Re-check active state immediately before the single activation RPC.
  const statusAgain = await getImportStatus(admin);
  if (statusAgain.currentActiveVersionKey !== null) {
    throw new LifecycleGateError("ACTIVE_VERSION_EXISTS");
  }
  if (statusAgain.executionId !== AUTHORIZED_EXECUTION_ID) {
    throw new LifecycleGateError("EXECUTION_MISMATCH");
  }
  if (statusAgain.stagingVersionKey !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("WRONG_VERSION");
  }

  const rpc = await admin.rpc("activate_rag_index_version", {
    p_version_key: AUTHORIZED_STAGING_VERSION_KEY,
  });
  if (rpc.error) {
    throw new LifecycleGateError("ACTIVATION_RPC_FAILURE");
  }
  const result = asRecord(rpc.data);
  if (!result) throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  if (result.ok !== true) throw new LifecycleGateError("ACTIVATION_RPC_FAILURE");
  if (readString(result.version_key) !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }
  const activatedChunks = readNumber(result.activated_chunks);
  if (activatedChunks === null || activatedChunks !== AUTHORIZED_CHUNK_COUNT) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }

  return {
    ok: true,
    activated: true,
    versionKey: AUTHORIZED_STAGING_VERSION_KEY,
    executionId: AUTHORIZED_EXECUTION_ID,
    sourceSha: AUTHORIZED_SOURCE_SHA,
    activatedChunks,
    activeVersionCountAfter: 1,
  };
}

/**
 * Guarded first-activation reversal wrapper. Does not run unless the exact
 * locked version is the sole active version. Uses rag_deactivate_first_active_version(text).
 *
 * Staging validation may report ok=false after activation (chunks are no longer staging);
 * activeVersionCount from that response is still trusted for the sole-active gate.
 */
export async function rollbackAuthorizedRagIndexVersion(
  admin: AdminClient,
  input: { versionKey: string; confirmation: string },
): Promise<RollbackEvidence> {
  assertExactRollbackInput(input);

  const status = await getImportStatus(admin);
  if (status.currentActiveVersionKey === null) {
    throw new LifecycleGateError("ROLLBACK_UNAVAILABLE");
  }
  if (status.currentActiveVersionKey !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("WRONG_VERSION");
  }

  const validationRaw = await validateStagingImport(admin);
  const validation = asRecord(validationRaw);
  if (!validation) throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  const activeVersionCount = readNumber(validation.activeVersionCount);
  if (activeVersionCount === null) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }
  if (activeVersionCount === 0) {
    throw new LifecycleGateError("ROLLBACK_UNAVAILABLE");
  }
  if (activeVersionCount !== 1) {
    throw new LifecycleGateError("ACTIVE_VERSION_COUNT_INVALID");
  }

  const rpc = await admin.rpc("rag_deactivate_first_active_version", {
    p_version_key: AUTHORIZED_STAGING_VERSION_KEY,
  });
  if (rpc.error) {
    const msg = (rpc.error.message ?? "").toUpperCase();
    if (msg.includes("VERSION_NOT_ACTIVE") || msg.includes("PRIOR_SUPERSEDED_EXISTS")) {
      throw new LifecycleGateError("ROLLBACK_UNAVAILABLE");
    }
    throw new LifecycleGateError("ROLLBACK_RPC_FAILURE");
  }
  const result = asRecord(rpc.data);
  if (!result) throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  if (result.ok !== true) throw new LifecycleGateError("ROLLBACK_RPC_FAILURE");
  if (readString(result.versionKey) !== AUTHORIZED_STAGING_VERSION_KEY) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }
  const activeVersions = readNumber(result.activeVersions);
  if (activeVersions !== 0) {
    throw new LifecycleGateError("MALFORMED_RPC_RESPONSE");
  }

  return {
    ok: true,
    rolledBack: true,
    versionKey: AUTHORIZED_STAGING_VERSION_KEY,
    activeVersions: 0,
  };
}
