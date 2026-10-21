// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ from: vi.fn(), courses: vi.fn(), count: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware: () => ({ handler: (fn: unknown) => fn }) }) }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: state.from } }));
vi.mock("@/lib/card-assistant/registry", () => ({ CARD_REGISTRY: [
  { area: "kids", id: "future-card", steps: [{ id: "one" }, { id: "two" }] },
] }));
import { getNativePreparationCards } from "../native-assistant-preparation.functions";
const run = getNativePreparationCards as unknown as (args: { context: { userId: string; supabase: { rpc: ReturnType<typeof vi.fn> } } }) => Promise<unknown>;
beforeEach(() => {
  vi.clearAllMocks();
  state.courses.mockResolvedValue({ data: [{ id: "AC-FUTURE" }], error: null });
  state.count.mockResolvedValue({ count: 160, error: null });
  state.from.mockImplementation(name => name === "academic_courses"
    ? { select: state.courses } : { select: () => ({ eq: state.count }) });
});
function context(respond?: (name: string) => unknown) {
  return { userId: "verified-operator", supabase: { rpc: vi.fn(async (name: string) => respond ? respond(name) : { data: true, error: null }) } };
}
it("rejects a non-administrator before reading privileged course metadata", async () => {
  await expect(run({ context: context(() => ({ data: false, error: null })) })).rejects.toThrow("FORBIDDEN");
  expect(state.from).not.toHaveBeenCalled();
});
it("lists future registered cards and actual academic courses without content bodies", async () => {
  expect(await run({ context: context() })).toEqual({ operatorId: "verified-operator", cards: [
    { area: "kids", cardId: "future-card", scopes: 8 }, { area: "academic", cardId: "AC-FUTURE", scopes: 160 },
  ] });
  expect(state.courses).toHaveBeenCalledWith("id");
});
it("preserves each native review gate after checking the administrator role", async () => {
  const ctx = context(name => ({ data: name === "has_role", error: null }));
  expect(await run({ context: ctx })).toEqual({ operatorId: "verified-operator", cards: [] });
  expect(state.count).not.toHaveBeenCalled();
  expect(ctx.supabase.rpc).toHaveBeenCalledWith("academic_review_allowed", { p_course: "AC-FUTURE" });
});
it("fails closed on a native review RPC failure", async () => {
  await expect(run({ context: context(name => ({ data: true, error: name === "card_assistant_review_allowed" ? {} : null })) })).rejects.toThrow("PREPARATION_SERVICE_UNAVAILABLE");
  expect(state.from).not.toHaveBeenCalled();
});
it("uses an exact source count and rejects missing counts", async () => {
  state.count.mockResolvedValue({ count: null, error: null });
  await expect(run({ context: context() })).rejects.toThrow("PREPARATION_SOURCE_UNAVAILABLE");
});
