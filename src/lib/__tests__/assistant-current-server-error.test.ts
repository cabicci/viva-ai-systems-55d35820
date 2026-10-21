// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ role: true, execute: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; },
}) }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {} }));
vi.mock("@/lib/rag/current-release/corpus.server", () => ({ loadCurrentRelease: vi.fn() }));
vi.mock("@/lib/rag/current-release/executor.server", () => ({ executeCurrentRelease: state.execute }));
import { runCurrentRagRelease } from "../rag-current-release.functions";
async function invoke() {
  return (runCurrentRagRelease as unknown as (args: unknown) => Promise<Record<string, unknown>>)({
    context: { userId: "verified-admin", supabase: { rpc: async () => ({ data: state.role, error: null }) } },
    data: { operation: "batch" },
  });
}
beforeEach(() => { vi.clearAllMocks(); state.role = true; });
it("returns a safe provider status to the verified operator and preserves unknown paid-call count", async () => {
  state.execute.mockRejectedValue(new Error("PROVIDER_FAILED:HTTP_429"));
  expect(await invoke()).toMatchObject({ errorCode: "CURRENT_PROVIDER_HTTP_429", providerCalls: null, activated: false, committed: false });
  expect(state.execute).toHaveBeenCalledTimes(1);
});
it("never exposes arbitrary server, key or source errors", async () => {
  state.execute.mockRejectedValue(new Error("private source body and sk-secret"));
  expect(JSON.stringify(await invoke())).not.toMatch(/private|sk-secret/);
  expect((await invoke()).errorCode).toBe("CURRENT_OPERATION_UNAVAILABLE");
});
it("checks authorization before returning operational diagnostics", async () => {
  state.role = false;
  await expect(invoke()).rejects.toThrow("FORBIDDEN");
  expect(state.execute).not.toHaveBeenCalled();
});
