// @vitest-environment node
/** Handler contract only: mock the server-function registration and database port.
 * Do not load real auth, clients, routes, widgets, lesson content or network services.
 * Auth assertions cover unchanged registration, not a new authentication audit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registration = vi.hoisted(() => ({
  options: undefined as unknown,
  middleware: [] as unknown[],
  validate: undefined as ((input: unknown) => unknown) | undefined,
  auth: Object.freeze({ marker: "test-only-auth-boundary" }),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: (options: unknown) => {
    registration.options = options;
    return {
      middleware(chain: unknown[]) { registration.middleware = chain; return this; },
      inputValidator(validate: (input: unknown) => unknown) { registration.validate = validate; return this; },
      handler(fn: unknown) { return fn; },
    };
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: registration.auth }));
import { getDueReviews, type DueReview } from "../spaced-repetition.functions";

type ScheduleRow = {
  lesson_id: string; next_review_at: string; interval_days: number; reviews: number; lapses: number;
};
type ReadResult = { data: ScheduleRow[] | null; error: unknown };
const now = "2031-04-05T10:11:12.000Z";
const actorA = "synthetic-actor-a", actorB = "synthetic-actor-b";
const rows: ScheduleRow[] = [
  { lesson_id: "synthetic-older", next_review_at: "2031-04-01T00:00:00.000Z", interval_days: 3, reviews: 2, lapses: 1 },
  { lesson_id: "synthetic-due", next_review_at: now, interval_days: 7, reviews: 4, lapses: 0 },
];
function fakeRead(result: ReadResult) {
  const query = {
    select: vi.fn(), eq: vi.fn(), lte: vi.fn(), order: vi.fn(),
    limit: vi.fn(async (_limit: number): Promise<ReadResult> => result),
  };
  for (const method of [query.select, query.eq, query.lte, query.order]) method.mockReturnValue(query);
  const from = vi.fn((_table: string) => query);
  return { supabase: { from }, query };
}
type Port = ReturnType<typeof fakeRead>;
const invoke = (port: Port, userId = actorA) =>
  (getDueReviews as unknown as (input: {
    context: { userId: string; supabase: Port["supabase"] };
  }) => Promise<DueReview[]>)({ context: { userId, supabase: port.supabase } });
function expectReadBoundary(port: Port, actor = actorA) {
  expect(port.supabase.from).toHaveBeenCalledExactlyOnceWith("lesson_review_schedule");
  expect(port.query.select).toHaveBeenCalledExactlyOnceWith("lesson_id, next_review_at, interval_days, reviews, lapses");
  expect(port.query.eq).toHaveBeenCalledExactlyOnceWith("user_id", actor);
  expect(port.query.lte).toHaveBeenCalledExactlyOnceWith("next_review_at", now);
  expect(port.query.order).toHaveBeenCalledExactlyOnceWith("next_review_at", { ascending: true });
  expect(port.query.limit).toHaveBeenCalledExactlyOnceWith(20);
  const order = [port.supabase.from, port.query.select, port.query.eq, port.query.lte, port.query.order, port.query.limit]
    .map(method => method.mock.invocationCallOrder[0]);
  expect(order).toEqual([...order].sort((a, b) => a - b));
}
function expectNoDiagnosticPayload() {
  expect(console.error).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.log).not.toHaveBeenCalled();
}
async function expectSafeReadFailure(port: Port) {
  const failure: unknown = await invoke(port).then(
    () => { throw new Error("TEST_EXPECTED_READ_REJECTION"); },
    error => error,
  );
  expect(failure).toBeInstanceOf(Error);
  expect((failure as Error).message).toBe("DUE_REVIEWS_UNAVAILABLE");
  expect((failure as Error).cause).toBeUndefined();
  expect(Object.keys(failure as Error)).toEqual([]);
  expectReadBoundary(port);
  expectNoDiagnosticPayload();
}

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(now));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("getDueReviews safe read-error contract", () => {
  it("retains GET and the existing authentication middleware registration", () => {
    expect(registration.options).toEqual({ method: "GET" });
    expect(registration.middleware).toEqual([registration.auth]);
    expect(registration.validate).toBeTypeOf("function");
  });

  it.each([
    { label: "omitted", value: undefined }, { label: "null", value: null }, { label: "empty object", value: {} },
  ])("retains accepted $label input", ({ value }) => {
    expect(registration.validate!(value)).toEqual({});
  });

  it.each([
    { label: "caller identity", value: { userId: actorB } },
    { label: "caller limit", value: { limit: 100 } },
    { label: "caller cutoff", value: { nextReviewAt: "2099-01-01" } },
    { label: "array", value: [] }, { label: "string", value: actorB },
  ])("rejects unexpected $label input using the real validator", ({ value }) => {
    expect(() => registration.validate!(value)).toThrow();
  });

  it("returns populated DueReview records with unchanged mapping, order and read boundary", async () => {
    const port = fakeRead({ data: rows, error: null });
    await expect(invoke(port)).resolves.toEqual([
      { lessonId: "synthetic-older", nextReviewAt: "2031-04-01T00:00:00.000Z", intervalDays: 3, reviews: 2, lapses: 1 },
      { lessonId: "synthetic-due", nextReviewAt: now, intervalDays: 7, reviews: 4, lapses: 0 },
    ]);
    expectReadBoundary(port); expectNoDiagnosticPayload();
  });

  it.each([
    { label: "empty rows", data: [] }, { label: "null data", data: null },
  ])("keeps successful $label as an empty array", async ({ data }) => {
    const port = fakeRead({ data, error: null });
    await expect(invoke(port)).resolves.toEqual([]);
    expectReadBoundary(port); expectNoDiagnosticPayload();
  });

  it.each([
    { label: "without data", data: null }, { label: "with partial data", data: rows },
  ])("rejects a returned database error $label without exposing or logging its payload", async ({ data }) => {
    const port = fakeRead({ data, error: {
      message: "SYNTHETIC_PRIVATE_DB_MESSAGE", details: "SYNTHETIC_PRIVATE_ACTOR_DATA",
      hint: "SYNTHETIC_INTERNAL_HINT", code: "SYNTHETIC_DB_CODE",
    } });
    await expectSafeReadFailure(port);
  });

  it("normalizes a rejected read without leaking its raw error or treating it as empty success", async () => {
    const port = fakeRead({ data: null, error: null });
    port.query.limit.mockRejectedValue(new Error("SYNTHETIC_PRIVATE_TRANSPORT_AND_ACTOR_DATA"));
    await expectSafeReadFailure(port);
  });

  it("uses each request's context actor without reusing the previous identity", async () => {
    const first = fakeRead({ data: [], error: null }), second = fakeRead({ data: [], error: null });
    await invoke(first, actorA); await invoke(second, actorB);
    expectReadBoundary(first, actorA); expectReadBoundary(second, actorB);
  });
});
