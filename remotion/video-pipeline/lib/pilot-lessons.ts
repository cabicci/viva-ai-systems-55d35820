/** Paid pilot lesson selection (2 IDs × 3 locales = 6 videos). */

export const PILOT_LESSON_IDS = [
  "analyst-m3-l2-ai-summarization",
  "intro-m1-l4-ai-can-cannot",
] as const;

export const PILOT_SELECTION_REASONS: Record<(typeof PILOT_LESSON_IDS)[number], string> = {
  "analyst-m3-l2-ai-summarization":
    "Longest pilot candidate (~4990 chars), mixed AI/LLM terminology, quiz + mission + 3 tables.",
  "intro-m1-l4-ai-can-cannot":
    "Complex punctuation/tables, quiz + mission, strong AI can/cannot framing for all locales.",
};
