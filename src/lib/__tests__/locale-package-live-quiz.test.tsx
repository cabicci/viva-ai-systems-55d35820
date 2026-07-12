import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderLocalizedLesson } from "@/lib/__tests__/locale-test-utils";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
  }) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  createLink: (component: unknown) => component,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const LESSON_ID = "intro-m1-l1-what-is-ai";

function readPackage(locale: "en"): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${LESSON_ID}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

describe("LocalePackageLessonRenderer live quiz", () => {
  it("renders interactive quiz options instead of read-only preview", async () => {
    const { container } = await renderLocalizedLesson(readPackage("en"));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /I've thought — show options/i }),
      ).toBeTruthy();
    });
    expect(container.querySelector('[data-preview-quiz="read-only"]')).toBeNull();
  });

  it("supports selection, scoring, explanation, and retry", async () => {
    const pkg = readPackage("en");
    const quiz = pkg.sections.find((section) => section.quiz)?.quiz!;
    await renderLocalizedLesson(pkg);

    const reveal = await screen.findByRole("button", {
      name: /I've thought — show options/i,
    });
    fireEvent.click(reveal);

    const options = screen.getAllByRole("button").filter((button) =>
      quiz.options.some((option) => button.textContent?.includes(option.slice(0, 20))),
    );
    expect(options.length).toBeGreaterThan(0);

    const wrongIndex = quiz.correctIndex === 0 ? 1 : 0;
    fireEvent.click(options[wrongIndex]!);

    expect(screen.getByText(/Incorrect/i)).toBeTruthy();
    expect(screen.getByText(quiz.explanation!)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

    fireEvent.click(
      await screen.findByRole("button", {
        name: /I've thought — show options/i,
      }),
    );

    const retryOptions = screen.getAllByRole("button").filter((button) =>
      quiz.options.some((option) => button.textContent?.includes(option.slice(0, 20))),
    );
    fireEvent.click(retryOptions[quiz.correctIndex ?? 0]!);
    expect(screen.getByText(/Correct/i)).toBeTruthy();
  });
});

describe("QuizBlock ar-EG regression (unchanged component contract)", () => {
  it("still requires bloom, explanation, and correctIndex on quiz items", async () => {
    const { QuizBlock } = await import("@/components/intro/QuizBlock");
    const { LocaleProvider } = await import("@/lib/locale/locale-context");
    const { render } = await import("@testing-library/react");
    render(
      <LocaleProvider effectiveLocale="en">
        <QuizBlock
          lessonId="intro-m1-l1-what-is-ai"
          items={[
            {
              id: "apply1",
              bloom: "understand",
              question: "Regression question?",
              options: ["Wrong", "Right", "Maybe"],
              correctIndex: 1,
              explanation: "Because regression.",
            },
          ]}
        />
      </LocaleProvider>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /I've thought — show options/i }),
    );

    const optionButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent === "Right");
    fireEvent.click(optionButtons[0]!);
    expect(screen.getByText(/Correct/i)).toBeTruthy();
    expect(screen.getByText("Because regression.")).toBeTruthy();
  });
});
