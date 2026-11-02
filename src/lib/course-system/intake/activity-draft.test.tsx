import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readActivityDraft, useActivityDraft, type ActivityValues } from "./use-activity-draft";
const attemptId = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());
describe("attempt drafts across acknowledgments, devices and account changes", () => {
  it("debounces edits and persists the exact uncertain command identity for a safe retry", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("lost response"))
      .mockResolvedValue({ state: "draft_saved", revision: 1 });
    const { result } = renderHook(() =>
      useActivityDraft({
        storageKey: "account:course:version:step",
        attemptId,
        initial: {},
        revision: 0,
        current: () => true,
        save,
      }),
    );
    act(() => result.current.setValues({ response: "My answer" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(result.current.state).toBe("unconfirmed");
    const sent = save.mock.calls[0][0];
    expect(JSON.parse(localStorage.getItem("account:course:version:step")!).pending.requestId).toBe(
      sent.requestId,
    );
    await act(async () => {
      await result.current.retry();
    });
    expect(save).toHaveBeenLastCalledWith(sent);
    expect(result.current.state).toBe("saved");
    expect(localStorage.getItem("account:course:version:step")).toBeNull();
  });
  it("never silently overwrites another device's work", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({
        state: "draft_conflict",
        revision: 3,
        draft: { response: "Other device" },
      })
      .mockResolvedValue({ state: "draft_saved", revision: 4 });
    const { result } = renderHook(() =>
      useActivityDraft({
        storageKey: "owner:child:course",
        attemptId,
        initial: {},
        revision: 0,
        current: () => true,
        save,
      }),
    );
    act(() => result.current.setValues({ response: "My work" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(result.current.state).toBe("conflict");
    expect(result.current.values.response).toBe("My work");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(save).toHaveBeenCalledTimes(1);
    act(() => result.current.saveMine());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(save.mock.calls[1][0]).toMatchObject({
      revision: 3,
      submission: { response: "My work" },
    });
    expect(result.current.state).toBe("saved");
  });
  it("can choose the server draft without sending an overwrite", async () => {
    const save = vi.fn().mockResolvedValue({
      state: "draft_conflict",
      revision: 2,
      draft: { response: "Saved elsewhere" },
    });
    const { result } = renderHook(() =>
      useActivityDraft({
        storageKey: "scope",
        attemptId,
        initial: {},
        revision: 0,
        current: () => true,
        save,
      }),
    );
    act(() => result.current.setValues({ response: "Local work" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    act(() => result.current.useCloud());
    expect(result.current.values.response).toBe("Saved elsewhere");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
  it("restores only the same owner's verified attempt and ignores expired/different attempts", () => {
    const raw = JSON.stringify({ attemptId, values: { response: "Unsaved work" } });
    localStorage.setItem("owner-a:course", raw);
    const first = renderHook(() =>
      useActivityDraft({
        storageKey: "owner-a:course",
        attemptId,
        initial: {},
        revision: 0,
        current: () => true,
        save: vi.fn(),
      }),
    );
    expect(first.result.current.values.response).toBe("Unsaved work");
    first.unmount();
    const second = renderHook(() =>
      useActivityDraft({
        storageKey: "owner-b:course",
        attemptId,
        initial: {},
        revision: 0,
        current: () => true,
        save: vi.fn(),
      }),
    );
    expect(second.result.current.values).toEqual({});
    expect(readActivityDraft(raw, "22222222-2222-4222-8222-222222222222")).toBeNull();
  });
  it("retires an in-flight result after the owning account/session stops being current", async () => {
    let current = true;
    let finish!: (value: unknown) => void;
    const save = vi.fn(
      () =>
        new Promise<{ state: "draft_saved"; revision: number }>((resolve) => {
          finish = (value) => resolve(value as never);
        }),
    );
    const hook = renderHook(() =>
      useActivityDraft({
        storageKey: "a:course",
        attemptId,
        initial: {},
        revision: 0,
        current: () => current,
        save,
      }),
    );
    act(() => hook.result.current.setValues({ response: "Owned work" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    const before = localStorage.getItem("a:course");
    current = false;
    hook.unmount();
    await act(async () => {
      finish({ state: "draft_saved", revision: 1 });
    });
    expect(localStorage.getItem("a:course")).toBe(before);
  });
  it("loads a newer clean server draft, while preserving edits if another device races", () => {
    const initial: ActivityValues = {};
    const { result, rerender } = renderHook(
      ({ values, revision }) =>
        useActivityDraft({
          storageKey: "scope",
          attemptId,
          initial: values,
          revision,
          current: () => true,
          save: vi.fn(),
        }),
      { initialProps: { values: initial, revision: 0 } },
    );
    rerender({ values: { response: "Server" }, revision: 1 });
    expect(result.current.values.response).toBe("Server");
    act(() => result.current.setValues({ response: "New local edit" }));
    rerender({ values: { response: "Another device" }, revision: 2 });
    expect(result.current.state).toBe("conflict");
    expect(result.current.values.response).toBe("New local edit");
  });
});
