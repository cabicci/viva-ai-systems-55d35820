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
  applied: [] as Array<Record<string, unknown>>,
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (input: unknown) => input;
    const chain: Record<string, unknown> = {};
    chain.middleware = () => chain;
    chain.inputValidator = (next: (input: unknown) => unknown) => {
      validate = next;
      return chain;
    };
    chain.handler =
      (handler: (args: { data: unknown; context: { userId: string } }) => unknown) =>
      async (args: { data: unknown; context: { userId: string } }) =>
        handler({ ...args, data: validate(args.data) });
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
  data: Record<string, unknown>;
  context: { userId: string };
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
  mocks.applied.length = 0;
  mocks.row = {
    id: submissionId,
    user_id: "user-1",
    mission_id: canonicalSource.missionId,
    lesson_id: canonicalSource.lessonId,
    attempt_count: 2,
    status: "needs_revision",
    updated_at: "2026-11-04T19:00:00.123456Z",
    submission_metadata: { nextStep: "Preserve me" },
  };
  mocks.from.mockImplementation(() => {
    const q: Record<string, unknown> = {};
    const filters: Array<[string, unknown]> = [];
    let pendingUpdate: Record<string, unknown> | undefined;
    q.select = vi.fn(() => q);
    q.eq = vi.fn((key: string, value: unknown) => {
      mocks.eqCalls.push([key, value]);
      filters.push([key, value]);
      return q;
    });
    let writing = false;
    const finish = () => {
      if (writing && mocks.updateError) return { data: null, error: mocks.updateError };
      const row = mocks.row;
      if (!row || !filters.every(([key, value]) => row[key] === value)) return { data: null, error: null };
      if (writing && pendingUpdate) {
        mocks.row = { ...row, ...pendingUpdate };
        mocks.applied.push(pendingUpdate);
      }
      return { data: structuredClone(mocks.row), error: null };
    };
    q.maybeSingle = vi.fn(async () => finish());
    q.update = vi.fn((payload: Record<string, unknown>) => {
      writing = true;
      pendingUpdate = payload;
      mocks.updates.push(payload);
      return q;
    });
    q.then = (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve(finish()).then(resolve, reject);
    return q;
  });
  mocks.resolveSource.mockResolvedValue(canonicalSource);
  mocks.enforceRateLimit.mockResolvedValue(undefined);
  mocks.callAI.mockResolvedValue({
    content: JSON.stringify({ modelAnswer: "Answer", note: "Note" }),
  });
});

describe("revealModelMissionAnswer canonical locale contract", () => {
  it.each(["resubmit", "evaluation claim", "completed evaluation", "feedback", "deleted", "owner", "mission", "lesson"])(
    "a delayed reveal cannot replace a concurrent %s change",
    async (change) => {
      let started!: () => void;
      const providerStarted = new Promise<void>(resolve => { started = resolve; });
      let complete!: (value: { content: string }) => void;
      const provider = new Promise<{ content: string }>(resolve => { complete = resolve; });
      mocks.callAI.mockImplementationOnce(() => { started(); return provider; });
      const pending = callReveal(request());
      await providerStarted;
      const row = structuredClone(mocks.row!);
      if (change === "deleted") mocks.row = null;
      else {
        mocks.row = { ...row, updated_at: "2026-11-04T19:01:00.654321Z" };
        if (change === "resubmit") Object.assign(mocks.row, { status: "submitted", attempt_count: 3, submission_text: "Improved submission" });
        if (change === "evaluation claim") Object.assign(mocks.row, { status: "evaluating", submission_metadata: { claim: "current-evaluation" } });
        if (change === "completed evaluation") Object.assign(mocks.row, { status: "passed", score: 100, feedback: "Accepted", submission_metadata: { nextStep: "Current feedback" } });
        if (change === "feedback") Object.assign(mocks.row, { submission_metadata: { nextStep: "Preserve current feedback", feedbackRevision: 2 } });
        if (change === "owner") mocks.row.user_id = "other-user";
        if (change === "mission") mocks.row.mission_id = "other-mission";
        if (change === "lesson") mocks.row.lesson_id = "other-lesson";
      }
      const current = structuredClone(mocks.row);
      complete({ content: JSON.stringify({ modelAnswer: "Delayed example", note: "Delayed note" }) });
      await expect(pending).rejects.toThrow();
      expect(mocks.row).toEqual(current);
      expect(mocks.applied).toEqual([]);
    },
  );

  it("saves a delayed example when its captured row version still matches", async () => {
    mocks.callAI.mockImplementationOnce(async () => {
      await Promise.resolve();
      return { content: JSON.stringify({ modelAnswer: "Confirmed example", note: "Useful note" }) };
    });
    expect(await callReveal(request())).toEqual({ modelAnswer: "Confirmed example", note: "Useful note" });
    expect(mocks.applied).toHaveLength(1);
    expect(mocks.row!.status).toBe("needs_revision");
    expect(mocks.eqCalls).toContainEqual(["updated_at", "2026-11-04T19:00:00.123456Z"]);
  });

  it("refuses missing persisted row version before generating an answer", async () => {
    delete mocks.row!.updated_at;
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.applied).toEqual([]);
  });

  it.each([
    ["ar-EG", "العربية المصرية"],
    ["ar-MSA", "Modern Standard Arabic"],
    ["ar-Gulf", "Gulf Arabic"],
    ["en", "simple English"],
  ])(
    "uses owned canonical %s source and ignores client prompt tampering",
    async (locale, language) => {
      await callReveal(
        request({
          locale,
          lessonTitle: "TAMPERED",
          missionPrompt: "TAMPERED",
          lessonId: "TAMPERED",
        }),
      );
      expect(mocks.resolveSource).toHaveBeenCalledExactlyOnceWith({
        locale,
        lessonId: canonicalSource.lessonId,
        missionId: canonicalSource.missionId,
      });
      const messages = mocks.callAI.mock.calls[0]![0].messages as Array<{ content: string }>;
      expect(messages[0]!.content).toContain(language);
      expect(messages[1]!.content).toContain(canonicalSource.lessonTitle);
      expect(messages[1]!.content).toContain(canonicalSource.missionPrompt);
      expect(JSON.stringify(messages)).not.toContain("TAMPERED");
      expect(mocks.eqCalls).toEqual(
        expect.arrayContaining([
          ["id", submissionId],
          ["user_id", "user-1"],
          ["mission_id", canonicalSource.missionId],
        ]),
      );
      expect(mocks.updates).toEqual([
        {
          submission_metadata: {
            nextStep: "Preserve me",
            revealed: true,
            modelAnswer: "Answer",
            note: "Note",
          },
        },
      ]);
      expect(mocks.enforceRateLimit).toHaveBeenCalledTimes(3);
    },
  );

  it.each(["invalid", undefined])(
    "rejects unsupported or missing locale %s before DB/provider",
    async (locale) => {
      await expect(callReveal(request({ locale }))).rejects.toThrow();
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.callAI).not.toHaveBeenCalled();
    },
  );

  it("rejects an unowned or mismatched submission before source/provider", async () => {
    mocks.row = null;
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.eqCalls).toEqual(
      expect.arrayContaining([
        ["id", submissionId],
        ["user_id", "user-1"],
        ["mission_id", canonicalSource.missionId],
      ]),
    );
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
    mocks.row!.submission_metadata = {
      revealed: true,
      modelAnswer: "Historical answer",
      note: "Historical note",
    };
    expect(await callReveal(request({ locale: "en" }))).toEqual({
      modelAnswer: "Historical answer",
      note: "Historical note",
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

  it("formats and persists a structured provider answer without replacing the learner submission", async () => {
    mocks.callAI.mockResolvedValue({
      content: JSON.stringify({
        modelAnswer: { response: "Ask for the missing date", steps: ["Read", "Confirm"] },
        note: "Compare with your attempt",
      }),
    });
    const answer = await callReveal(request());
    expect(answer.modelAnswer).toBe(
      "response: Ask for the missing date\n\nsteps: 1. Read\n2. Confirm",
    );
    expect(mocks.updates[0]).toEqual({
      submission_metadata: {
        nextStep: "Preserve me",
        revealed: true,
        modelAnswer: answer.modelAnswer,
        note: "Compare with your attempt",
      },
    });
    expect(mocks.updates[0]).not.toHaveProperty("submission_text");
    expect(mocks.updates[0]).not.toHaveProperty("attempt_count");
  });

  it("reads structured historical cache without rewriting the stored original or note", async () => {
    const original = {
      revealed: true,
      modelAnswer: { answer: "Historical structured answer" },
      note: "Original note",
    };
    mocks.row!.submission_metadata = original;
    expect(await callReveal(request())).toEqual({
      modelAnswer: "answer: Historical structured answer",
      note: "Original note",
    });
    expect(mocks.row!.submission_metadata).toBe(original);
    expect(mocks.updates).toEqual([]);
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it.each(["[object Object]", "", null, {}])(
    "rejects unreadable generated answer %j without persisting it",
    async (modelAnswer) => {
      mocks.callAI.mockResolvedValue({ content: JSON.stringify({ modelAnswer }) });
      await expect(callReveal(request())).rejects.toThrow();
      expect(mocks.updates).toEqual([]);
    },
  );

  it("does not regenerate or rewrite an irrecoverable historical answer", async () => {
    mocks.row!.submission_metadata = {
      revealed: true,
      modelAnswer: "[object Object]",
      note: "Original note",
    };
    await expect(callReveal(request())).rejects.toThrow();
    expect(mocks.updates).toEqual([]);
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it("does not report success when persistence fails", async () => {
    mocks.updateError = { message: "Mock persistence failure" };
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(callReveal(request())).rejects.toThrow();
      expect(mocks.updates[0]).toEqual(
        expect.objectContaining({ submission_metadata: expect.any(Object) }),
      );
      expect(mocks.updates[0]).not.toHaveProperty("status");
      expect(mocks.updates[0]).not.toHaveProperty("score");
    } finally {
      errorLog.mockRestore();
    }
  });
});
