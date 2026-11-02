import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  listeners: [] as Array<(event: string, session: { user: { id: string } } | null) => void>,
  getSession: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: sdk.getSession,
      onAuthStateChange: (fn: (typeof sdk.listeners)[number]) => {
        sdk.listeners.push(fn);
      },
    },
    from: (table: string) => ({
      upsert: (row: unknown, options: unknown) => sdk.upsert(table, row, options),
    }),
  },
}));
vi.mock("@/lib/lesson-catalog", () => ({ getLesson: () => null }));
vi.mock("@/lib/error-capture", () => ({ captureWarn: vi.fn() }));

function session(user: string | null) {
  for (const listener of sdk.listeners) listener("SIGNED_IN", user ? { user: { id: user } } : null);
}
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  localStorage.clear();
  sdk.listeners.length = 0;
  vi.stubGlobal("crypto", webcrypto);
  sdk.getSession.mockResolvedValue({ data: { session: { user: { id: "A" } } } });
  sdk.upsert.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("account scoped local learning persistence", () => {
  it("does not adopt unattributed logs or expose one account's history to another", async () => {
    localStorage.setItem("build-logs:v1", JSON.stringify([{ id: "legacy-unknown" }]));
    const owner = await import("@/lib/local-learning-owner");
    owner.localLearningOwner();
    await Promise.resolve();
    const logs = await import("@/lib/build-logs");
    const sync = await import("@/lib/cloud-sync");
    expect(logs.getBuildLogs()).toEqual([]);
    logs.addBuildLog({ type: "lesson_completed", lessonId: "L1" });
    await sync.retryCloudSync();
    expect(logs.getBuildLogs()).toHaveLength(1);
    session("B");
    expect(logs.getBuildLogs()).toEqual([]);
    logs.addBuildLog({ type: "lesson_completed", lessonId: "L2" });
    await sync.retryCloudSync();
    session("A");
    expect(logs.getBuildLogs().map((log) => log.lessonId)).toEqual(["L1"]);
    expect(JSON.parse(localStorage.getItem("build-logs:v1")!)).toEqual([{ id: "legacy-unknown" }]);
  });

  it("ignores a delayed bootstrap session after a newer observed sign-in", async () => {
    let finish!: (value: unknown) => void;
    sdk.getSession.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const owner = await import("@/lib/local-learning-owner");
    const initial = owner.localLearningOwner();
    session("B");
    finish({ data: { session: { user: { id: "A" } } } });
    await Promise.resolve();
    expect(owner.localLearningOwner().userId).toBe("B");
    expect(owner.localLearningOwnerCurrent(initial)).toBe(false);
  });

  it("retains failed mission writes across reload-style retries, scoped to the originating user", async () => {
    const owner = await import("@/lib/local-learning-owner");
    owner.localLearningOwner();
    await Promise.resolve();
    const sync = await import("@/lib/cloud-sync");
    sdk.upsert.mockResolvedValueOnce({ error: new Error("offline") });
    await sync.syncMissionState("L1::mission", "completed", "A");
    expect(JSON.parse(localStorage.getItem("learning-sync:v1:A")!)).toHaveLength(1);
    session("B");
    await sync.retryCloudSync();
    expect(sdk.upsert).toHaveBeenCalledTimes(1);
    session("A");
    await sync.retryCloudSync();
    expect(sdk.upsert).toHaveBeenCalledTimes(2);
    expect(sdk.upsert.mock.calls[1][1]).toMatchObject({ user_id: "A", state: "completed" });
    expect(JSON.parse(localStorage.getItem("learning-sync:v1:A")!)).toEqual([]);
  });

  it("uses the same UUID when a log response fails after the remote insert", async () => {
    const owner = await import("@/lib/local-learning-owner");
    owner.localLearningOwner();
    await Promise.resolve();
    const sync = await import("@/lib/cloud-sync");
    sdk.upsert.mockResolvedValueOnce({ error: new Error("response lost") });
    await sync.syncBuildLog(
      {
        id: "existing-local-id",
        type: "lesson_completed",
        lessonId: "L1",
        moduleId: null,
        title: "Lesson",
        shortDescription: "Complete",
        timestamp: 1,
      },
      undefined,
      "A",
    );
    await sync.retryCloudSync();
    expect(sdk.upsert).toHaveBeenCalledTimes(2);
    expect(sdk.upsert.mock.calls[0][1].id).toBe(sdk.upsert.mock.calls[1][1].id);
    expect(sdk.upsert.mock.calls[1][2]).toEqual({ onConflict: "id", ignoreDuplicates: true });
  });

  it("does not remove a newer queued mission edit when an earlier request completes", async () => {
    const owner = await import("@/lib/local-learning-owner");
    owner.localLearningOwner();
    await Promise.resolve();
    const sync = await import("@/lib/cloud-sync");
    let finish!: (value: { error: null }) => void;
    sdk.upsert.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const first = sync.syncMissionState("L1::mission", "started", "A");
    const second = sync.syncMissionState("L1::mission", "completed", "A");
    finish({ error: null });
    await first;
    await second;
    expect(JSON.parse(localStorage.getItem("learning-sync:v1:A")!)[0].state).toBe("completed");
    await sync.retryCloudSync();
    expect(sdk.upsert.mock.calls[1][1].state).toBe("completed");
  });
});
