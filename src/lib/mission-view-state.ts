import type { MissionSubmission } from "./mission-evaluation";
import type { AIEvaluationResult } from "./mission-ai-evaluation.functions";

// Keep unsent work in this tab, scoped to user/lesson/mission/locale.
// Memory is a fallback when browser storage is unavailable or full.
const drafts = new Map<string, string>();
const storageKey = (identity: string) => "masaarat:mission-draft:" + identity;

export function readMissionDraft(identity: string): string | null {
  if (drafts.has(identity)) return drafts.get(identity)!;
  try {
    return typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem(storageKey(identity));
  } catch {
    return null;
  }
}

export function writeMissionDraft(identity: string, text: string): void {
  drafts.set(identity, text);
  try {
    window.sessionStorage.setItem(storageKey(identity), text);
  } catch {
    // The current tab still retains the draft in memory.
  }
}

export function clearMissionDraft(identity: string): void {
  drafts.delete(identity);
  try {
    window.sessionStorage.removeItem(storageKey(identity));
  } catch {
    // Clearing the in-memory entry does not affect saved server submissions.
  }
}

/** Restore only fields actually saved by the evaluator, without regrading. */
export function restoreMissionEvaluation(sub: MissionSubmission): AIEvaluationResult | null {
  if (typeof sub.score !== "number" || !Number.isFinite(sub.score)) return null;
  const meta = sub.submission_metadata ?? {};
  const perCriterion = Array.isArray(meta.perCriterion)
    ? meta.perCriterion.filter(
        (row): row is AIEvaluationResult["perCriterion"][number] =>
          row !== null &&
          typeof row === "object" &&
          typeof row.label === "string" &&
          typeof row.score === "number" &&
          Number.isFinite(row.score) &&
          typeof row.feedback === "string",
      )
    : [];
  return {
    overallScore: sub.score,
    passed: sub.status === "passed",
    perCriterion,
    summary: sub.feedback ?? "",
    nextStep: typeof meta.nextStep === "string" ? meta.nextStep : "",
    socraticQuestion: typeof meta.socraticQuestion === "string" ? meta.socraticQuestion : "",
  };
}
