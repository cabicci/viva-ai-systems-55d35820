import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocalePackagePreviewRenderer } from "@/components/locale/LocalePackagePreviewRenderer";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

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

vi.mock("@/components/intro/lessons", () => ({
  loadIntroLessonContent: vi.fn(),
  hasIntroLessonContent: vi.fn(() => false),
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

function renderLocalizedPackage(locale: "en") {
  const pkg = readPackage(locale);
  return render(
    <LocaleProvider effectiveLocale={locale}>
      <LocalePackagePreviewRenderer pkg={pkg} />
    </LocaleProvider>,
  );
}

describe("LocalePackagePreviewRenderer live quiz", () => {
  it("renders interactive quiz options instead of read-only preview", () => {
    const { container } = renderLocalizedPackage("en");
    expect(container.querySelector('[data-locale-quiz="live"]')).not.toBeNull();
    expect(container.querySelector('[data-preview-quiz="read-only"]')).toBeNull();
  });

  it("supports selection, scoring, explanation, and retry", async () => {
    const pkg = readPackage("en");
    const quiz = pkg.sections.find((section) => section.quiz)?.quiz!;
    renderLocalizedPackage("en");

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

  it("does not load ar-EG quiz content", async () => {
    const lessons = await import("@/components/intro/lessons");
    renderLocalizedPackage("en");
    expect(lessons.loadIntroLessonContent).not.toHaveBeenCalled();
  });
});

describe("QuizBlock ar-EG regression (unchanged component contract)", () => {
  it("still requires bloom, explanation, and correctIndex on quiz items", async () => {
    const { QuizBlock } = await import("@/components/intro/QuizBlock");
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
