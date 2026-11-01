import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AcademicLessonPage } from "./AcademicLessonPage";
const state = vi.hoisted(() => ({
  command: vi.fn(),
  catalogue: vi.fn(),
  canAccess: vi.fn(),
  user: { id: "learner-1" } as { id: string } | null,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: state.user, loading: false }) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => <header>Masaarat</header> }));
vi.mock("@/components/journey/JourneyVisitRecorder", () => ({
  JourneyVisitRecorder: () => <span data-testid="journey-visit" />,
}));
vi.mock("@/components/site/Footer", () => ({ Footer: () => <footer>Masaarat</footer> }));
vi.mock("@/components/assistant/CourseLessonAssistant", () => ({ CourseLessonAssistant: (props: { cardId: string; stepId: string; locale: string }) =>
  <aside data-testid="lesson-assistant" data-card={props.cardId} data-step={props.stepId} data-locale={props.locale} /> }));
vi.mock("@/lib/academic-education/client", () => ({
  academicCommand: state.command,
  academicCatalogue: state.catalogue,
  academicCanAccess: state.canAccess,
  academicDownload: vi.fn(),
  academicQueryKey: (...args: unknown[]) => ["academic", ...args],
}));
const delivery = {
  allowed: true,
  video: null,
  files: [],
  assistantAllowed: false,
  lesson: {
    id: "AC-BUS-M01-L02",
    locale: "en",
    title: "Business functions",
    intro: "Introductory explanation",
    goals: ["Connect operations and sales"],
    sections: [
      {
        id: "one",
        title: "Capacity",
        text: "Paid lesson explanation",
        reflection: "Check the promise",
      },
    ],
    example: { title: "Example", text: "An original case", decision: "Check capacity" },
    quiz: [{ id: "q1", question: "Which evidence?", options: ["Capacity", "Follower count"] }],
    assignment: { prompt: "Map an order", fields: ["Output"], criteria: ["Evidence"] },
    faq: [],
    summary: [],
  },
};
function setup(lessonId = "AC-BUS-M01-L02") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <AcademicLessonPage courseId="AC-BUS" lessonId={lessonId} />
    </QueryClientProvider>,
  );
  return { ...view, queryClient: client };
}
beforeEach(() => {
  state.user = { id: "learner-1" };
  state.command.mockReset();
  state.catalogue.mockReset().mockResolvedValue([]);
  state.canAccess.mockReset().mockResolvedValue(false);
  state.command.mockImplementation(async (action: string) =>
    action === "lesson" ? delivery : { progress: {} },
  );
});
afterEach(() => cleanup());
it("offers the assistant immediately in an authorized lesson without changing its course or locale", async () => {
  state.command.mockImplementation(async (action: string) => action === "lesson"
    ? { ...delivery, assistantAllowed: true } : { progress: {} });
  setup();
  const assistant = await screen.findByTestId("lesson-assistant");
  expect(assistant).toHaveAttribute("data-card", "AC-BUS");
  expect(assistant).toHaveAttribute("data-step", delivery.lesson.id);
  expect(assistant).toHaveAttribute("data-locale", "en");
  expect(screen.getByText("Paid lesson explanation")).toBeVisible();
});
it("does not mount the assistant without the delivery's independent permission", async () => {
  setup();
  await screen.findByText("Paid lesson explanation");
  expect(screen.queryByTestId("lesson-assistant")).toBeNull();
});
it("reveals a changed section hidden above the header and keeps practice drafts", async () => {
  const originalScroll = Element.prototype.scrollIntoView;
  const scroll = vi.fn();
  Element.prototype.scrollIntoView = scroll;
  const rect = vi
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(0, -3000, 800, 900));
  try {
    setup();
    await screen.findByText("Paid lesson explanation");
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Downloads" }));
    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: "start", behavior: "auto" }));
    fireEvent.click(screen.getByRole("button", { name: "Practice" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Unsent preserved practice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Downloads" }));
    fireEvent.click(screen.getByRole("button", { name: "Practice" }));
    expect(screen.getByRole("textbox")).toHaveValue("Unsent preserved practice");
    expect(
      state.command.mock.calls.every(([action]) => ["lesson", "status"].includes(action)),
    ).toBe(true);
  } finally {
    rect.mockRestore();
    Element.prototype.scrollIntoView = originalScroll;
  }
});
it("does not scroll an already visible section on navigation", async () => {
  const originalScroll = Element.prototype.scrollIntoView;
  const scroll = vi.fn();
  Element.prototype.scrollIntoView = scroll;
  const rect = vi
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(0, 200, 800, 300));
  try {
    setup();
    await screen.findByText("Paid lesson explanation");
    fireEvent.click(screen.getByRole("button", { name: "Downloads" }));
    expect(scroll).not.toHaveBeenCalled();
  } finally {
    rect.mockRestore();
    Element.prototype.scrollIntoView = originalScroll;
  }
});
it("renders the authored two-period assignment while preserving all five fields and their draft", async () => {
  const lessons = JSON.parse(
    readFileSync(resolve(process.cwd(), "experiments/academic/course/expanded/en.json"), "utf8"),
  );
  const source = lessons.find((lesson: { id: string }) => lesson.id === "AC-BUS-M01-L04");
  const assignment = source.assignment as typeof delivery.lesson.assignment;
  state.command.mockImplementation(async (action: string) =>
    action === "lesson"
      ? { ...delivery, lesson: { ...delivery.lesson, assignment } }
      : { progress: {} },
  );
  const { container } = setup();
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  expect(screen.getByText("Period 1 (Last Quarter):").tagName).toBe("STRONG");
  expect(screen.getByText("Period 2 (Current Quarter):").tagName).toBe("STRONG");
  for (const text of [
    "Total Orders: 500",
    "Product Returns: 25",
    "Total Orders: 800",
    "Product Returns: 32",
  ]) {
    expect(screen.getByText(text).closest("li")).toBeTruthy();
  }
  expect(container.textContent).not.toContain("**Period");
  expect(screen.getAllByRole("textbox")).toHaveLength(5);
  fireEvent.change(screen.getAllByRole("textbox")[0], {
    target: { value: "My unsent calculation" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Downloads" }));
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  expect(screen.getAllByRole("textbox")[0]).toHaveValue("My unsent calculation");
  expect(state.command.mock.calls.every(([action]) => ["lesson", "status"].includes(action))).toBe(
    true,
  );
});
it("does not fetch lesson bodies when signed out", async () => {
  state.user = null;
  setup();
  expect(await screen.findByText("Sign in to continue")).toBeTruthy();
  expect(state.command).not.toHaveBeenCalled();
});
it("hides unavailable video and obtains grades from the server without bundled answer keys", async () => {
  state.command.mockImplementation(async (action: string) =>
    action === "lesson"
      ? delivery
      : action === "quiz"
        ? {
            allowed: true,
            score: 1,
            total: 1,
            passed: true,
            feedback: [{ id: "q1", correct: true, explanation: "Server verified capacity." }],
          }
        : { progress: {} },
  );
  setup();
  await screen.findByText("Paid lesson explanation");
  expect(screen.queryByRole("button", { name: "Video" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Check understanding" }));
  fireEvent.click(screen.getByLabelText("Capacity"));
  fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
  expect(await screen.findByText("Server verified capacity.")).toBeTruthy();
  expect(state.command).toHaveBeenCalledWith("quiz", "AC-BUS", "AC-BUS-M01-L02", "en", {
    answers: { q1: 0 },
  });
});
it("removes previously displayed protected content when a mutation reports lost access", async () => {
  let denied = false;
  state.command.mockImplementation(async (action: string) => {
    if (action === "read") {
      denied = true;
      return { allowed: false };
    }
    return action === "lesson" ? (denied ? { allowed: false } : delivery) : { progress: {} };
  });
  setup();
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Mark reading complete" }));
  await screen.findByText("This lesson requires an active Academic subscription.");
  await waitFor(() => expect(screen.queryByText("Paid lesson explanation")).toBeNull());
});

it("names activity progress and keeps an age-range option in one inline text container", async () => {
  state.command.mockImplementation(async (action: string) =>
    action === "lesson"
      ? {
          ...delivery,
          lesson: {
            ...delivery.lesson,
            quiz: [
              {
                id: "range",
                question: "Which audience?",
                options: ["People aged 25-35 with a weekly need", "A different audience"],
              },
            ],
          },
        }
      : { progress: {} },
  );
  setup();
  await screen.findByText("Paid lesson explanation");
  const progress = screen.getByRole("progressbar");
  expect(progress.getAttribute("aria-label")).toBeTruthy();
  expect(progress).toHaveAttribute("aria-valuenow", "0");
  fireEvent.click(screen.getByRole("button", { name: "Check understanding" }));
  const radio = screen.getByRole("radio", { name: "People aged 25-35 with a weekly need" });
  const label = radio.closest("label")!;
  expect(label.children).toHaveLength(2);
  const text = label.children[1];
  expect(text.tagName).toBe("SPAN");
  expect(text).toHaveClass("min-w-0", "flex-1");
  expect(text.querySelector("bdi")).toHaveTextContent("25-35");
  expect(radio).not.toBeChecked();
  expect(state.command.mock.calls.every(([action]) => ["lesson", "status"].includes(action))).toBe(
    true,
  );
});

it("renders one presentation step number beside a complete formatted heading and explanation", async () => {
  state.command.mockImplementation(async (action: string) =>
    action === "lesson"
      ? {
          ...delivery,
          lesson: {
            ...delivery.lesson,
            example: {
              title: "Numbered example",
              text: "Worked explanation",
              decision: "Preserved decision",
              steps: [
                "**Step 1: Identify the gap.**\n\n30 - 20 = 10 orders.",
                "2. Compare both options.\n\nKeep the context.",
              ],
            },
          },
        }
      : { progress: {} },
  );
  const { container } = setup();
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Worked example" }));
  const list = container.querySelector("ol")!;
  expect(list.children).toHaveLength(2);
  expect(list.children[0].children).toHaveLength(2);
  expect(list.children[0].children[0]).toHaveTextContent("1");
  expect(list.children[0].children[0]).toHaveAttribute("aria-hidden", "true");
  expect(list.children[0].querySelector("strong")).toHaveTextContent("Identify the gap.");
  expect(list.children[0]).not.toHaveTextContent("Step 1");
  expect(list.children[0]).toHaveTextContent("30 - 20 = 10 orders.");
  expect(list.children[1]).toHaveTextContent("Compare both options.");
  expect(list.children[1]).toHaveTextContent("Keep the context.");
  expect(screen.getByText("Preserved decision")).toBeTruthy();
});

it("restores the old five values into six fields and saves the new fifth task without shifting answers", async () => {
  const lessonId = "AC-BUS-M02-L01";
  const lessons = JSON.parse(
    readFileSync(resolve(process.cwd(), "experiments/academic/course/expanded/en.json"), "utf8"),
  );
  const source = lessons.find((lesson: { id: string }) => lesson.id === lessonId);
  const assignment = source.assignment as typeof delivery.lesson.assignment;
  expect(assignment.fields).toHaveLength(6);
  const oldValues = [
    "Original project title",
    "Old task one",
    "Old task two",
    "Old task three",
    "Old task four",
  ];
  const progress = {
    progress: {
      [lessonId]: {
        read: false,
        quizPassed: false,
        practiceSubmitted: false,
        drafts: { en: oldValues },
      },
    },
  };
  state.command.mockImplementation(async (action: string) => {
    if (action === "lesson")
      return { ...delivery, lesson: { ...delivery.lesson, id: lessonId, assignment } };
    if (action === "status") return progress;
    return { allowed: true };
  });
  const { queryClient } = setup(lessonId);
  await screen.findByText("Paid lesson explanation");
  await waitFor(() =>
    expect(
      queryClient.getQueryState(["academic-progress", "learner-1", "AC-BUS", lessonId, "en"])
        ?.status,
    ).toBe("success"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  fireEvent.click(screen.getByRole("button", { name: "Restore saved response" }));
  const inputs = screen.getAllByRole("textbox");
  expect(inputs).toHaveLength(6);
  for (let i = 0; i < oldValues.length; i++) expect(inputs[i]).toHaveValue(oldValues[i]);
  expect(inputs[5]).toHaveValue("");
  expect(screen.getByRole("button", { name: "Save practice submission" })).toBeDisabled();
  expect(state.command.mock.calls.some(([action]) => action === "practice")).toBe(false);
  fireEvent.change(inputs[5], { target: { value: "New fifth task with its roles" } });
  fireEvent.click(screen.getByRole("button", { name: "Save practice submission" }));
  await waitFor(() =>
    expect(state.command).toHaveBeenCalledWith("practice", "AC-BUS", lessonId, "en", {
      values: [...oldValues, "New fifth task with its roles"],
    }),
  );
  expect(oldValues).toHaveLength(5);
});

it("keeps unsent values when the same lesson receives the appended-field content revision", async () => {
  const lessonId = "AC-BUS-M02-L01";
  const lessons = JSON.parse(
    readFileSync(resolve(process.cwd(), "experiments/academic/course/expanded/en.json"), "utf8"),
  );
  const source = lessons.find((lesson: { id: string }) => lesson.id === lessonId);
  const revision = JSON.parse(
    readFileSync(
      resolve(process.cwd(), "scripts/academic-integration/audit-revision-22.json"),
      "utf8",
    ),
  );
  const changedFields = revision.changes[0].changedFields as Array<{
    path: string;
    before: unknown;
  }>;
  const oldAssignment = {
    ...source.assignment,
    fields: changedFields.find((field) => field.path === "assignment.fields")!.before,
    prompt: changedFields.find((field) => field.path === "assignment.prompt")!.before,
  };
  let currentAssignment = oldAssignment;
  state.command.mockImplementation(async (action: string) =>
    action === "lesson"
      ? { ...delivery, lesson: { ...delivery.lesson, id: lessonId, assignment: currentAssignment } }
      : { progress: {} },
  );
  const { queryClient } = setup(lessonId);
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  const values = [
    "Unsent title",
    "Unsent task one",
    "Unsent task two",
    "Unsent task three",
    "Unsent task four",
  ];
  const before = screen.getAllByRole("textbox");
  expect(before).toHaveLength(5);
  before.forEach((input, i) => fireEvent.change(input, { target: { value: values[i] } }));
  currentAssignment = source.assignment;
  await act(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["academic", "learner-1", "AC-BUS", lessonId, "en"],
    });
  });
  await waitFor(() => expect(screen.getAllByRole("textbox")).toHaveLength(6));
  const after = screen.getAllByRole("textbox");
  values.forEach((value, i) => expect(after[i]).toHaveValue(value));
  expect(after[5]).toHaveValue("");
  fireEvent.change(after[5], { target: { value: "Unsent new fifth task" } });
  expect(screen.getAllByRole("textbox")[5]).toHaveValue("Unsent new fifth task");
  expect(state.command.mock.calls.every(([action]) => ["lesson", "status"].includes(action))).toBe(
    true,
  );
});
