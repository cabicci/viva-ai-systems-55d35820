import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  inserted: [] as Array<Record<string, unknown>>,
  updated: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from: mocks.from,
  },
}));

import {
  getActiveSubmissionForMission,
  prepareSubmissionForAttempt,
} from "@/lib/mission-evaluation";

function buildQuery() {
  const filters: Array<(row: Record<string, unknown>) => boolean> = [];
  let insert: Record<string, unknown> | null = null;
  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return query;
    },
    in: (column: string, values: unknown[]) => {
      filters.push((row) => values.includes(row[column]));
      return query;
    },
    order: () => query,
    limit: () => query,
    maybeSingle: async () => ({
      data: mocks.rows.find((row) => filters.every((filter) => filter(row))) ?? null,
      error: null,
    }),
    insert: (payload: Record<string, unknown>) => {
      insert = payload;
      mocks.inserted.push(payload);
      return query;
    },
    update: mocks.updated,
    single: async () => ({ data: { id: "fresh-draft", ...insert }, error: null }),
  };
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows = [{
    id: "interrupted-claim",
    user_id: "user-1",
    mission_id: "mission-1",
    lesson_id: "lesson-1",
    status: "evaluating",
    submission_text: "The saved answer before the interrupted evaluation.",
    submission_metadata: {},
    attempt_count: 2,
  }];
  mocks.inserted.length = 0;
  mocks.from.mockImplementation(buildQuery);
});

describe("interrupted mission evaluation recovery", () => {
  it("hydrates the saved answer and attempts from an evaluating row after reload", async () => {
    await expect(getActiveSubmissionForMission("mission-1", "lesson-1")).resolves.toMatchObject({
      id: "interrupted-claim",
      submission_text: "The saved answer before the interrupted evaluation.",
      attempt_count: 2,
    });
    expect(mocks.inserted).toEqual([]);
    expect(mocks.updated).not.toHaveBeenCalled();
  });

  it("starts a fresh draft on retry without mutating the interrupted claim", async () => {
    const original = { ...mocks.rows[0] };
    const draft = await prepareSubmissionForAttempt({
      missionId: "mission-1",
      lessonId: "lesson-1",
      submissionText: String(original.submission_text),
    });
    expect(draft).toMatchObject({ id: "fresh-draft", status: "draft" });
    expect(mocks.inserted).toEqual([expect.objectContaining({
      user_id: "user-1",
      mission_id: "mission-1",
      lesson_id: "lesson-1",
      status: "draft",
      submission_text: original.submission_text,
    })]);
    expect(mocks.rows).toEqual([original]);
    expect(mocks.updated).not.toHaveBeenCalled();
  });
});
