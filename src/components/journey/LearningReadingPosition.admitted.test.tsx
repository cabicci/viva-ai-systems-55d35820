import React from "react";
import { act, render, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningReadingPosition } from "./LearningReadingPosition";
const live = vi.hoisted(() => ({ auth: null as any, position: vi.fn(), legacy: vi.fn() }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => live.auth }));
vi.mock("@/lib/course-system/intake/functions", () => ({
  curriculumPosition: live.position,
  readCurriculumJourney: vi.fn(),
}));
vi.mock("@/lib/learning/client", () => ({ learningCommand: live.legacy }));
const actor = "a1400000-0000-4000-8000-000000000001",
  record = "a1400000-0000-4000-8000-000000000010";
const version = "a".repeat(64),
  scope = { area: "ai" as const, course: "synthetic", lesson: "lesson" };
let client: QueryClient;
function view(v = version, onContentChanged = vi.fn()) {
  return (
    <QueryClientProvider client={client}>
      <LearningReadingPosition
        scope={scope}
        admitted={{ recordId: record, contentVersion: v, locale: "en" }}
        onContentChanged={onContentChanged}
      />
    </QueryClientProvider>
  );
}
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  localStorage.clear();
  live.auth = {
    user: { id: actor },
    loading: false,
    authGeneration: {},
    isAuthGenerationCurrent: (g: object) => g === live.auth.authGeneration,
  };
  live.legacy.mockReset();
  live.position
    .mockReset()
    .mockImplementation(async ({ data }: any) =>
      data.action === "position" ? { ratio: 0.4, contentVersion: data.contentVersion } : {},
    );
  Object.defineProperty(window, "scrollY", { value: 200, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: 2000,
    configurable: true,
  });
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.useRealTimers();
});
describe("M14 admitted reading position", () => {
  it("restores delivered version and never invokes enrollment-writing records", async () => {
    const result = render(view());
    await settle();
    expect(live.legacy).not.toHaveBeenCalled();
    fireEvent.click(result.getByText("Return to saved reading position"));
    expect(window.scrollTo).toHaveBeenCalled();
    fireEvent.scroll(window);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    const save = live.position.mock.calls.find(([x]) => x.data.action === "save_position")?.[0];
    expect(save.data).toMatchObject({
      expectedAccountId: actor,
      recordId: record,
      contentVersion: version,
      locale: "en",
    });
  });
  it("does not upgrade an old unversioned local ratio", async () => {
    localStorage.setItem(
      `learning-position:v1:${JSON.stringify([actor, record, "lesson", "en"])}`,
      "0.9",
    );
    render(view());
    await settle();
    expect(live.position.mock.calls.every(([x]) => x.data.action === "position")).toBe(true);
  });
  it("retires pending old-version timer on a delivery change", async () => {
    const result = render(view());
    await settle();
    fireEvent.scroll(window);
    result.rerender(view("b".repeat(64)));
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(
      live.position.mock.calls.filter(([x]) => x.data.action === "save_position"),
    ).toHaveLength(0);
  });
  it("stops an old auth generation even before rerender", async () => {
    render(view());
    await settle();
    fireEvent.scroll(window);
    live.auth.authGeneration = {};
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(
      live.position.mock.calls.filter(([x]) => x.data.action === "save_position"),
    ).toHaveLength(0);
  });
  it("refreshes expired delivery and never relabels/retries its rejected save", async () => {
    const changed = vi.fn();
    live.position.mockImplementation(async ({ data }: any) => {
      if (data.action === "save_position") throw new Error("CURRICULUM_CONTENT_CHANGED");
      return {};
    });
    render(view(version, changed));
    await settle();
    fireEvent.scroll(window);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(
      live.position.mock.calls.filter(([x]) => x.data.action === "save_position"),
    ).toHaveLength(1);
  });
  it("unmount cancels a queued save", async () => {
    const result = render(view());
    await settle();
    fireEvent.scroll(window);
    result.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(
      live.position.mock.calls.filter(([x]) => x.data.action === "save_position"),
    ).toHaveLength(0);
  });
});
