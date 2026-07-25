/**
 * Production-safe inactive RAG importer locks.
 * Implementation authorization CR-RAG-INACTIVE-IMPORTER-20260724-01 is for
 * disposable validation only — never Production corpus import.
 */

import {
  CONTENT_FREEZE_SHA,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_PLACEHOLDER,
  EXPECTED_PACKAGES_PER_LOCALE,
  EXPECTED_TOTAL_PACKAGES,
  RAG_INDEX_VERSION,
} from "../constants";

/** Disposable-validation authorization only (not Production execution). */
export const IMPLEMENTATION_AUTHORIZATION_ID = "CR-RAG-INACTIVE-IMPORTER-20260724-01";

export const EXPECTED_REPOSITORY = "cabicci/viva-ai-systems-55d35820";

/** Repo-tracked Supabase project_id — Production confirmation is a separate Control Room gate. */
export const EXPECTED_PROJECT_REF = "abyqqeboyrkkwhjpwmtd";

export const EXPECTED_SOURCE_SHA = CONTENT_FREEZE_SHA;
export const EXPECTED_INDEX_VERSION = RAG_INDEX_VERSION;
export const EXPECTED_PACKAGE_COUNT = EXPECTED_TOTAL_PACKAGES;
export const EXPECTED_CHUNK_COUNT = 3700;
export const EXPECTED_EMBEDDING_MODEL = EMBEDDING_MODEL_PLACEHOLDER;
export const EXPECTED_EMBEDDING_DIMENSIONS = EMBEDDING_DIMENSIONS;

export const EXPECTED_LOCALE_PACKAGE_COUNTS = {
  "ar-EG": EXPECTED_PACKAGES_PER_LOCALE,
  "ar-MSA": EXPECTED_PACKAGES_PER_LOCALE,
  "ar-Gulf": EXPECTED_PACKAGES_PER_LOCALE,
  en: EXPECTED_PACKAGES_PER_LOCALE,
} as const;

export const EXPECTED_LOCALE_CHUNK_COUNTS = {
  "ar-EG": 1008,
  "ar-MSA": 866,
  "ar-Gulf": 862,
  en: 964,
} as const;

export const PACKAGE_MANIFEST_SCHEMA = "package-manifest-v1" as const;
export const CHUNK_MANIFEST_SCHEMA = "chunk-manifest-v1" as const;
export const LOOKUP_SCHEMA = "authoritative-corpus-lookup-v1" as const;

/** Provider ceilings — every attempt including retries counts. */
export const EMBEDDING_BATCH_SIZE = 64;
export const EMBEDDING_CONCURRENCY = 2;
export const EMBEDDING_TIMEOUT_MS = 60_000;
export const EMBEDDING_MAX_ATTEMPTS_PER_BATCH = 3;
export const BASE_EMBEDDING_REQUESTS = 58;
export const MAX_EMBEDDING_REQUESTS = 67;

export const SOURCE_TYPE_LOCALE_LESSON = "locale_lesson" as const;
export const INDEX_STATE_STAGING = "staging" as const;

export const FORBIDDEN_MODES = [
  "activate",
  "rollback",
  "seed-100",
  "delete",
  "replace",
  "truncate",
] as const;

export type ImporterEnvironment = "disposable" | "production";
export type ImporterOperation = "preflight" | "import" | "validate";

export const ARTIFACT_REL_PATHS = {
  packageManifest: "artifacts/rag/package-manifest.json",
  chunkManifest: "artifacts/rag/chunk-manifest.json",
  chunks: "artifacts/rag/chunks.json",
  authoritativeLookup: "artifacts/rag/authoritative-lookup.json",
} as const;

export const REPORT_SCHEMA_VERSION = "rag-inactive-importer-report-v1" as const;
