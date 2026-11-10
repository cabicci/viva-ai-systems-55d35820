import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: state.rpc } }));
import { learningCommand, learningReports } from "./client";

const record = {
  id: "record",
  subject_id: "subject",
  area: "academic",
  course: "AC-T",
  account_id: "account",
  profile_id: null,
  first_recorded_at: "2026-11-08T00:00:00Z",
  last_recorded_at: "2026-11-08T00:00:00Z",
  learning_model: { activities: ["notes"], version: "1", completion: {} },
  title: null,
};
const detail = { record, events: [], notes: [], hasMore: false, enrollments: [] };
const reportList = { sources: [], reports: [] };
beforeEach(() => state.rpc.mockReset());
const valid = [
  ["records", [record]],
  ["detail", detail],
  ["export", { ...detail, noteVersions: [] }],
  ["position", {}],
  ["position", { ratio: 0 }],
  ["position", { ratio: 1 }],
  ["save_position", {}],
  ["note", { content: "", revision: 0 }],
  ["save_note", { content: "saved", revision: 2 }],
] as const;
describe("learning response contracts", () => {
  it.each(valid)("preserves the complete %s transport object", async (action, data) => {
    state.rpc.mockResolvedValue({ data, error: null });
    const input = { recordId: "record", lesson: "lesson" };
    expect(await learningCommand(action, input)).toBe(data);
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith("learning_command", {
      p_action: action,
      p_data: input,
    });
  });
  it.each(["records", "detail", "export", "position", "save_position"])(
    "rejects missing %s results",
    async (action) => {
      for (const data of [null, undefined, "success", 1]) {
        state.rpc.mockResolvedValue({ data, error: null });
        await expect(learningCommand(action)).rejects.toThrow("LEARNING_RESPONSE_INVALID");
      }
    },
  );
  it.each([
    ["records", [null]],
    ["records", [{ ...record, subject_id: 4 }]],
    ["records", [{ ...record, learning_model: { activities: null } }]],
    ["detail", {}],
    ["detail", { ...detail, events: null }],
    ["detail", { ...detail, events: [{ id: "event" }] }],
    ["detail", { ...detail, notes: [{ lesson: "lesson", content: "text", revision: "2" }] }],
    ["detail", { ...detail, hasMore: "false" }],
    ["export", detail],
    ["export", { ...detail, noteVersions: null }],
    ["position", { ratio: "0.5" }],
    ["position", { ratio: Infinity }],
    ["position", { ratio: -1 }],
    ["position", { ratio: 2 }],
    ["save_position", []],
    ["save_position", { error: "unsaved" }],
  ])("rejects malformed %s data instead of confirming it", async (action, data) => {
    state.rpc.mockResolvedValue({ data, error: null });
    await expect(learningCommand(action as string)).rejects.toThrow("LEARNING_RESPONSE_INVALID");
  });
  it("retains additional export fields without parsing away data", async () => {
    const data = {
      ...detail,
      noteVersions: [
        {
          record_id: "record",
          lesson: "lesson",
          content: "text",
          revision: 1,
          recorded_at: "2026-11-08T00:00:00Z",
          original: "retained",
        },
      ],
      extra: { retained: true },
    };
    state.rpc.mockResolvedValue({ data, error: null });
    expect(await learningCommand("export")).toBe(data);
  });
  it("preserves compatible records without optional historical metadata", async () => {
    const data = [{ id: "record", subject_id: "subject", area: "kids", course: "level" }];
    state.rpc.mockResolvedValue({ data, error: null });
    expect(await learningCommand("records")).toBe(data);
  });
  it.each([
    null,
    {},
    { record_id: "record", lesson: "lesson", content: "text", revision: "1", recorded_at: "time" },
  ])("rejects malformed revision history", async (revision) => {
    state.rpc.mockResolvedValue({ data: { ...detail, noteVersions: [revision] }, error: null });
    await expect(learningCommand("export")).rejects.toThrow("LEARNING_RESPONSE_INVALID");
  });
  it("preserves an RPC failure and never makes a fallback request", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { message: "LEARNING_ACCESS_REQUIRED" } });
    await expect(learningCommand("export")).rejects.toThrow("LEARNING_ACCESS_REQUIRED");
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
  it("preserves unknown action transport behavior", async () => {
    const data = { extension: true };
    state.rpc.mockResolvedValue({ data, error: null });
    expect(await learningCommand("future_server_action")).toBe(data);
  });
  it("preserves empty report collections", async () => {
    state.rpc.mockResolvedValue({ data: reportList, error: null });
    expect(await learningReports("list", { subjectId: "subject" })).toBe(reportList);
  });
  it("preserves report rows with a nullable lease and report body", async () => {
    const data = {
      sources: [{ sourceKey: "s", startsAt: "start", endsAt: "end", used: 0, limit: 2 }],
      reports: [
        {
          id: "report",
          subject_id: "subject",
          source_key: "s",
          state: "generating",
          lease_until: null,
          created_at: "created",
          report: null,
        },
      ],
    };
    state.rpc.mockResolvedValue({ data, error: null });
    expect(await learningReports("list")).toBe(data);
  });
  it("preserves additional report fields", async () => {
    const report = {
      summary: "Summary",
      strengths: [],
      review: [],
      nextSteps: [],
      limitations: ["Synthetic"],
      additionalMetadata: "retained",
    };
    const data = {
      sources: [],
      reports: [
        {
          id: "report",
          subject_id: "subject",
          source_key: "source",
          state: "ready",
          created_at: "time",
          report,
        },
      ],
    };
    state.rpc.mockResolvedValue({ data, error: null });
    expect(await learningReports("list")).toBe(data);
  });
  it.each([
    null,
    {},
    { sources: null, reports: [] },
    { sources: [], reports: null },
    { sources: [{ sourceKey: "s", used: "0" }], reports: [] },
    { sources: [], reports: [{ id: "report" }] },
  ])("rejects incomplete report lists", async (data) => {
    state.rpc.mockResolvedValue({ data, error: null });
    await expect(learningReports("list")).rejects.toThrow("LEARNING_RESPONSE_INVALID");
  });
});
