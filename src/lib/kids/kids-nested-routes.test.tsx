import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route as KidsLayout } from "@/routes/kids";
import { Route as KidsCurriculum } from "@/routes/kids.curriculum";
import { Route as KidsIndex } from "@/routes/kids.index";
import { Route as Family } from "@/routes/kids.family";
import { Route as LevelLayout } from "@/routes/kids.$levelId";
import { Route as Contents } from "@/routes/kids.$levelId.contents";
import { Route as LevelIndex } from "@/routes/kids.$levelId.index";
import { Route as Lesson } from "@/routes/kids.$levelId.$lessonNumber";

const mock = vi.hoisted(() => ({
  invoke: vi.fn(),
  parentState: {
    state: "signed-out",
    profiles: [] as { id: string; level_id: string; display_name: string }[],
  },
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: () => ({ isAdmin: false }) }));
vi.mock("@/components/kids/KidsBrand", () => ({ KidsBrand: () => <div>Kids brand</div> }));
vi.mock("@/components/kids/KidsReleaseNotice", () => ({ KidsReleaseNotice: () => null }));
vi.mock("@/components/kids/KidsParentPanel", () => ({
  KidsParentPanel: () => <div>Parent access pending</div>,
}));
vi.mock("@/lib/kids/KidsParentStateProvider", () => ({
  KidsParentStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/lib/kids/parent-state", () => ({
  useKidsParentState: () => ({ ...mock.parentState, refresh: vi.fn() }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mock.invoke } },
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en", dir: "ltr" }) }));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => (base?: Record<string, unknown>) => ({ ...base, locale: "en" }),
}));
vi.mock("@/lib/locale/resolve-route-head-locale", () => ({
  resolveRouteHeadLocale: async () => "en",
}));

function mountKids(start = "/kids?locale=en") {
  const root = createRootRoute({ component: Outlet });
  const kids = KidsLayout.update({
    id: "/kids",
    path: "/kids",
    getParentRoute: () => root,
  } as unknown as Parameters<typeof KidsLayout.update>[0]);
  const kidsIndex = KidsIndex.update({
    id: "/",
    path: "/",
    getParentRoute: () => kids,
  } as unknown as Parameters<typeof KidsIndex.update>[0]);
  const curriculum = KidsCurriculum.update({
    id: "/curriculum",
    path: "/curriculum",
    getParentRoute: () => kids,
  } as unknown as Parameters<typeof KidsCurriculum.update>[0]);
  const level = LevelLayout.update({
    id: "/$levelId",
    path: "/$levelId",
    getParentRoute: () => kids,
  } as unknown as Parameters<typeof LevelLayout.update>[0]);
  const family = Family.update({
    id: "/family",
    path: "/family",
    getParentRoute: () => kids,
  } as unknown as Parameters<typeof Family.update>[0]);
  const levelIndex = LevelIndex.update({
    id: "/",
    path: "/",
    getParentRoute: () => level,
  } as unknown as Parameters<typeof LevelIndex.update>[0]);
  const contents = Contents.update({
    id: "/contents",
    path: "/contents",
    getParentRoute: () => level,
  } as unknown as Parameters<typeof Contents.update>[0]);
  const lesson = Lesson.update({
    id: "/$lessonNumber",
    path: "/$lessonNumber",
    getParentRoute: () => level,
  } as unknown as Parameters<typeof Lesson.update>[0]);
  const tree = root.addChildren([
    kids.addChildren([
      kidsIndex,
      curriculum,
      family,
      level.addChildren([levelIndex, contents, lesson]),
    ]),
  ]);
  const router = createRouter({
    routeTree: tree,
    history: createMemoryHistory({ initialEntries: [start] }),
    defaultNotFoundComponent: () => <p>Kids route not found</p>,
  });
  return { router, view: render(<RouterProvider router={router} />) };
}

afterEach(() => {
  cleanup();
  mock.invoke.mockReset();
  mock.parentState = { state: "signed-out", profiles: [] };
});

describe("Kids canonical nested path journey", () => {
  it("redirects the former curriculum to the sole catalogue without exposing step bodies", async () => {
    const { router } = mountKids("/kids/curriculum?locale=en");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Paths — Masaarat Kids" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kids");
    expect(screen.getAllByTestId("kids-course-card")).toHaveLength(3);
    expect(mock.invoke).not.toHaveBeenCalled();
  });
  it("opens one path definition then contents; a signed-out visitor cannot open protected steps", async () => {
    mock.invoke.mockResolvedValue({
      data: {
        levelId: "level-1",
        locale: "en",
        titles: Array.from({ length: 12 }, (_, i) => ({
          lessonNumber: i + 1,
          title: `Approved topic ${i + 1}`,
        })),
      },
      error: null,
    });
    const { router } = mountKids("/kids/level-1?locale=en");
    expect(
      await screen.findByRole("heading", { level: 1, name: /Path Kids ages 10–12/ }),
    ).toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Explore path steps" })).toHaveAttribute(
      "href",
      "/kids/level-1/contents?locale=en",
    );
    await act(() =>
      router.navigate({
        to: "/kids/$levelId/contents",
        params: { levelId: "level-1" },
        search: { locale: "en" },
      }),
    );
    expect(await screen.findByText("Approved topic 1")).toBeInTheDocument();
    expect(screen.getByText("Approved topic 12")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View step status" })).toBeNull();
    expect(screen.getByRole("link", { name: "Back to path overview" })).toHaveAttribute(
      "href",
      "/kids/level-1?locale=en",
    );
    expect(screen.getByRole("link", { name: "Get started with Kids" })).toHaveAttribute(
      "href",
      "/kids/family?locale=en",
    );
  });
  it("shows the same twelve step titles with open actions for a consented matching profile", async () => {
    mock.parentState = {
      state: "ready",
      profiles: [{ id: "child-profile", level_id: "level-1", display_name: "Explorer" }],
    };
    mountKids("/kids/level-1/contents?locale=en");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Path contents" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View step status" })).toHaveLength(12);
    expect(document.querySelector('a[href="/kids/level-1/1?locale=en"]')).toBeTruthy();
  });
  it("opens a direct protected step at mobile width with the canonical return and no private fetch", async () => {
    const prior = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    try {
      mountKids("/kids/level-1/1?locale=en");
      expect(await screen.findByRole("heading", { level: 1, name: "Step 1" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to path" })).toHaveAttribute(
        "href",
        "/kids/level-1/contents?locale=en",
      );
      expect(mock.invoke).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: prior });
    }
  });
  it("rejects an unknown age path without fetching content", async () => {
    const { router } = mountKids("/kids/unknown/1?locale=en");
    await waitFor(() =>
      expect(router.state.matches.some((m) => m.status === "notFound")).toBe(true),
    );
    expect(screen.getByText("Kids route not found")).toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
  });
});
