import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AcademicLessonPage } from "./AcademicLessonPage";
const state = vi.hoisted(() => ({
  command: vi.fn(),
  user: { id: "learner-1" } as { id: string } | null,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: state.user, loading: false }) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => <header>Masaarat</header> }));
vi.mock("@/components/journey/JourneyVisitRecorder", () => ({
  JourneyVisitRecorder: () => <span data-testid="journey-visit" />,
}));
vi.mock("@/components/site/Footer", () => ({ Footer: () => <footer>Masaarat</footer> }));
vi.mock("@/lib/academic-education/client", () => ({
  academicCommand: state.command,
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
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AcademicLessonPage courseId="AC-BUS" lessonId="AC-BUS-M01-L02" />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  state.user = { id: "learner-1" };
  state.command.mockReset();
  state.command.mockImplementation(async (action: string) =>
    action === "lesson" ? delivery : { progress: {} },
  );
});
afterEach(() => cleanup());
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
                options: ["People aged 25–35 with a weekly need", "A different audience"],
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
  fireEvent.click(screen.getByRole("button", { name: "Quiz" }));
  const radio = screen.getByRole("radio", { name: "People aged 25–35 with a weekly need" });
  const label = radio.closest("label")!;
  expect(label.children).toHaveLength(2);
  const text = label.children[1];
  expect(text.tagName).toBe("SPAN");
  expect(text).toHaveClass("min-w-0", "flex-1");
  expect(text.querySelector("bdi")).toHaveTextContent("25–35");
  expect(radio).not.toBeChecked();
  expect(state.command.mock.calls.every(([action]) => ["lesson", "status"].includes(action))).toBe(
    true,
  );
});
