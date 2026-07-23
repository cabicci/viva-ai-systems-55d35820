/**
 * Basic locale-purity smoke checks for controlled-v1.
 *
 * Reuses the Egyptian-dialect marker pattern already established in
 * `src/lib/lesson-visuals/v1/validators/localeIntegrity.ts` (best-effort,
 * soft-fail heuristic — see LIMITATIONS below). This module does not read or
 * modify that legacy v1 file; the marker list is duplicated intentionally so
 * controlled-v1 has zero runtime coupling to v1.
 *
 * LIMITATIONS (documented, not solved here):
 * - Marker list is a small, hand-picked set of common ar-EG dialect tells; it
 *   is not a full dialect classifier and will miss many ar-EG-only phrasings.
 * - Only flags heavy leakage (>= threshold marker hits) in ar-MSA/ar-Gulf text,
 *   mirroring the v1 "soft check" behavior. It is a smoke test, not a gate.
 * - Does not attempt any ar-MSA vs ar-Gulf distinction.
 */

const EGYPTIAN_DIALECT_MARKERS =
  /النهاردة|ازاي|إزاي|بتاع|عشان كده|هتعمل|علشان|كمان|دلوقتي|مفروض|حاجة|أهو/g;

export interface LocalePurityCheckInput {
  lessonId: string;
  locale: "ar-MSA" | "ar-Gulf";
  text: string;
}

export interface LocalePurityIssue {
  lessonId: string;
  locale: string;
  message: string;
  markerHits: number;
}

/**
 * Soft-fail heuristic: only flags when Egyptian markers heavily dominate
 * (>= 4 hits), matching the threshold used by the legacy v1 validator.
 */
export function checkLocalePurity(
  input: LocalePurityCheckInput,
  threshold = 4,
): LocalePurityIssue | null {
  const hits = (input.text.match(EGYPTIAN_DIALECT_MARKERS) ?? []).length;
  if (hits >= threshold) {
    return {
      lessonId: input.lessonId,
      locale: input.locale,
      message: `${input.locale} text shows heavy ar-EG dialect leakage (${hits} markers)`,
      markerHits: hits,
    };
  }
  return null;
}

export function checkLocalePurityBatch(
  inputs: LocalePurityCheckInput[],
  threshold = 4,
): LocalePurityIssue[] {
  const issues: LocalePurityIssue[] = [];
  for (const input of inputs) {
    const issue = checkLocalePurity(input, threshold);
    if (issue) issues.push(issue);
  }
  return issues;
}
