import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IntakeSection } from "@/lib/course-system/intake/package";
import { CurriculumContent, type LessonContent } from "./CurriculumContent";
import { ActivityForm } from "./CurriculumFields";

const command = vi.fn();
vi.mock("@/lib/course-system/intake/client", () => ({
  curriculumCommand: (...args: unknown[]) => command(...args),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u1" },
    authGeneration: { value: 1 },
    isAuthGenerationCurrent: () => true,
  }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en", dir: "ltr" }) }));
const { Activity } = await import("./CurriculumActivity");

const section = (over: Partial<IntakeSection> & Pick<IntakeSection, "id" | "kind">) =>
  ({
    title: over.id,
    paragraphs: ["Body"],
    questions: [],
    assets: [],
    fields: [],
    required: false,
    completion: "read",
    ...over,
  }) as IntakeSection;
const choice = section({
  id: "diagnostic",
  kind: "questions",
  title: "Diagnostic",
  completion: "review",
  fields: [
    {
      id: "D01",
      input: "choice",
      label: "Which is shown?",
      options: [
        { id: "option-0", label: "Amount absorbed" },
        { id: "option-1", label: "Result for the sample" },
      ],
    },
  ] as IntakeSection["fields"],
});
const lesson: LessonContent = {
  id: "FATE2-S01",
  title: "Step",
  assets: [],
  sections: [
    section({ id: "reading", kind: "explanation", title: "Explanation", paragraphs: ["Lead?", "1. Heading", "Text"] }),
    choice,
    section({ id: "post", kind: "questions", title: "Post check", completion: "review", fields: choice.fields }),
    section({
      id: "faq",
      kind: "faq",
      title: "Questions and answers",
      paragraphs: ["Is A B?\nNo, it is C.", "Does X hold?\nOnly with Y."],
    }),
  ],
};
afterEach(cleanup);
beforeEach(() => command.mockReset());

describe("admitted curriculum presentation", () => {
  it("shows concise groups and keeps every section, with subheadings for multiple checks", () => {
    const { container } = render(
      <CurriculumContent lesson={lesson} locale="en" selected="check" onSelect={vi.fn()} activity={(s) => <i data-activity={s.id} />} />,
    );
    const nav = screen.getByRole("navigation");
    expect(within(nav).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Explanation",
      "Check understanding",
      "Questions and answers",
    ]);
    expect([...container.querySelectorAll("[data-section]")].map((e) => e.getAttribute("data-section"))).toEqual(
      ["reading", "diagnostic", "post", "faq"],
    );
    // Activities stay mounted for every section so input survives tab changes.
    expect(container.querySelectorAll("[data-activity]")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Diagnostic" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Post check" })).toBeVisible();
  });
  it("renders FAQ pairs as individual collapsible cards without generic labels", () => {
    const { container } = render(
      <CurriculumContent lesson={lesson} locale="en" selected="faq" onSelect={vi.fn()} />,
    );
    const cards = container.querySelectorAll('[data-group="faq"] details');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector("summary")).toHaveTextContent("Is A B?");
    expect(cards[0]).toHaveTextContent("No, it is C.");
    expect(container.querySelector('[data-group="faq"]')).not.toHaveTextContent(/Optional|Required/);
  });
  it("moves the first explanation paragraph to the hero only when asked", () => {
    const { container, rerender } = render(
      <CurriculumContent lesson={lesson} locale="en" selected="explanation" onSelect={vi.fn()} />,
    );
    expect(container.querySelector('[data-section="reading"]')).toHaveTextContent("Lead?");
    rerender(<CurriculumContent lesson={lesson} locale="en" selected="explanation" onSelect={vi.fn()} leadInHero />);
    expect(container.querySelector('[data-section="reading"]')).not.toHaveTextContent("Lead?");
    expect(screen.getByRole("heading", { name: "1. Heading" })).toBeVisible();
  });
  it("renders choice fields as visible editable radios shared with the admin preview", () => {
    const change = vi.fn();
    render(<ActivityForm section={choice} values={{}} onChange={change} disabled={false} locale="en" />);
    const radios = within(screen.getByRole("group", { name: "Which is shown?" })).getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[1]).toBeEnabled();
    fireEvent.click(radios[1]);
    expect(change).toHaveBeenCalledWith("D01", "option-1");
  });
});

describe("learner activity lifecycle", () => {
  const delivery = {
    version: "v1",
    recordId: null,
    lesson,
    progress: [],
    events: [],
    attempts: [],
  };
  const scope = { area: "academic" as const, course: "AC-FATE", lesson: "FATE2-S01" };
  const mount = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Activity section={choice} delivery={delivery} scope={scope} />
      </QueryClientProvider>,
    );
  it("creates no attempt on view and starts then submits the learner's input on submit", async () => {
    command.mockImplementation(async (action: string) =>
      action === "start"
        ? { attemptId: "a1", state: "started", draft: {}, revision: 0 }
        : { state: "awaiting_review" },
    );
    mount();
    expect(command).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("radio")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
    await waitFor(() => expect(command).toHaveBeenCalledTimes(2));
    expect(command.mock.calls[0][0]).toBe("start");
    expect(command.mock.calls[1][0]).toBe("submit");
    expect(command.mock.calls[1][1]).toMatchObject({
      attemptId: "a1",
      section: "diagnostic",
      submission: { D01: "option-1" },
    });
  });
  it("keeps input and reuses the started attempt and request id when submit fails", async () => {
    let fail = true;
    command.mockImplementation(async (action: string) => {
      if (action === "start") return { attemptId: "a1", state: "started", draft: {}, revision: 0 };
      if (action === "submit" && fail) throw new Error("network");
      return { state: "awaiting_review" };
    });
    mount();
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")[0]).toBeChecked();
    fail = false;
    const firstSubmit = command.mock.calls.find((c) => c[0] === "submit")![1].requestId;
    fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
    await waitFor(() =>
      expect(command.mock.calls.filter((c) => c[0] === "submit")).toHaveLength(2),
    );
    expect(command.mock.calls.filter((c) => c[0] === "start")).toHaveLength(1);
    const submits = command.mock.calls.filter((c) => c[0] === "submit");
    expect(submits[1][1]).toMatchObject({ attemptId: "a1", submission: { D01: "option-0" } });
    expect(submits[1][1].requestId).toBe(firstSubmit);
  });
  it("shows no completion control on optional reading sections", () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Activity section={lesson.sections[3]} delivery={delivery} scope={scope} />
      </QueryClientProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
