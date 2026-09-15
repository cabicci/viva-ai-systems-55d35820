import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  row: null as null | {
    id: string;
    user_id: string;
    mission_id: string;
    lesson_id: string | null;
    submission_text: string | null;
    updated_at: string;
  },
  updates: [] as Array<Record<string, unknown>>,
  eqCalls: [] as Array<[string, unknown]>,
  maybeSingleResults: [] as Array<{ data: unknown; error: unknown }>,
  queryFilters: [] as Array<Array<[string, unknown]>>,
  queryResponder: null as null | ((payload: Record<string, unknown>, filters: Array<[string, unknown]>) => { data: unknown; error: unknown }),
  resolveSource: vi.fn(),
  callAI: vi.fn(),
  enforceRateLimit: vi.fn(),
  from: vi.fn(),
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
    chain.handler =
      (handler: (args: { data: unknown; context: { userId: string } }) => unknown) =>
      async (args: { data: unknown; context: { userId: string } }) =>
        handler({ ...args, data: validate(args.data) });
    return chain;
  },
}));

vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: {},
}));

vi.mock("@/lib/rate-limit.server", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));

vi.mock("@/lib/ai-providers.server", () => ({
  callAI: mocks.callAI,
}));

vi.mock("@/lib/mission-evaluation-source.server", () => ({
  MISSION_EVALUATION_LOCALES: ["ar-EG", "ar-MSA", "ar-Gulf", "en"],
  resolveCanonicalMissionEvaluationSource: mocks.resolveSource,
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}));

import { evaluateMissionWithAI } from "@/lib/mission-ai-evaluation.functions";

const canonicalSource = {
  lessonId: "intro-m1-l2-first-prompt",
  missionId: "intro-m1-l2-first-prompt::mission",
  lessonTitle: "Canonical lesson title",
  missionPrompt: "Canonical mission prompt",
  rubric: [
    {
      label: "Canonical criterion",
      weight: 100,
      criteria: ["Canonical rubric requirement"],
    },
  ],
};

function buildQuery() {
  const filters: Array<[string, unknown]> = [];
  mocks.queryFilters.push(filters);
  let payload: Record<string, unknown> = {};
  const query: any = {};
  query.select = vi.fn(() => query);
  query.update = vi.fn((next: Record<string, unknown>) => {
    payload = next;
    mocks.updates.push(next);
    return query;
  });
  query.eq = vi.fn((column: string, value: unknown) => {
    mocks.eqCalls.push([column, value]);
    filters.push([column, value]);
    return query;
  });
  query.maybeSingle = vi.fn(
    async () => mocks.queryResponder?.(payload, filters) ?? mocks.maybeSingleResults.shift() ?? { data: mocks.row, error: null },
  );
  query.then = (
    onFulfilled: (value: { error: unknown }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(mocks.queryResponder?.(payload, filters) ?? { error: null }).then(onFulfilled, onRejected);
  return query;
}

const callEvaluate = evaluateMissionWithAI as unknown as (args: {
  data: Record<string, unknown>;
  context: { userId: string };
}) => Promise<{ passed: boolean; overallScore: number }>;

function evaluationArgs() {
  return {
    context: { userId: "user-1" },
    data: {
      submissionId: mocks.row!.id,
      missionId: canonicalSource.missionId,
      locale: "en",
    },
  };
}

function claimFilters(status: string): Array<[string, unknown]> {
  return [
    ["id", mocks.row!.id],
    ["user_id", "user-1"],
    ["mission_id", canonicalSource.missionId],
    ["status", status],
    ...(status === "evaluating" ? [["updated_at", mocks.row!.updated_at] as [string, unknown]] : []),
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updates.length = 0;
  mocks.eqCalls.length = 0;
  mocks.maybeSingleResults.length = 0;
  mocks.queryFilters.length = 0;
  mocks.queryResponder = null;
  mocks.row = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    mission_id: canonicalSource.missionId,
    lesson_id: canonicalSource.lessonId,
    submission_text: "Stored learner answer from the owned submission row.",
    updated_at: "2026-09-15T11:00:00.123456+00:00",
  };
  mocks.maybeSingleResults.push(
    { data: mocks.row, error: null },
    { data: { id: mocks.row.id }, error: null },
  );
  mocks.from.mockImplementation(() => buildQuery());
  mocks.resolveSource.mockResolvedValue(canonicalSource);
  mocks.enforceRateLimit.mockResolvedValue(undefined);
  mocks.callAI.mockResolvedValue({
    content: JSON.stringify({
      overallScore: 75,
      passed: true,
      perCriterion: [
        {
          label: "Canonical criterion",
          score: 75,
          feedback: "Useful feedback",
        },
      ],
      summary: "Canonical summary",
      nextStep: "Canonical next step",
      socraticQuestion: "",
    }),
  });
});

describe("evaluateMissionWithAI authority boundary", () => {
  it("uses the owned row and canonical source while stripping tampered grading fields", async () => {
    const result = await callEvaluate({
      context: { userId: "user-1" },
      data: {
        submissionId: mocks.row!.id,
        missionId: canonicalSource.missionId,
        locale: "ar-EG",
        lessonTitle: "TAMPERED TITLE",
        missionPrompt: "TAMPERED PROMPT",
        submissionText: "TAMPERED ANSWER",
        rubric: [
          {
            label: "TAMPERED RUBRIC",
            weight: 100,
            criteria: ["TAMPERED CRITERIA"],
          },
        ],
      },
    });

    expect(result).toMatchObject({ overallScore: 75, passed: true });
    expect(mocks.resolveSource).toHaveBeenCalledWith({
      locale: "ar-EG",
      lessonId: canonicalSource.lessonId,
      missionId: canonicalSource.missionId,
    });
    const aiRequest = mocks.callAI.mock.calls[0]![0] as {
      messages: Array<{ content: string }>;
    };
    const prompt = aiRequest.messages.map((message) => message.content).join("\n");
    expect(prompt).toContain(canonicalSource.lessonTitle);
    expect(prompt).toContain(canonicalSource.missionPrompt);
    expect(prompt).toContain("Canonical criterion");
    expect(prompt).toContain("Canonical rubric requirement");
    expect(prompt).toContain(mocks.row!.submission_text);
    expect(prompt).not.toContain("TAMPERED");
    expect(mocks.updates[0]).toEqual({ status: "evaluating" });
    expect(mocks.updates).toContainEqual(
      expect.objectContaining({
        status: "passed",
        score: 75,
      }),
    );
    expect(mocks.eqCalls).toEqual(
      expect.arrayContaining([
        ["status", "submitted"],
        ["status", "evaluating"],
      ]),
    );
  });

  it("rejects a submission that is not owned by the authenticated user", async () => {
    mocks.row = null;
    mocks.maybeSingleResults.splice(0, Infinity, { data: null, error: null });
    await expect(
      callEvaluate({
        context: { userId: "user-1" },
        data: {
          submissionId: "11111111-1111-4111-8111-111111111111",
          missionId: canonicalSource.missionId,
          locale: "ar-EG",
        },
      }),
    ).rejects.toThrow();
    expect(mocks.eqCalls).toEqual(
      expect.arrayContaining([
        ["id", "11111111-1111-4111-8111-111111111111"],
        ["user_id", "user-1"],
        ["mission_id", canonicalSource.missionId],
      ]),
    );
    expect(mocks.resolveSource).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it("rejects an unclaimable row without calling AI or releasing another evaluator", async () => {
    mocks.maybeSingleResults.splice(0, Infinity, { data: null, error: null });
    await expect(callEvaluate(evaluationArgs())).rejects.toThrow("غير متاح للتقييم");
    expect(mocks.queryFilters).toEqual([claimFilters("submitted")]);
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([{ status: "evaluating" }]);
  });

  it("does not release a row when the claim query fails", async () => {
    mocks.maybeSingleResults.splice(0, Infinity, {
      data: null,
      error: new Error("claim failed"),
    });
    await expect(callEvaluate(evaluationArgs())).rejects.toThrow();
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([{ status: "evaluating" }]);
  });

  it("allows one overlapping evaluator and leaves the winner's claim intact", async () => {
    let resolveAI!: (value: { content: string }) => void;
    mocks.callAI.mockImplementationOnce(
      () => new Promise<{ content: string }>((resolve) => { resolveAI = resolve; }),
    );
    mocks.maybeSingleResults.splice(0, Infinity,
      { data: mocks.row, error: null },
      { data: null, error: null },
      { data: { id: mocks.row!.id }, error: null },
    );
    const winner = callEvaluate(evaluationArgs());
    await vi.waitFor(() => expect(mocks.callAI).toHaveBeenCalledTimes(1));
    await expect(callEvaluate(evaluationArgs())).rejects.toThrow("غير متاح للتقييم");
    expect(mocks.updates).toEqual([{ status: "evaluating" }, { status: "evaluating" }]);
    resolveAI({ content: JSON.stringify({ overallScore: 75 }) });
    await expect(winner).resolves.toMatchObject({ passed: true, overallScore: 75 });
    expect(mocks.callAI).toHaveBeenCalledTimes(1);
    expect(mocks.queryFilters).toEqual([
      claimFilters("submitted"),
      claimFilters("submitted"),
      claimFilters("evaluating"),
    ]);
  });

  it.each(["success", "failure"] as const)(
    "preserves the new claim after reset/resubmit when the stale evaluator returns %s",
    async (outcome) => {
      let stored: Record<string, unknown> = { ...mocks.row!, status: "submitted" };
      let version = 0;
      mocks.queryResponder = (payload, filters) => {
        if (!filters.every(([column, value]) => stored[column] === value)) {
          return { data: null, error: null };
        }
        stored = {
          ...stored,
          ...payload,
          updated_at: `2026-09-15T11:00:00.12345${++version}+00:00`,
        };
        return { data: { ...stored }, error: null };
      };
      let finishOld!: (value: { content: string }) => void;
      let failOld!: (reason: Error) => void;
      let finishNew!: (value: { content: string }) => void;
      mocks.callAI
        .mockImplementationOnce(() => new Promise<{ content: string }>((resolve, reject) => {
          finishOld = resolve;
          failOld = reject;
        }))
        .mockImplementationOnce(() => new Promise<{ content: string }>((resolve) => {
          finishNew = resolve;
        }));

      const oldEvaluation = callEvaluate(evaluationArgs());
      await vi.waitFor(() => expect(mocks.callAI).toHaveBeenCalledTimes(1));
      // The existing authenticated trigger permits resetting to submitted.
      stored = { ...stored, status: "submitted", updated_at: "2026-09-15T11:00:00.123459+00:00" };
      const newEvaluation = callEvaluate(evaluationArgs());
      await vi.waitFor(() => expect(mocks.callAI).toHaveBeenCalledTimes(2));
      const newClaim = { ...stored };

      const oldFailure = expect(oldEvaluation).rejects.toThrow();
      if (outcome === "success") {
        finishOld({ content: JSON.stringify({ overallScore: 10 }) });
      } else {
        failOld(new Error("stale provider failed"));
      }
      await oldFailure;
      expect(stored).toEqual(newClaim);
      expect(stored.status).toBe("evaluating");

      finishNew({ content: JSON.stringify({ overallScore: 90 }) });
      await expect(newEvaluation).resolves.toMatchObject({ passed: true, overallScore: 90 });
      expect(stored).toMatchObject({ status: "passed", score: 90 });
    },
  );

  it("releases only its claimed row when AI evaluation fails", async () => {
    mocks.callAI.mockRejectedValueOnce(new Error("provider failed"));
    await expect(callEvaluate(evaluationArgs())).rejects.toThrow("provider failed");
    expect(mocks.updates).toEqual([{ status: "evaluating" }, { status: "needs_revision" }]);
    expect(mocks.queryFilters).toEqual([
      claimFilters("submitted"), claimFilters("evaluating"),
    ]);
  });

  it("releases its claim after a rate limit rejection so submission can be retried", async () => {
    mocks.enforceRateLimit.mockRejectedValueOnce(new Error("rate limited"));
    await expect(callEvaluate(evaluationArgs())).rejects.toThrow("rate limited");
    expect(mocks.callAI).not.toHaveBeenCalled();
    expect(mocks.updates).toEqual([{ status: "evaluating" }, { status: "needs_revision" }]);
    expect(mocks.queryFilters).toEqual([
      claimFilters("submitted"), claimFilters("evaluating"),
    ]);
  });

  it.each([
    { label: "no matching row", error: null },
    { label: "database error", error: new Error("persist failed") },
  ])("rejects persistence with $label instead of returning an unsaved grade", async ({ error }) => {
    mocks.maybeSingleResults.splice(0, Infinity,
      { data: mocks.row, error: null },
      { data: null, error },
    );
    await expect(callEvaluate(evaluationArgs())).rejects.toThrow();
    expect(mocks.queryFilters).toEqual([
      claimFilters("submitted"), claimFilters("evaluating"), claimFilters("evaluating"),
    ]);
    expect(mocks.updates.at(-1)).toEqual({ status: "needs_revision" });
  });

  it("rejects an invalid locale before querying the submission", async () => {
    await expect(
      callEvaluate({
        context: { userId: "user-1" },
        data: {
          submissionId: "11111111-1111-4111-8111-111111111111",
          missionId: canonicalSource.missionId,
          locale: "invalid",
        },
      }),
    ).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.callAI).not.toHaveBeenCalled();
  });

  it("rejects missing persisted submission text before calling AI", async () => {
    const row = { ...mocks.row!, submission_text: null };
    mocks.row = row;
    mocks.maybeSingleResults.splice(0, Infinity, { data: row, error: null });
    await expect(
      callEvaluate({
        context: { userId: "user-1" },
        data: {
          submissionId: row.id,
          missionId: canonicalSource.missionId,
          locale: "en",
        },
      }),
    ).rejects.toThrow();
    expect(mocks.callAI).not.toHaveBeenCalled();
  });
});