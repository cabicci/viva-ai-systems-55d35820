import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  row: null as null | Record<string, unknown>,
  updates: [] as Array<Record<string, unknown>>,
  eqCalls: [] as Array<[string, unknown]>,
  resolveSource: vi.fn(),
  callAI: vi.fn(),
  enforceRateLimit: vi.fn(),
  from: vi.fn(),
  updateError: null as null | { message: string },
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (input: unknown) => input;
    const chain: any = {};
    chain.middleware = () => chain;
    chain.inputValidator = (next: (input: unknown) => unknown) => {
      validate = next;
      return chain;
    };
    chain.handler = (handler: (args: any) => unknown) =>
      async (args: any) => handler({ ...args, data: validate(args.data) });
    return chain;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/rate-limit.server", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/ai-providers.server", () => ({ callAI: mocks.callAI }));
vi.mock("@/lib/mission-evaluation-source.server", () => ({
  resolveCanonicalMissionEvaluationSource: mocks.resolveSource,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import { revealModelMissionAnswer } from "@/lib/mission-ai-evaluation.functions";

const canonicalSource = {
  lessonId: "intro-m1-l2-first-prompt",
  missionId: "intro-m1-l2-first-prompt::mission",
  lessonTitle: "Canonical title",
  missionPrompt: "Canonical mission",
  rubric: [{ label: "Criterion", weight: 100, criteria: ["Requirement"] }],
};
const submissionId = "11111111-1111-4111-8111-111111111111";
const callReveal = revealModelMissionAnswer as unknown as (args: {
  data: Record<string, unknown>; context: { userId: string };
}) => Promise<{ modelAnswer: string; note: string }>;
const request = (extra: Record<string, unknown> = {}) => ({
  context: { userId: "user-1" },
  data: { submissionId, missionId: canonicalSource.missionId, locale: "ar-EG", ...extra },
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updates.length = 0;
  mocks.eqCalls.length = 0;
  mocks.updateError = null;
  mocks.row = {
    id: submissionId, user_id: "user-1", mission_id: canonicalSource.missionId,
    lesson_id: canonicalSource.lessonId, attempt_count: 2, status: "needs_revision",
    submission_metadata: { nextStep: "Preserve me" },
  };
  mocks.from.mockImplementation(() => {
    const q: any = {};
    q.select = vi.fn(() => q);
    q.eq = vi.fn((key: string, value: unknown) => { mocks.eqCalls.push([key, value]); return q; });
    q.maybeSingle = vi.fn(async () => ({ data: mocks.row, error: null }));
    q.update = vi.fn((payload: Record<string, unknown>) => { mocks.updates.push(payload); return q; });
    q.then = (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve({ error: mocks.updateError }).then(resolve, reject);
    return q;
  });
  mocks.resolveSource.mockResolvedValue(canonicalSource);
  mocks.enforceRateLimit.mockResolvedValue(undefined);
  mocks.callAI.mockResolvedValue({ content: JSON.stringify({ modelAnswer: "Answer", note: "Note" }) });
});

describe("revealModelMissionAnswer canonical locale contract", () => {
  it.each([
    ["ar-EG", "العربية المصرية"],
    ["ar-MSA", "Modern Standard Arabic"],
    ["ar-Gulf", "Gulf Arabic"],
    ["en", "simple English"],
  ])("uses owned canonical %s source and ignores client prompt tampering", async (locale, language) => {
    await callReveal(request({ locale, lessonTitle: "TAMPERED", missionPrompt: "TAMPERED", lessonId: "TAMPERED" }));
    expect(mocks.resolveSource).toHaveBeenCalledExactlyOnceWith({
      locale, lessonId: canonicalSource.lessonId, missionId: canonicalSource.missionId,
    });
    const messages = mocks.callAI.mock.calls[0]![0].messages as Array<{ content: string }>;
    expect(messages[0]!.content).toContain(language);
    expect(messages[1]!.content).toContain(canonicalSource.lessonTitle);
    expect(messages[1]!.content).toContain(canonicalSource.missionPrompt);
    expect(JSON.stringify(messages)).not.toContain("TAMPERED");
    expect(mocks.eqCalls).toEqual(expect.arrayContaining([
      ["id", submissionId], ["user_id", "user-1"], ["mission_id", canonicalSource.missionId],
    ]));
    expect(mocks.updates).toEqual([{
      submission_metadata: { nextStep: "Preserve me", revealed: true, modelAnswer: "Answer", note: "Note" },
    }]);
    expect(mocks.enforceRateLimit).toHaveBeenCalledTimes(3);
  });

  it.each(["invalid", undefined])("rejects unsupported or missing locale %s before DB/provider", async (locale) => {
    await expect(callReveal(request({ locale }))).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it("rejects an unowned or mismatched submission before source/provider", async () => {
    mocks.row = null;
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.eqCalls).toEqual(expect.arrayContaining([
      ["id", submissionId], ["user_id", "user-1"], ["mission_id", canonicalSource.missionId],
    ]));
    expect(mocks.resolveSource).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([]);
  });

  it("rejects missing persisted lesson id before provider", async () => {
    mocks.row!.lesson_id = null;
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.resolveSource).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it("fails closed when the exact localized canonical mission is unavailable", async () => {
    mocks.resolveSource.mockRejectedValue(new Error("No exact source"));
    await expect(callReveal(request({ locale: "en" }))).rejects.toThrow("No exact source");
    expect(mocks.resolveSource).toHaveBeenCalledTimes(1);
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([]);
  });

  it.each(["passed", "evaluating"])("preserves %s status guard even with cache", async (status) => {
    mocks.row!.status = status;
    mocks.row!.submission_metadata = { revealed: true, modelAnswer: "Cached" };
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([]);
  });

  it("preserves two-attempt guard before canonical source/provider", async () => {
    mocks.row!.attempt_count = 1;
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.resolveSource).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it("preserves legacy cache verbatim across locale switches without regeneration or invented locale", async () => {
    mocks.row!.lesson_id = null;
    mocks.row!.attempt_count = 0;
    mocks.row!.submission_metadata = { revealed: true, modelAnswer: "Historical answer", note: "Historical note" };
    expect(await callReveal(request({ locale: "en" }))).toEqual({
      modelAnswer: "Historical answer", note: "Historical note",
    });
    expect(mocks.resolveSource).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([]);
  });

  it("uses an English learning note if a new English answer omits it", async () => {
    mocks.callAI.mockResolvedValue({ content: JSON.stringify({ modelAnswer: "Answer" }) });
    expect((await callReveal(request({ locale: "en" }))).note).toBe(
      "This is a learning example; compare it with your attempt.",
    );
  });

  it("does not report success when persistence fails", async () => {
    mocks.updateError = { message: "Mock persistence failure" };
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(callReveal(request())).rejects.toThrow();
      expect(mocks.updates[0]).toEqual(expect.objectContaining({ submission_metadata: expect.any(Object) }));
      expect(mocks.updates[0]).not.toHaveProperty("status");
      expect(mocks.updates[0]).not.toHaveProperty("score");
    } finally {
      errorLog.mockRestore();
    }
  });
});
