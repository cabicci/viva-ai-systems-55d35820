import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BookOpen } from "lucide-react";
import { IntroLessonRenderer } from "./IntroLessonRenderer";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { IntroLessonContent } from "./intro-lesson-types";

vi.mock("./IntroMission", () => ({ IntroMissionPrompt: () => null }));
vi.mock("./QuizBlock", () => ({ QuizBlock: () => null }));
vi.mock("./value-hooks", () => ({ getValueHookForLocale: () => null }));
afterEach(cleanup);

it("formats all terminology fields and the three Creator terms without changing their words", () => {
  const content: IntroLessonContent = [
    {
      icon: BookOpen,
      eyebrow: "Terms",
      title: "Glossary",
      block: {
        kind: "concepts",
        items: [
          {
            term: "**Content System**",
            meaning: "A **specific audience**",
            example: "Use a **repeatable** form.",
          },
          {
            term: "**Content Promise**",
            meaning: "A consistent promise",
            example: "A useful result",
          },
          { term: "**Repeatable Format**", meaning: "A format you can reuse" },
        ],
      },
    },
  ];
  const { container } = render(
    <LocaleProvider initialLocale="en">
      <IntroLessonRenderer content={content} />
    </LocaleProvider>,
  );
  for (const text of [
    "Content System",
    "Content Promise",
    "Repeatable Format",
    "specific audience",
    "repeatable",
  ]) {
    expect(screen.getByText(text).tagName).toBe("STRONG");
  }
  expect(container.textContent).not.toContain("**Content");
  expect(container.textContent).toContain("A consistent promise");
});
it("formats comparison labels and bodies independently of terminology", () => {
  const content: IntroLessonContent = [
    {
      icon: BookOpen,
      eyebrow: "Compare",
      title: "A/B comparison",
      block: {
        kind: "comparison",
        left: { label: "**Uncontrolled**", body: "**3 changes** — we do not know what worked." },
        right: { label: "**One A/B**", body: "**Title A** vs **Title B**, same page and price." },
      },
    },
  ];
  const { container } = render(
    <LocaleProvider initialLocale="en">
      <IntroLessonRenderer content={content} />
    </LocaleProvider>,
  );
  for (const text of ["Uncontrolled", "One A/B", "3 changes", "Title A", "Title B"]) {
    expect(screen.getByText(text).tagName).toBe("STRONG");
  }
  expect(container.textContent).toContain("same page and price");
});
it("leaves HTML, arithmetic asterisks and unmatched markers as inert literal text", () => {
  const content: IntroLessonContent = [
    {
      icon: BookOpen,
      eyebrow: "Terms",
      title: "Literal characters",
      block: {
        kind: "concepts",
        items: [
          {
            term: "****",
            meaning: "5 * 4 = 20",
            example: "<script>unsafe()</script> and **unclosed",
          },
        ],
      },
    },
  ];
  const { container } = render(
    <LocaleProvider initialLocale="ar-MSA">
      <IntroLessonRenderer content={content} />
    </LocaleProvider>,
  );
  expect(container.querySelector("script, a, strong")).toBeNull();
  for (const text of ["****", "5 * 4 = 20", "<script>unsafe()</script>", "**unclosed"]) {
    expect(container.textContent).toContain(text);
  }
});
