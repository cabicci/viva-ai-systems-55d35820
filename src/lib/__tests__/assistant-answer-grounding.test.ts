// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { handleAssistantRuntimeRequest, insufficientGroundingMessage, type AssistantRuntimeDeps,
  type BillingRpcResult, type LlmResult } from "../../../supabase/functions/assistant-runtime/handler.ts";
import { currentSample, CURRENT_CHUNKS } from "./helpers/current-assistant-corpus";
import { callDirectAssistantModel } from "../../../supabase/functions/assistant-runtime/direct-model";

const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
function fixture(locale: string = "ar-EG") {
  const records = CURRENT_CHUNKS.filter(c => c.locale === locale && c.trackId === "intro").slice(0, 2);
  const chunks = records.map(c => currentSample(c.chunkId));
  let allowed = true, attempt = 0;
  const deps: AssistantRuntimeDeps = {
    verifyJwt: vi.fn(async () => ({ ok: true as const, userId: "learner-fixture" })),
    consumeRateLimit: vi.fn(async () => ({ allowed: true, resetAt: "2099-01-01T00:00:00Z" })),
    billingRpc: vi.fn(async (name, body): Promise<BillingRpcResult> => {
      if (name === "assistant_card_content_access") return { ok: true, data: {
        card_id: body.p_card_id, admin_review: false, lessons: { entitled_lesson_ids: allowed ? chunks.map(c => c.lessonId) : [] },
      } };
      if (name === "reserve_learner_ai_access") return { ok: true, data: { reservation_id: "fixture-reservation" } };
      if (name === "register_provider_attempt") return { ok: true, data: { attempt_index: ++attempt } };
      if (["finalize_provider_attempt", "commit_ai_quota", "release_ai_quota"].includes(name)) return { ok: true, data: {} };
      throw new Error(`Unexpected fixture RPC ${name}`);
    }),
    embedQuery: vi.fn(async () => [0.1, 0.2, 0.3]),
    localeSemanticRetrieve: vi.fn(async () => ({ ok: true as const, chunks })),
    callLlm: vi.fn(async (): Promise<LlmResult> => ({ ok: true, answer: JSON.stringify({
      grounding: "supported", answer: "A curriculum explanation.", sourceIds: [chunks[0].sourceId],
    }) })),
    env: { OPENAI_API_KEY: "fixture-only", SUPABASE_URL: "https://fixture.invalid", SUPABASE_SERVICE_ROLE_KEY: "fixture-only" },
  };
  function request(query: string, history: { question: string; answer: string }[] = []) {
    return new Request("https://fixture.invalid/assistant-runtime", { method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer fixture-only" },
      body: JSON.stringify({ query, conversationHistory: history,
        learnerContext: { locale, currentPath: "intro", currentLesson: chunks[0].lessonId } }),
    });
  }
  return { deps, chunks, request, revoke: () => { allowed = false; } };
}
const result = (value: unknown): LlmResult => ({ ok: true, answer: JSON.stringify(value) });

describe("answer grounding belongs to the current turn", () => {
  it("refuses an unrelated recipe without attaching retrieved lesson citations", async () => {
    const f = fixture();
    vi.mocked(f.deps.callLlm).mockResolvedValue(result({ grounding: "insufficient", answer: "No recipe in these lessons.", sourceIds: [] }));
    const res = await handleAssistantRuntimeRequest(f.request("إيه مقادير وخطوات عمل الكنافة بالقشطة؟"), f.deps);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.citations).toEqual([]);
    expect(body.answerGrounding).toBe("insufficient");
    expect(body.answer).toBe(insufficientGroundingMessage("ar-EG"));
    expect(body.retrieval.citationCount).toBe(0);
    expect(body.retrieval.noResultReason).toBe("insufficient_grounding");
  });

  it.each(locales)("keeps supported answer citations server-owned and locale-correct in %s", async locale => {
    const f = fixture(locale);
    const res = await handleAssistantRuntimeRequest(f.request("Explain this curriculum concept"), f.deps);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toBe("A curriculum explanation.");
    expect(body.answerGrounding).toBe("supported");
    expect(body.citations).toHaveLength(1);
    expect(body.citations[0]).toMatchObject({ chunkId: f.chunks[0].sourceId, locale, authoritative: true });
    expect(body.citations[0].productionRoute).toMatch(/^\/learn\/intro\//);
    expect(body.retrieval.citationCount).toBe(1);
  });

  it("does not embed the previous supported question into a new unrelated question or inherit its citations", async () => {
    const f = fixture();
    const first = await (await handleAssistantRuntimeRequest(f.request("يعني إيه ذكاء اصطناعي؟"), f.deps)).json();
    expect(first.citations).toHaveLength(1);
    vi.mocked(f.deps.callLlm).mockResolvedValue(result({ grounding: "insufficient", answer: "Not supported.", sourceIds: [] }));
    const query = "إيه مقادير وخطوات عمل الكنافة بالقشطة؟";
    const second = await (await handleAssistantRuntimeRequest(f.request(query,
      [{ question: "يعني إيه ذكاء اصطناعي؟", answer: first.answer }]), f.deps)).json();
    expect(second.citations).toEqual([]);
    expect(f.deps.embedQuery).toHaveBeenLastCalledWith(query, "fixture-only");
    const prompt = vi.mocked(f.deps.callLlm).mock.calls.at(-1)![1];
    expect(prompt).toContain("يعني إيه ذكاء اصطناعي؟"); // History remains available to interpret follow-ups.
    expect(prompt).toContain("UNTRUSTED_CONVERSATION");
    expect(second.answer).not.toBe(first.answer);
  });

  it.each(locales)("uses a localized server refusal regardless of model wording in %s", async locale => {
    const f = fixture(locale);
    vi.mocked(f.deps.callLlm).mockResolvedValue(result({ grounding: "insufficient", answer: "UNSAFE_UNSUPPORTED_MODEL_PROSE", sourceIds: [] }));
    const body = await (await handleAssistantRuntimeRequest(f.request("Unrelated question"), f.deps)).json();
    expect(body.answer).toBe(insufficientGroundingMessage(locale));
    expect(body.citations).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("UNSAFE_UNSUPPORTED_MODEL_PROSE");
  });

  it.each([
    { grounding: "insufficient", answer: "Refusal", sourceIds: ["unknown"] },
    { grounding: "supported", answer: "Claim", sourceIds: [] },
    { grounding: "supported", answer: "Claim", sourceIds: ["foreign-card-source"] },
    { answer: "Legacy untyped answer" },
    { grounding: "maybe", answer: "Claim", sourceIds: [] },
    { grounding: "insufficient", answer: "", sourceIds: [] },
    { grounding: "insufficient", answer: "Refusal", sourceIds: [], citations: [{ href: "https://invalid.example" }] },
    null, [],
  ])("rejects invalid or contradictory answers instead of reporting success: %j", async response => {
    const f = fixture();
    vi.mocked(f.deps.callLlm).mockResolvedValue(result(response));
    const res = await handleAssistantRuntimeRequest(f.request("Explain AI"), f.deps);
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.answer).toBeUndefined();
    expect(body.citations).toEqual([]);
    expect(f.deps.billingRpc).toHaveBeenCalledWith("finalize_provider_attempt", expect.objectContaining({ p_attempt_index: 2, p_attempt_status: "failed" }));
    expect(vi.mocked(f.deps.billingRpc).mock.calls.filter(([name]) => name === "commit_ai_quota")).toHaveLength(1);
    expect(f.deps.callLlm).toHaveBeenCalledTimes(1);
  });

  it("rejects duplicate IDs and insufficient responses even when their cited IDs are admitted", async () => {
    for (const grounding of ["supported", "insufficient"]) {
      const f = fixture();
      const sourceIds = grounding === "supported" ? [f.chunks[0].sourceId, f.chunks[0].sourceId] : [f.chunks[0].sourceId];
      vi.mocked(f.deps.callLlm).mockResolvedValue(result({ grounding, answer: "Claim", sourceIds }));
      const res = await handleAssistantRuntimeRequest(f.request("Explain"), f.deps);
      expect(res.status).toBe(502);
      expect((await res.json()).citations).toEqual([]);
    }
  });

  it.each(["supported", "insufficient"])("still denies content withdrawn during %s generation", async grounding => {
    const f = fixture();
    vi.mocked(f.deps.callLlm).mockImplementation(async () => {
      f.revoke();
      return result({ grounding, answer: "Claim", sourceIds: grounding === "supported" ? [f.chunks[0].sourceId] : [] });
    });
    const res = await handleAssistantRuntimeRequest(f.request("Explain"), f.deps);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.answer).toBeUndefined();
    expect(body.citations).toEqual([]);
  });

  it("contains provider failures without successful answers or candidate citations", async () => {
    const f = fixture();
    vi.mocked(f.deps.callLlm).mockResolvedValue({ ok: false, status: 502, error: "fixture-error" });
    const res = await handleAssistantRuntimeRequest(f.request("Explain"), f.deps);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.answer).toBeUndefined();
    expect(body.citations).toEqual([]);
  });

  it("uses only the current reply's selected subset and never inserts model-created citation metadata", async () => {
    const f = fixture();
    vi.mocked(f.deps.callLlm).mockResolvedValue(result({ grounding: "supported", answer: "Second-source explanation", sourceIds: [f.chunks[1].sourceId] }));
    const body = await (await handleAssistantRuntimeRequest(f.request("Explain this concept"), f.deps)).json();
    expect(body.citations.map((c: { chunkId: string }) => c.chunkId)).toEqual([f.chunks[1].sourceId]);
    expect(body.retrieval).toMatchObject({ citationCount: 1, candidateCitationCount: 2 });
    expect(body.citations[0].excerpt).toBe(f.chunks[1].content.slice(0, 500));
  });

  it("supports a later grounded turn after a refusal without inheriting the refusal's decision", async () => {
    const f = fixture();
    vi.mocked(f.deps.callLlm).mockResolvedValueOnce(result({ grounding: "insufficient", answer: "Not covered.", sourceIds: [] }));
    const first = await (await handleAssistantRuntimeRequest(f.request("Recipe?"), f.deps)).json();
    const second = await (await handleAssistantRuntimeRequest(f.request("Explain AI from these lessons",
      [{ question: "Recipe?", answer: first.answer }]), f.deps)).json();
    expect(first.citations).toEqual([]);
    expect(second.answerGrounding).toBe("supported");
    expect(second.citations).toHaveLength(1);
    expect(f.deps.callLlm).toHaveBeenCalledTimes(2);
  });

  it("enforces the contract through the real direct adapter and handler with a simulated HTTP response", async () => {
    const f = fixture();
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ grounding: "insufficient", answer: "No evidence.", sourceIds: [] }) } }],
    })));
    vi.mocked(f.deps.callLlm).mockImplementation((system, user, key, admitted) => callDirectAssistantModel(system, user, key, request, admitted));
    const response = await handleAssistantRuntimeRequest(f.request("Recipe?"), f.deps);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.answer).toBe(insufficientGroundingMessage("ar-EG"));
    expect(body.citations).toEqual([]);
    expect(request).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(request.mock.calls[0][1]!.body));
    expect(payload.messages[0].content).toContain("CURRENT QUESTION");
    expect(payload.messages[0].content).toContain('grounding="insufficient"');
    expect(payload.messages[1].content).toContain(f.chunks[0].sourceId);
    expect(payload.response_format.json_schema.schema.properties.sourceIds.items.enum).toEqual(f.chunks.map(c => c.sourceId));
    expect(vi.mocked(f.deps.billingRpc).mock.calls.filter(([name]) => name === "commit_ai_quota")).toHaveLength(1);
  });
});

describe("source-ID transport", () => {
  it("passes exactly the admitted citation IDs to the model and still rejects an unknown ID", async () => {
    const f = fixture();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(f.deps.callLlm).mockResolvedValue(result({ grounding: "supported", answer: "PRIVATE_MODEL_PROSE", sourceIds: [`${f.chunks[0].sourceId}-x`] }));
    const response = await handleAssistantRuntimeRequest(f.request("Explain this concept"), f.deps);
    expect(vi.mocked(f.deps.callLlm).mock.calls[0][3]).toEqual(f.chunks.map(c => c.sourceId));
    expect(response.status).toBe(502);
    expect((await response.json()).citations ?? []).toEqual([]);
    expect(f.deps.callLlm).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(String(warning.mock.calls[0][0]));
    expect(logged).toEqual({ event: "assistant_answer_failed", requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      status: 502, error: "ASSISTANT_PROVIDER_INVALID_RESPONSE", detail: "source_id_not_admitted",
      candidateCitations: f.chunks.length, unknownSourceIds: 1 });
    expect(JSON.stringify(warning.mock.calls)).not.toContain("PRIVATE_MODEL_PROSE");
    expect(JSON.stringify(warning.mock.calls)).not.toContain("Explain this concept");
    expect(JSON.stringify(warning.mock.calls)).not.toContain("fixture-only");
    for (const chunk of f.chunks) expect(JSON.stringify(warning.mock.calls)).not.toContain(chunk.sourceId);
    warning.mockRestore();
  });
});
