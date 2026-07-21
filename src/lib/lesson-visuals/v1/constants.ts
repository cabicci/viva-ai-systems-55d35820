/**
 * Immutable candidate-base pin for Lesson Images production.
 * Always the approved origin/main SHA used to author/repin masters — never the candidate tip.
 */
export const AUTHORITATIVE_BASE_SOURCE_SHA =
  "b211cd43ed8378dcc9921d85b19a7e8ef6c7b70d" as const;

export const AUTHORIZED_MANIFEST_RELATIVE_PATH =
  "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json" as const;

export const AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH =
  "docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json" as const;

export const EXPECTED_PILOT_CELL_COUNT = 12;

export const PRODUCTION_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;

export const EXPECTED_LESSON_COUNT = 100;
export const EXPECTED_CELL_COUNT = 400;
export const EXPECTED_PER_LOCALE = 100;

/** Raster production policy (provider-neutral). */
export const DEFAULT_REQUIRED_WIDTH = 1280;
export const DEFAULT_REQUIRED_HEIGHT = 720;
export const DEFAULT_ALLOWED_MIME_TYPES = ["image/png"] as const;
export const DEFAULT_MAX_OUTPUT_BYTES = 8_000_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_MAX_PARALLEL = 20;
export const MAX_PARALLEL_CEILING = 50;
export const MIN_PARALLEL = 1;

/** Money: integer micro-USD (1 USD = 1_000_000). Never use binary float for ceilings. */
export const USD_MICROS_PER_DOLLAR = 1_000_000n;

export const FIXTURE_BYTE_MARKER = "LESSON_VISUALS_FIXTURE_MARKER" as const;
export const STUB_RECEIPT_MARKER = "candidate run — comparison sheet stub only" as const;

/** Only MIME types with implemented magic-byte + decode + dimension validators. */
export const SUPPORTED_PRODUCTION_MIME_TYPES = ["image/png"] as const;

/** Max retries per eligible cell (initial attempt is separate). */
export const MAX_RETRIES_HARD_CEILING = 5;

/** Explicit fixture/mock marker on receipts for production reuse rejection. */
export const FIXTURE_RECEIPT_MARKER = "LESSON_VISUALS_FIXTURE_RECEIPT" as const;
