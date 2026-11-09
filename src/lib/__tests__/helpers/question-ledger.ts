import type { QuestionRpc } from "../../../../supabase/functions/assistant-runtime/question-metering";

/** Deterministic transport fixture. Allocation/concurrency are tested against SQL separately. */
export function successfulQuestionRpc(name: string, body: Record<string, unknown>): Awaited<ReturnType<QuestionRpc>> {
  if (name === "reserve_assistant_question") return { ok: true, data: {
    reservation_id: "aaaaaaaa-0000-4000-8000-000000000001", status: "reserved", allowed: true, replay: false,
  } };
  if (name === "settle_assistant_question") return { ok: true, data: { status: "settled",
    charged_units: body.p_outcome === "answered" ? 1 : 0, response: body.p_response,
    balance: { monthly_remaining: 99, purchased_remaining: 0 },
  } };
  if (name === "assistant_question_provider_attempt") return { ok: true, data: { ok: true } };
  return { ok: false, status: 404, error: `Unexpected fixture RPC ${name}` };
}
export const QUESTION_ID = "aaaaaaaa-0000-4000-8000-000000000099";

/** Grant the child preflight and return the result saved by this case's ledger. */
export function withGrantedChildLedger(rpc: QuestionRpc): QuestionRpc {
  let saved: Record<string, unknown> | undefined;
  return async (name, args) => {
    if (name === "kids_ai_consent_context") return { ok: true, data: { allowed: true } };
    if (name === "assistant_question_delivery") {
      if (!saved) return { ok: false, status: 503, error: "FIXTURE_DELIVERY_MISSING" };
      return { ok: true, data: { ...saved, status: "settled", charged_units: saved.charged_units ?? 1 } };
    }
    const result = await rpc(name, args);
    if (result.ok && ((name === "settle_assistant_question" && result.data.status === "settled") ||
        (name === "reserve_assistant_question" && result.data.status === "replay"))) saved = result.data;
    return result;
  };
}
