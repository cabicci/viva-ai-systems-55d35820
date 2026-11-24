import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  actor: "student-a" as string | null,
  loading: false,
  generation: { value: 1 },
  allowed: true,
  record: vi.fn(),
  track: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: state.actor ? { id: state.actor } : null,
    loading: state.loading,
    authGeneration: state.generation,
    isAuthGenerationCurrent: (generation: object) =>
      state.allowed && generation === state.generation,
  }),
}));
vi.mock("@/lib/learner-events", () => ({ logLearnerEvent: state.record }));
vi.mock("@/lib/analytics", () => ({ trackLessonOpened: state.track }));
import { LessonOpenTelemetry } from "./LessonOpenTelemetry";
beforeEach(() => {
  vi.clearAllMocks();
  state.actor = "student-a";
  state.loading = false;
  state.allowed = true;
  state.generation = { value: 1 };
});
afterEach(cleanup);
const flush = () =>
  act(async () => {
    await Promise.resolve();
  });
describe("authorized lesson open measurement", () => {
  it.each(["ai", "academic", "technical"] as const)(
    "records one %s open through StrictMode replay",
    async (line) => {
      render(
        <StrictMode>
          <LessonOpenTelemetry line={line} course="course" lesson="lesson-1" />
        </StrictMode>,
      );
      await flush();
      expect(state.record).toHaveBeenCalledTimes(1);
      expect(state.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "lesson_opened",
          lessonId: "lesson-1",
          metadata: { area: line, course: "course" },
        }),
        expect.objectContaining({ userId: "student-a" }),
      );
      expect(state.track).toHaveBeenCalledWith({
        area: line,
        course: "course",
        lesson: "lesson-1",
      });
    },
  );
  it("waits for authentication and records each newly opened lesson", async () => {
    state.loading = true;
    const view = render(<LessonOpenTelemetry line="academic" course="course" lesson="lesson-1" />);
    await flush();
    expect(state.record).not.toHaveBeenCalled();
    state.loading = false;
    view.rerender(<LessonOpenTelemetry line="academic" course="course" lesson="lesson-1" />);
    await flush();
    expect(state.record).toHaveBeenCalledTimes(1);
    state.generation = { value: 2 };
    view.rerender(<LessonOpenTelemetry line="academic" course="course" lesson="lesson-1" />);
    await flush();
    expect(state.record).toHaveBeenCalledTimes(1);
    view.rerender(<LessonOpenTelemetry line="academic" course="course" lesson="lesson-2" />);
    await flush();
    expect(state.record).toHaveBeenCalledTimes(2);
  });
  it("does not measure a child, a signed-out user or an unmounted page", async () => {
    const child = render(<LessonOpenTelemetry line="kids" course="course" lesson="lesson-1" />);
    await flush();
    child.unmount();
    state.actor = null;
    const signedOut = render(<LessonOpenTelemetry line="ai" course="course" lesson="lesson-1" />);
    await flush();
    signedOut.unmount();
    state.actor = "student-a";
    const retired = render(
      <LessonOpenTelemetry line="technical" course="course" lesson="lesson-1" />,
    );
    retired.unmount();
    await flush();
    expect(state.record).not.toHaveBeenCalled();
    expect(state.track).not.toHaveBeenCalled();
  });
  it("invalidates an asynchronous learner event when its account leaves", async () => {
    const view = render(<LessonOpenTelemetry line="ai" course="course" lesson="lesson-1" />);
    await flush();
    const context = state.record.mock.calls[0][1];
    expect(context.isCurrent()).toBe(true);
    state.actor = "student-b";
    view.rerender(<LessonOpenTelemetry line="ai" course="course" lesson="lesson-1" />);
    expect(context.isCurrent()).toBe(false);
    await flush();
  });
});
