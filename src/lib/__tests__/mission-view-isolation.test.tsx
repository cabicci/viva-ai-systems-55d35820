import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MissionSubmission } from "@/lib/mission-evaluation";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  locale: "en",
  active: vi.fn(),
  evaluated: vi.fn(),
  prepare: vi.fn(),
  submit: vi.fn(),
  evaluate: vi.fn(),
  reveal: vi.fn(),
  skip: vi.fn(),
  emit: vi.fn(),
  log: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("lucide-react", () =>
  Object.fromEntries(
    [
      "CheckCircle2",
      "ChevronDown",
      "ChevronUp",
      "ListChecks",
      "Loader2",
      "Lightbulb",
      "HelpCircle",
      "Send",
      "ClipboardCheck",
      "FileText",
      "SkipForward",
    ].map((name) => [name, () => null]),
  ),
);
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({
    locale: mocks.locale,
    dir: mocks.locale === "en" ? "ltr" : "rtl",
  }),
}));
vi.mock("@/lib/mission-evaluation", () => ({
  getActiveSubmissionForMission: mocks.active,
  getLatestEvaluatedSubmissionForMission: mocks.evaluated,
  prepareSubmissionForAttempt: mocks.prepare,
  submitForEvaluation: mocks.submit,
}));
vi.mock("@/lib/mission-ai-evaluation.functions", () => ({
  evaluateMissionWithAI: mocks.evaluate,
  revealModelMissionAnswer: mocks.reveal,
}));
vi.mock("@/lib/mission-skip.functions", () => ({ skipMissionServer: mocks.skip }));
vi.mock("@/lib/mission-gate", () => ({ emitMissionPassed: mocks.emit }));
vi.mock("@/lib/learner-events", () => ({ logLearnerEvent: mocks.log }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import { MissionRubricSection } from "@/components/intro/MissionRubricSubmit";

let sequence = 0;
const result = {
  overallScore: 90,
  passed: true,
  perCriterion: [{ label: "Evidence", score: 90, feedback: "Saved criterion feedback" }],
  summary: "The saved summary.",
  nextStep: "The saved next step.",
  socraticQuestion: "The saved question?",
};
function row(patch: Partial<MissionSubmission> = {}): MissionSubmission {
  return {
    id: "saved-evaluation",
    user_id: mocks.user!.id,
    mission_id: "shared-mission",
    lesson_id: "lesson-a",
    submission_text: "A previously successful answer with supporting evidence.",
    submission_url: null,
    submission_metadata: {
      perCriterion: result.perCriterion,
      nextStep: result.nextStep,
      socraticQuestion: result.socraticQuestion,
      evaluationVersion: "recorded-version",
    },
    status: "passed",
    feedback: result.summary,
    score: 90,
    attempt_count: 2,
    submitted_at: "2026-10-10T10:00:00Z",
    evaluated_at: "2026-10-10T10:01:00Z",
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:01:00Z",
    ...patch,
  };
}
function mission(lessonId = "lesson-a", missionId = "shared-mission") {
  return (
    <MissionRubricSection
      rubric={[{ label: "Evidence", weight: 100, criteria: ["Show the evidence"] }]}
      lessonId={lessonId}
      missionId={missionId}
      lessonTitle="Independent training fixture"
      missionPrompt="Explain your reasoning using the supplied teaching data."
    />
  );
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
async function answerField() {
  const field = await screen.findByRole("textbox");
  expect(field).not.toHaveAttribute("readonly");
  return field;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: "fixture-user-" + ++sequence };
  mocks.locale = "en";
  window.sessionStorage.clear();
  mocks.active.mockResolvedValue(null);
  mocks.evaluated.mockResolvedValue(null);
  mocks.log.mockResolvedValue(undefined);
  mocks.prepare.mockResolvedValue({ id: "new-submission" });
  mocks.submit.mockResolvedValue({ attempt_count: 1 });
  mocks.evaluate.mockResolvedValue(result);
  mocks.skip.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("mission answer ownership and saved result restoration", () => {
  it("never paints another lesson's answer, and retains each unsent draft on return", async () => {
    const view = render(mission());
    fireEvent.change(await answerField(), { target: { value: "Unsent draft belonging to A" } });
    view.rerender(mission("lesson-b"));
    expect(screen.queryByDisplayValue("Unsent draft belonging to A")).toBeNull();
    fireEvent.change(await answerField(), { target: { value: "Unsent draft belonging to B" } });
    view.rerender(mission());
    expect(await answerField()).toHaveValue("Unsent draft belonging to A");
    view.rerender(mission("lesson-b"));
    expect(await answerField()).toHaveValue("Unsent draft belonging to B");
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it("keeps the draft across a route unmount without submitting it", async () => {
    const view = render(mission());
    fireEvent.change(await answerField(), { target: { value: "Draft surviving route unmount" } });
    view.unmount();
    render(mission());
    expect(await answerField()).toHaveValue("Draft surviving route unmount");
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("isolates users and locales, including when the mission identifier is reused", async () => {
    const firstUser = mocks.user;
    const view = render(mission());
    fireEvent.change(await answerField(), {
      target: { value: "Private first-user English draft" },
    });
    mocks.locale = "ar-EG";
    view.rerender(mission());
    expect(await answerField()).toHaveValue("");
    mocks.locale = "en";
    mocks.user = { id: "another-fixture-user" };
    view.rerender(mission());
    expect(await answerField()).toHaveValue("");
    mocks.user = firstUser;
    view.rerender(mission());
    expect(await answerField()).toHaveValue("Private first-user English draft");
  });

  it("isolates separate missions within one lesson", async () => {
    const view = render(mission());
    fireEvent.change(await answerField(), { target: { value: "First mission draft" } });
    view.rerender(mission("lesson-a", "second-mission"));
    expect(await answerField()).toHaveValue("");
  });

  it("ignores a late restoration from the preceding lesson", async () => {
    const pending = deferred<MissionSubmission | null>();
    mocks.active.mockImplementation((_mission: string, lesson: string) =>
      lesson === "lesson-a" ? pending.promise : Promise.resolve(null),
    );
    const oldRow = row({ status: "draft", submission_text: "Old restored answer" });
    const view = render(mission());
    view.rerender(mission("lesson-b"));
    fireEvent.change(await answerField(), { target: { value: "New destination draft" } });
    await act(async () => {
      pending.resolve(oldRow);
    });
    expect(await answerField()).toHaveValue("New destination draft");
    expect(screen.queryByDisplayValue("Old restored answer")).toBeNull();
  });

  it("preserves a local unsent draft instead of replacing it with an older server draft", async () => {
    const view = render(mission());
    fireEvent.change(await answerField(), { target: { value: "Newer unsent work" } });
    view.rerender(mission("lesson-b"));
    await answerField();
    mocks.active.mockResolvedValue(row({ status: "draft", submission_text: "Older saved work" }));
    view.rerender(mission());
    expect(await answerField()).toHaveValue("Newer unsent work");
  });

  it("restores the passed answer and original feedback read-only without a new attempt", async () => {
    const saved = row();
    mocks.evaluated.mockResolvedValue(saved);
    const view = render(mission());
    expect(await screen.findByDisplayValue(saved.submission_text!)).toHaveAttribute("readonly");
    expect(screen.getByText(result.summary)).toBeTruthy();
    expect(screen.getByText(result.perCriterion[0].feedback)).toBeTruthy();
    expect(screen.getByText(result.socraticQuestion)).toBeTruthy();
    expect(screen.getByText("recorded-version", { exact: false })).toBeTruthy();
    expect(screen.getByText(saved.evaluated_at!)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Submit and get feedback/i })).toBeNull();
    view.unmount();
    render(mission());
    expect(await screen.findByDisplayValue(saved.submission_text!)).toHaveAttribute("readonly");
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it("does not invent a score or detailed feedback for an older passed record", async () => {
    mocks.evaluated.mockResolvedValue(
      row({ score: null, feedback: null, submission_metadata: {} }),
    );
    render(mission());
    expect(await screen.findByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.queryByText(result.summary)).toBeNull();
    expect(screen.queryByRole("button", { name: /Submit and get feedback/i })).toBeNull();
  });

  it("still shows available feedback when a historical score is absent", async () => {
    mocks.evaluated.mockResolvedValue(
      row({ score: null, feedback: "Original feedback without a score" }),
    );
    render(mission());
    expect(await screen.findByText("Original feedback without a score")).toBeTruthy();
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it("rejects restored rows belonging to a different user or lesson", async () => {
    mocks.evaluated.mockResolvedValue(row({ user_id: "wrong-owner" }));
    render(mission());
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it("shows a retryable read error instead of an empty editable answer", async () => {
    mocks.active.mockRejectedValueOnce(new Error("Read unavailable"));
    render(mission());
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Submit and get feedback/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await answerField()).toHaveValue("");
  });

  it("allows improving a restored failed answer without changing its old evaluation on read", async () => {
    const saved = row({ status: "needs_revision", score: 40 });
    mocks.active.mockResolvedValue(saved);
    mocks.evaluated.mockResolvedValue(saved);
    render(mission());
    await screen.findByText(result.summary);
    fireEvent.click(screen.getByRole("button", { name: /Improve my answer/i }));
    expect(await answerField()).toHaveValue(saved.submission_text);
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it("ignores a late evaluation result after navigating to another lesson", async () => {
    const pending = deferred<typeof result>();
    mocks.evaluate.mockReturnValue(pending.promise);
    const view = render(mission());
    fireEvent.change(await answerField(), {
      target: { value: "A sufficiently long original answer from lesson A." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit and get feedback/i }));
    await waitFor(() => expect(mocks.evaluate).toHaveBeenCalledTimes(1));
    view.rerender(mission("lesson-b"));
    fireEvent.change(await answerField(), { target: { value: "Independent destination answer" } });
    await act(async () => {
      pending.resolve(result);
    });
    expect(await answerField()).toHaveValue("Independent destination answer");
    expect(screen.queryByText(result.summary)).toBeNull();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it("does not continue a submission after the original view has unmounted", async () => {
    const pending = deferred<{ id: string }>();
    mocks.prepare.mockReturnValue(pending.promise);
    const view = render(mission());
    fireEvent.change(await answerField(), {
      target: { value: "A sufficiently long answer waiting to be saved." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit and get feedback/i }));
    view.rerender(mission("lesson-b"));
    await act(async () => {
      pending.resolve({ id: "saved-draft" });
    });
    await answerField();
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it("blocks editing during evaluation and sends the current identity exactly once", async () => {
    const pending = deferred<typeof result>();
    mocks.evaluate.mockReturnValue(pending.promise);
    render(mission());
    const field = await answerField();
    fireEvent.change(field, {
      target: { value: "A sufficiently long fixture answer for evaluation." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit and get feedback/i }));
    expect(field).toBeDisabled();
    await waitFor(() => expect(mocks.evaluate).toHaveBeenCalledTimes(1));
    expect(mocks.evaluate).toHaveBeenCalledWith({
      data: { submissionId: "new-submission", missionId: "shared-mission", locale: "en" },
    });
    await act(async () => {
      pending.resolve(result);
    });
    expect(await screen.findByText(result.summary)).toBeTruthy();
  });
});
