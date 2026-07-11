/** Frozen values from validated RAG candidate — fail closed if anything differs. */
export const CANDIDATE_SHA = "8e48d655489fcdfad4df8e33b3c93c61bbde3468";
export const CONTENT_FREEZE_SHA = "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2";
export const EXPECTED_PACKAGE_COUNT = 300;
export const EXPECTED_CHUNK_COUNT = 2692;
export const EXPECTED_PACKAGE_MANIFEST_CHECKSUM =
  "67853190cc01097504fb0ed9cf1bafd43885ddd43db8abd24b50e11f4e8c23ba";
export const EXPECTED_CHUNK_MANIFEST_CHECKSUM =
  "b598e58375d504d57f042ff2e6d0dc19c92a12909ea34a657172a9e730bb46c0";
export const EXPECTED_INPUT_TOKENS = 893_290;
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const BATCH_SIZE = 64;
export const EXPECTED_INITIAL_REQUESTS = 43;
export const COST_PER_MILLION_TOKENS_USD = 0.02;
export const MAX_APPROVED_COST_USD = 0.03;
export const MAX_RETRY_ATTEMPTS = 3;
export const VERSION_KEY = `rag-paid-staging-${CANDIDATE_SHA.slice(0, 8)}`;
