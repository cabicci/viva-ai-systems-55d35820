import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyPage } from "./JourneyPage";
const state = vi.hoisted(() => ({
  auth: null as any,
  catalogue: vi.fn(),
  read: vi.fn(),
  children: [] as any[],
  technicalError: false, aiError: false, visits: [], rpc: vi.fn().mockResolvedValue({ data: true, error: null }), locale: "en", tier: "pro_plus", admin: false,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => state.auth }));
vi.mock("@/lib/course-system/intake/client", () => ({ curriculumCatalogue: state.catalogue }));
vi.mock("@/lib/course-system/intake/functions", () => ({ readCurriculumJourney: state.read }));
vi.mock("@/lib/kids/parent-state", () => ({
  useKidsParentStateSource: () => ({ state: "ready", profiles: state.children, refresh: vi.fn() }),
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
vi.mock("./LearningRecordPanel", () => ({ LearningRecordPanel: () => null }));
const actor = "a1400000-0000-4000-8000-000000000001",
  version = "a".repeat(64);
const course = {
  id: "synthetic",
  area: "academic",
  title: "Synthetic admitted course",
  version,
  stations: [{ id: "unit", title: "Unit", steps: [{ id: "lesson", title: "Step" }] }],
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  state.auth = {
    user: { id: actor },
    loading: false,
    authGeneration: {},
    isAuthGenerationCurrent: (g: object) => g === state.auth.authGeneration,
  };
  state.children = [];
  state.catalogue
    .mockReset()
    .mockImplementation(async (area: string) => (area === "academic" ? [course] : []));
  state.read
    .mockReset()
    .mockImplementation(async ({ data }: any) => ({
      ...data,
      expectedAccountId: undefined,
      activeVersion: version,
      recordId: null,
      reviewOnly: false,
      profileId: data.profileId ?? null,
      lessons: [
        {
          lesson: "lesson",
          required: 0,
          completed: 0,
          done: false,
          available: true,
          deliveryVersion: version,
        },
      ],
      resume: null,
    }));
});
afterEach(() => {
  cleanup();
  client.clear();
});
function screen() {
  const root = createRootRoute({ component: JourneyPage });
  const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ["/"] }) });
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
describe("M14 journey page integration with excluded content stubs", () => {
  it("adds an admitted card with actual route and keeps static card", async () => {
    const result = screen();
    await waitFor(() => expect(result.getByText("Synthetic admitted course")).toBeTruthy());
    const card = result.container.querySelector(
      '[data-journey-path="academic:intake:academic:synthetic:' + actor + '"]',
    );
    expect(card).toBeTruthy();
    expect(card?.querySelector('a[href*="/courses/academic/synthetic"]')).toBeTruthy();
    expect(
      result.container.querySelector('[data-journey-path="technical:furniture"]'),
    ).toBeTruthy();
  });
  it("shows private-read failure without removing other path cards or faking progress", async () => {
    state.read.mockRejectedValue(new Error("offline"));
    const result = screen();
    await waitFor(() => expect(result.container.querySelector('[role="alert"]')).toBeTruthy());
    expect(
      result.container.querySelector(
        '[data-journey-path="academic:intake:academic:synthetic:' + actor + '"]',
      ),
    ).toBeNull();
    await waitFor(() =>
      expect(
        result.container.querySelector('[data-journey-path="technical:furniture"]'),
      ).toBeTruthy(),
    );
  });
  it("includes an admitted current-version saved position in the top resume", async () => {
    state.read.mockImplementation(async ({ data }: any) => ({
      ...data,
      activeVersion: version,
      recordId: actor,
      reviewOnly: false,
      profileId: null,
      lessons: [
        {
          lesson: "lesson",
          required: 1,
          completed: 0,
          done: false,
          available: true,
          deliveryVersion: version,
        },
      ],
      resume: {
        lesson: "lesson",
        ratio: 0.5,
        contentVersion: version,
        savedAt: "2026-11-05T06:00:00Z",
      },
    }));
    const result = screen();
    await waitFor(() => expect(result.getByText("Synthetic admitted course · Step")).toBeTruthy());
    const resumeSection = result.getByRole("heading", { name: "Continue where you left off" }).closest("section");
    const href = resumeSection?.querySelector("a")?.getAttribute("href");
    expect(href).toContain("/courses/academic/synthetic");
    expect(new URL(href!, "http://localhost").searchParams.get("lesson")).toBe("lesson");
  });
});
