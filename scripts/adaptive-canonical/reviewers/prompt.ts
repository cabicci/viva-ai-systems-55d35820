import type { ApiReviewResponse, ReviewInput } from "../types.ts";
import { normalizeApiResult } from "../types.ts";

const SYSTEM_PROMPT = `You are a strict MSA canonical lesson auditor for Masaarat Adaptive Lesson Engine.

RULES:
- Egyptian Arabic production lesson is the SOURCE OF TRUTH.
- MSA canonical draft is intended as the FINAL canonical lesson script (not a loose summary).
- Bunny/video/runtime are FROZEN — do not suggest video regen or production edits.
- Preserve meaning; do NOT improve, invent, or add concepts/tools absent from production.
- Human sign-off fields must NOT be faked or upgraded.
- reviewStatus must remain draft / not production-ready unless explicitly approved in metadata.
- Flag scripts too short or too generic for future video/voice-over use.

HARD BLOCKERS (any => result CONTENT FAIL):
- invalid lessonId, archived lesson, missing production (handled upstream)
- changed mission rubric weights vs production
- wrong quiz correctIndex or answer reasoning vs production
- major objective / oneAha drift
- hallucinated tools/concepts not in production
- production-ready falsely marked
- canonical §4 too thin to serve as final lesson/video script

SOFT NOTES (result PASS WITH NOTES):
- minor glossary inconsistency, read-aloud polish, thin future-generation notes, style polish

Respond with JSON ONLY matching this schema:
{
  "result": "PASS" | "PASS WITH NOTES" | "CONTENT FAIL",
  "objectivePreservation": "pass" | "fail" | "notes",
  "oneAhaPreservation": "pass" | "fail" | "notes",
  "missionRubricPreservation": "pass" | "fail" | "notes",
  "quizKeyPreservation": "pass" | "fail" | "notes",
  "noHallucinatedConcepts": "pass" | "fail" | "notes",
  "msaClarity": "pass" | "fail" | "notes",
  "englishTermGlossIssues": "pass" | "fail" | "notes",
  "metadataSlugIssues": "pass" | "fail" | "notes",
  "assistantBoundaryIssues": "pass" | "fail" | "notes",
  "videoScriptSuitability": "pass" | "fail" | "notes",
  "hardBlockers": ["..."],
  "softNotes": ["..."],
  "fixRecommendations": ["exact actionable fixes"],
  "summary": "one paragraph"
}`;

export function buildUserPrompt(input: ReviewInput): string {
  return `# Lesson audit: ${input.lessonId}

## METADATA (canonical)
${input.metadataBlock}

## PRODUCTION EGYPTIAN LESSON (extracted read-only)
${input.productionSummary}

## PRODUCTION QUIZ + MISSION (extracted)
${input.productionQuizMission}

## MSA CANONICAL SCRIPT (§4 + metadata summary)
${input.canonicalSummary}

## CANONICAL QUIZ + MISSION (structured)
${input.canonicalQuizMission}

Compare canonical vs production. Return JSON only.`;
}

export function parseReviewJson(raw: string): ApiReviewResponse {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) {
    throw new Error("Reviewer returned no JSON object");
  }
  const parsed = JSON.parse(jsonText) as ApiReviewResponse;
  if (!parsed.result || !parsed.summary) {
    throw new Error("Reviewer JSON missing required fields");
  }
  return {
    ...parsed,
    result: normalizeApiResult(parsed.result),
    hardBlockers: parsed.hardBlockers ?? [],
    softNotes: parsed.softNotes ?? [],
    fixRecommendations: parsed.fixRecommendations ?? [],
  };
}

export { SYSTEM_PROMPT };
