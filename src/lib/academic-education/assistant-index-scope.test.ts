// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ACADEMIC_EMBEDDING_MODEL, approvedChunks, canonicalJson, sha256,
  type ApprovedLesson, type IndexedAcademicChunk } from "./assistant-corpus";
const state = vi.hoisted(() => ({ lessons: [] as unknown[], existing: [] as unknown[],
  filters: [] as [string, unknown][], admin: true, adminCalls: 0, revoke: false,
  sync: vi.fn(), adminCheck: vi.fn() }));
vi.mock("@/lib/ai-providers.server", () => ({ callAI: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: (table: string) => {
    const builder = {
      select: () => builder,
      eq: (name: string, value: unknown) => { state.filters.push([name, value]); return builder; },
      in: (name: string, value: unknown) => { state.filters.push([name, value]); return builder; },
      order: () => builder,
      then: (resolve: (value: unknown) => void) => resolve({ data: table === "academic_lesson_content" ? state.lessons : state.existing, error: null }),
    };
    return builder;
  },
  rpc: (...args: unknown[]) => state.sync(...args),
} }));
import { indexAcademicBatch } from "./assistant.server";
const context = { userId: "admin-user", supabase: { rpc: async (_name: string, body: unknown) => {
  state.adminCalls++; state.adminCheck(body);
  return { data: state.admin && !(state.revoke && state.adminCalls > 1), error: null };
} } };
const input = { courseId: "AC-NEW", offset: 0, batchSize: 1 };
beforeEach(async () => {
  state.filters = []; state.admin = true; state.adminCalls = 0; state.revoke = false;
  state.adminCheck.mockReset(); state.sync.mockReset().mockResolvedValue({ data: 1, error: null });
  state.lessons = await Promise.all(["ar-EG", "ar-MSA", "ar-Gulf", "en"].map(async locale => {
    const payload = { id: "AC-NEW-M01-L01", locale, version: "2", sections: [{ id: "s1", title: "Title", text: "The same concept" }] };
    return { course_id: "AC-NEW", lesson_id: payload.id, locale, approved: true,
      payload, source_sha256: await sha256(canonicalJson(payload)) };
  }));
  state.existing = [];
  vi.stubEnv("OPENAI_API_KEY", "fixture-not-a-secret");
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, request) => {
    const body = JSON.parse(request.body);
    return new Response(JSON.stringify({ data: body.input.map((_: unknown, index: number) => ({ index, embedding: Array(1536).fill(0.1) })) }));
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

async function currentIndex(): Promise<IndexedAcademicChunk> {
  const [chunk] = await approvedChunks(state.lessons[0] as ApprovedLesson);
  return { ...chunk, embedding: JSON.stringify(Array(1536).fill(0.2)),
    embedding_model: ACADEMIC_EMBEDDING_MODEL, embedding_dimensions: 1536 };
}

it("indexes the requested registered card and synchronizes only the selected lesson/locale", async () => {
  const result = await indexAcademicBatch(input, context);
  expect(result).toMatchObject({ courseId: "AC-NEW", embedded: 1, reused: 0, inserted: 1, skipped: 0, nextOffset: 1 });
  expect(state.adminCheck).toHaveBeenNthCalledWith(1, { p_course: "AC-NEW" });
  expect(state.adminCheck).toHaveBeenNthCalledWith(2, { p_course: "AC-NEW" });
  expect(state.filters).toEqual([["course_id", "AC-NEW"], ["course_id", "AC-NEW"],
    ["lesson_id", ["AC-NEW-M01-L01"]], ["locale", ["ar-EG"]]]);
  expect(state.sync).toHaveBeenCalledWith("academic_sync_chunks", expect.objectContaining({
    p_course: "AC-NEW", p_scopes: [{ lesson_id: "AC-NEW-M01-L01", locale: "ar-EG",
      source_sha256: (state.lessons[0] as ApprovedLesson).source_sha256, approved: true }],
  }));
  const rows = state.sync.mock.calls[0][1].p_rows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ course_id: "AC-NEW", embedding_model: ACADEMIC_EMBEDDING_MODEL, embedding_dimensions: 1536 });
});

it("refreshes source/version metadata with a compatible identical vector and zero embedding calls", async () => {
  state.existing = [{ ...await currentIndex(), source_sha256: "a".repeat(64), content_version: "1" }];
  const result = await indexAcademicBatch(input, context);
  expect(result).toMatchObject({ embedded: 0, reused: 1, inserted: 1 });
  expect(fetch).not.toHaveBeenCalled();
  expect(state.sync.mock.calls[0][1].p_rows[0]).toMatchObject({ content_version: "2",
    source_sha256: (state.lessons[0] as ApprovedLesson).source_sha256 });
});

it("still runs the atomic stale-index reconciliation when all current sections are unchanged", async () => {
  state.existing = [await currentIndex()];
  expect(await indexAcademicBatch(input, context)).toMatchObject({ embedded: 0, reused: 0, skipped: 1 });
  expect(fetch).not.toHaveBeenCalled();
  expect(state.sync.mock.calls[0][1].p_rows).toEqual([]);
});

it("sends an exact unapproved scope for pruning without embedding its content", async () => {
  state.lessons = state.lessons.map(row => ({ ...(row as ApprovedLesson), approved: false }));
  await indexAcademicBatch(input, context);
  expect(fetch).not.toHaveBeenCalled();
  expect(state.sync.mock.calls[0][1].p_rows).toEqual([]);
  expect(state.sync.mock.calls[0][1].p_scopes[0].approved).toBe(false);
});

it("prunes one revoked locale without requiring the remaining approvals to form a complete card", async () => {
  state.lessons[0] = { ...(state.lessons[0] as ApprovedLesson), approved: false };
  await indexAcademicBatch(input, context);
  expect(fetch).not.toHaveBeenCalled();
  expect(state.sync.mock.calls[0][1].p_rows).toEqual([]);
  expect(state.sync.mock.calls[0][1].p_scopes).toEqual([expect.objectContaining({ locale: "ar-EG", approved: false })]);
});

it("requires a verified admin before reading/indexing and rechecks before index mutation", async () => {
  state.admin = false;
  await expect(indexAcademicBatch(input, context)).rejects.toThrow("ACADEMIC_ADMIN_REQUIRED");
  expect(fetch).not.toHaveBeenCalled(); expect(state.sync).not.toHaveBeenCalled();
  state.admin = true; state.adminCalls = 0; state.revoke = true;
  await expect(indexAcademicBatch(input, context)).rejects.toThrow("ACADEMIC_ADMIN_REQUIRED");
  expect(state.sync).not.toHaveBeenCalled();
});

it("propagates a source-change transaction failure instead of reporting a successful cleanup", async () => {
  state.sync.mockResolvedValue({ data: null, error: { message: "ACADEMIC_IMPORT_SOURCE_CHANGED" } });
  await expect(indexAcademicBatch(input, context)).rejects.toThrow("ACADEMIC_SERVICE_UNAVAILABLE");
});
