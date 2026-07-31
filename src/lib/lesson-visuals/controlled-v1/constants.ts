import { LOCALES, ROUTES } from "./types";

export { LOCALES, ROUTES };

export const CONTROLLED_FAILURE_TARGET_LESSON_ID = "intro-m1-l4-ai-can-cannot";
export const CONTROLLED_FAILURE_TARGET_LOCALE = "en" as const;
export const CONTROLLED_FAILURE_TARGET_CELL_ID = `${CONTROLLED_FAILURE_TARGET_LESSON_ID}__${CONTROLLED_FAILURE_TARGET_LOCALE}`;

export const PILOT_INSTRUCTIONAL_LESSON_ID = "intro-m1-l4-ai-can-cannot";
export const PILOT_MASAARAT_LESSON_ID = "builder-m7-l1-tables-columns";
/** Historical pilot matrix lesson; route is now INSTRUCTIONAL_COMPOSITION (B→C). */
export const PILOT_AUTHORIZED_EXTERNAL_LESSON_ID = "builder-m6-l3-first-prompt-to-lovable";

export const FULL_400_CONFIRM_TOKEN = "RUN_AUTHORIZED_400";

/** Exact confirmation sentinel for mode=method-c-remaining (reuses confirm_full_400 input). */
export const METHOD_C_REMAINING_CONFIRM_TOKEN = "RUN_AUTHORIZED_METHOD_C_356";

/**
 * Authoritative counts after CR-LV-METHOD-B-TO-C-FOUR-CELL-PILOT-20260727-01
 * (three former Method B lessons → Method C / INSTRUCTIONAL_COMPOSITION).
 */
export const EXPECTED_COUNTS = {
  MASAARAT_SCREENSHOT: 7,
  AUTHORIZED_EXTERNAL_SCREENSHOT: 0,
  INSTRUCTIONAL_COMPOSITION: 93,
} as const;

/**
 * Former Method B lessons permanently reclassified to Method C due to
 * NO_VALID_RIGHTS_BASIS. Their 12 cells stay unresolved (not part of accepted 360).
 */
export const METHOD_B_TO_C_REPLACEMENT_LESSON_IDS = [
  "intro-m1-l3-setup-your-ai",
  "builder-m5-l2-frontend",
  "builder-m6-l3-first-prompt-to-lovable",
] as const;

export const METHOD_B_TO_C_REPLACEMENT_CELL_IDS = METHOD_B_TO_C_REPLACEMENT_LESSON_IDS.flatMap(
  (lessonId) => LOCALES.map((locale) => `${lessonId}__${locale}`),
) as readonly string[];

/** Four human-accepted Method C pilot cells excluded from method-c-remaining rendering. */
export const PRESERVED_METHOD_C_PILOT_CELL_IDS = [
  "intro-m1-l4-ai-can-cannot__ar-EG",
  "intro-m1-l4-ai-can-cannot__ar-MSA",
  "intro-m1-l4-ai-can-cannot__ar-Gulf",
  "intro-m1-l4-ai-can-cannot__en",
] as const;

export const METHOD_C_REMAINING_EXPECTED_TOTAL = 356;
export const METHOD_C_REMAINING_EXPECTED_PER_LOCALE = 89;
/** Method A cells only after B→C (7 lessons × 4 locales). */
export const METHOD_C_REMAINING_EXPECTED_EXCLUDED_A_CELLS = 28;

/** Exact confirmation sentinel for mode=method-c-canonical-repair. */
export const METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN = "RUN_AUTHORIZED_METHOD_C_CANONICAL_REPAIR";

export const METHOD_C_CANONICAL_REPAIR_AUTH_ID =
  "CR-LV-METHOD-C-356-CANONICAL-ARTIFACT-REPAIR-20260727-01";

export const METHOD_C_CANONICAL_SOURCE_RUN_ID = "30221875344";
export const METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID = "8637507763";
export const METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME =
  "controlled-v1-method-c-remaining-30221875344";
export const METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST =
  "914F985ABC45051943A8CCE5D72E43A6B5892017556877317F3A0225468528B7";

export const METHOD_C_CANONICAL_EXCLUDED_RESIDUE_CELL_IDS = [
  "intro-m1-l4-ai-can-cannot__ar-EG",
  "intro-m1-l4-ai-can-cannot__en",
] as const;

/** Exact four-cell Method B→C pilot (builder-m6-l3 × 4 locales only). */
export const METHOD_C_B6L3_FOUR_PILOT_LESSON_ID = "builder-m6-l3-first-prompt-to-lovable";
export const METHOD_C_B6L3_FOUR_PILOT_CELL_IDS = LOCALES.map(
  (locale) => `${METHOD_C_B6L3_FOUR_PILOT_LESSON_ID}__${locale}`,
) as readonly string[];
export const METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL = 4;
export const METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN =
  "RUN_AUTHORIZED_METHOD_B_TO_C_FOUR_CELL_PILOT";
export const METHOD_C_B6L3_FOUR_PILOT_AUTH_ID = "CR-LV-METHOD-B-TO-C-FOUR-CELL-PILOT-20260727-01";

/**
 * Khalil human acceptance of the four-cell Method B→C pilot (ACCEPT ALL 4).
 * PNG bytes are immutable; only acceptance metadata may change.
 */
export const METHOD_C_B6L3_FOUR_PILOT_HUMAN_DECISION = "ACCEPT ALL 4" as const;
export const METHOD_C_B6L3_FOUR_PILOT_ACCEPTED_PNG_SHA256 = {
  "builder-m6-l3-first-prompt-to-lovable__ar-EG":
    "C37DB9371483878D5558AD5250BDEED59177687680A17B0E859AFFB4B9352FAF",
  "builder-m6-l3-first-prompt-to-lovable__ar-MSA":
    "784A4A7BC9531B060A3CF92D203A15C7DF8A6B9A4FBEC74D5BF59AF5B15BCAF0",
  "builder-m6-l3-first-prompt-to-lovable__ar-Gulf":
    "9F1CC4EC3F3B89B088979590FF5726CDABD9A631B112DB34C5ED4C91247F72DF",
  "builder-m6-l3-first-prompt-to-lovable__en":
    "0110DC1FD6DB95C616F51CA3DD81D3486D0E0C20ADB54D3A6A78FA8E1488847D",
} as const;

/** Remaining eight Method B→C replacement cells (excludes human-accepted m6×4). */
export const METHOD_C_REMAINING_EIGHT_LESSON_IDS = [
  "intro-m1-l3-setup-your-ai",
  "builder-m5-l2-frontend",
] as const;
export const METHOD_C_REMAINING_EIGHT_CELL_IDS = METHOD_C_REMAINING_EIGHT_LESSON_IDS.flatMap(
  (lessonId) => LOCALES.map((locale) => `${lessonId}__${locale}`),
) as readonly string[];
export const METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL = 8;
export const METHOD_C_REMAINING_EIGHT_EXPECTED_PER_LOCALE = 2;
export const METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN =
  "RUN_AUTHORIZED_METHOD_B_TO_C_REMAINING_EIGHT";
export const METHOD_C_REMAINING_EIGHT_AUTH_ID =
  "CR-LV-METHOD-B-TO-C-REMAINING-EIGHT-EXECUTION-20260727-01";

/** Accepted Method C after four-cell pilot human acceptance (360 + 4). */
export const ACCEPTED_METHOD_C_CELLS_AFTER_B6L3_ACCEPTANCE = 364;

export const EXPECTED_TOTAL_LESSONS = 100;
export const EXPECTED_TOTAL_CELLS = EXPECTED_TOTAL_LESSONS * LOCALES.length;

/** Exact four-cell Method A capture pilot (builder-m7-l1 × 4 locales only). */
export const METHOD_A_M7L1_FOUR_PILOT_LESSON_ID = PILOT_MASAARAT_LESSON_ID;
export const METHOD_A_M7L1_FOUR_PILOT_CELL_IDS = LOCALES.map(
  (locale) => `${METHOD_A_M7L1_FOUR_PILOT_LESSON_ID}__${locale}`,
) as readonly string[];
export const METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL = 4;
export const METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN =
  "RUN_AUTHORIZED_METHOD_A_FOUR_LOCALE_CAPTURE_PILOT";
export const METHOD_A_M7L1_FOUR_PILOT_AUTH_ID =
  "CR-LV-METHOD-A-FOUR-LOCALE-CAPTURE-PILOT-20260728-01";

/** Exact six remaining Method A lessons × 4 locales (24 cells). Order is authoritative. */
export const METHOD_A_REMAINING_SIX_LESSON_IDS = [
  "builder-m2-l1-prompt-layer",
  "builder-m2-l2-instructions-examples",
  "builder-m3-l1-context-layer",
  "builder-m6-l4-components-routes",
  "builder-m7-l3-queries",
  "builder-m10-l2-first-users",
] as const;
export const METHOD_A_REMAINING_SIX_CELL_IDS = METHOD_A_REMAINING_SIX_LESSON_IDS.flatMap(
  (lessonId) => LOCALES.map((locale) => `${lessonId}__${locale}`),
) as readonly string[];
export const METHOD_A_REMAINING_SIX_EXPECTED_TOTAL = 24;
export const METHOD_A_REMAINING_SIX_CONFIRM_TOKEN =
  "RUN_AUTHORIZED_METHOD_A_REMAINING_SIX_LESSONS_24";
export const METHOD_A_REMAINING_SIX_AUTH_ID =
  "CR-LV-METHOD-A-QUERY-CONCEPT-NORMALIZATION-SIX-LESSON-SINGLE-RUN-20260728-01";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const CLASSIFICATION_SOURCE_SHA256 =
  "A5F3F5F5937584C5A646115AF2652F8DD0011D3079B0D0F1D04CD758D9B6EA9F";
export const ACCEPTED_CLASSIFICATION_BASELINE_SHA = "a9b31c53aee45a9498f89f1301987f684ff1bae9";
export const RECONCILED_ORIGIN_MAIN_SHA = "aca5ad018b7d47238959bc0ee91a195d142cd348";
