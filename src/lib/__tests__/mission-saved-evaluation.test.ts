import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  authError: null as Error | null,
  readError: null as Error | null,
  filters: [] as Array<[string, unknown]>,
  orders: [] as Array<[string, Record<string, unknown>]>,
  from: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({
        data: { user: mocks.authError ? null : { id: "fixture-user" } },
        error: mocks.authError,
      }),
    },
    from: mocks.from,
  },
}));
import { getLatestEvaluatedSubmissionForMission } from "@/lib/mission-evaluation";
import { restoreMissionEvaluation } from "@/lib/mission-view-state";
import type { MissionSubmission } from "@/lib/mission-evaluation";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.rows = [];
  mocks.filters = [];
  mocks.orders = [];
  mocks.authError = null;
  mocks.readError = null;
  mocks.from.mockImplementation(() => {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        mocks.filters.push([key, value]);
        filters.push((row) => row[key] === value);
        return query;
      },
      in: (key: string, values: unknown[]) => {
        filters.push((row) => values.includes(row[key]));
        return query;
      },
      not: (key: string, operator: string, value: string) => {
        if (key !== "submission_metadata" || operator !== "cs") throw new Error("Unexpected exclusion");
        const expected = JSON.parse(value);
        filters.push(row => (row.submission_metadata as Record<string, unknown> | undefined)?.skipped !== expected.skipped);
        return query;
      },
      order: (key: string, options: Record<string, unknown>) => {
        mocks.orders.push([key, options]);
        return query;
      },
      limit: () => query,
      maybeSingle: async () => ({
        data: mocks.rows.find((row) => filters.every((filter) => filter(row))) ?? null,
        error: mocks.readError,
      }),
    };
    return query;
  });
});

describe("read-only evaluated submission lookup", () => {
  it("includes saved success and scopes by authenticated user, mission and exact lesson", async () => {
    mocks.rows = [
      {
        id: "other-user",
        user_id: "other",
        mission_id: "mission",
        lesson_id: "lesson",
        status: "passed",
      },
      {
        id: "other-lesson",
        user_id: "fixture-user",
        mission_id: "mission",
        lesson_id: "other",
        status: "passed",
      },
      {
        id: "draft",
        user_id: "fixture-user",
        mission_id: "mission",
        lesson_id: "lesson",
        status: "draft",
      },
      {
        id: "saved",
        user_id: "fixture-user",
        mission_id: "mission",
        lesson_id: "lesson",
        status: "passed",
      },
    ];
    await expect(
      getLatestEvaluatedSubmissionForMission("mission", "lesson"),
    ).resolves.toMatchObject({ id: "saved" });
    expect(mocks.filters).toEqual([
      ["user_id", "fixture-user"],
      ["mission_id", "mission"],
      ["lesson_id", "lesson"],
      ["status", "passed"],
    ]);
    expect(mocks.orders).toEqual([
      ["evaluated_at", { ascending: false, nullsFirst: false }],
    ]);
  });

  it("returns no result for an unanswered mission", async () => {
    await expect(getLatestEvaluatedSubmissionForMission("mission", "lesson")).resolves.toBeNull();
  });

  it("does not query rows without an authenticated user", async () => {
    mocks.authError = new Error("Signed out");
    await expect(getLatestEvaluatedSubmissionForMission("mission", "lesson")).rejects.toThrow(
      "not authenticated",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("propagates a read failure rather than treating it as no saved answer", async () => {
    mocks.readError = new Error("Read failed");
    await expect(getLatestEvaluatedSubmissionForMission("mission", "lesson")).rejects.toThrow(
      "Read failed",
    );
  });

  it("preserves stored pass status and text without applying today's threshold", () => {
    const saved = {
      score: 40,
      status: "passed",
      feedback: "Original feedback language",
      submission_metadata: {
        perCriterion: [{ label: "Saved", score: 40, feedback: "Original" }],
        nextStep: "Original next step",
      },
    } as unknown as MissionSubmission;
    expect(restoreMissionEvaluation(saved)).toEqual({
      overallScore: 40,
      passed: true,
      summary: "Original feedback language",
      perCriterion: saved.submission_metadata.perCriterion,
      nextStep: "Original next step",
      socraticQuestion: "",
    });
  });

  it("does not fabricate absent scores or malformed criterion feedback", () => {
    expect(restoreMissionEvaluation({ score: null } as MissionSubmission)).toBeNull();
    const saved = {
      score: 80,
      status: "passed",
      feedback: null,
      submission_metadata: { perCriterion: [null, "bad", { label: "Incomplete" }] },
    } as unknown as MissionSubmission;
    expect(restoreMissionEvaluation(saved)).toMatchObject({
      perCriterion: [],
      summary: "",
      passed: true,
    });
  });
});

it("legacy passed skip is not restored as a grade and genuine pass wins", async () => {
  const common = { user_id: "fixture-user", mission_id: "mission", lesson_id: "lesson" };
  mocks.rows = [
    { ...common, id: "legacy-skip", status: "passed", submission_metadata: { skipped: true } },
    { ...common, id: "latest-fail", status: "failed", score: 10 },
    { ...common, id: "actual-pass", status: "passed", score: 70 },
  ];
  expect(await getLatestEvaluatedSubmissionForMission("mission", "lesson")).toMatchObject({ id: "actual-pass" });
});
