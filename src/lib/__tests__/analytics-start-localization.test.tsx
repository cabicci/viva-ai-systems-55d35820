import type { ComponentType, ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

const state = vi.hoisted(() => ({
  pages: {} as Record<string, ComponentType>,
  locale: "en" as SupportedLocale,
  navigate: vi.fn(),
  run: vi.fn(),
  log: vi.fn(),
  seen: vi.fn(),
  analytics: undefined as unknown,
  from: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: ComponentType }) => {
    state.pages[path] = options.component;
    return options;
  },
  useNavigate: () => state.navigate,
  useRouterState: ({
    select,
  }: {
    select: (value: { location: { search: { locale: SupportedLocale } } }) => unknown;
  }) => select({ location: { search: { locale: state.locale } } }),
  Link: ({
    to,
    search,
    children,
    ...props
  }: {
    to: string;
    search?: { locale?: string };
    children: ReactNode;
    className?: string;
  }) => (
    <a href={to + (search?.locale ? "?locale=" + search.locale : "")} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: state.analytics, isLoading: false }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/wow-experience.functions", () => ({ runWowPath: state.run }));
vi.mock("@/lib/learner-events", () => ({
  logLearnerEvent: state.log,
  markWowExperienceSeen: state.seen,
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "fixture-user", user_metadata: { full_name: "Test learner" } } }),
}));
vi.mock("@/lib/auth-route-guard", () => ({
  requireAuthBeforeLoad: vi.fn(),
  AuthSessionGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/dashboard/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: state.from } }));

import "@/routes/start";
import "@/routes/analytics";

function setup(path: "/start" | "/analytics", locale: SupportedLocale = "en") {
  state.locale = locale;
  const Page = state.pages[path];
  return render(
    <LocaleProvider effectiveLocale={locale}>
      <Page />
    </LocaleProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  state.run.mockResolvedValue({ text: "Synthetic exercise output" });
  state.log.mockResolvedValue(undefined);
  state.analytics = {
    events: [
      { event_type: "lesson_opened", path_id: "business", created_at: new Date().toISOString() },
      { event_type: "custom_event", path_id: "business", created_at: new Date().toISOString() },
    ],
    lessonStatus: [{ status: "completed", lesson_id: "fixture-lesson" }],
    missions: [{ status: "passed", mission_id: "fixture-mission" }],
    quizzes: [{ is_correct: true }],
    streak: { current_streak: 1, longest_streak: 1 },
    time: { total_seconds: 3660 },
  };
});
afterEach(cleanup);

it("renders English analytics, duration, singular counts and locale-preserving navigation without a query write", () => {
  const { container } = setup("/analytics");
  expect(screen.getByRole("heading", { name: "My analytics" })).toBeTruthy();
  expect(screen.getByText("1h 1m")).toBeTruthy();
  expect(screen.getByText("Longest: 1 day")).toBeTruthy();
  expect(screen.getByText("1 correct out of 1 attempt")).toBeTruthy();
  expect(screen.getByText("Lesson opened")).toBeTruthy();
  // Unknown event identifiers retain their prior display; they are not renamed by this audit item.
  expect(screen.getByText("custom_event")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute(
    "href",
    "/dashboard?locale=en",
  );
  expect(container.querySelector('[dir="ltr"]')).toBeTruthy();
  expect(container.textContent).not.toMatch(/[ء-ي]/);
  expect(state.from).not.toHaveBeenCalled();
});
it.each(["ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "uses %s analytics direction and UI copy without changing the fixture",
  (locale) => {
    const before = JSON.stringify(state.analytics);
    const { container } = setup("/analytics", locale);
    expect(
      screen.getByRole("heading", { name: getUiString(locale, "analytics.title") }),
    ).toBeTruthy();
    expect(container.querySelector('[dir="rtl"]')).toBeTruthy();
    expect(JSON.stringify(state.analytics)).toBe(before);
    expect(state.from).not.toHaveBeenCalled();
  },
);
it("localizes the analytics loading state", () => {
  state.analytics = undefined;
  setup("/analytics");
  expect(screen.getByText("Loading your analytics…")).toBeTruthy();
});
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "preserves %s when skipping without automatically running the assistant",
  (locale) => {
    const { container } = setup("/start", locale);
    expect(container.querySelector(locale === "en" ? '[dir="ltr"]' : '[dir="rtl"]')).toBeTruthy();
    expect(state.run).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: getUiString(locale, "start.skip") }));
    expect(state.navigate).toHaveBeenCalledWith({
      to: "/dashboard",
      search: locale === "ar-EG" ? {} : { locale },
    });
    expect(state.run).not.toHaveBeenCalled();
  },
);
it("localizes all five English stages while keeping generation behind the explicit run action", async () => {
  const { container } = setup("/start");
  expect(screen.getByRole("heading", { name: /Welcome Test learner/ })).toBeTruthy();
  expect(state.run).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Let's begin" }));
  expect(screen.getByRole("heading", { name: "What project do you have in mind?" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "A flower shop" }));
  expect(state.run).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Run the five paths" }));
  await waitFor(() => expect(state.run).toHaveBeenCalledTimes(5));
  expect(state.run.mock.calls.map(([args]) => args.data)).toEqual(
    ["business", "creator", "analyst", "automator", "builder"].map((pathId) => ({
      pathId,
      idea: "A flower shop",
    })),
  );
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  expect(container.textContent).not.toMatch(/[ء-ي]/);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByText("Illustrative comparison")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(
    screen.getByRole("heading", { name: "You have tried the platform in practice" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Go to dashboard" }));
  expect(state.navigate).toHaveBeenCalledWith({ to: "/dashboard", search: { locale: "en" } });
  expect(state.run).toHaveBeenCalledTimes(5);
});
it("shows a localized generation error without exposing an untranslated provider error", async () => {
  state.run.mockResolvedValueOnce({ error: "رسالة قديمة من المزوّد" });
  setup("/start");
  fireEvent.click(screen.getByRole("button", { name: "Let's begin" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "A synthetic project" } });
  fireEvent.click(screen.getByRole("button", { name: "Run the five paths" }));
  expect(await screen.findByText("No response was received from the assistant.")).toBeTruthy();
  expect(screen.queryByText("رسالة قديمة من المزوّد")).toBeNull();
  expect(state.run).toHaveBeenCalledTimes(5);
});
