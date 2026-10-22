// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AutomaticLease } from "../assistant-automation/store.server";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), check: vi.fn(), reserve: vi.fn(), native: vi.fn(), academic: vi.fn(),
  deps: vi.fn(), executeAI: vi.fn() }));
vi.mock("../assistant-automation/store.server", () => ({ automationRpc: mocks.rpc, checkAutomaticLease: mocks.check,
  reserveAutomaticProvider: mocks.reserve, leaseArguments: (l: AutomaticLease) => ({ p_job: l.jobId, p_request: l.requestId, p_lease: l.leaseToken }) }));
vi.mock("@/lib/card-assistant/assistant.server", () => ({ indexCardBatchWithAuthority: mocks.native }));
vi.mock("@/lib/academic-education/assistant.server", () => ({ indexAcademicBatchWithAuthority: mocks.academic }));
vi.mock("@/lib/rag/current-release/dependencies.server", () => ({ currentReleaseDependencies: mocks.deps }));
vi.mock("@/lib/rag/current-release/executor.server", () => ({ executeCurrentRelease: mocks.executeAI }));
import { executeAutomaticScope } from "../assistant-automation/worker.server";
const sha = "a".repeat(64);
function lease(area: "kids" | "academic" | "ai" = "kids", offset = 0): AutomaticLease {
  return { jobId: sha, requestId: "00000000-0000-4000-8000-000000000001", leaseToken: "00000000-0000-4000-8000-000000000002", offset,
    manifest: { schemaVersion: "assistant-auto-v1", build: sha, area, cardId: area === "academic" ? "AC-NEW" : area === "ai" ? "current" : "level-1",
      scopes: area === "ai" ? [] : [{ stepId: "1", locale: "en", sourceSha: sha }], scopeCount: area === "ai" ? 3 : 2,
      issue: null, ...(area === "ai" ? { releaseId: sha } : {}) } };
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.check.mockResolvedValue(undefined); mocks.reserve.mockResolvedValue(undefined); mocks.rpc.mockResolvedValue(true);
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
    expect(await executeAutomaticScope(lease(area, 1))).toEqual({ activated: true });
    expect(mocks.rpc).toHaveBeenCalledWith(area === "kids" ? "assistant_auto_publish_card" : "assistant_auto_publish_academic", expect.any(Object));
    expect(mocks.native).not.toHaveBeenCalled(); expect(mocks.academic).not.toHaveBeenCalled();
  });
  it("never retries a legacy uncertain AI request after its lease expires", async () => {
    mocks.rpc.mockResolvedValue(false);
    await expect(executeAutomaticScope(lease("ai", 1))).rejects.toThrow("AUTOMATION_AI_REQUEST_NEEDS_REVIEW");
    expect(mocks.executeAI).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
  });
});
