import { render, screen, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { JourneyPage } from "./JourneyPage";
const state = vi.hoisted(() => ({
  locale: "en",
  tier: "pro_plus",
  admin: false,
  aiError: false,
  technicalError: false,
  user: "parent-a",
  profiles: [] as { id: string; level_id: string; display_name: string }[],
  visits: [] as unknown[],
  rpc: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: state.user }, loading: false }),
}));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: state.locale, dir: state.locale === "en" ? "ltr" : "rtl" }),
}));
vi.mock("@/lib/entitlements", async (original) => ({
  ...(await original<object>()),
  useEntitlement: () => ({ tier: state.tier, isAdmin: state.admin, isLoaded: true }),
}));
vi.mock("@/lib/lesson-progress", () => ({
  useLessonProgress: () => ({
    isLoaded: true,
    isError: state.aiError,
    refetch: vi.fn(),
    getStatus: () => "not-started",
  }),
}));
vi.mock("@/lib/journey/client", () => ({
  useJourneyVisits: () => ({
    data: state.visits,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/lib/kids/parent-state", () => ({
  useKidsParentStateSource: () => ({ state: "ready", profiles: state.profiles, refresh: vi.fn() }),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: state.rpc } }));
vi.mock("@/lib/technical-education/client", () => ({
  technicalCompleted: (entry?: {
    read: boolean;
    quizPassed: boolean;
    practiceReviewed: boolean;
  }) =>
    entry ? Number(entry.read) + Number(entry.quizPassed) + Number(entry.practiceReviewed) : 0,
  technicalCommand: async () => {
    if (state.technicalError) throw new Error("offline");
    return {
      paid: true,
      progress: { "M01-L01": { read: true, quizPassed: true, practiceReviewed: true } },
    };
  },
}));
vi.mock("@/lib/academic-education/client", () => ({
  academicCatalogue: async () => [
    {
      id: "AC-BUS",
      title: "Academic fixture",
      lessons: [
        { id: "AC-BUS-M01-L01", title: "Academic start", introductory: true },
        { id: "AC-BUS-M01-L02", title: "Academic next", introductory: false },
      ],
    },
  ],
  academicCommand: async () => ({
    progress: { "AC-BUS-M01-L01": { read: true, quizPassed: true, practiceSubmitted: true } },
  }),
}));
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <JourneyPage />
    </QueryClientProvider>,
  );
  return { ...view, client };
}
beforeEach(() => {
  state.locale = "en";
  state.tier = "pro_plus";
  state.admin = false;
  state.aiError = false;
  state.technicalError = false;
  state.profiles = [];
  state.visits = [];
  state.rpc.mockImplementation(async (name: string, args: { p_profile: string }) => ({
    data:
      name === "kids_journey"
        ? { allowed: [1, 2], completed: args.p_profile === "child-a" ? [1] : [] }
        : true,
    error: null,
  }));
});
afterEach(cleanup);
it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
  "renders one AI path and separate Technical and Academic progress in %s",
  async (locale) => {
    state.locale = locale;
    const { container } = setup();
    await screen.findByText("Academic fixture");
    const cards = container.querySelectorAll("[data-journey-path]");
    expect(cards).toHaveLength(3);
    expect(container.querySelector('[data-journey-path="ai:ai"]')).toHaveTextContent("0 / 100");
    expect(container.querySelector('[data-journey-path="technical:furniture"]')).toHaveTextContent(
      "1 / 80",
    );
    expect(container.querySelector('[data-journey-path="academic:AC-BUS"]')).toHaveTextContent(
      "1 / 2",
    );
    for (const a of container.querySelectorAll("main a[href]"))
      expect(a.getAttribute("href")).toContain(`locale=${locale}`);
  },
);
it("Pro excludes Builder and never resumes a formerly accessible Builder step", async () => {
  state.tier = "pro";
  state.visits = [
    {
      line: "ai",
      course_id: "ai",
      subject_id: "parent-a",
      lesson_id: "builder-m1-l1-what-is-a-system",
      visited_at: "2026-10-07T07:00:00Z",
    },
  ];
  const { container } = setup();
  await screen.findByText("Academic fixture");
  expect(container.querySelector('[data-journey-path="ai:ai"]')).toHaveTextContent("0 / 71");
  expect(screen.queryByRole("heading", { name: "Continue where you left off" })).toBeNull();
});
it("keeps both children's progress independent and selects the child before resume", async () => {
  state.profiles = [
    { id: "child-a", level_id: "level-1", display_name: "Child A" },
    { id: "child-b", level_id: "level-1", display_name: "Child B" },
  ];
  const { container } = setup();
  await waitFor(() =>
    expect(container.querySelector('[data-journey-path="kids:child-b"]')).not.toBeNull(),
  );
  expect(container.querySelector('[data-journey-path="kids:child-a"]')).toHaveTextContent("1 / 2");
  expect(container.querySelector('[data-journey-path="kids:child-b"]')).toHaveTextContent("0 / 2");
});
it("offers all Kids admin previews without invented child progress", async () => {
  state.admin = true;
  setup();
  await screen.findByText("Academic fixture");
  expect(screen.getAllByRole("link", { name: "Admin preview" })).toHaveLength(3);
  expect(screen.queryByText("Child A")).toBeNull();
});
it("does not render zero progress when a source failed", async () => {
  state.technicalError = true;
  state.aiError = true;
  const { container } = setup();
  await screen.findByText("Academic fixture");
  expect(container.querySelector('[data-journey-path="ai:ai"]')).toBeNull();
  expect(container.querySelector('[data-journey-path="technical:furniture"]')).toBeNull();
  expect(screen.getAllByRole("alert")).toHaveLength(2);
});
it("global resume selects the most recently visited eligible adult path", async () => {
  state.visits = [
    {
      line: "academic",
      course_id: "AC-BUS",
      subject_id: "parent-a",
      lesson_id: "AC-BUS-M01-L02",
      visited_at: "2026-10-07T09:00:00Z",
    },
    {
      line: "technical",
      course_id: "furniture",
      subject_id: "parent-a",
      lesson_id: "M01-L01",
      visited_at: "2026-10-07T08:00:00Z",
    },
  ];
  setup();
  const heading = await screen.findByRole("heading", { name: "Continue where you left off" });
  expect(within(heading.closest("section")!).getByRole("link")).toHaveAttribute(
    "href",
    "/academic/learn/AC-BUS-M01-L02?locale=en",
  );
});
