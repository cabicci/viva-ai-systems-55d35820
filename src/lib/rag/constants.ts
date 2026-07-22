/** Approved Content Freeze SHA — sole curriculum source of truth for RAG indexing. */
export const CONTENT_FREEZE_SHA = "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2";

/** Locales in the approved 400-package corpus (100 per locale). */
export const APPROVED_LOCALES = ["ar-EG", "en", "ar-MSA", "ar-Gulf"] as const;

export type ApprovedLocale = (typeof APPROVED_LOCALES)[number];

/** Expected package count per locale and total. */
export const EXPECTED_PACKAGES_PER_LOCALE = 100;
export const EXPECTED_TOTAL_PACKAGES = 400;

/** Agent 4 scientific correction record count. */
export const EXPECTED_AG4_RECORD_COUNT = 40;

/** Runtime lesson package root (relative to repo root). */
export const LOCALE_LESSONS_ROOT = "src/lib/locale-lessons";

/** Path segments excluded from corpus discovery. */
export const EXCLUDED_PATH_SEGMENTS = [
  "reports",
  "phase13b-recovered-packages",
  "__tests__",
  "fixtures",
] as const;

/** Deterministic chunking parameters — local generation only, no embedding calls. */
export const CHUNK_MAX_CHARS = 1200;
export const CHUNK_OVERLAP_CHARS = 100;
export const CHUNK_MIN_CHARS = 20;
export const CHUNK_SOFT_MAX_CHARS = 2000;

/** Embedding model placeholder for paid execution gate — no calls in this phase. */
export const EMBEDDING_MODEL_PLACEHOLDER = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

/** RAG index version schema identifier. */
export const RAG_INDEX_VERSION = "rag-index-v1";

/** Default artifact output directory (relative to repo root). */
export const RAG_ARTIFACTS_DIR = "artifacts/rag";
