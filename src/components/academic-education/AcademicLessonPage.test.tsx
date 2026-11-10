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
  return {
    ...view,
    queryClient: client,
    showLesson: (id = lessonId, courseId = "AC-BUS") => view.rerender(
      <QueryClientProvider client={client}>
        <AcademicLessonPage courseId={courseId} lessonId={id} />
      </QueryClientProvider>,
    ),
  };
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


// Actual component/React Query with controlled command completions. No server,
// persistence adapter or browser storage is introduced by these tests.
function pendingCommand() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function openPractice(text = "Scoped learner response") {
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
}
const savePractice = () => fireEvent.click(screen.getByRole("button", { name: "Save practice submission" }));
const saveUnconfirmed = "Could not confirm the save. Your draft is still here. Try saving again.";

it.each(["network rejection", "lost acknowledgement"])("preserves practice on %s and retries the submitted values", async (failure) => {
  const first = pendingCommand(), second = pendingCommand();
  let writes = 0;
  let lessonRequests = 0;
  const unavailableRefetch = pendingCommand();
  let recorded: unknown;
  state.command.mockImplementation((action: string, _course: string, _lesson: string, _locale: string, data: unknown) => {
    if (action === "practice") {
      writes++;
      if (failure === "lost acknowledgement") recorded = data;
      return writes === 1 ? first.promise : second.promise;
    }
    if (action === "lesson") return ++lessonRequests === 1
      ? Promise.resolve(delivery) : unavailableRefetch.promise;
    return Promise.resolve({ progress: {} });
  });
  setup();
  await openPractice();
  savePractice();
  expect(screen.getByRole("button", { name: "Save practice submission" })).toBeDisabled();
  await act(async () => {
    first.reject(new Error("synthetic transport interruption"));
    await first.promise.catch(() => {});
    // Flush React Query's scheduled cache notification as well as the save.
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(screen.getByRole("textbox")).toHaveValue("Scoped learner response");
  expect(await screen.findByRole("alert")).toHaveTextContent(saveUnconfirmed);
  expect(screen.queryByText("Saved to your account.")).toBeNull();
  expect(state.command.mock.calls.filter(([action]) => action === "lesson")).toHaveLength(1);
  if (failure === "lost acknowledgement") expect(recorded).toEqual({ values: ["Scoped learner response"] });
  savePractice();
  expect(screen.queryByRole("alert")).toBeNull();
  await act(async () => second.resolve({ allowed: true }));
  expect(await screen.findByText("Saved to your account.")).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveValue("Scoped learner response");
  expect(state.command.mock.calls.filter(([action]) => action === "practice").map(call => call[4])).toEqual([
    { values: ["Scoped learner response"] }, { values: ["Scoped learner response"] },
  ]);
});

it("preserves selected quiz answers on failure and displays only the confirmed retry result", async () => {
  const first = pendingCommand(), second = pendingCommand();
  let attempts = 0;
  state.command.mockImplementation((action: string) => action === "quiz"
    ? (++attempts === 1 ? first.promise : second.promise)
    : Promise.resolve(action === "lesson" ? delivery : { progress: {} }));
  setup();
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Check understanding" }));
  fireEvent.click(screen.getByRole("radio", { name: "Follower count" }));
  fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
  await act(async () => first.reject(new Error("synthetic offline")));
  expect(await screen.findByRole("alert")).toHaveTextContent(saveUnconfirmed);
  expect(screen.getByRole("radio", { name: "Follower count" })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
  await act(async () => second.resolve({ allowed: true, score: 0, total: 1, passed: false,
    feedback: [{ id: "q1", correct: false, explanation: "Confirmed retry feedback" }] }));
  expect(await screen.findByText("Confirmed retry feedback")).toBeVisible();
  expect(state.command.mock.calls.filter(([action]) => action === "quiz").map(call => call[4])).toEqual([
    { answers: { q1: 1 } }, { answers: { q1: 1 } },
  ]);
});

it("does not interpret a malformed save acknowledgement as success or access revocation", async () => {
  state.command.mockImplementation(async (action: string) => action === "lesson" ? delivery
    : action === "practice" ? null : { progress: {} });
  setup();
  await openPractice();savePractice();
  expect(screen.getByRole("textbox")).toHaveValue("Scoped learner response");
  expect(await screen.findByRole("alert")).toHaveTextContent(saveUnconfirmed);
  expect(screen.queryByText("Saved to your account.")).toBeNull();
});

it("enforces explicit practice access revocation and does not carry its draft into reauthorization", async () => {
  const saving = pendingCommand();
  let allowed = true;
  state.command.mockImplementation((action: string) => action === "practice" ? saving.promise
    : Promise.resolve(action === "lesson" ? (allowed ? delivery : { allowed: false }) : { progress: {} }));
  const { queryClient } = setup();await openPractice();savePractice();
  allowed = false;
  await act(async () => saving.resolve({ allowed: false }));
  expect(await screen.findByText("This lesson requires an active Academic subscription.")).toBeVisible();
  expect(screen.queryByRole("textbox")).toBeNull();
  allowed = true;
  await act(async () => { await queryClient.invalidateQueries({ queryKey: ["academic", "learner-1"] }); });
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  expect(screen.getByRole("textbox")).toHaveValue("");
});

it("drops account-scoped drafts and ignores a previous account's late denial", async () => {
  const saving = pendingCommand();
  state.command.mockImplementation((action: string) => action === "practice" ? saving.promise
    : Promise.resolve(action === "lesson" ? delivery : { progress: {} }));
  const { showLesson, queryClient } = setup();await openPractice("Account one draft");savePractice();
  state.user = { id: "learner-2" };showLesson();
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  expect(screen.getByRole("textbox")).toHaveValue("");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Account two draft" } });
  await act(async () => saving.resolve({ allowed: false }));
  expect(screen.getByRole("textbox")).toHaveValue("Account two draft");
  expect(queryClient.getQueryData(["academic", "learner-1", "AC-BUS", delivery.lesson.id, "en"])).toMatchObject({ allowed: true });
  expect(state.command.mock.calls.filter(([action]) => action === "lesson")).toHaveLength(2);
});

it("does not reuse a draft after sign out and sign in to the same account", async () => {
  const { showLesson } = setup();await openPractice();
  state.user = null;showLesson();
  expect(await screen.findByText("Sign in to continue")).toBeVisible();
  state.user = { id: "learner-1" };showLesson();
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  expect(screen.getByRole("textbox")).toHaveValue("");
});

it("scopes a pending save to its lesson and never refetches it after navigation", async () => {
  const saving = pendingCommand();
  state.command.mockImplementation((action: string, _course: string, lessonId: string) => action === "practice" ? saving.promise
    : Promise.resolve(action === "lesson" ? { ...delivery, lesson: { ...delivery.lesson, id: lessonId } } : { progress: {} }));
  const { showLesson } = setup();await openPractice("First lesson draft");savePractice();
  showLesson("AC-BUS-M01-L03");
  await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Practice" }));
  expect(screen.getByRole("textbox")).toHaveValue("");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Second lesson draft" } });
  const statuses = state.command.mock.calls.filter(([action]) => action === "status").length;
  await act(async () => saving.resolve({ allowed: true }));
  expect(screen.getByRole("textbox")).toHaveValue("Second lesson draft");
  expect(screen.queryByText("Saved to your account.")).toBeNull();
  expect(state.command.mock.calls.filter(([action]) => action === "status")).toHaveLength(statuses);
});

it("retains the current draft when an equivalent lesson delivery is refreshed", async () => {
  const { queryClient } = setup();await openPractice();
  await act(async () => { await queryClient.invalidateQueries({ queryKey: ["academic", "learner-1"] }); });
  expect(screen.getByRole("textbox")).toHaveValue("Scoped learner response");
});

it("clears draft values when a same-length assignment changes meaning", async () => {
  const { queryClient } = setup();await openPractice();
  act(() => queryClient.setQueryData(["academic", "learner-1", "AC-BUS", delivery.lesson.id, "en"], {
    ...delivery, lesson: { ...delivery.lesson, assignment: { ...delivery.lesson.assignment, prompt: "Revised task", fields: ["Different evidence"] } },
  }));
  expect(await screen.findByLabelText("Different evidence")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Save practice submission" })).toBeDisabled();
});

it("does not reuse quiz answer positions after question options are reordered", async () => {
  const { queryClient } = setup();await screen.findByText("Paid lesson explanation");
  fireEvent.click(screen.getByRole("button", { name: "Check understanding" }));
  fireEvent.click(screen.getByRole("radio", { name: "Capacity" }));
  act(() => queryClient.setQueryData(["academic", "learner-1", "AC-BUS", delivery.lesson.id, "en"], {
    ...delivery, lesson: { ...delivery.lesson, quiz: [{ ...delivery.lesson.quiz[0], options: ["Follower count", "Capacity"] }] },
  }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit answers" })).toBeDisabled());
  expect(screen.getByRole("radio", { name: "Follower count" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Capacity" })).not.toBeChecked();
});

it.each(["denial", "success", "failure"])("ignores a late %s after a revised assignment has been saved", async (late) => {
  const initial = pendingCommand(), revised = pendingCommand();
  let calls = 0;
  state.command.mockImplementation((action: string) => action === "practice" ? (++calls === 1 ? initial.promise : revised.promise)
    : Promise.resolve(action === "lesson" ? delivery : { progress: {} }));
  const { queryClient } = setup();await openPractice("Initial task response");savePractice();
  act(() => queryClient.setQueryData(["academic", "learner-1", "AC-BUS", delivery.lesson.id, "en"], {
    ...delivery, lesson: { ...delivery.lesson, assignment: { ...delivery.lesson.assignment, fields: ["Revised task response"] } },
  }));
  const input = await screen.findByLabelText("Revised task response");
  expect(input).toHaveValue("");
  fireEvent.change(input, { target: { value: "Scoped revised answer" } });savePractice();
  await act(async () => revised.resolve({ allowed: true }));
  expect(await screen.findByText("Saved to your account.")).toBeVisible();
  const requestCount = state.command.mock.calls.length;
  await act(async () => late === "failure" ? initial.reject(new Error("late synthetic failure"))
    : initial.resolve({ allowed: late === "success" }));
  expect(screen.getByRole("textbox")).toHaveValue("Scoped revised answer");
  expect(screen.getByText("Saved to your account.")).toBeVisible();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(state.command).toHaveBeenCalledTimes(requestCount);
});

it("does not label edits made during a save as acknowledged", async () => {
  const saving = pendingCommand();
  state.command.mockImplementation((action: string) => action === "practice" ? saving.promise
    : Promise.resolve(action === "lesson" ? delivery : { progress: {} }));
  setup();await openPractice("Submitted answer");savePractice();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Further unsent edits" } });
  await act(async () => saving.resolve({ allowed: true }));
  expect(screen.getByRole("textbox")).toHaveValue("Further unsent edits");
  expect(screen.queryByText("Saved to your account.")).toBeNull();
  expect(screen.getByRole("button", { name: "Save practice submission" })).toBeEnabled();
});

it("keeps acknowledged save status when only the progress refresh fails", async () => {
  let reads = 0;
  state.command.mockImplementation(async (action: string) => {
    if (action === "lesson") return delivery;
    if (action === "practice") return { allowed: true };
    if (++reads > 1) throw new Error("synthetic progress refresh failure");
    return { progress: {} };
  });
  setup();await openPractice();savePractice();
  expect(await screen.findByText("Saved to your account.")).toBeVisible();
  await waitFor(() => expect(reads).toBe(2));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("textbox")).toHaveValue("Scoped learner response");
});
