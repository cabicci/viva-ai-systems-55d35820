import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  row: null as null | {
    id: string;
    user_id: string;
    mission_id: string;
    lesson_id: string | null;
    submission_text: string | null;
  },
  updates: [] as Array<Record<string, unknown>>,
  eqCalls: [] as Array<[string, unknown]>,
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
      (
        handler: (args: {
          data: unknown;
          context: { userId: string };
        }) => unknown,
      ) =>
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
  const query: any = {};
  query.select = vi.fn(() => query);
  query.update = vi.fn((payload: Record<string, unknown>) => {
    mocks.updates.push(payload);
    return query;
  });
  query.eq = vi.fn((column: string, value: unknown) => {
    mocks.eqCalls.push([column, value]);
    return query;
  });
  query.maybeSingle = vi.fn(async () => ({ data: mocks.row, error: null }));
  query.then = (
    onFulfilled: (value: { error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve({ error: null }).then(onFulfilled, onRejected);
  return query;
}

const callEvaluate = evaluateMissionWithAI as unknown as (args: {
  data: Record<string, unknown>;
  context: { userId: string };
}) => Promise<{ passed: boolean; overallScore: number }>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updates.length = 0;
  mocks.eqCalls.length = 0;
  mocks.row = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    mission_id: canonicalSource.missionId,
    lesson_id: canonicalSource.lessonId,
    submission_text: "Stored learner answer from the owned submission row.",
  };
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
    expect(mocks.updates).toContainEqual(
      expect.objectContaining({
        status: "passed",
        score: 75,
      }),
    );
  });

  it("rejects a submission that is not owned by the authenticated user", async () => {
    mocks.row = null;
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
