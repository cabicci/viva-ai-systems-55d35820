import {
  EXPECTED_CHUNK_COUNT,
  EXPECTED_EMBEDDING_DIMENSIONS,
  EXPECTED_EMBEDDING_MODEL,
  EXPECTED_INDEX_VERSION,
  EXPECTED_MAIN_SHA,
  EXPECTED_PACKAGE_COUNT,
  EXPECTED_PROJECT_REF,
  EXPECTED_REPOSITORY,
  EXPECTED_SOURCE_SHA,
  IMPLEMENTATION_AUTHORIZATION_ID,
  MAX_EMBEDDING_REQUESTS,
  type ImporterEnvironment,
} from "./constants";
import type { ArtifactDigests, TargetLocks } from "./types";

export class LockError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "LockError";
    this.code = code;
  }
}

export function readLocksFromEnv(env: NodeJS.ProcessEnv = process.env): TargetLocks {
  const num = (name: string, fallback?: number): number => {
    const raw = env[name];
    if (raw == null || raw === "") {
      if (fallback !== undefined) return fallback;
      throw new LockError("MISSING_LOCK", `Missing required lock ${name}`);
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      throw new LockError("INVALID_LOCK", `Non-numeric lock ${name}`);
    }
    return n;
  };
  const req = (name: string, fallback?: string): string => {
    const raw = env[name]?.trim();
    if (!raw) {
      if (fallback !== undefined) return fallback;
      throw new LockError("MISSING_LOCK", `Missing required lock ${name}`);
    }
    return raw;
  };

  return {
    controlRoomAuthorizationId: req("CONTROL_ROOM_AUTHORIZATION_ID"),
    expectedRepository: req("EXPECTED_REPOSITORY", EXPECTED_REPOSITORY),
    expectedMainSha: req("EXPECTED_MAIN_SHA", EXPECTED_MAIN_SHA),
    expectedProjectRef: req("EXPECTED_PROJECT_REF", EXPECTED_PROJECT_REF),
    expectedSourceSha: req("EXPECTED_SOURCE_SHA", EXPECTED_SOURCE_SHA),
    expectedIndexVersion: req("EXPECTED_INDEX_VERSION", EXPECTED_INDEX_VERSION),
    expectedPackageManifestSha256: req("EXPECTED_PACKAGE_MANIFEST_SHA256"),
    expectedChunkManifestSha256: req("EXPECTED_CHUNK_MANIFEST_SHA256"),
    expectedChunksSha256: req("EXPECTED_CHUNKS_SHA256"),
    expectedAuthoritativeLookupSha256: req("EXPECTED_AUTHORITATIVE_LOOKUP_SHA256"),
    expectedPackageCount: num("EXPECTED_PACKAGE_COUNT", EXPECTED_PACKAGE_COUNT),
    expectedChunkCount: num("EXPECTED_CHUNK_COUNT", EXPECTED_CHUNK_COUNT),
    expectedEmbeddingModel: req("EXPECTED_EMBEDDING_MODEL", EXPECTED_EMBEDDING_MODEL),
    expectedEmbeddingDimensions: num(
      "EXPECTED_EMBEDDING_DIMENSIONS",
      EXPECTED_EMBEDDING_DIMENSIONS,
    ),
    maxEmbeddingRequests: num("MAX_EMBEDDING_REQUESTS", MAX_EMBEDDING_REQUESTS),
    databaseUrlEnvName: req("DATABASE_URL_ENV_NAME", "SUPABASE_DB_URL"),
    providerCredentialEnvName: req("PROVIDER_CREDENTIAL_ENV_NAME", "OPENAI_API_KEY"),
    confirmInactiveRagImport: env.CONFIRM_INACTIVE_RAG_IMPORT?.trim() || undefined,
    paidCallAuthorizationId: env.PAID_CALL_AUTHORIZATION_ID?.trim() || undefined,
    executionId: req("EXECUTION_ID"),
  };
}

export function assertLocksAgainstAdmission(
  locks: TargetLocks,
  digests: ArtifactDigests,
  environment: ImporterEnvironment,
  options: {
    observedMainSha?: string;
    observedProjectRef?: string;
    databaseUrlPresent: boolean;
    providerCredentialPresent: boolean;
    databaseHostHint?: string;
  },
): void {
  if (!locks.controlRoomAuthorizationId) {
    throw new LockError("MISSING_AUTHORIZATION", "Authorization ID required");
  }
  if (environment === "disposable") {
    if (locks.controlRoomAuthorizationId !== IMPLEMENTATION_AUTHORIZATION_ID) {
      throw new LockError(
        "WRONG_AUTHORIZATION",
        "Disposable mode requires CR-RAG-INACTIVE-IMPORTER-20260724-01",
      );
    }
  } else {
    if (locks.controlRoomAuthorizationId === IMPLEMENTATION_AUTHORIZATION_ID) {
      throw new LockError(
        "WRONG_AUTHORIZATION",
        "Implementation authorization cannot authorize Production import",
      );
    }
    if (!locks.confirmInactiveRagImport) {
      throw new LockError(
        "MISSING_CONFIRMATION",
        "CONFIRM_INACTIVE_RAG_IMPORT required for Production import",
      );
    }
    if (!locks.paidCallAuthorizationId) {
      throw new LockError(
        "MISSING_PAID_AUTH",
        "PAID_CALL_AUTHORIZATION_ID required for Production import",
      );
    }
  }

  if (locks.expectedRepository !== EXPECTED_REPOSITORY) {
    throw new LockError("WRONG_REPOSITORY", "Repository lock mismatch");
  }
  if (locks.expectedMainSha !== EXPECTED_MAIN_SHA) {
    throw new LockError("WRONG_MAIN_SHA", "Main SHA lock mismatch vs candidate base");
  }
  if (options.observedMainSha && options.observedMainSha !== locks.expectedMainSha) {
    throw new LockError("WRONG_MAIN_SHA", "Observed main SHA does not match lock");
  }
  if (locks.expectedProjectRef !== EXPECTED_PROJECT_REF) {
    throw new LockError("WRONG_PROJECT_REF", "Project ref lock mismatch");
  }
  // Production must observe the locked project ref. Disposable may use an
  // isolated local identity and must not claim the Production hostname.
  if (environment === "production") {
    if (options.observedProjectRef && options.observedProjectRef !== locks.expectedProjectRef) {
      throw new LockError("WRONG_PROJECT_REF", "Observed project ref does not match lock");
    }
  }
  if (locks.expectedSourceSha !== EXPECTED_SOURCE_SHA) {
    throw new LockError("WRONG_SOURCE_SHA", "Source SHA lock mismatch");
  }
  if (locks.expectedIndexVersion !== EXPECTED_INDEX_VERSION) {
    throw new LockError("WRONG_INDEX_VERSION", "Index version lock mismatch");
  }
  if (locks.expectedPackageCount !== EXPECTED_PACKAGE_COUNT) {
    throw new LockError("WRONG_PACKAGE_COUNT", "Package count lock mismatch");
  }
  if (locks.expectedChunkCount !== EXPECTED_CHUNK_COUNT) {
    throw new LockError("WRONG_CHUNK_COUNT", "Chunk count lock mismatch");
  }
  if (locks.expectedEmbeddingModel !== EXPECTED_EMBEDDING_MODEL) {
    throw new LockError("WRONG_MODEL", "Embedding model lock mismatch");
  }
  if (locks.expectedEmbeddingDimensions !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new LockError("WRONG_DIMENSIONS", "Embedding dimensions lock mismatch");
  }
  if (locks.maxEmbeddingRequests > MAX_EMBEDDING_REQUESTS) {
    throw new LockError(
      "REQUEST_CEILING",
      `MAX_EMBEDDING_REQUESTS exceeds absolute ceiling ${MAX_EMBEDDING_REQUESTS}`,
    );
  }
  if (locks.maxEmbeddingRequests < 1) {
    throw new LockError("REQUEST_CEILING", "MAX_EMBEDDING_REQUESTS must be >= 1");
  }

  const digestChecks: Array<[keyof ArtifactDigests, string]> = [
    ["packageManifestSha256", locks.expectedPackageManifestSha256],
    ["chunkManifestSha256", locks.expectedChunkManifestSha256],
    ["chunksSha256", locks.expectedChunksSha256],
    ["authoritativeLookupSha256", locks.expectedAuthoritativeLookupSha256],
  ];
  for (const [key, expected] of digestChecks) {
    if (digests[key] !== expected.toLowerCase()) {
      throw new LockError("DIGEST_MISMATCH", `Artifact digest mismatch for ${key}`);
    }
  }

  if (environment === "production") {
    if (!options.databaseUrlPresent) {
      throw new LockError("MISSING_DB", "Database connection env absent");
    }
    if (!options.providerCredentialPresent) {
      throw new LockError("MISSING_PROVIDER", "Provider credential env absent");
    }
    const host = (options.databaseHostHint ?? "").toLowerCase();
    if (
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("0.0.0.0") ||
      host.includes("supabase_db_")
    ) {
      throw new LockError(
        "DISPOSABLE_TARGET",
        "Production mode rejects localhost/disposable database targets",
      );
    }
  }

  if (environment === "disposable") {
    if (
      options.observedProjectRef === EXPECTED_PROJECT_REF &&
      options.databaseHostHint?.includes("supabase.co")
    ) {
      throw new LockError(
        "PRODUCTION_TARGET",
        "Disposable mode rejects Production project hostname",
      );
    }
  }
}
