// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AutomaticLease } from "../assistant-automation/store.server";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), check: vi.fn(), reserve: vi.fn(), native: vi.fn(), academic: vi.fn(),
  deps: vi.fn(), executeAI: vi.fn(), prior: vi.fn(), from: vi.fn(), select: vi.fn(), neq: vi.fn(), or: vi.fn() }));
vi.mock("../assistant-automation/store.server", () => ({ automationRpc: mocks.rpc, checkAutomaticLease: mocks.check,
  reserveAutomaticProvider: mocks.reserve, leaseArguments: (l: AutomaticLease) => ({ p_job: l.jobId, p_request: l.requestId, p_lease: l.leaseToken }) }));
vi.mock("@/lib/card-assistant/assistant.server", () => ({ indexCardBatchWithAuthority: mocks.native }));
vi.mock("@/lib/academic-education/assistant.server", () => ({ indexAcademicBatchWithAuthority: mocks.academic }));
vi.mock("@/lib/rag/current-release/dependencies.server", () => ({ currentReleaseDependencies: mocks.deps }));
vi.mock("@/lib/rag/current-release/executor.server", () => ({ executeCurrentRelease: mocks.executeAI }));
vi.mock("@/lib/card-assistant/registry", () => ({ CARD_REGISTRY: [] }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
import { automaticTick, executeAutomaticScope, type AutomaticTickDependencies } from "../assistant-automation/worker.server";
import { loadCurrentRelease } from "../rag/current-release/corpus.server";
const sha = "a".repeat(64);
function lease(area: "kids" | "academic" | "ai" = "kids", offset = 0): AutomaticLease {
  return { jobId: sha, requestId: "00000000-0000-4000-8000-000000000001", leaseToken: "00000000-0000-4000-8000-000000000002", offset,
    manifest: { schemaVersion: "assistant-auto-v1", build: sha, area, cardId: area === "academic" ? "AC-NEW" : area === "ai" ? "current" : "level-1",
      scopes: area === "ai" ? [] : [{ stepId: "1", locale: "en", sourceSha: sha }], scopeCount: area === "ai" ? 3 : 2,
      issue: null, ...(area === "ai" ? { releaseId: sha } : {}) } };
}
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: mocks.select, neq: mocks.neq, or: mocks.or, limit: mocks.prior };
  mocks.from.mockReturnValue(query); mocks.select.mockReturnValue(query);
  mocks.neq.mockReturnValue(query); mocks.or.mockReturnValue(query);
  mocks.prior.mockResolvedValue({ data: [], error: null });
  mocks.executeAI.mockResolvedValue({ committed: true, activated: true, providerCalls: 0 });
  mocks.check.mockResolvedValue(undefined); mocks.reserve.mockResolvedValue(undefined); mocks.rpc.mockResolvedValue(true);
  const result = { proofs: [{ stepId: "1", locale: "en", sourceSha: sha, chunks: [] }], embedded: 1, reused: 0 };
  mocks.native.mockResolvedValue(result); mocks.academic.mockResolvedValue(result);
  mocks.deps.mockResolvedValue({ load: () => ({ approval: { releaseId: sha, indexVersion: "next" } }), rpc: vi.fn().mockResolvedValue({ executionId: "execution", currentActiveVersion: "previous" }) });
});
describe("automatic worker isolation and guarded publication", () => {
  it("checks the live lease before any source adapter or provider", async () => {
    mocks.check.mockRejectedValue(new Error("AUTOMATION_LEASE_UNAVAILABLE"));
    await expect(executeAutomaticScope(lease())).rejects.toThrow("LEASE_UNAVAILABLE");
    expect(mocks.native).not.toHaveBeenCalled(); expect(mocks.deps).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["kids", "academic"] as const)("passes the exact %s scope and durable authority to its shared core", async area => {
    const l = lease(area); expect(await executeAutomaticScope(l)).toMatchObject({ embedded: 1 });
    const core = area === "kids" ? mocks.native : mocks.academic;
    expect(core).toHaveBeenCalledOnce(); const authority = core.mock.calls[0][1];
    expect(authority.sources).toEqual(l.manifest.scopes);
    await authority.check(); await authority.beforeEmbedding(); expect(mocks.reserve).toHaveBeenCalledWith(l);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not accept a receipt for a different card source scope", async () => {
    mocks.native.mockResolvedValue({ proofs: [{ stepId: "other", locale: "en", sourceSha: sha }], embedded: 1, reused: 0 });
    await expect(executeAutomaticScope(lease())).rejects.toThrow("AUTOMATION_SCOPE_CHANGED");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["kids", "academic"] as const)("delegates final %s activation to the atomic database coverage guard", async area => {
    expect(await executeAutomaticScope(lease(area, 1))).toEqual(area === "academic" ? { prepared: true, activated: true } : { activated: true });
    expect(mocks.rpc).toHaveBeenCalledWith(area === "kids" ? "assistant_auto_publish_card" : "assistant_auto_publish_academic", expect.any(Object));
    expect(mocks.native).not.toHaveBeenCalled(); expect(mocks.academic).not.toHaveBeenCalled();
  });
  it("finalizes a preparation-only Academic index without claiming runtime activation", async () => {
    const l = lease("academic", 1); l.manifest.preparationOnly = true;
    expect(await executeAutomaticScope(l)).toEqual({ prepared: true, activated: false });
    expect(mocks.rpc).toHaveBeenCalledWith("assistant_auto_publish_academic", expect.any(Object));
    expect(mocks.academic).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("never retries a legacy uncertain AI request after its lease expires", async () => {
    mocks.rpc.mockResolvedValue(false);
    await expect(executeAutomaticScope(lease("ai", 1))).rejects.toThrow("AUTOMATION_AI_REQUEST_NEEDS_REVIEW");
    expect(mocks.executeAI).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it.each([0, 1, 2])("holds AI operation at offset %s when another release has unresolved work", async offset => {
    mocks.prior.mockResolvedValue({ data: [{ release_id: "previous-release" }], error: null });
    await expect(executeAutomaticScope(lease("ai", offset))).rejects.toThrow("AUTOMATION_AI_REQUEST_NEEDS_REVIEW");
    expect(mocks.executeAI).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledWith("rag_current_batches");
    expect(mocks.select).toHaveBeenCalledWith("release_id");
    expect(mocks.neq.mock.calls).toEqual([["release_id", sha], ["state", "done"]]);
    expect(mocks.or).toHaveBeenCalledWith("state.eq.inflight,provider_reserved.eq.true");
    expect(mocks.prior).toHaveBeenCalledWith(1);
  });
  it.each([
    { data: null, error: { message: "unavailable" } },
    { data: null, error: null },
    { data: {}, error: null },
  ])("holds AI work when prior-release status is unavailable or malformed (%j)", async result => {
    mocks.prior.mockResolvedValue(result);
    await expect(executeAutomaticScope(lease("ai", 1))).rejects.toThrow("AUTOMATION_AI_REQUEST_NEEDS_REVIEW");
    expect(mocks.executeAI).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it.each([[0, "initialize"], [1, "batch"], [2, "activate"]] as const)(
    "allows AI %s only when the prior-release guard is clear", async (offset, operation) => {
      await expect(executeAutomaticScope(lease("ai", offset))).resolves.toMatchObject({ operation });
      expect(mocks.executeAI).toHaveBeenCalledOnce();
      expect(mocks.executeAI.mock.calls[0][0]).toMatchObject({ operation, releaseId: sha });
      if (operation === "batch")
        expect(mocks.rpc).toHaveBeenCalledWith("assistant_auto_ai_clear", { p_release: sha });
    },
  );
  it("does not restart an already active AI release", async () => {
    mocks.deps.mockResolvedValue({ load: () => ({ approval: { releaseId: sha, indexVersion: "next" } }),
      rpc: vi.fn().mockResolvedValue({ executionId: "execution", currentActiveVersion: "next" }) });
    await expect(executeAutomaticScope(lease("ai", 1))).resolves.toEqual({ alreadyActive: true });
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.executeAI).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it.each([0, 1, 62])("reuses actual compiled active 0c0f at offset %s without touching historical UNKNOWN", async offset => {
    const current = loadCurrentRelease();
    const l = lease("ai", offset); l.manifest.releaseId = current.approval.releaseId; l.manifest.scopeCount = 63;
    mocks.prior.mockResolvedValue({ data: [{ release_id: "11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5" }], error: null });
    mocks.deps.mockResolvedValue({ load: () => current,
      rpc: vi.fn().mockResolvedValue({ executionId: "ready-transfer-execution", currentActiveVersion: current.approval.indexVersion }) });
    await expect(executeAutomaticScope(l)).resolves.toEqual({ alreadyActive: true });
    expect(current.approval.releaseId).toBe("0c0f31b61c596fd6b8687bb156911f8d28613581af0fcf5f7ac4063dce3c1b85");
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.executeAI).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("allows a different future release only after positive database revalidation of every prior retirement", async () => {
    mocks.prior.mockResolvedValue({ data: [{ release_id: "11930-UNKNOWN" }], error: null });
    const rpc = vi.fn(async (name: string) => name === "rag_current_status"
      ? { executionId: "future-execution", currentActiveVersion: "previous" } : true);
    mocks.deps.mockResolvedValue({ load: () => ({ approval: { releaseId: sha, indexVersion: "next" } }), rpc });
    await expect(executeAutomaticScope(lease("ai", 0))).resolves.toMatchObject({ operation: "initialize" });
    expect(rpc).toHaveBeenCalledWith("rag_current_prior_ai_clear", { p_release_id: sha });
    expect(mocks.executeAI).toHaveBeenCalledOnce();
  });
  it("a prior retirement never clears an uncertain batch of the current release", async () => {
    mocks.prior.mockResolvedValue({ data: [{ release_id: "11930-UNKNOWN" }], error: null });
    mocks.deps.mockResolvedValue({ load: () => ({ approval: { releaseId: sha, indexVersion: "next" } }),
      rpc: vi.fn(async (name: string) => name === "rag_current_status" ? { executionId: "future-execution", currentActiveVersion: "previous" } : true) });
    mocks.rpc.mockResolvedValue(false);
    await expect(executeAutomaticScope(lease("ai", 1))).rejects.toThrow("AUTOMATION_AI_REQUEST_NEEDS_REVIEW");
    expect(mocks.executeAI).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
  });

});

describe("scheduled assistant response cache maintenance", () => {
  function ports(result: unknown, fails = false) {
    const rpc = vi.fn(async (name: string) => {
      if (name === "prune_assistant_response_cache") { if (fails) throw Error("private database diagnostic"); return result; }
      return name === "assistant_auto_claim" ? { done: true } : true;
    });
    const dependencies: AutomaticTickDependencies = { plans: async () => [], rpc: rpc as AutomaticTickDependencies["rpc"],
      execute: vi.fn(), registry: [] };
    return { dependencies, rpc };
  }
  it("prunes one bounded batch without adding a provider or changing indexing completion", async () => {
    const { dependencies, rpc } = ports({ pruned: 12 });
    expect(await automaticTick("request", dependencies, true)).toEqual({ done: true, responseCachePrune: { state: "complete", pruned: 12 } });
    expect(rpc.mock.calls.filter(([name]) => name === "prune_assistant_response_cache")).toEqual([["prune_assistant_response_cache", { p_limit: 1000 }]]);
    expect(dependencies.execute).not.toHaveBeenCalled();
  });
  it.each([false, true])("records cleanup for the next scheduled retry without losing the indexing result (%s)", async fails => {
    const { dependencies } = ports({ pruned: "invalid" }, fails);
    expect(await automaticTick("request", dependencies, true)).toEqual({ done: true,
      responseCachePrune: { state: "retry", code: "ASSISTANT_CACHE_PRUNE_UNAVAILABLE" } });
  });
  it("does not prune on subsequent ticks without the first-tick flag", async () => {
    const { dependencies, rpc } = ports({ pruned: 12 });
    expect(await automaticTick("request", dependencies)).toEqual({ done: true });
    expect(rpc.mock.calls.some(([name]) => name === "prune_assistant_response_cache")).toBe(false);
  });
});
