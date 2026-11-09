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

export async function questionFingerprint(identity: QuestionIdentity): Promise<string> {
  // Explicit ordered fields: client-supplied account, price, outcome and balances never participate.
  const text = JSON.stringify([identity.userId, identity.area, identity.course, identity.cardId ?? identity.course,
    identity.lesson, identity.locale, identity.childId, identity.query.trim(),
    (identity.history ?? []).map(turn => [turn.question, turn.answer])]);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
    byte => byte.toString(16).padStart(2, "0")).join("");
}
const failure = (status = 503, error = "ASSISTANT_BILLING_UNAVAILABLE"): QuestionResponse =>
  ({ status, body: { ok: false, error, citations: [] } });
export async function recordedQuestionProvider<T>(rpc: QuestionRpc,
  identity: { userId: string; requestId: string; fingerprint: string }, model: string,
  run: () => Promise<T>, succeeded: (value: T) => boolean = () => true): Promise<T> {
  const args = { p_user_id: identity.userId, p_request_id: identity.requestId,
    p_fingerprint: identity.fingerprint, p_model: model, p_attempt_id: crypto.randomUUID() };
  const started = await rpc("assistant_question_provider_attempt", { ...args, p_status: "started" });
  if (!started.ok || started.data.ok !== true) throw new Error("ASSISTANT_PROVIDER_RECORD_UNAVAILABLE");
  let success = false;
  try { const result = await run(); success = succeeded(result); return result; }
  finally {
    const completed = await rpc("assistant_question_provider_attempt", { ...args, p_status: success ? "succeeded" : "failed" });
    if (!completed.ok || completed.data.ok !== true) throw new Error("ASSISTANT_PROVIDER_RECORD_UNAVAILABLE");
  }
}
function savedResponse(value: unknown): QuestionResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const saved = value as QuestionResponse;
  if (!Number.isInteger(saved.status) || saved.status < 200 || saved.status > 599 ||
    !saved.body || typeof saved.body !== "object" || Array.isArray(saved.body)) return null;
  return saved;
}

/** Reserve before providers, settle after all source/access checks, return only persisted results.
 * A retry cannot run a provider again or turn a different question into a free replay.
 */
export async function runMeteredQuestion(identity: QuestionIdentity, rpc: QuestionRpc,
  execute: (fingerprint: string) => Promise<QuestionExecution>,
  replayAllowed: (response: QuestionResponse) => Promise<boolean>): Promise<QuestionResponse> {
  if (!validQuestionId(identity.requestId)) return failure(400, "ASSISTANT_REQUEST_ID_INVALID");
  try {
    // Shared preflight covers registered and newly admitted Kids adapters before
    // any reservation. Native reserve/attempt gates still bind the current event.
    if (identity.area === "kids") {
      const consent = await rpc("kids_ai_consent_context", { p_user: identity.userId, p_profile: identity.childId });
      if (!consent.ok) return failure(consent.status, consent.error);
      if (consent.data.allowed !== true) return failure(403, "ASSISTANT_AI_CONSENT_REQUIRED");
    }
    const fingerprint = await questionFingerprint(identity);
    const deliverChild = async (replay: boolean): Promise<QuestionResponse> => {
      const delivered = await rpc("assistant_question_delivery", { p_user_id: identity.userId,
        p_request_id: identity.requestId, p_fingerprint: fingerprint });
      if (!delivered.ok) return failure(delivered.status, delivered.error);
      const response = savedResponse(delivered.data.response);
      if (delivered.data.status !== "settled" || !response || ![0, 1].includes(delivered.data.charged_units as number)) return failure();
      return { status: response.status, body: { ...response.body, balance: questionBalance(delivered.data.balance),
        ...(replay ? { replay: true } : { chargedUnits: delivered.data.charged_units }) } };
    };
    const reserved = await rpc("reserve_assistant_question", {
      p_user_id: identity.userId, p_area: identity.area, p_course: identity.course,
      p_lesson: identity.lesson, p_locale: identity.locale, p_child_id: identity.childId,
      p_request_id: identity.requestId, p_fingerprint: fingerprint,
    });
    if (!reserved.ok) return failure(reserved.status, reserved.error);
    const row = reserved.data;
    if (row.status === "replay_expired") return failure(409, "ASSISTANT_REQUEST_EXPIRED");
    if (row.replay === true || row.status === "replay") {
      const response = savedResponse(row.response);
      if (!response || !(await replayAllowed(response))) return failure(403, "ASSISTANT_ACCESS_CHANGED");
      if (identity.area === "kids") return await deliverChild(true);
      return { status: response.status, body: { ...response.body, balance: questionBalance(row.balance), replay: true } };
    }
    if (row.status === "in_progress") return failure(409, "ASSISTANT_REQUEST_IN_PROGRESS");
    if (row.status === "rate_limited") return failure(429, "ASSISTANT_RATE_LIMITED");
    if (row.allowed !== true || row.status !== "reserved")
      return failure(row.status === "quota_exceeded" ? 429 : 403,
        row.status === "quota_exceeded" ? "ASSISTANT_QUOTA_EXCEEDED" : "ASSISTANT_ACCESS_REQUIRED");
    let result: QuestionExecution;
    try { result = await execute(fingerprint); }
    catch { result = { ...failure(503, "ASSISTANT_UNAVAILABLE"), outcome: "system_failure" }; }
    const response: QuestionResponse = { status: result.status, body: result.body,
      ...(result.proof === undefined ? {} : { proof: result.proof }) };
    const settle = (outcome: QuestionOutcome, response: QuestionResponse) =>
      rpc("settle_assistant_question", { p_user_id: identity.userId,
        p_request_id: identity.requestId, p_fingerprint: fingerprint, p_outcome: outcome, p_response: response });
    const settled = await settle(result.outcome, response);
    if (!settled.ok) {
      if (identity.area === "kids" && ["ASSISTANT_AI_CONSENT_REQUIRED", "ASSISTANT_AI_CONSENT_CHANGED", "ASSISTANT_ACCESS_DENIED"].includes(settled.error)) {
        // Retire a still-reserved denied question through the existing zero-charge
        // failure path. A previously committed settlement is never refunded or
        // rewritten; an uncertain cleanup does not imply that it succeeded.
        try { await settle("system_failure", failure(settled.status, settled.error)); }
        catch { /* Preserve the actual denial. */ }
      }
      return failure(settled.status, settled.error);
    }
    const persisted = savedResponse(settled.data.response);
    if (settled.data.status !== "settled" || !persisted || ![0, 1].includes(settled.data.charged_units as number)) return failure();
    if (identity.area === "kids") return await deliverChild(false);
    return { status: persisted.status, body: { ...persisted.body,
      balance: questionBalance(settled.data.balance), chargedUnits: settled.data.charged_units } };
  } catch { return failure(); }
}
