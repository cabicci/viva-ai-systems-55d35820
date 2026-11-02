import { describe, expect, it, vi } from "vitest";
import { runLearningReport } from "./reports.server";
const report = {
  summary: "Completed one lesson",
  strengths: ["Recorded completion"],
  review: [],
  nextSteps: ["Try the assessment"],
  limitations: ["No assessment grade is recorded"],
};
const deps = () => ({
  reserve: vi.fn(async () => ({
    state: "claimed" as const,
    claimToken: "claim",
    snapshot: { records: [] },
  })),
  generate: vi.fn(async (_system: string, _user: string) => JSON.stringify(report)),
  finish: vi.fn(async () => true),
});
describe("evidence-bound report orchestration", () => {
  it("claims quota before any provider call and commits a validated report", async () => {
    const d = deps();
    expect(await runLearningReport("ar-EG", d)).toEqual({ state: "ready", report });
    expect(d.reserve.mock.invocationCallOrder[0]).toBeLessThan(
      d.generate.mock.invocationCallOrder[0],
    );
    expect(d.generate.mock.calls[0]?.[0]).toContain("Missing evidence is unknown");
    expect(d.finish).toHaveBeenCalledWith("claim", report);
  });
  it.each(["pending", "ready"] as const)(
    "never calls the model for a %s request",
    async (state) => {
      const d = deps();
      const result = state === "ready" ? { state, report } : { state };
      expect(await runLearningReport("en", { ...d, reserve: async () => result })).toEqual(result);
      expect(d.generate).not.toHaveBeenCalled();
    },
  );
  it("releases a failed generation and rejects malformed output", async () => {
    const d = deps();
    d.generate.mockResolvedValue('{"summary":"invented"}');
    await expect(runLearningReport("en", d)).rejects.toThrow();
    expect(d.finish).toHaveBeenCalledWith("claim", null);
  });
  it("does not report success when persistence confirmation fails", async () => {
    const d = deps();
    d.finish.mockResolvedValue(false);
    await expect(runLearningReport("en", d)).rejects.toThrow("CONFIRMATION_UNAVAILABLE");
  });
  it("does not call the model after an authorization/quota rejection", async () => {
    const d = deps();
    d.reserve.mockRejectedValue(new Error("LIMIT"));
    await expect(runLearningReport("en", d)).rejects.toThrow("LIMIT");
    expect(d.generate).not.toHaveBeenCalled();
  });
});
