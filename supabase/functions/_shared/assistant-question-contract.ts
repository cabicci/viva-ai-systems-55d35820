/** One server-owned question ledger for every assistant. Providers never choose a price. */
export type QuestionOutcome = "answered" | "insufficient" | "out_of_scope" | "system_failure";
export type QuestionBalance = { monthly_remaining: number; purchased_remaining: number; access_allowed?: boolean; admin_review?: boolean; unlimited?: boolean };
export type QuestionRpc = (name: string, args: Record<string, unknown>) => Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string }>;
export type QuestionIdentity = {
  userId: string; area: "ai" | "academic" | "technical" | "kids"; course: string;
  lesson: string | null; locale: string; childId: string | null; requestId: string;
  query: string; history?: readonly { question: string; answer: string }[]; cardId?: string;
};
export type QuestionResponse = { status: number; body: Record<string, unknown>; proof?: unknown };
export type QuestionExecution = QuestionResponse & { outcome: QuestionOutcome };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validQuestionId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
export function questionRpcFailure(error: unknown): { ok: false; status: number; error: string } {
  const message = typeof error === "string" ? error : error && typeof error === "object" &&
    "message" in error && typeof error.message === "string" ? error.message : "";
  if (message === "KIDS_AI_PROFILE_UNAVAILABLE")
    return { ok: false, status: 403, error: "ASSISTANT_AI_CONSENT_REQUIRED" };
  const safe = /^(ASSISTANT_(?:ACCESS_DENIED|PROOF_ACCESS_DENIED|AI_CONSENT_REQUIRED|AI_CONSENT_CHANGED|REQUEST_CONFLICT|ATTEMPT_CONFLICT|QUOTA_EXCEEDED|QUOTA_SCOPE_EXCEEDED|QUOTA_SOURCE_EXPIRED|REQUEST_EXPIRED|REQUEST_NOT_FOUND|INVALID_REQUEST))$/.exec(message)?.[1];
  if (!safe) return { ok: false, status: 503, error: "ASSISTANT_BILLING_UNAVAILABLE" };
  const status = safe.includes("QUOTA") ? 429 : safe.includes("ACCESS") || safe.includes("CONSENT") ? 403 : safe.includes("INVALID") ? 400 : 409;
  return { ok: false, status, error: safe };
}
export function questionBalance(value: unknown): QuestionBalance | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (![row.monthly_remaining, row.purchased_remaining].every(n => typeof n === "number" && Number.isSafeInteger(n) && n >= 0)) return null;
  return { monthly_remaining: row.monthly_remaining as number, purchased_remaining: row.purchased_remaining as number,
    ...(typeof row.access_allowed === "boolean" ? { access_allowed: row.access_allowed } : {}),
    ...(typeof row.admin_review === "boolean" ? { admin_review: row.admin_review } : {}),
    ...(typeof row.unlimited === "boolean" ? { unlimited: row.unlimited } : {}) };
}
