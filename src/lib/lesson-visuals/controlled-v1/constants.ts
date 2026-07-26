import { LOCALES, ROUTES } from "./types";

export { LOCALES, ROUTES };

export const CONTROLLED_FAILURE_TARGET_LESSON_ID = "intro-m1-l4-ai-can-cannot";
export const CONTROLLED_FAILURE_TARGET_LOCALE = "en" as const;
export const CONTROLLED_FAILURE_TARGET_CELL_ID = `${CONTROLLED_FAILURE_TARGET_LESSON_ID}__${CONTROLLED_FAILURE_TARGET_LOCALE}`;

export const PILOT_INSTRUCTIONAL_LESSON_ID = "intro-m1-l4-ai-can-cannot";
export const PILOT_MASAARAT_LESSON_ID = "builder-m7-l1-tables-columns";
export const PILOT_AUTHORIZED_EXTERNAL_LESSON_ID = "builder-m6-l3-first-prompt-to-lovable";

export const FULL_400_CONFIRM_TOKEN = "RUN_AUTHORIZED_400";

/** Exact confirmation sentinel for mode=method-c-remaining (reuses confirm_full_400 input). */
export const METHOD_C_REMAINING_CONFIRM_TOKEN = "RUN_AUTHORIZED_METHOD_C_356";

/**
 * Authoritative counts restored by CR-LV-METHOD-C-356-PRODUCTION-20260727-01
 * (undoes the temporary pilot reclassification of two A/B lessons to Method C).
 */
export const EXPECTED_COUNTS = {
  MASAARAT_SCREENSHOT: 7,
  AUTHORIZED_EXTERNAL_SCREENSHOT: 3,
  INSTRUCTIONAL_COMPOSITION: 90,
} as const;

/** Four human-accepted Method C pilot cells excluded from method-c-remaining rendering. */
export const PRESERVED_METHOD_C_PILOT_CELL_IDS = [
  "intro-m1-l4-ai-can-cannot__ar-EG",
  "intro-m1-l4-ai-can-cannot__ar-MSA",
  "intro-m1-l4-ai-can-cannot__ar-Gulf",
  "intro-m1-l4-ai-can-cannot__en",
] as const;

export const METHOD_C_REMAINING_EXPECTED_TOTAL = 356;
export const METHOD_C_REMAINING_EXPECTED_PER_LOCALE = 89;

export const EXPECTED_TOTAL_LESSONS = 100;
export const EXPECTED_TOTAL_CELLS = EXPECTED_TOTAL_LESSONS * LOCALES.length;

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const CLASSIFICATION_SOURCE_SHA256 =
  "19401FA59DA7A592C9BD81D74C59CF501D6CE182D7B71A9CA10801D166FE093B";
export const ACCEPTED_CLASSIFICATION_BASELINE_SHA = "a9b31c53aee45a9498f89f1301987f684ff1bae9";
export const RECONCILED_ORIGIN_MAIN_SHA = "aca5ad018b7d47238959bc0ee91a195d142cd348";
