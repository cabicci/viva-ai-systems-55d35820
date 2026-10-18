import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { id: "user-a" } as { id: string } | null,
  locale: "en",
  submit: vi.fn(),
  log: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("lucide-react", () =>
  Object.fromEntries(
    ["CircleHelp", "CheckCircle2", "XCircle", "RotateCcw", "Eye"].map((name) => [name, () => null]),
  ),
);
vi.mock("@/lib/quiz-attempt.functions", () => ({ submitQuizAttempt: mocks.submit }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/learner-events", () => ({ logLearnerEvent: mocks.log }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: mocks.locale }),
}));
import { QuizBlock, type QuizItem } from "@/components/intro/QuizBlock";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

const item: QuizItem = {
  id: "apply1",
  bloom: "apply",
  question: "A standalone training question",
  options: ["First", "Second"],
  correctIndex: 1,
  explanation: "The fixture explanation.",
};
function quiz(lessonId = "lesson-a", question = item) {
  return <QuizBlock lessonId={lessonId} items={[question]} />;
}
function reveal() {
  fireEvent.click(
    screen.getByRole("button", {
      name: getUiString(mocks.locale as SupportedLocale, "intro.quiz.revealCta"),
    }),
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: "user-a" };
  mocks.locale = "en";
  mocks.submit.mockResolvedValue({ isCorrect: true, bloomLevel: "apply" });
  mocks.log.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("quiz owner identity", () => {
  it("clears a selection and reveal when different lessons reuse apply1", async () => {
    const view = render(quiz());
    reveal();
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getByText(item.explanation)).toBeTruthy();
    view.rerender(quiz("lesson-b"));
    expect(screen.queryByText(item.explanation)).toBeNull();
    expect(screen.queryByRole("button", { name: "Second" })).toBeNull();
    reveal();
    expect(screen.getByRole("button", { name: "Second" })).not.toBeDisabled();
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    await act(async () => {});
  });

  it("resets reveal on locale changes and does not submit during navigation", () => {
    const view = render(quiz());
    reveal();
    mocks.locale = "ar-EG";
    view.rerender(quiz());
    expect(screen.queryByRole("button", { name: "Second" })).toBeNull();
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("does not retain another user's choices", () => {
    const view = render(quiz());
    reveal();
    mocks.user = { id: "user-b" };
    view.rerender(quiz());
    expect(screen.queryByRole("button", { name: "Second" })).toBeNull();
  });

  it("keeps a pending previous attempt from changing the destination question", async () => {
    let finish!: (value: { isCorrect: boolean; bloomLevel: string }) => void;
    mocks.submit.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = render(quiz());
    reveal();
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    view.rerender(
      quiz("lesson-b", { ...item, question: "New lesson", explanation: "New explanation" }),
    );
    await act(async () => {
      finish({ isCorrect: false, bloomLevel: "apply" });
    });
    expect(screen.queryByText(item.explanation)).toBeNull();
    reveal();
    expect(screen.getByRole("button", { name: "First" })).not.toBeDisabled();
    expect(screen.queryByText("New explanation")).toBeNull();
    expect(mocks.submit).toHaveBeenCalledTimes(1);
  });
});
