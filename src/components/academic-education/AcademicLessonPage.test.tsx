import { beforeEach, afterEach, expect, it, vi } from "vitest";
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
