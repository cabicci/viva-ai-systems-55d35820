// @vitest-environment node
import { it, expect, vi } from "vitest";
import { loadPersonalAnalytics } from "@/lib/analytics/personal";
const tables = [
  "learner_events",
  "user_lesson_status",
  "mission_submissions",
  "lesson_quiz_attempts",
  "user_streaks",
  "user_activity_time",
];
function fixture(failed?: string, rejected = false) {
  const reads: Array<{
    table: string;
    filters: Array<[string, unknown]>;
    dates: Array<[string, string]>;
  }> = [];
  const client = {
    from: vi.fn((table: string) => {
      const read = {
        table,
        filters: [] as Array<[string, unknown]>,
        dates: [] as Array<[string, string]>,
      };
      reads.push(read);
      let single = false;
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          read.filters.push([key, value]);
          return chain;
        },
        gte: (key: string, value: string) => {
          read.dates.push([key, value]);
          return chain;
        },
        maybeSingle: () => {
          single = true;
          return chain;
        },
        then: (resolve: Function, reject: Function) => {
          if (table === failed && rejected)
            return Promise.reject(new Error("synthetic rejection")).then(
              resolve as never,
              reject as never,
            );
          const rows = [
            { user_id: "self", value: "own" },
            { user_id: "other", value: "foreign" },
          ].filter((row) =>
            read.filters.every(([key, value]) => row[key as keyof typeof row] === value),
          );
          return Promise.resolve(
            table === failed
              ? { data: null, error: { message: "synthetic returned error" } }
              : { data: single ? (rows[0] ?? null) : rows, error: null },
          ).then(resolve as never, reject as never);
        },
      };
      return chain;
    }),
  };
  return { client, reads };
}
it("adds explicit account filters to all six personal queries even when the caller can read other users", async () => {
  const f = fixture();
  const result = await loadPersonalAnalytics(f.client as never, "self", "2026-11-01T00:00:00Z");
  expect(f.reads.map((r) => r.table)).toEqual(tables);
  for (const read of f.reads) expect(read.filters).toEqual([["user_id", "self"]]);
  expect(JSON.stringify(result)).not.toContain("foreign");
  expect(JSON.stringify(result)).toContain("own");
  expect(f.reads.find((r) => r.table === "learner_events")?.dates).toEqual([
    ["created_at", "2026-11-01T00:00:00Z"],
  ]);
  expect(f.reads.find((r) => r.table === "lesson_quiz_attempts")?.dates).toEqual([
    ["attempted_at", "2026-11-01T00:00:00Z"],
  ]);
});
it.each(tables)(
  "treats a returned error from %s as unavailable rather than zero activity",
  async (table) => {
    const f = fixture(table);
    await expect(loadPersonalAnalytics(f.client as never, "self", "2026-11-01")).rejects.toThrow(
      "PERSONAL_ANALYTICS_UNAVAILABLE",
    );
  },
);
it("propagates a rejected query rather than returning successful empty metrics", async () => {
  const f = fixture("learner_events", true);
  await expect(loadPersonalAnalytics(f.client as never, "self", "2026-11-01")).rejects.toThrow(
    "synthetic rejection",
  );
});
it("distinguishes successful empty records from a read failure", async () => {
  const f = fixture();
  const result = await loadPersonalAnalytics(f.client as never, "not-present", "2026-11-01");
  expect(result).toEqual({
    events: [],
    lessonStatus: [],
    missions: [],
    quizzes: [],
    streak: null,
    time: null,
  });
});
it("refuses missing account identity before reading any table", async () => {
  const f = fixture();
  await expect(loadPersonalAnalytics(f.client as never, "", "2026-11-01")).rejects.toThrow(
    "ACCOUNT_REQUIRED",
  );
  expect(f.client.from).not.toHaveBeenCalled();
});

it("projects only skip classification and excludes historical marker grades", async () => {
  const selections: string[] = [];
  const client = {
    from: (table: string) => {
      const q: any = {
        select: (fields: string) => {
          if (table === "mission_submissions") selections.push(fields);
          return q;
        },
        eq: () => q,
        gte: () => q,
        maybeSingle: () => q,
        then: (resolve: any) =>
          Promise.resolve({
            data:
              table === "mission_submissions"
                ? [
                    { status: "passed", mission_id: "m", score: 0, skipped: true },
                    { status: "passed", mission_id: "m", score: 82, skipped: false },
                  ]
                : [],
            error: null,
          }).then(resolve),
      };
      return q;
    },
  };
  const result = await loadPersonalAnalytics(client as never, "self", "2026-11-01");
  expect(result.missions).toEqual([
    { status: "skipped", mission_id: "m", score: null },
    { status: "passed", mission_id: "m", score: 82 },
  ]);
  expect(selections).toEqual(["status, mission_id, score, skipped:submission_metadata->skipped"]);
});
