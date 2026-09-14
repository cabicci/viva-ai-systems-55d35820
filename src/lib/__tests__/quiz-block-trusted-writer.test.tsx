import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  submitAttempt: vi.fn(),
  logLearnerEvent: vi.fn(),
}));

vi.mock("@tanstack/react-start", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-start")>();
  return {
    ...actual,
    useServerFn: (serverFn: unknown) => serverFn,
  };
});

vi.mock("@/lib/quiz-attempt.functions", () => ({
  submitQuizAttempt: mocks.submitAttempt,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    loading: false,
  }),
}));

vi.mock("@/lib/learner-events", () => ({
  logLearnerEvent: mocks.logLearnerEvent,
}));
import { QuizBlock, type QuizItem } from "@/components/intro/QuizBlock";
import { LocaleProvider } from "@/lib/locale/locale-context";

const ITEM: QuizItem = {
  id: "intro-m1-l1-what-is-ai::quiz::0",
  bloom: "understand",
  question: "Which answer is canonical?",
  options: ["Wrong answer", "Right answer", "Another answer"],
  correctIndex: 1,
  explanation: "The canonical explanation.",
};

function renderQuiz() {
  render(
    <LocaleProvider effectiveLocale="en">
      <QuizBlock lessonId="intro-m1-l1-what-is-ai" items={[ITEM]} />
    </LocaleProvider>,
  );
}

async function revealOptions() {
  fireEvent.click(
    await screen.findByRole("button", {
      name: /I've thought — show options/i,
    }),
  );
}

function attemptEvent() {
  return mocks.logLearnerEvent.mock.calls
    .map(([event]) => event as {
      type: string;
      metadata: Record<string, unknown>;
    })
    .find((event) => event.type === "quiz_attempted");
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.logLearnerEvent.mockResolvedValue(undefined);
});

describe("QuizBlock trusted writer", () => {
  it("keeps feedback immediate while persisting through the server contract", async () => {
    let finish!: (value: {
      attemptId: string;
      isCorrect: boolean;
      bloomLevel: string;
    }) => void;
    mocks.submitAttempt.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderQuiz();
    await revealOptions();

    fireEvent.click(screen.getByRole("button", { name: "Wrong answer" }));
    expect(screen.getByText(/Incorrect/i)).toBeTruthy();
    expect(screen.getByText(ITEM.explanation)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeTruthy();
    expect(mocks.submitAttempt).toHaveBeenCalledWith({
      data: {
        locale: "en",
        lessonId: "intro-m1-l1-what-is-ai",
        questionId: ITEM.id,
        selectedIndex: 0,
      },
    });
    finish({
      attemptId: "11111111-1111-4111-8111-111111111111",
      isCorrect: false,
      bloomLevel: "understand",
    });
    await waitFor(() => expect(attemptEvent()).toBeTruthy());
  });

  it("uses only the server result for correctness telemetry", async () => {
    mocks.submitAttempt.mockResolvedValue({
      attemptId: "11111111-1111-4111-8111-111111111111",
      isCorrect: true,
      bloomLevel: "apply",
    });
    renderQuiz();
    await revealOptions();

    fireEvent.click(screen.getByRole("button", { name: "Wrong answer" }));
    expect(screen.getByText(/Incorrect/i)).toBeTruthy();

    await waitFor(() => {
      expect(attemptEvent()?.metadata).toEqual({
        question_id: ITEM.id,
        is_correct: true,
        bloom_level: "apply",
      });
    });
  });

  it("silently preserves feedback and retry while omitting failed correctness", async () => {
    mocks.submitAttempt.mockRejectedValue(new Error("db unavailable"));
    renderQuiz();
    await revealOptions();
    fireEvent.click(screen.getByRole("button", { name: "Right answer" }));
    expect(screen.getByText(/Correct/i)).toBeTruthy();
    expect(screen.getByText(ITEM.explanation)).toBeTruthy();

    await waitFor(() => {
      expect(attemptEvent()?.metadata).toEqual({
        question_id: ITEM.id,
        bloom_level: ITEM.bloom,
      });
    });
    expect(attemptEvent()?.metadata).not.toHaveProperty("is_correct");

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(
      await screen.findByRole("button", {
        name: /I've thought — show options/i,
      }),
    ).toBeTruthy();
  });
});
