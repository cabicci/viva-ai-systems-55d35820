// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { questionFingerprint, runMeteredQuestion, recordedQuestionProvider,
  type QuestionIdentity, type QuestionRpc, type QuestionExecution } from "../../../supabase/functions/assistant-runtime/question-metering";
import { parseAssistantAnswer } from "../../../supabase/functions/assistant-runtime/answer-contract";
import { successfulQuestionRpc, withGrantedChildLedger, QUESTION_ID } from "./helpers/question-ledger";

const identity: QuestionIdentity = { userId: "owner", area: "kids", course: "kids", cardId: "level-1",
  lesson: "level-1:1", locale: "en", childId: "child-a", requestId: QUESTION_ID, query: "Explain this concept" };
const answer: QuestionExecution = { status: 200, body: { answer: "Grounded answer", citations: [] }, outcome: "answered", proof: ["current-source"] };
const allowed = async () => true;

describe("shared assistant reservation and settlement", () => {
  it.each(["ai", "academic", "technical", "kids"] as const)("uses the same server ledger for %s", async area => {
    const calls: string[] = [];
    const rpc: QuestionRpc = vi.fn(async (name, args) => { calls.push(name); return successfulQuestionRpc(name, args); });
    const execute = vi.fn(async () => { calls.push("provider"); return answer; });
    const childAwareRpc = vi.fn(withGrantedChildLedger(rpc));
    const response = await runMeteredQuestion({ ...identity, area }, childAwareRpc, execute, allowed);
    expect(childAwareRpc.mock.calls.map(([name]) => name)).toEqual(area === "kids"
      ? ["kids_ai_consent_context", "reserve_assistant_question", "settle_assistant_question", "assistant_question_delivery"]
      : ["reserve_assistant_question", "settle_assistant_question"]);
    expect(calls).toEqual(["reserve_assistant_question", "provider", "settle_assistant_question"]);
    expect(response.body.chargedUnits).toBe(1);
    expect(response).not.toHaveProperty("proof");
    expect(rpc).toHaveBeenCalledWith("settle_assistant_question", expect.objectContaining({ p_outcome: "answered", p_response: expect.objectContaining({ proof: ["current-source"] }) }));
  });
  it.each(["insufficient", "system_failure"] as const)("settles %s without a debit", async outcome => {
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => successfulQuestionRpc(name, args));
    const response = await runMeteredQuestion(identity, withGrantedChildLedger(rpc), async () => ({ ...answer, outcome }), allowed);
    expect(response.body.chargedUnits).toBe(0);
    expect(rpc.mock.calls.filter(([name]) => name === "settle_assistant_question")).toHaveLength(1);
  });
  it("settles thrown provider work at zero and never returns its private error", async () => {
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => successfulQuestionRpc(name, args));
    const response = await runMeteredQuestion(identity, withGrantedChildLedger(rpc), async () => { throw new Error("PRIVATE_PROVIDER_DETAILS"); }, allowed);
    expect(response.status).toBe(503);
    expect(JSON.stringify(response)).not.toContain("PRIVATE");
    expect(rpc).toHaveBeenCalledWith("settle_assistant_question", expect.objectContaining({ p_outcome: "system_failure" }));
  });
  it("requires a persisted result before exposing a paid answer", async () => {
    const rpc: QuestionRpc = async (name, args) => name === "settle_assistant_question"
      ? { ok: false as const, status: 503, error: "unavailable" } : successfulQuestionRpc(name, args);
    const result = await runMeteredQuestion(identity, withGrantedChildLedger(rpc), async () => answer, allowed);
    expect(result.status).toBe(503); expect(result.body.answer).toBeUndefined();
  });
  it("returns a validated saved answer on retry without providers or a second settlement", async () => {
    const execute = vi.fn(async () => answer);
    const replayCheck = vi.fn(async () => true);
    const rpc: QuestionRpc = vi.fn(async () => ({ ok: true as const, data: { status: "replay", replay: true,
      response: answer, balance: { monthly_remaining: 98, purchased_remaining: 100 } } }));
    const result = await runMeteredQuestion(identity, withGrantedChildLedger(rpc), execute, replayCheck);
    expect(result.body).toMatchObject({ answer: "Grounded answer", replay: true });
    expect(execute).not.toHaveBeenCalled(); expect(rpc).toHaveBeenCalledOnce(); expect(replayCheck).toHaveBeenCalledWith(answer);
  });
  it("does not return a saved answer when its source or access was withdrawn", async () => {
    const rpc: QuestionRpc = async () => ({ ok: true as const, data: { status: "replay", response: answer } });
    const result = await runMeteredQuestion(identity, withGrantedChildLedger(rpc), async () => answer, async () => false);
    expect(result.status).toBe(403); expect(result.body.answer).toBeUndefined();
  });
  it.each(["quota_exceeded", "in_progress"])("does no provider work for %s", async status => {
    const execute = vi.fn(async () => answer);
    const rpc: QuestionRpc = async () => ({ ok: true as const, data: { status, allowed: false } });
    expect((await runMeteredQuestion(identity, withGrantedChildLedger(rpc), execute, allowed)).status).toBe(status === "in_progress" ? 409 : 429);
    expect(execute).not.toHaveBeenCalled();
  });
  it("binds retries to question, scope, child, account, locale and history", async () => {
    const original = await questionFingerprint(identity);
    for (const change of [{ query: "A different question" }, { userId: "other" }, { childId: "child-b" },
      { lesson: "level-2:1" }, { cardId: "level-2" }, { locale: "ar-EG" }, { course: "other" },
      { history: [{ question: "Earlier", answer: "Context" }] }]) {
      expect(await questionFingerprint({ ...identity, ...change })).not.toBe(original);
    }
    expect(await questionFingerprint({ ...identity, query: "  Explain this concept  " })).toBe(original);
    const execute = vi.fn(async () => answer);
    const rpc: QuestionRpc = async () => ({ ok: false as const, status: 409, error: "ASSISTANT_REQUEST_CONFLICT" });
    expect((await runMeteredQuestion(identity, withGrantedChildLedger(rpc), execute, allowed)).status).toBe(409);
    expect(execute).not.toHaveBeenCalled();
  });
  it("requires a stable request UUID before calling billing", async () => {
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => successfulQuestionRpc(name, args));
    expect((await runMeteredQuestion({ ...identity, requestId: "" }, withGrantedChildLedger(rpc), async () => answer, allowed)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("provider accounting and non-answer classification", () => {
  it("records one attempt identity before and after provider work", async () => {
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => successfulQuestionRpc(name, args));
    await recordedQuestionProvider(rpc, { userId: "owner", requestId: QUESTION_ID, fingerprint: "f" }, "embedding", async () => [1]);
    expect(rpc.mock.calls).toHaveLength(2);
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_status: "started" });
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_status: "succeeded", p_attempt_id: rpc.mock.calls[0][1].p_attempt_id });
  });
  it("fails closed before providers when attempt registration fails", async () => {
    const run = vi.fn(async () => "should not run");
    await expect(recordedQuestionProvider(async () => ({ ok: false as const, status: 503, error: "down" }),
      { userId: "owner", requestId: QUESTION_ID, fingerprint: "f" }, "llm", run)).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();
  });
  it("separates outside-course refusal from missing information and rejects citations on either", () => {
    for (const grounding of ["insufficient", "out_of_scope"]) {
      expect(parseAssistantAnswer(JSON.stringify({ grounding, answer: "Unable to answer", sourceIds: [] }))?.grounding).toBe(grounding);
      expect(parseAssistantAnswer(JSON.stringify({ grounding, answer: "Unable to answer", sourceIds: ["S1"] }))).toBeNull();
    }
  });
});
