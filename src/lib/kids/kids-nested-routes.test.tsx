import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route as KidsLayout } from "@/routes/kids";
import { Route as KidsIndex } from "@/routes/kids.index";
import { Route as Family } from "@/routes/kids.family";
import { Route as LevelLayout } from "@/routes/kids.$levelId";
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
vi.mock("@/components/kids/KidsBrand", () => ({ KidsBrand: () => <div>Kids brand</div> }));
vi.mock("@/components/kids/KidsReleaseNotice", () => ({ KidsReleaseNotice: () => null }));
vi.mock("@/components/kids/KidsParentPanel", () => ({
  KidsParentPanel: () => <div>Parent access pending</div>,
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
  const lesson = Lesson.update({
    id: "/$lessonNumber",
    path: "/$lessonNumber",
    getParentRoute: () => level,
  } as unknown as Parameters<typeof Lesson.update>[0]);
  const tree = root.addChildren([
    kids.addChildren([kidsIndex, family, level.addChildren([levelIndex, lesson])]),
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

describe("Kids nested routes", () => {
  it("shows level summaries and links to platform pricing without placing prices in Kids landing", async () => {
    mountKids();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Kids plans and prices" })).toHaveAttribute(
      "href",
      "/pricing?locale=en#kids",
    );
    expect(screen.queryByText("Kids family pricing")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started with Kids" })).toHaveAttribute(
      "href",
      "/kids/family?locale=en",
    );
  });
  it("keeps parent setup on a standalone page and out of the level and lesson", async () => {
    const { router } = mountKids();
    fireEvent.click(await screen.findByRole("link", { name: "Get started with Kids" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Parent space" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kids/family");
    expect(screen.getByText("Parent access pending")).toBeInTheDocument();
    await act(() =>
      router.navigate({
        to: "/kids/$levelId/$lessonNumber",
        params: { levelId: "level-1", lessonNumber: "1" },
        search: { locale: "en" },
      }),
    );
    expect(await screen.findByRole("heading", { level: 1, name: "Lesson 1" })).toBeInTheDocument();
    expect(screen.queryByText("Parent access pending")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?intent=kids&locale=en",
    );
  });
  it("shows lesson titles but one setup action to a visitor without an account", async () => {
    const { router } = mountKids();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("link", { name: "Explore Masaarat Kids" })[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Level 1" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kids/level-1");
    expect(screen.getByRole("heading", { level: 2, name: "Lesson 1" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2, name: /Lesson/ })).toHaveLength(12);
    expect(screen.queryByRole("link", { name: "View lesson status" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started with Kids" })).toHaveAttribute(
      "href",
      "/kids/family?locale=en",
    );
    expect(mock.invoke).not.toHaveBeenCalled();
    await act(() => router.navigate({ to: "/kids", search: { locale: "en" } }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).toBeInTheDocument();
  });

  it("shows lesson actions after consent and a profile for the level are ready", async () => {
    mock.parentState = {
      state: "ready",
      profiles: [{ id: "child-profile", level_id: "level-1", display_name: "Explorer" }],
    };
    mountKids("/kids/level-1?locale=en");
    expect(await screen.findByRole("heading", { level: 1, name: "Level 1" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View lesson status" })).toHaveLength(12);
    expect(screen.queryByRole("link", { name: "Get started with Kids" })).not.toBeInTheDocument();
  });

  it("renders a directly opened lesson at a narrow viewport without fetching child data", async () => {
    const priorWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    try {
      mountKids("/kids/level-1/1?locale=en");
      expect(
        await screen.findByRole("heading", { level: 1, name: "Lesson 1" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to level" })).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 1, name: "Masaarat Kids" }),
      ).not.toBeInTheDocument();
      expect(mock.invoke).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: priorWidth });
    }
  });

  it("rejects a directly opened lesson with an unknown level", async () => {
    const { router } = mountKids("/kids/unknown/1?locale=en");
    await waitFor(() =>
      expect(router.state.matches.some((match) => match.status === "notFound")).toBe(true),
    );
    expect(screen.getByText("Kids route not found")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Lesson 1" })).not.toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
  });
});
