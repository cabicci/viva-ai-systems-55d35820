// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({
  tick: vi.fn(),
  plans: vi.fn(),
  legacy: vi.fn(),
  admittedPlans: vi.fn(),
  admitted: vi.fn(),
}));
vi.mock("@/lib/assistant-automation/worker.server", () => ({
  automaticTick: calls.tick,
  currentAutomaticPlans: calls.plans,
  executeAutomaticScope: calls.legacy,
}));
vi.mock("./index.server", () => ({
  curriculumAutomaticPlans: calls.admittedPlans,
  indexCurriculumScope: calls.admitted,
}));
import { automaticTick } from "./automatic-worker.server";
import type { AutomaticTickDependencies } from "@/lib/assistant-automation/worker.server";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("__ASSISTANT_INDEXER_BUILD__", "a".repeat(64));
});
afterEach(() => vi.unstubAllGlobals());
it("preserves completed legacy plans and dispatches both course kinds through the original queue", async () => {
  const old = { key: "existing-complete-key", manifest: { area: "ai" } },
    added = { key: "admitted-key", manifest: { area: "technical", adapter: "curriculum" } };
  calls.plans.mockResolvedValue([old]);
  calls.admittedPlans.mockResolvedValue([added]);
  calls.tick.mockImplementation(
    async (id: string, ports: AutomaticTickDependencies, prune: boolean) => {
      const plans = await ports.plans();
      expect(plans).toEqual([old, added]);
      expect(plans[0]).toBe(old);
      await ports.execute({ manifest: old.manifest } as never);
      await ports.execute({ manifest: added.manifest } as never);
      return { id, prune };
    },
  );
  expect(await automaticTick("request", undefined, true)).toEqual({ id: "request", prune: true });
  expect(calls.tick).toHaveBeenCalledTimes(1);
  expect(calls.legacy).toHaveBeenCalledTimes(1);
  expect(calls.admitted).toHaveBeenCalledTimes(1);
  expect(calls.admittedPlans).toHaveBeenCalledWith("a".repeat(64));
});
it("stops before claiming work when the combined registry exceeds the existing queue limit", async () => {
  calls.plans.mockResolvedValue(Array(200).fill({ key: "existing" }));
  calls.admittedPlans.mockResolvedValue([{ key: "new" }]);
  calls.tick.mockImplementation(async (_: string, ports: AutomaticTickDependencies) =>
    ports.plans(),
  );
  await expect(automaticTick("request")).rejects.toThrow("AUTOMATION_SCOPE_LIMIT");
  expect(calls.admitted).not.toHaveBeenCalled();
  expect(calls.legacy).not.toHaveBeenCalled();
});
