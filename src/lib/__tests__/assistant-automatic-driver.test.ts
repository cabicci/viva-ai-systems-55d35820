// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { runAutomaticDriver } from "../assistant-automation/driver";
const ready = { schemaVersion: "assistant-auto-v1", enabled: true };
describe("scheduled preparation driver", () => {
  it("may wait for a deployment but never retries a tick whose HTTP outcome was lost", async () => {
    const call = vi.fn().mockRejectedValueOnce(new Error("status deployment unavailable")).mockResolvedValueOnce(ready)
      .mockRejectedValueOnce(new Error("paid request outcome unknown"));
    const wait = vi.fn();
    await expect(runAutomaticDriver({ call, wait, now: () => 0, log: vi.fn() })).rejects.toThrow("outcome unknown");
    expect(call.mock.calls.map(args => args[0])).toEqual(["status", "status", "tick"]); expect(wait).toHaveBeenCalledOnce();
  });
  it("does not report success when a held paid request blocks following work", async () => {
    const call = vi.fn().mockResolvedValueOnce(ready).mockResolvedValueOnce({ held: true, code: "AUTOMATION_UNCERTAIN_REQUEST" }).mockResolvedValueOnce({ busy: true });
    await expect(runAutomaticDriver({ call, wait: vi.fn(), now: () => 0, log: vi.fn() })).rejects.toThrow("REVIEW_REQUIRED");
  });
  it("pauses only after the current bounded scope has completed", async () => {
    let clock = 0;
    const call = vi.fn(async operation => {
      if (operation === "status") return ready;
      clock = 50 * 60000;
      return { progressed: true, area: "kids", cardId: "level-1", completedScopes: 1, totalScopes: 49 };
    });
    expect(await runAutomaticDriver({ call, wait: vi.fn(), now: () => clock, log: vi.fn() })).toBe("paused");
    expect(call.mock.calls.map(args => args[0])).toEqual(["status", "tick"]);
  });
  it("makes no mutation when the installed policy is disabled", async () => {
    const call = vi.fn().mockResolvedValue({ ...ready, enabled: false });
    expect(await runAutomaticDriver({ call, wait: vi.fn(), now: () => 0, log: vi.fn() })).toBe("disabled");
    expect(call).toHaveBeenCalledExactlyOnceWith("status");
  });
});
